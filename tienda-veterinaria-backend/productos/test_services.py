"""
productos/test_services.py

Tests unitarios e integración para la capa de servicios de productos.
Sigue el patrón de pytest + Django.
"""

import pytest
from decimal import Decimal
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model

from .models import Categoria, Producto, ImagenProducto, Review
from .services import CategoryService, ProductService, ReviewService, ImageService
from .exceptions import (
    CategoryNotFoundError,
    ProductNotFoundError,
    InvalidPriceError,
    InvalidStockError,
    InsufficientStockError,
    DuplicateReviewError,
    InvalidRatingError,
    DuplicateCategoryError,
    DuplicateProductError,
)
from . import selectors

User = get_user_model()


@pytest.mark.django_db
class TestCategoryService:
    """Tests para CategoryService."""

    def test_create_category_success(self):
        """Crear categoría válida."""
        category = CategoryService.create_category(
            nombre="Alimentos Perros",
            descripcion="Alimentos de calidad para perros",
            slug=None,  # Se genera automáticamente
        )
        assert category.id is not None
        assert category.nombre == "Alimentos Perros"
        assert category.slug == "alimentos-perros"

    def test_create_category_duplicate_error(self):
        """Crear categoría con nombre duplicado."""
        Categoria.objects.create(
            nombre="Accesorios",
            descripcion="",
            slug="accesorios"
        )

        with pytest.raises(DuplicateCategoryError):
            CategoryService.create_category(
                nombre="Accesorios",
                descripcion="",
                slug=None,
            )

    def test_update_category_success(self):
        """Actualizar categoría válida."""
        category = Categoria.objects.create(
            nombre="Original", 
            descripcion="", 
            slug="original"
        )

        updated = CategoryService.update_category(
            category_id=category.id,
            nombre="Actualizado",
            descripcion="Nueva descripción",
        )

        assert updated.nombre == "Actualizado"
        assert updated.descripcion == "Nueva descripción"

    def test_update_category_not_found(self):
        """Actualizar categoría inexistente."""
        with pytest.raises(CategoryNotFoundError):
            CategoryService.update_category(
                category_id=999,
                nombre="Test",
            )


