# usuarios/views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken # Para JWT
from django.contrib.auth import get_user_model # Para obtener el modelo de usuario actual
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from django.urls import reverse
from django.db import transaction # <--- Nueva importación para transacciones atómicas
from django.dispatch import receiver
from .serializers import AdminUserSerializer, AdminUserDetailSerializer



# Importaciones específicas para el Carrito y JWT
from rest_framework_simplejwt.views import TokenObtainPairView # <--- Importar la vista base de Simple JWT
from carrito.models import Cart, CartItem # <--- Importar modelos del carrito
from carrito.serializers import CartSerializer # <--- Importar serializador del carrito
from carrito.views import CART_SESSION_KEY_HEADER # <--- Importar la cabecera del carrito para carritos anónimos
import uuid # <--- ¡Nueva importación para UUID!
from django.contrib.auth.models import update_last_login

from .models import CustomUser, UserActivityLog
from .serializers import (
    CustomUserSerializer,
    UserRegistrationSerializer,
    UserProfileUpdateSerializer,
    PasswordChangeSerializer,
    AdminUserSerializer 
)



def create_log(user, action, details, request=None):
    ip = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
    
    UserActivityLog.objects.create(user=user, action=action, details=details, ip_address=ip)




# --- Función Auxiliar para Fusionar Carritos ---
def merge_anonymous_cart(request, user):
    """
    Fusiona un carrito anónimo (identificado por CART_SESSION_KEY_HEADER en la request)
    con el carrito del usuario autenticado o que acaba de registrarse.
    Elimina el carrito anónimo después de la fusión.
    """
    anon_session_key_str = request.headers.get(CART_SESSION_KEY_HEADER)
    merged_cart_data = None
    if anon_session_key_str:
        try:
            anon_session_uuid = uuid.UUID(anon_session_key_str)
            # Buscar el carrito anónimo que no esté asociado a un usuario
            anonymous_cart = Cart.objects.get(session_key=anon_session_uuid, user__isnull=True)

            with transaction.atomic(): # Asegura que la fusión sea atómica
                # Obtener o crear el carrito del usuario
                user_cart, created_user_cart = Cart.objects.get_or_create(user=user)

                for anon_item in anonymous_cart.items.all():
                    # Verificar si el producto ya está en el carrito del usuario
                    existing_item = user_cart.items.filter(product=anon_item.product).first()

                    if existing_item:
                        # Si ya existe, actualizar la cantidad
                        new_quantity = existing_item.quantity + anon_item.quantity
                        if new_quantity <= existing_item.product.stock: # Verificar stock antes de actualizar
                            existing_item.quantity = new_quantity
                            existing_item.price = anon_item.product.get_precio_actual # Actualizar precio por si cambió
                            existing_item.save()
                        else:
                            # Si la nueva cantidad excede el stock, mantener el stock máximo posible
                            # Opcional: Podrías añadir un mensaje de advertencia aquí.
                            existing_item.quantity = existing_item.product.stock
                            existing_item.price = anon_item.product.get_precio_actual
                            existing_item.save()
                    else:
                        # Si no existe, crear un nuevo CartItem para el usuario
                        if anon_item.quantity <= anon_item.product.stock: # Verificar stock antes de añadir
                            CartItem.objects.create(
                                cart=user_cart,
                                product=anon_item.product,
                                quantity=anon_item.quantity,
                                price=anon_item.product.get_precio_actual # Usar el precio actual del producto
                            )
                        # else: Opcional: Si no hay stock para añadir, no se añade o se añade lo que queda.

                anonymous_cart.delete() # Eliminar el carrito anónimo después de la fusión
                merged_cart_data = CartSerializer(user_cart, context={'request': request}).data # Serializar el carrito fusionado

        except (ValueError, Cart.DoesNotExist):
            # El session_key es inválido o no existe un carrito anónimo con ese ID, no hacemos nada
            pass
    return merged_cart_data


# --- Vistas existentes, modificadas para la fusión ---

class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generar tokens JWT para el nuevo usuario
        refresh = RefreshToken.for_user(user)

        # --- Lógica de Fusión del Carrito Anónimo al Registrarse ---
        merged_cart_data = merge_anonymous_cart(request, user)

        # Construir la respuesta
        response_data = {
            'message': 'Registro exitoso.',
            'user': CustomUserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        if merged_cart_data:
            response_data['cart'] = merged_cart_data # Añadir datos del carrito fusionado si existe

        response = Response(response_data, status=status.HTTP_201_CREATED)
        return response


# --- NUEVA VISTA DE LOGIN PERSONALIZADA PARA FUSIÓN ---
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Extiende TokenObtainPairView para incluir la fusión de carritos anónimos
    y devolver información adicional del usuario y el carrito en la respuesta del login.
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs) # Llama al método POST original de Simple JWT

        if response.status_code == status.HTTP_200_OK:
            # Si el login fue exitoso, el usuario ya está autenticado.
            # Necesitamos obtener la instancia del usuario.
            # Asumimos que se loguea con 'username', ajusta si usas 'email'.
            User = get_user_model()
            try:
                user = User.objects.get(username=request.data.get('username'))
                update_last_login(None, user) 
                create_log(user, 'LOGIN', 'Inicio de sesión (JWT)', request)
            except User.DoesNotExist:
                # Esto no debería pasar si super().post() fue exitoso, pero es una buena práctica
                return Response({'detail': 'Usuario no encontrado después de la autenticación.'}, status=status.HTTP_400_BAD_REQUEST)

            # --- Lógica de Fusión del Carrito Anónimo al Iniciar Sesión ---
            merged_cart_data = merge_anonymous_cart(request, user)

            # Añadir información del usuario y del carrito a la respuesta original de JWT
            response.data['user'] = CustomUserSerializer(user).data
            if merged_cart_data:
                response.data['cart'] = merged_cart_data

        return response


