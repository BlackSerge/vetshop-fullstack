
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

    @staticmethod
    def validate_password_strength(password: str) -> None:
        
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
      
        if password != password_confirm:
            raise PasswordMismatchError()

        UserService.validate_password_strength(password)

      
        if selectors.user_exists(email=email, username=username):
            if selectors.user_exists(email=email):
                raise UserAlreadyExistsError("email", email)
            else:
                raise UserAlreadyExistsError("username", username)

      
        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

      
        UserService.log_activity(user, "REGISTRATION", f"Usuario registrado: {email}")

        return user

    @staticmethod
    def authenticate_user(credential: str, password: str) -> Tuple[CustomUser, Dict[str, str]]:
      
        user = selectors.get_user_by_email(credential)
        if not user:
            user = selectors.get_user_by_username(credential)

        if not user or not user.check_password(password):
            raise InvalidCredentialsError()

        if not user.is_active:
            raise UserInactiveError()

        refresh = RefreshToken.for_user(user)
        tokens = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

   
        UserService.log_activity(user, "LOGIN", "Inicio de sesión exitoso")

        return user, tokens

    @staticmethod
    @transaction.atomic
    def change_password(user: CustomUser, old_password: str, new_password: str, new_password_confirm: str) -> None:
        
        if not user.check_password(old_password):
            raise InvalidPasswordError(reason="La contraseña actual es incorrecta")

   
        if new_password != new_password_confirm:
            raise PasswordMismatchError()

      
        UserService.validate_password_strength(new_password)

        user.set_password(new_password)
        user.save(update_fields=['password'])

 
        UserService.log_activity(user, "PASSWORD_CHANGE", "Contraseña cambiada exitosamente")

    @staticmethod
    def request_password_reset(email: str) -> CustomUser:
       
        user = selectors.get_user_by_email(email)

        if not user:
            raise UserNotFoundError(email)

        token = default_token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        reset_url = f"{settings.FRONTEND_URL}/reset-password-confirm/?uidb64={uidb64}&token={token}"
        context = {
            "user": user,
            "reset_url": reset_url,
        }

        email_html = render_to_string("usuarios/password_reset_email_api.html", context)

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

        UserService.log_activity(user, "PASSWORD_RESET_REQUESTED", f"Solicitud de restablecimiento enviada")

        return user

    @staticmethod
    @transaction.atomic
    def confirm_password_reset(uidb64: str, token: str, new_password: str, new_password_confirm: str) -> CustomUser:
       
        try:
            user_id = force_str(urlsafe_base64_decode(uidb64))
            user = selectors.get_user_by_id(int(user_id))
        except (TypeError, ValueError, OverflowError):
            raise PasswordResetTokenInvalidError()

        if not user:
            raise PasswordResetTokenInvalidError()

        if not default_token_generator.check_token(user, token):
            raise PasswordResetTokenExpiredError()

        if new_password != new_password_confirm:
            raise PasswordMismatchError()

        UserService.validate_password_strength(new_password)

        user.set_password(new_password)
        user.save(update_fields=['password'])

        UserService.log_activity(user, "PASSWORD_RESET_CONFIRMED", "Contraseña restablecida exitosamente")

        return user

    @staticmethod
    @transaction.atomic
    def update_user_profile(
        user: CustomUser,
        first_name: str = None,
        last_name: str = None,
    ) -> CustomUser:
        
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name

        user.save()

        UserService.log_activity(user, "PROFILE_UPDATE", "Perfil actualizado")

        return user

    @staticmethod
    def generate_tokens(user: CustomUser) -> Dict[str, str]:
  
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
      
        return UserActivityLog.objects.create(
            user=user,
            action=action,
            details=details,
            ip_address=ip_address,
        )

    @staticmethod
    def get_user_ip(request) -> str:
      
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "")
