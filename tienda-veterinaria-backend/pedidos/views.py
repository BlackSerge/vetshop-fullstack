# backend/pedidos/views.py

import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse
from django.db import transaction
from django.db.models import Sum # Necesario para calcular total gastado (VIP)
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta



# Modelos
from .models import Order, OrderItem
from carrito.models import Cart
from usuarios.models import CustomUser, UserActivityLog

# Serializers (Importados desde su archivo para mantener orden)
from .serializers import OrderSerializer 

# Configuración de Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Configuración de Negocio VIP
VIP_THRESHOLD = 500.00 # Monto total histórico para ser VIP automáticamente


# ==============================================================================
# VISTA 1: CREAR INTENTO DE PAGO
# El frontend llama aquí cuando el usuario entra al Checkout.
# Calcula el total real desde la DB y le pide permiso a Stripe.
# ==============================================================================
class CreatePaymentIntentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        
        # 1. Validar Carrito
        try:
            cart = Cart.objects.get(user=user)
        except Cart.DoesNotExist:
            return Response({'error': 'No tienes un carrito activo.'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart.items.exists():
            return Response({'error': 'El carrito está vacío.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Calcular Monto
        # Stripe siempre trabaja en CENTAVOS (enteros). $10.50 -> 1050
        amount = int(cart.total_price * 100)

        try:
            # 3. Crear PaymentIntent en Stripe
            # Guardamos user_id y cart_id en metadata para recuperarlos luego en el Webhook.
            # NOTA: No enviamos dirección aquí porque Stripe AddressElement la gestiona en el frontend.
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency='usd',
                metadata={
                    'user_id': user.id,
                    'cart_id': cart.id
                },
                automatic_payment_methods={'enabled': True},
            )

            # 4. Devolver el secreto al frontend
            return Response({'clientSecret': intent.client_secret})

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)


# ==============================================================================
# VISTA 2: WEBHOOK DE STRIPE
# Stripe llama aquí cuando un evento ocurre (ej: pago exitoso).
# Es CRÍTICO porque aquí es donde realmente creamos la Orden en la DB.
# ==============================================================================
@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny] # Stripe no manda JWT, validamos con firma

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        event = None

        # 1. Verificar Firma de Seguridad (Evitar hackers)
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return HttpResponse(status=400) # Payload inválido
        except stripe.error.SignatureVerificationError:
            return HttpResponse(status=400) # Firma falsa

        # 2. Manejar Evento "Pago Exitoso"
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            
            # Recuperar IDs de metadata
            user_id = payment_intent['metadata'].get('user_id')
            cart_id = payment_intent['metadata'].get('cart_id')
            
            if user_id and cart_id:
                # Procesar la orden internamente
                self._handle_successful_payment(user_id, cart_id, payment_intent)

        return HttpResponse(status=200)

    def _handle_successful_payment(self, user_id, cart_id, payment_intent):
        """
        Lógica interna para crear la orden, mover items y vaciar carrito.
        """
        try:
            user = CustomUser.objects.get(id=user_id)
            cart = Cart.objects.filter(id=cart_id).first()
            
            if not cart:
                print(f"Error Webhook: Carrito {cart_id} no encontrado (¿Ya procesado?)")
                return

            # --- EXTRACCIÓN DE DATOS DE ENVÍO (DIRECCIÓN) ---
            # IMPORTANTE: Stripe AddressElement guarda los datos en 'shipping'.
            # Si no está ahí, buscamos en 'charges' como fallback.
            
            shipping = payment_intent.get('shipping') or {}
            address_info = shipping.get('address') or {}
            
            # Intentar extraer de 'shipping' (Prioridad 1)
            full_name = shipping.get('name')
            # El email suele estar en receipt_email o hay que sacarlo del usuario si Stripe no lo pide
            email = payment_intent.get('receipt_email') or user.email 
            
            address = address_info.get('line1')
            city = address_info.get('city')
            postal_code = address_info.get('postal_code')

            # Fallback a 'charges' (Prioridad 2 - Método antiguo)
            if not address:
                charges = payment_intent.get('charges', {}).get('data', [])
                if charges:
                    billing = charges[0].get('billing_details', {})
                    address_info_backup = billing.get('address', {})
                    
                    full_name = billing.get('name')
                    email = billing.get('email')
                    address = address_info_backup.get('line1')
                    city = address_info_backup.get('city')
                    postal_code = address_info_backup.get('postal_code')

            # Valores por defecto finales si todo falla
            full_name = full_name or f"{user.first_name} {user.last_name}"
            email = email or user.email
            address = address or "Dirección no provista por Stripe"
            city = city or ""
            postal_code = postal_code or ""

            # --- TRANSACCIÓN ATÓMICA (Todo o nada) ---
            with transaction.atomic():
                # 1. Crear Orden en DB
                order = Order.objects.create(
                    user=user,
                    full_name=full_name,
                    email=email,
                    address=address,
                    city=city,
                    postal_code=postal_code,
                    total=cart.total_price,
                    status='PAID', # ¡Pagado!
                    stripe_payment_intent_id=payment_intent['id']
                )
                
                # 2. Mover Items del Carrito -> Orden
                for item in cart.items.all():
                    OrderItem.objects.create(
                        order=order,
                        product=item.product,
                        price=item.price,
                        quantity=item.quantity
                    )
                    # Descontar Stock del Producto
                    item.product.stock -= item.quantity
                    item.product.save()

                # 3. Vaciar Carrito (Borrar items, mantener carrito vacío)
                cart.items.all().delete()
                
                # 4. Registrar en Auditoría
                UserActivityLog.objects.create(
                    user=user,
                    action='PURCHASE',
                    details=f"Orden #{order.id} creada por ${order.total}"
                
                )

            try:
                subject = f'Confirmación de Pedido #{order.id} - VetShop'
                html_message = render_to_string('pedidos/email_confirmacion.html', {'order': order, 'user': user})
                plain_message = strip_tags(html_message) # Versión texto plano por si acaso
                
                send_mail(
                    subject,
                    plain_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [order.email], # Al email del pedido
                    html_message=html_message,
                    fail_silently=True # Para no romper el webhook si falla el correo
                )
                print("📧 Correo enviado a", order.email)
            except Exception as mail_error:
                print(f"Error enviando correo: {mail_error}")
                
                # 5. Verificar Ascenso a VIP
                self._check_vip_upgrade(user)

                print(f"✅ Orden {order.id} creada exitosamente.")

        except Exception as e:
            print(f"🔥🔥🔥 Error procesando orden en webhook: {e}")

    def _check_vip_upgrade(self, user):
        """
        Método auxiliar para comprobar si el usuario debe ser VIP.
        Se llama automáticamente tras cada compra exitosa.
        """
        if user.is_vip:
            return # Ya es VIP

        # Sumar total de todas las órdenes pagadas históricamente
        total_spent = Order.objects.filter(user=user, status='PAID').aggregate(Sum('total'))['total__sum'] or 0
        
        if total_spent >= VIP_THRESHOLD:
            user.is_vip = True
            user.save()
            
            # Registrar el evento
            UserActivityLog.objects.create(
                user=user,
                action='VIP_UPGRADE',
                details=f"Ascendido automáticamente por superar ${VIP_THRESHOLD} en compras."
            )
            print(f"👑 Usuario {user.username} ascendido a VIP!")


            try:
                subject = f'Confirmación de Pedido #{order.id} - VetShop'
                html_message = render_to_string('pedidos/email_confirmacion.html', {'order': order, 'user': user})
                plain_message = strip_tags(html_message) # Versión texto plano por si acaso
                
                send_mail(
                    subject,
                    plain_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [order.email], # Al email del pedido
                    html_message=html_message,
                    fail_silently=True # Para no romper el webhook si falla el correo
                )
                print("📧 Correo enviado a", order.email)
            except Exception as mail_error:
                print(f"Error enviando correo: {mail_error}")


# ==============================================================================
# VISTA 3: LISTAR PEDIDOS (ADMIN)
# Para mostrar en el panel de administración.
# ==============================================================================
class OrderListAPIView(generics.ListAPIView):
    """
    Lista pedidos filtrados por usuario.
    Uso: /api/pedidos/admin/orders/?user=ID
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = Order.objects.all().order_by('-created_at')
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset



class MyOrderListAPIView(generics.ListAPIView):
    """
    Lista los pedidos del usuario autenticado.
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Solo devuelve las órdenes del usuario que hace la petición
        return Order.objects.filter(user=self.request.user).order_by('-created_at')
    

class AdminDashboardStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        now = timezone.now()
        last_30_days = now - timedelta(days=30)

        # 1. Ventas Totales (Histórico)
        total_sales = Order.objects.filter(status='PAID').aggregate(Sum('total'))['total__sum'] or 0
        total_orders = Order.objects.count()

        # 2. Ventas Último Mes
        month_sales = Order.objects.filter(status='PAID', created_at__gte=last_30_days).aggregate(Sum('total'))['total__sum'] or 0
        month_orders = Order.objects.filter(created_at__gte=last_30_days).count()

        # 3. Top 5 Productos Más Vendidos
        # Esto requiere agrupar por producto en OrderItem
        top_products = OrderItem.objects.filter(order__status='PAID')\
            .values('product__nombre')\
            .annotate(total_sold=Sum('quantity'))\
            .order_by('-total_sold')[:5]

        # 4. Datos para Gráfico (Ventas por día últimos 7 días)
        chart_data = []
        for i in range(6, -1, -1):
            date = now - timedelta(days=i)
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            daily_total = Order.objects.filter(
                status='PAID', 
                created_at__range=(day_start, day_end)
            ).aggregate(Sum('total'))['total__sum'] or 0
            
            chart_data.append({
                "date": date.strftime('%d/%m'), # Ej: "28/11"
                "sales": daily_total
            })

        return Response({
            "total_sales": total_sales,
            "total_orders": total_orders,
            "month_sales": month_sales,
            "month_orders": month_orders,
            "top_products": top_products,
            "chart_data": chart_data
        })