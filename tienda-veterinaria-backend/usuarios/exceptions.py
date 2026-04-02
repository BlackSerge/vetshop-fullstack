
class UserServiceError(Exception):

    def __init__(self, message: str, code: str | None = None):
        self.message = message
        self.code = code or "USER_SERVICE_ERROR"
        super().__init__(self.message)


class UserAlreadyExistsError(UserServiceError):

    def __init__(self, field: str, value: str):
        message = f"Ya existe un usuario con {field}: {value}"
        super().__init__(message, code="USER_ALREADY_EXISTS")


class UserNotFoundError(UserServiceError):

    def __init__(self, identifier: str):
        message = f"Usuario no encontrado: {identifier}"
        super().__init__(message, code="USER_NOT_FOUND")


class InvalidPasswordError(UserServiceError):

    def __init__(self, reason: str = ""):
        message = f"Contraseña inválida. {reason}" if reason else "Contraseña inválida"
        super().__init__(message, code="INVALID_PASSWORD")


class PasswordMismatchError(UserServiceError):

    def __init__(self):
        message = "Las contraseñas no coinciden"
        super().__init__(message, code="PASSWORD_MISMATCH")


class InvalidCredentialsError(UserServiceError):

    def __init__(self):
        message = "Las credenciales proporcionadas no son válidas"
        super().__init__(message, code="INVALID_CREDENTIALS")


class PasswordResetTokenExpiredError(UserServiceError):

    def __init__(self):
        message = "El token de restablecimiento ha expirado"
        super().__init__(message, code="TOKEN_EXPIRED")


class PasswordResetTokenInvalidError(UserServiceError):

    def __init__(self):
        message = "El token de restablecimiento es inválido"
        super().__init__(message, code="TOKEN_INVALID")


class EmailNotConfirmedError(UserServiceError):

    def __init__(self):
        message = "El email no ha sido confirmado"
        super().__init__(message, code="EMAIL_NOT_CONFIRMED")


class UserInactiveError(UserServiceError):

    def __init__(self):
        message = "La cuenta de usuario está inactiva"
        super().__init__(message, code="USER_INACTIVE")


class InsufficientPermissionsError(UserServiceError):

    def __init__(self):
        message = "Permisos insuficientes para realizar esta acción"
        super().__init__(message, code="INSUFFICIENT_PERMISSIONS")
