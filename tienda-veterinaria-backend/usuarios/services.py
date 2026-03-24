"""
usuarios/services.py

Capa de servicios para el módulo de usuarios.
TODA la lógica de negocio debe estar aquí, no en views ni serializers.

Responsabilidades:
- Creación, autenticación, y gestión de usuarios
- Validación de reglas de negocio
- Registro de auditoría
- Cambio de contraseñas
- Restablecimiento de contraseña
- Gestión de tokens JWT
"""

from __future__ import annotations
from typing import Optional, Dict, Any, Tuple
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password as django_validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import UserActivityLog
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

CustomUser = get_user_model()


class UserService:
    """Servicio centralizado para operaciones de usuarios."""

    @staticmethod
    def validate_password_strength(password: str) -> None:
        """
        Valida que la contraseña cumpla con los requisitos de seguridad.
        
        Args:
            password: Contraseña a validar
            
        Raises:
            InvalidPasswordError: Si la contraseña no es válida
        """
        try:
            django_validate_password(password)
        except DjangoValidationError as e:
            raise InvalidPasswordError(reason=" ".join(e.messages))

    @staticmethod
    @transaction.atomic
    def register_user(
        username: str,
        email: str,
        password: str,
        password_confirm: str,
        first_name: str = "",
        last_name: str = "",
    ) -> "CustomUser":
        """
        Registra un nuevo usuario con validaciones de negocio.
        
        Args:
            username: Nombre de usuario
            email: Email del usuario
            password: Contraseña
            password_confirm: Confirmación de contraseña
            first_name: Nombre del usuario
            last_name: Apellido del usuario
            
        Returns:
            CustomUser creado
            
        Raises:
            UserAlreadyExistsError: Si el usuario/email ya existe
            PasswordMismatchError: Si las contraseñas no coinciden
            InvalidPasswordError: Si la contraseña no es válida
        """
        # Validar que las contraseñas coincidan
        if password != password_confirm:
            raise PasswordMismatchError()

        # Validar fortaleza de contraseña
        UserService.validate_password_strength(password)

        # Validar que no exista un usuario con ese email o username
        if selectors.user_exists(email=email, username=username):
            if selectors.user_exists(email=email):
                raise UserAlreadyExistsError("email", email)
            else:
                raise UserAlreadyExistsError("username", username)

        # Crear usuario
        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        # Registrar la acción
        UserService.log_activity(user, "REGISTRATION", f"Usuario registrado: {email}")

        return user

    @staticmethod
    def authenticate_user(credential: str, password: str) -> Tuple[CustomUser, Dict[str, str]]:
        """
        Autentica un usuario y genera tokens JWT.
        Acepta tanto email como username como credencial.
        
        Args:
            credential: Email o username del usuario
            password: Contraseña
            
        Returns:
            Tupla (user, tokens_dict)
            
        Raises:
            InvalidCredentialsError: Si las credenciales no son válidas
            UserInactiveError: Si la cuenta está inactiva
        """
        # Intentar buscar por email primero, luego por username
        user = selectors.get_user_by_email(credential)
        if not user:
            user = selectors.get_user_by_username(credential)

        if not user or not user.check_password(password):
            raise InvalidCredentialsError()

        if not user.is_active:
            raise UserInactiveError()

        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        tokens = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

        # Registrar login
        UserService.log_activity(user, "LOGIN", "Inicio de sesión exitoso")

        return user, tokens

    @staticmethod
    @transaction.atomic
    def change_password(user: CustomUser, old_password: str, new_password: str, new_password_confirm: str) -> None:
        """
        Cambia la contraseña de un usuario.
        
        Args:
            user: Usuario
            old_password: Contraseña actual
            new_password: Nueva contraseña
            new_password_confirm: Confirmación de nueva contraseña
            
        Raises:
            InvalidPasswordError: Si la contraseña actual es incorrecta
            PasswordMismatchError: Si las nuevas contraseñas no coinciden
            InvalidPasswordError: Si la nueva contraseña no es válida
        """
        # Validar contraseña actual
        if not user.check_password(old_password):
            raise InvalidPasswordError(reason="La contraseña actual es incorrecta")

        # Validar que las nuevas contraseñas coincidan
        if new_password != new_password_confirm:
            raise PasswordMismatchError()

        # Validar fortaleza de nueva contraseña
        UserService.validate_password_strength(new_password)

        # Cambiar contraseña
        user.set_password(new_password)
        user.save(update_fields=['password'])

        # Registrar cambio
        UserService.log_activity(user, "PASSWORD_CHANGE", "Contraseña cambiada exitosamente")

    @staticmethod
    def request_password_reset(email: str) -> CustomUser:
        """
        Genera un token de restablecimiento de contraseña y envía email.
        
        Args:
            email: Email del usuario
            
        Returns:
            CustomUser
            
        Raises:
            UserNotFoundError: Si el usuario no existe
        """
        user = selectors.get_user_by_email(email)

        if not user:
            # Por seguridad, no revelamos si el email existe o no
            raise UserNotFoundError(email)

        # Generar token
        token = default_token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

        # Preparar contexto para el email
        reset_url = f"{settings.FRONTEND_URL}/reset-password-confirm/?uidb64={uidb64}&token={token}"
        context = {
            "user": user,
            "reset_url": reset_url,
        }

        # Renderizar template de email
        email_html = render_to_string("usuarios/password_reset_email_api.html", context)

        # Enviar email
        try:
            send_mail(
                subject="Restablecimiento de Contraseña",
                message="",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=email_html,
                fail_silently=False,
            )
        except Exception as e:
            raise e

        # Registrar acción
        UserService.log_activity(user, "PASSWORD_RESET_REQUESTED", f"Solicitud de restablecimiento enviada")

        return user

    @staticmethod
    @transaction.atomic
    def confirm_password_reset(uidb64: str, token: str, new_password: str, new_password_confirm: str) -> CustomUser:
        """
        Confirma el restablecimiento de contraseña con token.
        
        Args:
            uidb64: User ID encoded
            token: Token de restablecimiento
            new_password: Nueva contraseña
            new_password_confirm: Confirmación de nueva contraseña
            
        Returns:
            CustomUser con contraseña actualizada
            
        Raises:
            PasswordResetTokenInvalidError: Si el token es inválido
            PasswordResetTokenExpiredError: Si el token expiró
            PasswordMismatchError: Si las contraseñas no coinciden
            InvalidPasswordError: Si la nueva contraseña no es válida
        """
        # Decodificar UID
        try:
            user_id = force_str(urlsafe_base64_decode(uidb64))
            user = selectors.get_user_by_id(int(user_id))
        except (TypeError, ValueError, OverflowError):
            raise PasswordResetTokenInvalidError()

        if not user:
            raise PasswordResetTokenInvalidError()

        # Verificar token
        if not default_token_generator.check_token(user, token):
            raise PasswordResetTokenExpiredError()

        # Validar que las contraseñas coincidan
        if new_password != new_password_confirm:
            raise PasswordMismatchError()

        # Validar fortaleza
        UserService.validate_password_strength(new_password)

        # Cambiar contraseña
        user.set_password(new_password)
        user.save(update_fields=['password'])

        # Registrar acción
        UserService.log_activity(user, "PASSWORD_RESET_CONFIRMED", "Contraseña restablecida exitosamente")

        return user

    @staticmethod
    @transaction.atomic
    def update_user_profile(
        user: CustomUser,
        first_name: str = None,
        last_name: str = None,
    ) -> CustomUser:
        """
        Actualiza el perfil del usuario.
        
        Args:
            user: Usuario a actualizar
            first_name: Nuevo nombre (opcional)
            last_name: Nuevo apellido (opcional)
            
        Returns:
            CustomUser actualizado
        """
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name

        user.save()

        UserService.log_activity(user, "PROFILE_UPDATE", "Perfil actualizado")

        return user

    @staticmethod
    def generate_tokens(user: CustomUser) -> Dict[str, str]:
        """
        Genera tokens JWT para un usuario.
        
        Args:
            user: Usuario
            
        Returns:
            Dict con refresh y access tokens
        """
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

    @staticmethod
    def log_activity(
        user: CustomUser,
        action: str,
        details: str = "",
        ip_address: Optional[str] = None,
    ) -> UserActivityLog:
        """
        Registra una actividad del usuario para auditoría.
        
        Args:
            user: Usuario
            action: Tipo de acción
            details: Detalles de la acción
            ip_address: Dirección IP (opcional)
            
        Returns:
            UserActivityLog creado
        """
        return UserActivityLog.objects.create(
            user=user,
            action=action,
            details=details,
            ip_address=ip_address,
        )

    @staticmethod
    def get_user_ip(request) -> str:
        """
        Extrae la dirección IP del usuario de la request.
        
        Args:
            request: HttpRequest
            
        Returns:
            Dirección IP como string
        """
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "")