@pytest.mark.django_db
class TestProductService:
    """Tests para ProductService."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup para cada test."""
        self.category = Categoria.objects.create(
            nombre="Alimentos",
            slug="alimentos"
        )

    def test_validate_price_success(self):
        """Validación de precio correcta."""
        ProductService.validate_price(Decimal("99.99"))  # No lanza excepción

    def test_validate_price_negative(self):
        """Validación rechaza precio negativo."""
        with pytest.raises(InvalidPriceError):
            ProductService.validate_price(Decimal("-10.00"))

    def test_validate_price_zero(self):
        """Validación rechaza precio cero."""
        with pytest.raises(InvalidPriceError):
            ProductService.validate_price(Decimal("0"))

    def test_validate_stock_success(self):
        """Validación de stock correcta."""
        ProductService.validate_stock(100)  # No lanza excepción

    def test_validate_stock_negative(self):
        """Validación rechaza stock negativo."""
        with pytest.raises(InvalidStockError):
            ProductService.validate_stock(-5)

    def test_create_product_success(self):
        """Crear producto válido."""
        product = ProductService.create_product(
            nombre="Producto Test",
            precio=Decimal("50.00"),
            categoria_id=self.category.id,
            descripcion_corta="Descripción corta",
            descripcion_larga="Descripción larga",
            precio_oferta=None,
            stock=100,
            marca="MarcaTest",
            tipo_mascota="perro",
            is_featured=False,
        )

        assert product.id is not None
        assert product.nombre == "Producto Test"
        assert product.precio == Decimal("50.00")
        assert product.stock == 100
        assert product.marca == "MarcaTest"

    def test_create_product_invalid_price(self):
        """Crear producto con precio negativo."""
        with pytest.raises(InvalidPriceError):
            ProductService.create_product(
                nombre="Producto Test",
                precio=Decimal("-100.00"),
                categoria_id=self.category.id,
                descripcion_corta="",
                descripcion_larga="",
                precio_oferta=None,
                stock=100,
                marca="Test",
                tipo_mascota="perro",
                is_featured=False,
            )

    def test_create_product_invalid_stock(self):
        """Crear producto con stock negativo."""
        with pytest.raises(InvalidStockError):
            ProductService.create_product(
                nombre="Producto Test",
                precio=Decimal("50.00"),
                categoria_id=self.category.id,
                descripcion_corta="",
                descripcion_larga="",
                precio_oferta=None,
                stock=-10,
                marca="Test",
                tipo_mascota="perro",
                is_featured=False,
            )

    def test_create_product_category_not_found(self):
        """Crear producto con categoría inexistente."""
        with pytest.raises(CategoryNotFoundError):
            ProductService.create_product(
                nombre="Producto Test",
                precio=Decimal("50.00"),
                categoria_id=999,  # No existe
                descripcion_corta="",
                descripcion_larga="",
                precio_oferta=None,
                stock=100,
                marca="Test",
                tipo_mascota="perro",
                is_featured=False,
            )

    def test_update_product_success(self):
        """Actualizar producto válido."""
        product = Producto.objects.create(
            nombre="Producto Original",
            precio=Decimal("50.00"),
            categoria=self.category,
            stock=100,
            marca="Original",
            tipo_mascota="perro",
        )

        updated = ProductService.update_product(
            product_id=product.id,
            nombre="Producto Actualizado",
            precio=Decimal("75.00"),
            stock=150,
            marca="MarcaNueva",
        )

        assert updated.nombre == "Producto Actualizado"
        assert updated.precio == Decimal("75.00")
        assert updated.stock == 150
        assert updated.marca == "MarcaNueva"

    def test_update_product_not_found(self):
        """Actualizar producto inexistente."""
        with pytest.raises(ProductNotFoundError):
            ProductService.update_product(
                product_id=999,
                nombre="Test",
            )

    def test_decrease_stock_success(self):
        """Disminuir stock exitosamente."""
        product = Producto.objects.create(
            nombre="Producto Stock",
            precio=Decimal("50.00"),
            categoria=self.category,
            stock=100,
        )

        updated = ProductService.decrease_stock(
            product_id=product.id,
            quantity=30
        )

        assert updated.stock == 70

    def test_decrease_stock_insufficient(self):
        """Error al disminuir stock por debajo de 0."""
        product = Producto.objects.create(
            nombre="Producto Stock",
            precio=Decimal("50.00"),
            categoria=self.category,
            stock=10,
        )

        with pytest.raises(InsufficientStockError):
            ProductService.decrease_stock(
                product_id=product.id,
                quantity=20  # Más del disponible
            )

    def test_increase_stock_success(self):
        """Aumentar stock exitosamente."""
        product = Producto.objects.create(
            nombre="Producto Stock",
            precio=Decimal("50.00"),
            categoria=self.category,
            stock=100,
        )

        updated = ProductService.increase_stock(
            product_id=product.id,
            quantity=50
        )

        assert updated.stock == 150

    def test_increase_stock_not_found(self):
        """Error al aumentar stock de producto inexistente."""
        with pytest.raises(ProductNotFoundError):
            ProductService.increase_stock(
                product_id=999,
                quantity=10
            )


