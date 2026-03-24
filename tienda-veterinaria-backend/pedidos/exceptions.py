"""
pedidos/exceptions.py

Excepciones custom para el módulo de pedidos.
Todas las excepciones heredan de OrderServiceError.
"""


class OrderServiceError(Exception):
    """Excepción base para el servicio de pedidos."""

    def __init__(self, message: str, code: str = "ORDER_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class OrderNotFoundError(OrderServiceError):
    """La orden no existe."""

    def __init__(self, order_id: int):
        message = f"Orden con id={order_id} no encontrada"
        super().__init__(message, "ORDER_NOT_FOUND")


class CartEmptyError(OrderServiceError):
    """El carrito está vacío."""

    def __init__(self):
        message = "El carrito está vacío"
        super().__init__(message, "CART_EMPTY")


class CartNotFoundError(OrderServiceError):
    """El carrito no existe."""

    def __init__(self, user_id: int):
        message = f"Carrito no encontrado para usuario id={user_id}"
        super().__init__(message, "CART_NOT_FOUND")


class InsufficientStockError(OrderServiceError):
    """Stock insuficiente para uno o más productos."""

    def __init__(self, product_name: str):
        message = f"Stock insuficiente para '{product_name}'"
        super().__init__(message, "INSUFFICIENT_STOCK")


class InvalidAddressError(OrderServiceError):
    """Dirección inválida o incompleta."""

    def __init__(self, missing_fields: list):
        message = f"Dirección incompleta. Campos faltantes: {', '.join(missing_fields)}"
        super().__init__(message, "INVALID_ADDRESS")


class StripePaymentError(OrderServiceError):
    """Error de pago con Stripe."""

    def __init__(self, error_message: str):
        message = f"Error de pago Stripe: {error_message}"
        super().__init__(message, "STRIPE_PAYMENT_ERROR")


class StripeWebhookError(OrderServiceError):
    """Error en webhook de Stripe."""

    def __init__(self, reason: str):
        message = f"Error en webhook: {reason}"
        super().__init__(message, "STRIPE_WEBHOOK_ERROR")


class PaymentIntentNotFoundError(OrderServiceError):
    """PaymentIntent de Stripe no existe."""

    def __init__(self, intent_id: str):
        message = f"PaymentIntent '{intent_id}' no encontrado en Stripe"
        super().__init__(message, "PAYMENT_INTENT_NOT_FOUND")


class DuplicateOrderError(OrderServiceError):
    """Orden duplicada (mismo PaymentIntent ya procesado)."""

    def __init__(self, payment_intent_id: str):
        message = f"Orden para PaymentIntent '{payment_intent_id}' ya existe"
        super().__init__(message, "DUPLICATE_ORDER")


class InvalidOrderStatusError(OrderServiceError):
    """Estado de orden inválido para operación."""

    def __init__(self, current_status: str, operation: str):
        message = f"Operación '{operation}' no permitida para orden en estado '{current_status}'"
        super().__init__(message, "INVALID_ORDER_STATUS")


class EmailNotificationError(OrderServiceError):
    """Error al enviar email de confirmación."""

    def __init__(self, recipient: str):
        message = f"Error al enviar email a '{recipient}'"
        super().__init__(message, "EMAIL_NOTIFICATION_ERROR")
