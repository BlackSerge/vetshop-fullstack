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
)


User = get_user_model()


@pytest.mark.django_db
class TestCategoryService:

    def test_create_category_success(self):
       
        category = CategoryService.create_category(
            nombre="Alimentos Perros",
            descripcion="Alimentos de calidad para perros",
            slug=None,  
        )
        assert category.id is not None
        assert category.nombre == "Alimentos Perros"
        assert category.slug == "alimentos-perros"

    def test_create_category_duplicate_error(self):
      
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
        
        with pytest.raises(CategoryNotFoundError):
            CategoryService.update_category(
                category_id=999,
                nombre="Test",
            )


@pytest.mark.django_db
class TestProductService:
   
    @pytest.fixture(autouse=True)
    def setup(self):
      
        self.category = Categoria.objects.create(
            nombre="Alimentos",
            slug="alimentos"
        )

    def test_validate_price_success(self):
        
        ProductService.validate_price(Decimal("99.99"))  

    def test_validate_price_negative(self):
   
        with pytest.raises(InvalidPriceError):
            ProductService.validate_price(Decimal("-10.00"))

    def test_validate_price_zero(self):
    
        with pytest.raises(InvalidPriceError):
            ProductService.validate_price(Decimal("0"))

    def test_validate_stock_success(self):
        
        ProductService.validate_stock(100)  

    def test_validate_stock_negative(self):
   
        with pytest.raises(InvalidStockError):
            ProductService.validate_stock(-5)

    def test_create_product_success(self):
        
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
        
        with pytest.raises(CategoryNotFoundError):
            ProductService.create_product(
                nombre="Producto Test",
                precio=Decimal("50.00"),
                categoria_id=999,  
                descripcion_corta="",
                descripcion_larga="",
                precio_oferta=None,
                stock=100,
                marca="Test",
                tipo_mascota="perro",
                is_featured=False,
            )

    def test_update_product_success(self):
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
        with pytest.raises(ProductNotFoundError):
            ProductService.update_product(
                product_id=999,
                nombre="Test",
            )

    def test_decrease_stock_success(self):
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
        product = Producto.objects.create(
            nombre="Producto Stock",
            precio=Decimal("50.00"),
            categoria=self.category,
            stock=10,
        )

        with pytest.raises(InsufficientStockError):
            ProductService.decrease_stock(
                product_id=product.id,
                quantity=20 
            )

    def test_increase_stock_success(self):
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
        with pytest.raises(ProductNotFoundError):
            ProductService.increase_stock(
                product_id=999,
                quantity=10
            )


@pytest.mark.django_db
class TestReviewService:

    @pytest.fixture(autouse=True)
    def setup(self):
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
        for rating in [1, 2, 3, 4, 5]:
            ReviewService.validate_rating(rating)  

    def test_validate_rating_too_low(self):
        with pytest.raises(InvalidRatingError):
            ReviewService.validate_rating(0)

    def test_validate_rating_too_high(self):
        with pytest.raises(InvalidRatingError):
            ReviewService.validate_rating(6)

    def test_create_review_success(self):
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
        with pytest.raises(ProductNotFoundError):
            ReviewService.create_review(
                user_id=self.user.id,
                product_id=999,
                rating=5,
                comment="Test",
            )

    def test_create_review_invalid_rating(self):
        with pytest.raises(InvalidRatingError):
            ReviewService.create_review(
                user_id=self.user.id,
                product_id=self.product.id,
                rating=10, 
                comment="Test",
            )

    def test_update_review_success(self):
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
        review = Review.objects.create(
            user=self.user,
            product=self.product,
            rating=3,
            comment="Bueno",
        )

        with pytest.raises(InvalidRatingError):
            ReviewService.update_review(
                review_id=review.id,
                rating=0,  # Inválido
                comment="Test",
            )


@pytest.mark.django_db
class TestImageService:
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
        order = ImageService.get_next_image_order(self.product.id)
        assert order == 0

    def test_get_next_image_order_multiple_images(self):
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
        with pytest.raises(Exception):  
            ImageService.update_image(
                image_id=999,
                alt_text="Test",
            )