# --- Vistas restantes (sin cambios significativos para la fusión, solo se incluyen para un contexto completo) ---

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CustomUserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user # Solo el usuario autenticado puede ver/editar su perfil

    def put(self, request, *args, **kwargs):
        # Para la actualización completa (reemplaza todos los campos)
        serializer = UserProfileUpdateSerializer(self.get_object(), data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def patch(self, request, *args, **kwargs):
        # Para la actualización parcial (solo algunos campos)
        serializer = UserProfileUpdateSerializer(self.get_object(), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


def perform_destroy(self, instance):
        # Aquí podrías desactivarlo en vez de borrarlo: instance.is_active = False; instance.save()
        # O borrarlo físicamente:
        create_log(instance, 'ACCOUNT_DELETED', 'Usuario eliminó su propia cuenta', self.request)
        instance.delete()

def perform_update(self, serializer):
        # 1. Guardar los cambios
        super().perform_update(serializer)
        
        # 2. Crear el log
        # Usamos self.request.user para asegurar que registramos al usuario correcto
        create_log(
            user=self.request.user, 
            action='PROFILE_UPDATE', 
            details='Información de perfil actualizada', 
            request=self.request
        )


class UserAdminListAPIView(generics.ListCreateAPIView):
    queryset = CustomUser.objects.all().order_by('-date_joined')
    serializer_class = AdminUserSerializer # <--- Ahora usa el importado
    # ...

class UserAdminRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [IsAdminUser]
    lookup_field = 'pk'
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AdminUserDetailSerializer # <--- Para ver detalles, usa el completo
        return AdminUserSerializer # Para editar (PATCH/PUT), usa el norma

class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        create_log(user, 'PASSWORD_CHANGE', 'Contraseña actualizada manualmente', request)
        return Response({'message': 'Contraseña actualizada con éxito.'}, status=status.HTTP_200_OK)

class RequestPasswordResetAPIView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({'email': 'Este campo es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Por seguridad, no decimos si el usuario no existe
            return Response({'message': 'Si tu dirección de correo electrónico está en nuestro sistema, te enviaremos un enlace.'}, status=status.HTTP_200_OK)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        current_site_domain = 'localhost:5173' # Cambia esto en producción
        reset_url = f"http://{current_site_domain}/reset-password?uidb64={uid}&token={token}"

        email_context = {
            'user': user,
            'reset_url': reset_url,
            'site_name': 'Tu Tienda Veterinaria',
            'domain': current_site_domain,
        }

        # --- BLOQUE DE ENVÍO DE CORREO CON DEBUG ---
        try:
            print(f"--- INTENTANDO ENVIAR CORREO A: {user.email} ---")
            
            # 1. Renderizar plantillas (Si falla aquí, es error de ruta/archivo)
            email_html_message = render_to_string('usuarios/password_reset_email_api.html', email_context)
            email_plain_message = render_to_string('usuarios/password_reset_subject.txt', email_context)
            print("✅ Plantillas encontradas y renderizadas.")

            # 2. Enviar correo (Si falla aquí, es error SMTP/Gmail/Red)
            send_mail(
                'Restablecimiento de contraseña - VetShop',
                email_plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=email_html_message,
                fail_silently=False, # Importante para ver el error
            )
            print("✅ Correo enviado exitosamente.")

        except Exception as e:
            print(f"🔥🔥🔥 ERROR CRÍTICO ENVIANDO CORREO: {str(e)}")
            # En producción podrías querer silenciar esto o loguearlo en Sentry
            # Para debug, devolvemos el error en la respuesta (solo temporalmente)
            return Response({'error': f'Fallo envío correo: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Si tu dirección de correo electrónico está en nuestro sistema, te enviaremos un enlace.'}, status=status.HTTP_200_OK)
class ConfirmPasswordResetAPIView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        new_password_confirm = request.data.get('new_password_confirm')

        if not all([uidb64, token, new_password, new_password_confirm]):
            return Response({'detail': 'Faltan parámetros.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != new_password_confirm:
            return Response({'new_password_confirm': 'Las nuevas contraseñas no coinciden.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_password(new_password)
        except Exception as e:
            return Response({'new_password': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            
            create_log(user, 'PASSWORD_RESET', 'Contraseña restablecida por correo', request)
            
            return Response({'message': 'Contraseña restablecida con éxito.'}, status=status.HTTP_200_OK)
        else:
            return Response({'detail': 'El enlace de restablecimiento es inválido o ha caducado.'}, status=status.HTTP_400_BAD_REQUEST)
        
        
class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        create_log(request.user, 'LOGOUT', 'Cierre de sesión voluntario', request)
        # Aquí podrías añadir el token a la blacklist si la usas
        return Response({"message": "Logout registrado"}, status=status.HTTP_200_OK)