@pytest.mark.django_db
class TestReviewService:
    """Tests para ReviewService."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup para cada test."""
        self.category = Categoria.objects.create(
            nombre="Alimentos",
            slug="alimentos"
        )
        self.product = Producto.objects.create(
            nombre="Producto Test",
            precio=Decimal("50.00"),
            categoria=self.category,
            stock=100,
        )
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )

    def test_validate_rating_valid_range(self):
        """Validar rating con valores válidos."""
        for rating in [1, 2, 3, 4, 5]:
            ReviewService.validate_rating(rating)  # No lanza excepción

    def test_validate_rating_too_low(self):
        """Validar rating por debajo del rango."""
        with pytest.raises(InvalidRatingError):
            ReviewService.validate_rating(0)

    def test_validate_rating_too_high(self):
        """Validar rating por encima del rango."""
        with pytest.raises(InvalidRatingError):
            ReviewService.validate_rating(6)

    def test_create_review_success(self):
        """Crear review válido."""
        review = ReviewService.create_review(
            user_id=self.user.id,
            product_id=self.product.id,
            rating=5,
            comment="Excelente producto",
        )

        assert review.id is not None
        assert review.user_id == self.user.id
        assert review.product_id == self.product.id
        assert review.rating == 5
        assert review.comment == "Excelente producto"

    def test_create_review_duplicate(self):
        """Error al crear un segundo review del mismo usuario."""
        Review.objects.create(
            user=self.user,
            product=self.product,
            rating=4,
            comment="Bueno",
        )

        with pytest.raises(DuplicateReviewError):
            ReviewService.create_review(
                user_id=self.user.id,
                product_id=self.product.id,
                rating=5,
                comment="Ahora mejor",
            )

    def test_create_review_invalid_product(self):
        """Error al crear review para producto inexistente."""
        with pytest.raises(ProductNotFoundError):
            ReviewService.create_review(
                user_id=self.user.id,
                product_id=999,
                rating=5,
                comment="Test",
            )

    def test_create_review_invalid_rating(self):
        """Error al crear review con rating inválido."""
        with pytest.raises(InvalidRatingError):
            ReviewService.create_review(
                user_id=self.user.id,
                product_id=self.product.id,
                rating=10,  # Fuera de rango
                comment="Test",
            )

    def test_update_review_success(self):
        """Actualizar review existente."""
        review = Review.objects.create(
            user=self.user,
            product=self.product,
            rating=3,
            comment="Bueno",
        )

        updated = ReviewService.update_review(
            review_id=review.id,
            rating=5,
            comment="Excelente",
        )

        assert updated.rating == 5
        assert updated.comment == "Excelente"

    def test_update_review_invalid_rating(self):
        """Error al actualizar review con rating inválido."""
        review = Review.objects.create(
            user=self.user,
            product=self.product,
            rating=3,
            comment="Bueno",
        )

        # ReviewService.update_review no lanza error, pero validate_rating sí
        with pytest.raises(InvalidRatingError):
            ReviewService.update_review(
                review_id=review.id,
                rating=0,  # Inválido
                comment="Test",
            )


@pytest.mark.django_db
class TestImageService:
    """Tests para ImageService."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup para cada test."""
        self.category = Categoria.objects.create(
            nombre="Alimentos",
            slug="alimentos"
        )
        self.product = Producto.objects.create(
            nombre="Producto Test",
            precio=Decimal("50.00"),
            categoria=self.category,
            stock=100,
        )

    def test_get_next_image_order_first_image(self):
        """Obtener orden para primera imagen."""
        order = ImageService.get_next_image_order(self.product.id)
        assert order == 0

    def test_get_next_image_order_multiple_images(self):
        """Obtener orden para imagen adicional."""
        ImagenProducto.objects.create(
            producto=self.product,
            orden=0,
            alt_text="Imagen 1",
        )
        ImagenProducto.objects.create(
            producto=self.product,
            orden=1,
            alt_text="Imagen 2",
        )

        order = ImageService.get_next_image_order(self.product.id)
        assert order == 2

    def test_update_image_success(self):
        """Actualizar imagen exitosamente."""
        image = ImagenProducto.objects.create(
            producto=self.product,
            orden=0,
            alt_text="Original",
            is_feature=False,
        )

        updated = ImageService.update_image(
            image_id=image.id,
            alt_text="Actualizado",
            is_feature=True,
        )

        assert updated.alt_text == "Actualizado"
        assert updated.is_feature is True

    def test_update_image_not_found(self):
        """Error al actualizar imagen inexistente."""
        with pytest.raises(Exception):  # ImagenProducto.DoesNotExist
            ImageService.update_image(
                image_id=999,
                alt_text="Test",
            )
