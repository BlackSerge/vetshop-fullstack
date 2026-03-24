"""
usuarios/exceptions.py

Excepciones personalizadas para la capa de servicios del módulo de usuarios.
Permite un manejo centralizado y tipado de errores de negocio.
"""


class UserServiceError(Exception):
    """Excepción base para errores en el servicio de usuarios."""

    def __init__(self, message: str, code: str | None = None):
        self.message = message
        self.code = code or "USER_SERVICE_ERROR"
        super().__init__(self.message)


class UserAlreadyExistsError(UserServiceError):
    """Se intenta crear un usuario con email o username que ya existe."""

    def __init__(self, field: str, value: str):
        message = f"Ya existe un usuario con {field}: {value}"
        super().__init__(message, code="USER_ALREADY_EXISTS")


class UserNotFoundError(UserServiceError):
    """Usuario no encontrado en la base de datos."""

    def __init__(self, identifier: str):
        message = f"Usuario no encontrado: {identifier}"
        super().__init__(message, code="USER_NOT_FOUND")


class InvalidPasswordError(UserServiceError):
    """La contraseña proporcionada no es válida."""

    def __init__(self, reason: str = ""):
        message = f"Contraseña inválida. {reason}" if reason else "Contraseña inválida"
        super().__init__(message, code="INVALID_PASSWORD")


class PasswordMismatchError(UserServiceError):
    """Las contraseñas no coinciden (nuevo vs confirmación)."""

    def __init__(self):
        message = "Las contraseñas no coinciden"
        super().__init__(message, code="PASSWORD_MISMATCH")


class InvalidCredentialsError(UserServiceError):
    """Credenciales de login inválidas."""

    def __init__(self):
        message = "Las credenciales proporcionadas no son válidas"
        super().__init__(message, code="INVALID_CREDENTIALS")


class PasswordResetTokenExpiredError(UserServiceError):
    """El token de restablecimiento de contraseña ha expirado."""

    def __init__(self):
        message = "El token de restablecimiento ha expirado"
        super().__init__(message, code="TOKEN_EXPIRED")


class PasswordResetTokenInvalidError(UserServiceError):
    """El token de restablecimiento de contraseña es inválido."""

    def __init__(self):
        message = "El token de restablecimiento es inválido"
        super().__init__(message, code="TOKEN_INVALID")


class EmailNotConfirmedError(UserServiceError):
    """El email del usuario no ha sido confirmado."""

    def __init__(self):
        message = "El email no ha sido confirmado"
        super().__init__(message, code="EMAIL_NOT_CONFIRMED")


class UserInactiveError(UserServiceError):
    """El usuario está inactivo."""

    def __init__(self):
        message = "La cuenta de usuario está inactiva"
        super().__init__(message, code="USER_INACTIVE")


class InsufficientPermissionsError(UserServiceError):
    """El usuario no tiene permisos para realizar la acción."""

    def __init__(self):
        message = "Permisos insuficientes para realizar esta acción"
        super().__init__(message, code="INSUFFICIENT_PERMISSIONS")
