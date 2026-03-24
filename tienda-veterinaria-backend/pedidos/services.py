"""
pedidos/services.py

Capa de servicios (business logic) para el módulo de pedidos.
Centraliza: pagos Stripe, creación de órdenes, VIP logic, emails.
"""

from __future__ import annotations

from decimal import Decimal
from django.db import transaction
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import stripe

from .models import Order, OrderItem
from .exceptions import (
    OrderServiceError,
    CartEmptyError,
    CartNotFoundError,
    InsufficientStockError,
    InvalidAddressError,
    StripePaymentError,
    StripeWebhookError,
    PaymentIntentNotFoundError,
    DuplicateOrderError,
    InvalidOrderStatusError,
    EmailNotificationError,
    OrderNotFoundError,
)
from . import selectors
from carrito import selectors as cart_selectors
from carrito import services as cart_services
from productos import services as product_services
from productos import selectors as product_selectors
from usuarios.models import UserActivityLog, CustomUser

# Configuración de Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Configuración de negocio VIP
VIP_THRESHOLD = Decimal("500.00")


class PaymentService:
    """Servicio para gestionar pagos con Stripe."""

    @staticmethod
    def create_payment_intent(user_id: int, cart_id: int) -> str:
        """
        Crea un PaymentIntent en Stripe para iniciar el checkout.
        Devuelve el client_secret para que el frontend lo use.
        """
        try:
            # Validar que el carrito existe y tiene items
            try:
                cart = cart_selectors.get_cart_by_id(cart_id)
            except Exception:
                raise CartNotFoundError(user_id)

            if cart_selectors.cart_is_empty(cart_id):
                raise CartEmptyError()

            # Validar stock de todos los ítems
            validation = cart_services.CartService.validate_cart_stock(cart_id)
            if validation["invalid_items"]:
                invalid = validation["invalid_items"][0]
                raise InsufficientStockError(invalid["product_name"])

            # Calcular monto en centavos (formato Stripe)
            amount = int(cart.total_price * 100)

            # Crear PaymentIntent
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency="usd",
                metadata={"user_id": user_id, "cart_id": cart_id},
                automatic_payment_methods={"enabled": True},
            )

            return intent.client_secret

        except stripe.error.APIConnectionError as e:
            raise StripePaymentError(f"Conexión rechazada: {str(e)}")
        except stripe.error.StripeError as e:
            raise StripePaymentError(str(e))

    @staticmethod
    def verify_webhook_signature(payload: bytes, sig_header: str) -> dict:
        """
        Verifica y devuelve el evento del webhook de Stripe.
        Lanza excepción si la firma es inválida.
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            return event
        except ValueError as e:
            raise StripeWebhookError("Payload inválido")
        except stripe.error.SignatureVerificationError as e:
            raise StripeWebhookError("Firma de seguridad inválida")


class OrderService:
    """Servicio para gestionar órdenes."""

    @staticmethod
    def validate_shipping_address(
        full_name: str, email: str, address: str, city: str, postal_code: str
    ) -> None:
        """Valida que la dirección de envío sea completa."""
        required_fields = {
            "full_name": full_name,
            "email": email,
            "address": address,
            "city": city,
            "postal_code": postal_code,
        }

        missing = [name for name, value in required_fields.items() if not value]
        if missing:
            raise InvalidAddressError(missing)

    @staticmethod
    def extract_shipping_from_payment_intent(payment_intent: dict) -> dict:
        """
        Extrae datos de envío desde PaymentIntent de Stripe.
        Intenta múltiples fuentes: shipping, charges, fallbacks.
        """
        shipping = payment_intent.get("shipping") or {}
        address_info = shipping.get("address") or {}

        # Prioridad 1: De 'shipping'
        full_name = shipping.get("name")
        email = payment_intent.get("receipt_email")
        address = address_info.get("line1")
        city = address_info.get("city")
        postal_code = address_info.get("postal_code")

        # Prioridad 2: De 'charges' (fallback)
        if not address:
            charges = payment_intent.get("charges", {}).get("data", [])
            if charges:
                billing = charges[0].get("billing_details", {})
                billing_address = billing.get("address", {})

                full_name = full_name or billing.get("name")
                email = email or billing.get("email")
                address = billing_address.get("line1")
                city = billing_address.get("city")
                postal_code = billing_address.get("postal_code")

        return {
            "full_name": full_name,
            "email": email,
            "address": address,
            "city": city,
            "postal_code": postal_code,
        }

    @staticmethod
    @transaction.atomic
    def create_order_from_payment(
        user_id: int, cart_id: int, payment_intent: dict, shipping_data: dict = None
    ) -> Order:
        """
        Crea una orden a partir de un pago exitoso.
        Este es el punto crítico del webhook.
        """
        # Prevenir duplicados
        payment_intent_id = payment_intent.get("id")
        if selectors.order_exists_for_payment_intent(payment_intent_id):
            raise DuplicateOrderError(payment_intent_id)

        # Obtener usuario
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            raise OrderServiceError(f"Usuario id={user_id} no encontrado")

        # Obtener carrito
        try:
            cart = cart_selectors.get_cart_by_id(cart_id)
        except Exception:
            raise CartNotFoundError(user_id)

        if cart_selectors.cart_is_empty(cart_id):
            raise CartEmptyError()

        # Validar stock
        validation = cart_services.CartService.validate_cart_stock(cart_id)
        if validation["invalid_items"]:
            invalid = validation["invalid_items"][0]
            raise InsufficientStockError(invalid["product_name"])

        # Extraer datos de envío
        if not shipping_data:
            shipping_data = OrderService.extract_shipping_from_payment_intent(
                payment_intent
            )

        full_name = shipping_data.get("full_name") or f"{user.first_name} {user.last_name}"
        email = shipping_data.get("email") or user.email
        address = shipping_data.get("address") or "Dirección no provista"
        city = shipping_data.get("city") or ""
        postal_code = shipping_data.get("postal_code") or ""

        # Crear orden dentro de transacción atómica
        with transaction.atomic():
            # 1. Crear Orden
            order = Order.objects.create(
                user=user,
                full_name=full_name,
                email=email,
                address=address,
                city=city,
                postal_code=postal_code,
                total=cart.total_price,
                status="PAID",
                stripe_payment_intent_id=payment_intent_id,
            )

            # 2. Mover items del carrito a la orden y decrementar stock
            for cart_item in cart.items.all():
                # Crear OrderItem
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    price=cart_item.price,
                    quantity=cart_item.quantity,
                )

                # Decrementar stock usando ProductService
                try:
                    product_services.ProductService.decrease_stock(
                        cart_item.product.id, cart_item.quantity
                    )
                except Exception as e:
                    # Si falla stock, rollback de toda la transacción
                    raise InsufficientStockError(cart_item.product.nombre)

            # 3. Vaciar carrito
            cart.items.all().delete()

            # 4. Registrar actividad
            UserActivityLog.objects.create(
                user=user,
                action="PURCHASE",
                details=f"Orden #{order.id} creada por ${order.total}",
            )

            # 5. Verificar ascenso a VIP
            OrderService._check_vip_upgrade(user)

        return order

    @staticmethod
    def _check_vip_upgrade(user: CustomUser) -> None:
        """
        Verifica si el usuario debe ser ascendido a VIP.
        Se llama automáticamente después de crear una orden pagada.
        """
        if user.is_vip:
            return  # Ya es VIP

        # Calcular gasto total
        total_spent = selectors.get_total_user_spending(user.id)

        if total_spent >= VIP_THRESHOLD:
            user.is_vip = True
            user.save()

            # Registrar
            UserActivityLog.objects.create(
                user=user,
                action="VIP_UPGRADE",
                details=f"Ascendido automáticamente por superar ${VIP_THRESHOLD} en compras.",
            )

    @staticmethod
    def send_order_confirmation_email(order_id: int) -> None:
        """
        Envía email de confirmación de orden.
        No lanza excepción si falla (fail_silently=True).
        """
        try:
            order = selectors.get_order_by_id(order_id)
        except OrderNotFoundError:
            return

        try:
            subject = f"Confirmación de Pedido #{order.id} - VetShop"
            html_message = render_to_string(
                "pedidos/email_confirmacion.html", {"order": order, "user": order.user}
            )
            plain_message = strip_tags(html_message)

            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [order.email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            # Registrar pero no fallar
            pass

    @staticmethod
    def update_order_status(order_id: int, new_status: str) -> Order:
        """Actualiza el status de una orden."""
        try:
            order = selectors.get_order_by_id(order_id)
        except OrderNotFoundError:
            raise OrderNotFoundError(order_id)

        valid_statuses = ["PENDING", "PAID", "SHIPPED", "CANCELLED"]
        if new_status not in valid_statuses:
            raise InvalidOrderStatusError(order.status, f"cambiar a {new_status}")

        order.status = new_status
        order.save()

        UserActivityLog.objects.create(
            user=order.user,
            action="ORDER_STATUS_UPDATE",
            details=f"Orden #{order.id} cambió a estado {new_status}",
        )

        return order

    @staticmethod
    @transaction.atomic
    def cancel_order(order_id: int) -> Order:
        """
        Cancela una orden y devuelve el stock.
        Solo si está en estado PENDING.
        """
        try:
            order = selectors.get_order_by_id(order_id)
        except OrderNotFoundError:
            raise OrderNotFoundError(order_id)

        if order.status != "PENDING":
            raise InvalidOrderStatusError(order.status, "CANCEL")

        # Devolver stock
        for item in order.items.all():
            try:
                product_services.ProductService.increase_stock(
                    item.product.id, item.quantity
                )
            except Exception:
                # Si no se puede aumentar stock, fallar la operación (rollback)
                raise OrderServiceError("Error al devolver stock")

        # Actualizar status
        order.status = "CANCELLED"
        order.save()

        UserActivityLog.objects.create(
            user=order.user,
            action="ORDER_CANCELLED",
            details=f"Orden #{order.id} cancelada",
        )

        return order
