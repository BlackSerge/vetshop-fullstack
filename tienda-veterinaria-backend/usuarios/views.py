
from typing import Optional
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from drf_spectacular.utils import extend_schema

from .models import CustomUser
from .serializers import (
    CustomUserSerializer,
    UserRegistrationSerializer,
    UserProfileUpdateSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    MessageResponseSerializer,
    PasswordChangeSerializer,
    AdminUserSerializer,
    AdminUserDetailSerializer,
)
from .services import UserService
from .exceptions import (
    UserAlreadyExistsError,
    UserNotFoundError,
    InvalidPasswordError,
    PasswordMismatchError,
    InvalidCredentialsError,
    PasswordResetTokenExpiredError,
    PasswordResetTokenInvalidError,
    UserInactiveError,
)
from . import selectors
from carrito.models import Cart, CartItem
from carrito.serializers import CartSerializer
from carrito.views import CART_SESSION_KEY_HEADER

import uuid


def _merge_anonymous_cart(request, user: CustomUser) -> Optional[dict]:
    anon_session_key_str = request.headers.get(CART_SESSION_KEY_HEADER)
    if not anon_session_key_str:
        return None

    try:
        anon_session_uuid = uuid.UUID(anon_session_key_str)
        anonymous_cart = Cart.objects.get(
            session_key=anon_session_uuid,
            user__isnull=True
        )

        user_cart, _ = Cart.objects.get_or_create(user=user)

        for anon_item in anonymous_cart.items.all():
            existing_item = user_cart.items.filter(product=anon_item.product).first()

            if existing_item:
                new_quantity = existing_item.quantity + anon_item.quantity
                if new_quantity <= anon_item.product.stock:
                    existing_item.quantity = new_quantity
                    existing_item.price = anon_item.product.get_precio_actual
                    existing_item.save()
                else:
                    existing_item.quantity = anon_item.product.stock
                    existing_item.price = anon_item.product.get_precio_actual
                    existing_item.save()
            else:
                if anon_item.quantity <= anon_item.product.stock:
                    CartItem.objects.create(
                        cart=user_cart,
                        product=anon_item.product,
                        quantity=anon_item.quantity,
                        price=anon_item.product.get_precio_actual,
                    )

        anonymous_cart.delete()
        return CartSerializer(user_cart, context={"request": request}).data

    except (ValueError, Cart.DoesNotExist):
        return None


def _get_client_ip(request) -> str:
 
    return UserService.get_user_ip(request)

