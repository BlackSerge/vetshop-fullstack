"""
carrito/exceptions.py

Excepciones custom para el módulo de carrito.
Todas las excepciones heredan de CartServiceError.
"""


class CartServiceError(Exception):
    """Excepción base para el servicio de carrito."""

    def __init__(self, message: str, code: str = "CART_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class CartNotFoundError(CartServiceError):
    """El carrito no existe."""

    def __init__(self, cart_id=None, session_key=None):
        message = f"Carrito no encontrado"
        if cart_id:
            message = f"Carrito con id={cart_id} no encontrado"
        if session_key:
            message = f"Carrito con session_key={session_key} no encontrado"
        super().__init__(message, "CART_NOT_FOUND")


class CartItemNotFoundError(CartServiceError):
    """El ítem en el carrito no existe."""

    def __init__(self, item_id: int):
        message = f"Ítem con id={item_id} no encontrado en el carrito"
        super().__init__(message, "CART_ITEM_NOT_FOUND")


class ProductNotInCartError(CartServiceError):
    """El producto no está en el carrito."""

    def __init__(self, product_id: int):
        message = f"Producto con id={product_id} no está en el carrito"
        super().__init__(message, "PRODUCT_NOT_IN_CART")


class InvalidQuantityError(CartServiceError):
    """Cantidad inválida."""

    def __init__(self, quantity):
        message = f"Cantidad inválida: {quantity}. Debe ser un número positivo"
        super().__init__(message, "INVALID_QUANTITY")


class InsufficientStockError(CartServiceError):
    """Stock insuficiente para la cantidad solicitada."""

    def __init__(self, product_name: str, available_stock: int, requested_quantity: int):
        message = f"Stock insuficiente para '{product_name}'. Disponible: {available_stock}, Solicitado: {requested_quantity}"
        super().__init__(message, "INSUFFICIENT_STOCK")


class ProductNotFoundError(CartServiceError):
    """Producto no existe o no está activo."""

    def __init__(self, product_id: int):
        message = f"Producto con id={product_id} no existe o no está activo"
        super().__init__(message, "PRODUCT_NOT_FOUND")


class EmptyCartError(CartServiceError):
    """Intento de operación en carrito vacío."""

    def __init__(self):
        message = "El carrito está vacío"
        super().__init__(message, "EMPTY_CART")


class DuplicateCartItemError(CartServiceError):
    """El producto ya está en el carrito."""

    def __init__(self, product_id: int):
        message = f"Producto con id={product_id} ya está en el carrito"
        super().__init__(message, "DUPLICATE_CART_ITEM")


class InvalidSessionKeyError(CartServiceError):
    """Session key inválida."""

    def __init__(self, session_key):
        message = f"Session key inválida: {session_key}"
        super().__init__(message, "INVALID_SESSION_KEY")
