
class ProductServiceError(Exception):

    def __init__(self, message: str, code: str | None = None):
        self.message = message
        self.code = code or "PRODUCT_SERVICE_ERROR"
        super().__init__(self.message)


class ProductNotFoundError(ProductServiceError):

    def __init__(self, identifier: str):
        message = f"Producto no encontrado: {identifier}"
        super().__init__(message, code="PRODUCT_NOT_FOUND")


class CategoryNotFoundError(ProductServiceError):

    def __init__(self, identifier: str):
        message = f"Categoría no encontrada: {identifier}"
        super().__init__(message, code="CATEGORY_NOT_FOUND")


class InvalidPriceError(ProductServiceError):
   
    def __init__(self, price: float = None):
        message = f"Precio inválido: {price}. Debe ser positivo."
        super().__init__(message, code="INVALID_PRICE")


class InvalidStockError(ProductServiceError):

    def __init__(self, stock: int):
        message = f"Stock inválido: {stock}. No puede ser negativo."
        super().__init__(message, code="INVALID_STOCK")


class InsufficientStockError(ProductServiceError):
  
    def __init__(self, product_name: str, available: int, requested: int):
        message = f"Stock insuficiente para '{product_name}'. Disponible: {available}, Solicitado: {requested}"
        super().__init__(message, code="INSUFFICIENT_STOCK")


class DuplicateReviewError(ProductServiceError):

    def __init__(self, product_name: str):
        message = f"Ya has calificado '{product_name}'. No puedes opinar dos veces."
        super().__init__(message, code="DUPLICATE_REVIEW")


class InvalidRatingError(ProductServiceError):

    def __init__(self, rating: int):
        message = f"Calificación inválida: {rating}. Debe estar entre 1 y 5."
        super().__init__(message, code="INVALID_RATING")


class ImageUploadError(ProductServiceError):
    
    def __init__(self, reason: str = ""):
        message = f"Error al subir imagen. {reason}" if reason else "Error al subir imagen"
        super().__init__(message, code="IMAGE_UPLOAD_ERROR")


class DuplicateCategoryError(ProductServiceError):
   
    def __init__(self, field: str, value: str):
        message = f"Ya existe una categoría con {field}: {value}"
        super().__init__(message, code="DUPLICATE_CATEGORY")


class DuplicateProductError(ProductServiceError):
 

    def __init__(self, field: str, value: str):
        message = f"Ya existe un producto con {field}: {value}"
        super().__init__(message, code="DUPLICATE_PRODUCT")