class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = UserService.register_user(
                username=serializer.validated_data["username"],
                email=serializer.validated_data["email"],
                password=serializer.validated_data["password"],
                password_confirm=serializer.validated_data["password2"],
                first_name=serializer.validated_data.get("first_name", ""),
                last_name=serializer.validated_data.get("last_name", ""),
            )

            ip_address = _get_client_ip(request)
            UserService.log_activity(
                user,
                "REGISTRATION",
                f"Registro desde IP: {ip_address}",
                ip_address=ip_address,
            )

            tokens = UserService.generate_tokens(user)

            merged_cart_data = _merge_anonymous_cart(request, user)

            response_data = {
                "message": "Registro exitoso",
                "user": CustomUserSerializer(user).data,
                "refresh": tokens["refresh"],
                "access": tokens["access"],
            }
            if merged_cart_data:
                response_data["cart"] = merged_cart_data

            return Response(response_data, status=status.HTTP_201_CREATED)

        except UserAlreadyExistsError as e:
            return Response(
                {"detail": e.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except (PasswordMismatchError, InvalidPasswordError) as e:
            return Response(
                {"detail": e.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"detail": "Error al registrar usuario"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CustomTokenObtainPairView(TokenObtainPairView):

    def post(self, request, *args, **kwargs):
        
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            try:
                username = request.data.get("username")
                password = request.data.get("password")
                user, _ = UserService.authenticate_user(username, password)
                ip_address = _get_client_ip(request)
                UserService.log_activity(
                    user,
                    "LOGIN",
                    f"Login exitoso desde IP: {ip_address}",
                    ip_address=ip_address,
                )
                merged_cart_data = _merge_anonymous_cart(request, user)
                response.data["user"] = CustomUserSerializer(user).data
                if merged_cart_data:
                    response.data["cart"] = merged_cart_data

            except (InvalidCredentialsError, UserInactiveError) as e:
                return Response(
                    {"detail": e.message},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            except Exception as e:
                print(f"Error en lógica post-login: {e}")
                pass  

        return response


class UserProfileView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = CustomUserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self) -> CustomUser:
        return self.request.user

    def put(self, request, *args, **kwargs):
        serializer = UserProfileUpdateSerializer(
            self.get_object(),
            data=request.data,
            partial=False,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        UserService.log_activity(
            request.user,
            "PROFILE_UPDATE",
            "Perfil actualizado",
            ip_address=_get_client_ip(request),
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        serializer = UserProfileUpdateSerializer(
            self.get_object(),
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        UserService.log_activity(
            request.user,
            "PROFILE_UPDATE",
            "Perfil actualizado parcialmente",
            ip_address=_get_client_ip(request),
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        user = self.get_object()
        UserService.log_activity(
            user,
            "ACCOUNT_DELETED",
            "Cuenta eliminada por el usuario",
            ip_address=_get_client_ip(request),
        )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangePasswordView(APIView):

    permission_classes = (IsAuthenticated,)
    serializer_class = PasswordChangeSerializer

    @extend_schema(
        request=PasswordChangeSerializer,
        responses={200: MessageResponseSerializer},
    )

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        try:
            UserService.change_password(
                user=request.user,
                old_password=serializer.validated_data["old_password"],
                new_password=serializer.validated_data["new_password"],
                new_password_confirm=serializer.validated_data["new_password_confirm"],
            )

            UserService.log_activity(
                request.user,
                "PASSWORD_CHANGE",
                "Contraseña actualizada",
                ip_address=_get_client_ip(request),
            )

            return Response(
                {"message": "Contraseña actualizada con éxito"},
                status=status.HTTP_200_OK,
            )

        except (InvalidPasswordError, PasswordMismatchError) as e:
            return Response(
                {"detail": e.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"detail": "Error al cambiar contraseña"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RequestPasswordResetAPIView(APIView):

    permission_classes = (AllowAny,)
    serializer_class = PasswordResetRequestSerializer

    @extend_schema(
        request=PasswordResetRequestSerializer,
        responses={200: MessageResponseSerializer},
    )

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email:
            return Response(
                {"email": "Este campo es requerido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            UserService.request_password_reset(email)
            return Response(
                {
                    "message": "Si el email existe en nuestro sistema, "
                    "recibirás un enlace de restablecimiento"
                },
                status=status.HTTP_200_OK,
            )
        except UserNotFoundError:
            return Response(
                {
                    "message": "Si el email existe en nuestro sistema, "
                    "recibirás un enlace de restablecimiento"
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"detail": "Error al procesar solicitud"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ConfirmPasswordResetAPIView(APIView):

    permission_classes = (AllowAny,)
    serializer_class = PasswordResetConfirmSerializer

    @extend_schema(
        request=PasswordResetConfirmSerializer,
        responses={200: MessageResponseSerializer},
    )

    def post(self, request, *args, **kwargs):
        uidb64 = request.data.get("uidb64")
        token = request.data.get("token")
        new_password = request.data.get("new_password")
        new_password_confirm = request.data.get("new_password_confirm")

        if not all([uidb64, token, new_password, new_password_confirm]):
            return Response(
                {"detail": "Faltan parámetros requeridos"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = UserService.confirm_password_reset(
                uidb64=uidb64,
                token=token,
                new_password=new_password,
                new_password_confirm=new_password_confirm,
            )

            UserService.log_activity(
                user,
                "PASSWORD_RESET_CONFIRMED",
                "Contraseña restablecida",
                ip_address=_get_client_ip(request),
            )

            return Response(
                {"message": "Contraseña restablecida con éxito"},
                status=status.HTTP_200_OK,
            )

        except PasswordResetTokenInvalidError:
            return Response(
                {"detail": "Token de restablecimiento inválido"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except PasswordResetTokenExpiredError:
            return Response(
                {"detail": "Token de restablecimiento expirado"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except (PasswordMismatchError, InvalidPasswordError) as e:
            return Response(
                {"detail": e.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"detail": "Error al restablecimiento de contraseña"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserAdminListAPIView(generics.ListCreateAPIView):
  
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer
    pagination_class = None
    filter_backends = [filters.SearchFilter]
    search_fields = ["username", "email", "first_name", "last_name"]

    def get_queryset(self):
        return selectors.get_all_users()


class UserAdminRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
  
    permission_classes = [IsAdminUser]
    lookup_field = "pk"

    def get_queryset(self):
        return CustomUser.objects.all()

    def get_serializer_class(self):
        if self.request.method == "GET":
            return AdminUserDetailSerializer
        return AdminUserSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        UserService.log_activity(
            instance,
            "ACCOUNT_DELETED",
            "Cuenta eliminada por administrador",
            ip_address=_get_client_ip(request),
        )
        return super().destroy(request, *args, **kwargs)


class LogoutView(APIView):

    permission_classes = (IsAuthenticated,)
    serializer_class = MessageResponseSerializer

    @extend_schema(
        responses={200: MessageResponseSerializer},
    )

    def post(self, request):
        UserService.log_activity(
            request.user,
            "LOGOUT",
            "Cierre de sesión",
            ip_address=_get_client_ip(request),
        )
        return Response(
            {"message": "Logout registrado"},
            status=status.HTTP_200_OK,
        
        )