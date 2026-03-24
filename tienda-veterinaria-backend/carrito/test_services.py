"""
carrito/test_services.py

Tests unitarios e integración para la capa de servicios de carrito.
Sigue el patrón de pytest + Django.
"""

import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model

from .models import Cart, CartItem
from .services import CartService
from .exceptions import (
    CartNotFoundError,
    CartItemNotFoundError,
    InvalidQuantityError,
    InsufficientStockError,
    ProductNotFoundError,
    EmptyCartError,
    InvalidSessionKeyError,
)
from productos.models import Categoria, Producto

User = get_user_model()


@pytest.mark.django_db
class TestCartService:
    """Tests para CartService."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup para cada test."""
        # Crear categoría
        self.category = Categoria.objects.create(
            nombre="Alimentos",
            slug="alimentos"
        )

        # Crear producto
        self.product = Producto.objects.create(
            nombre="Alimento Premium",
            precio=Decimal("50.00"),
            categoria=self.category,
            stock=100,
        )

        # Crear usuario
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )

    def test_validate_quantity_success(self):
        """Validar cantidad correcta."""
        CartService.validate_quantity(5)  # No lanza excepción

    def test_validate_quantity_zero(self):
        """Rechazar cantidad cero."""
        with pytest.raises(InvalidQuantityError):
            CartService.validate_quantity(0)

    def test_validate_quantity_negative(self):
        """Rechazar cantidad negativa."""
        with pytest.raises(InvalidQuantityError):
            CartService.validate_quantity(-5)

    def test_validate_quantity_invalid_type(self):
        """Rechazar cantidad no-numérica."""
        with pytest.raises(InvalidQuantityError):
            CartService.validate_quantity("abc")

    def test_create_anonymous_cart(self):
        """Crear carrito anónimo."""
        cart = CartService.create_anonymous_cart()
        assert cart.id is not None
        assert cart.user is None
        assert cart.session_key is not None

    def test_create_or_get_user_cart_creates(self):
        """Crear carrito para usuario nuevo."""
        cart = CartService.create_or_get_user_cart(self.user.id)
        assert cart.id is not None
        assert cart.user_id == self.user.id

    def test_create_or_get_user_cart_gets_existing(self):
        """Obtener carrito existente del usuario."""
        cart1 = CartService.create_or_get_user_cart(self.user.id)
        cart2 = CartService.create_or_get_user_cart(self.user.id)
        assert cart1.id == cart2.id

    def test_get_cart_anonymous(self):
        """Obtener carrito anónimo por session_key."""
        anon_cart = CartService.create_anonymous_cart()
        retrieved = CartService.get_cart(session_key=anon_cart.session_key)
        assert retrieved.id == anon_cart.id

    def test_get_cart_user(self):
        """Obtener carrito de usuario."""
        user_cart = CartService.create_or_get_user_cart(self.user.id)
        retrieved = CartService.get_cart(user=self.user)
        assert retrieved.id == user_cart.id

    def test_add_product_to_cart_success(self):
        """Añadir producto a carrito."""
        cart = CartService.create_anonymous_cart()
        item = CartService.add_product_to_cart(
            cart.id, self.product.id, 5
        )
        assert item.quantity == 5
        assert item.price == Decimal("50.00")

    def test_add_product_to_cart_increments_quantity(self):
        """Añadir mismo producto incrementa cantidad."""
        cart = CartService.create_anonymous_cart()
        CartService.add_product_to_cart(cart.id, self.product.id, 5)
        item = CartService.add_product_to_cart(cart.id, self.product.id, 3)
        assert item.quantity == 8

    def test_add_product_insufficient_stock(self):
        """Error si no hay stock suficiente."""
        cart = CartService.create_anonymous_cart()
        with pytest.raises(InsufficientStockError):
            CartService.add_product_to_cart(cart.id, self.product.id, 150)

    def test_add_product_not_found(self):
        """Error si producto no existe."""
        cart = CartService.create_anonymous_cart()
        with pytest.raises(ProductNotFoundError):
            CartService.add_product_to_cart(cart.id, 999, 5)

    def test_add_product_invalid_quantity(self):
        """Error si cantidad es inválida."""
        cart = CartService.create_anonymous_cart()
        with pytest.raises(InvalidQuantityError):
            CartService.add_product_to_cart(cart.id, self.product.id, 0)

    def test_update_cart_item_success(self):
        """Actualizar cantidad de ítem."""
        cart = CartService.create_anonymous_cart()
        item = CartService.add_product_to_cart(cart.id, self.product.id, 5)
        updated = CartService.update_cart_item(cart.id, item.id, 10)
        assert updated.quantity == 10

    def test_update_cart_item_delete_when_zero(self):
        """Eliminar ítem cuando cantidad=0."""
        cart = CartService.create_anonymous_cart()
        item = CartService.add_product_to_cart(cart.id, self.product.id, 5)
        CartService.update_cart_item(cart.id, item.id, 0)
        exists = CartItem.objects.filter(id=item.id).exists()
        assert not exists

    def test_update_cart_item_not_found(self):
        """Error si ítem no existe."""
        cart = CartService.create_anonymous_cart()
        with pytest.raises(CartItemNotFoundError):
            CartService.update_cart_item(cart.id, 999, 5)

    def test_update_cart_item_insufficient_stock(self):
        """Error si stock insuficiente para nueva cantidad."""
        cart = CartService.create_anonymous_cart()
        item = CartService.add_product_to_cart(cart.id, self.product.id, 5)
        with pytest.raises(InsufficientStockError):
            CartService.update_cart_item(cart.id, item.id, 150)

    def test_remove_item_from_cart(self):
        """Eliminar ítem específico."""
        cart = CartService.create_anonymous_cart()
        item = CartService.add_product_to_cart(cart.id, self.product.id, 5)
        CartService.remove_item_from_cart(cart.id, item.id)
        exists = CartItem.objects.filter(id=item.id).exists()
        assert not exists

    def test_remove_item_not_found(self):
        """Error si ítem no existe."""
        cart = CartService.create_anonymous_cart()
        with pytest.raises(CartItemNotFoundError):
            CartService.remove_item_from_cart(cart.id, 999)

    def test_clear_cart_success(self):
        """Vaciar carrito."""
        cart = CartService.create_anonymous_cart()
        CartService.add_product_to_cart(cart.id, self.product.id, 5)
        CartService.clear_cart(cart.id)
        count = CartItem.objects.filter(cart_id=cart.id).count()
        assert count == 0

    def test_clear_empty_cart_error(self):
        """Error al vaciar carrito que ya está vacío."""
        cart = CartService.create_anonymous_cart()
        with pytest.raises(EmptyCartError):
            CartService.clear_cart(cart.id)

    def test_get_cart_total(self):
        """Calcular total del carrito."""
        cart = CartService.create_anonymous_cart()
        CartService.add_product_to_cart(cart.id, self.product.id, 5)
        total = CartService.get_cart_total(cart.id)
        assert total == Decimal("250.00")  # 5 * 50

    def test_get_cart_item_count(self):
        """Obtener cantidad total de ítems."""
        cart = CartService.create_anonymous_cart()
        CartService.add_product_to_cart(cart.id, self.product.id, 5)
        count = CartService.get_cart_item_count(cart.id)
        assert count == 5

    def test_merge_anonymous_cart_to_user(self):
        """Fusionar carrito anónimo al usuario."""
        # Crear carrito anónimo con ítem
        anon_cart = CartService.create_anonymous_cart()
        CartService.add_product_to_cart(anon_cart.id, self.product.id, 5)

        # Fusionar to user
        user_cart = CartService.merge_anonymous_cart_to_user(
            self.user.id, anon_cart.session_key
        )

        assert user_cart.user_id == self.user.id
        assert CartItem.objects.filter(cart=user_cart, product=self.product).count() == 1
        assert not Cart.objects.filter(id=anon_cart.id).exists()

    def test_merge_increments_quantity_if_product_exists(self):
        """Al fusionar, incrementar cantidad si producto ya existe en user cart."""
        # Crear user cart con ítem
        user_cart = CartService.create_or_get_user_cart(self.user.id)
        CartService.add_product_to_cart(user_cart.id, self.product.id, 3)

        # Crear carrito anónimo con mismo producto
        anon_cart = CartService.create_anonymous_cart()
        CartService.add_product_to_cart(anon_cart.id, self.product.id, 5)

        # Fusionar
        CartService.merge_anonymous_cart_to_user(
            self.user.id, anon_cart.session_key
        )

        # Verificar que se incrementó la cantidad
        item = CartItem.objects.get(cart=user_cart, product=self.product)
        assert item.quantity == 8  # 3 + 5

    def test_validate_cart_stock_all_valid(self):
        """Validar stock: todos los ítems válidos."""
        cart = CartService.create_anonymous_cart()
        CartService.add_product_to_cart(cart.id, self.product.id, 50)
        result = CartService.validate_cart_stock(cart.id)
        assert len(result["valid_items"]) == 1
        assert len(result["invalid_items"]) == 0

    def test_validate_cart_stock_insufficient(self):
        """Validar stock: ítem con stock insuficiente."""
        cart = CartService.create_anonymous_cart()
        item = CartService.add_product_to_cart(cart.id, self.product.id, 50)

        # Cambiar stock del producto
        self.product.stock = 30
        self.product.save()

        result = CartService.validate_cart_stock(cart.id)
        assert len(result["valid_items"]) == 0
        assert len(result["invalid_items"]) == 1

    def test_update_prices_in_cart(self):
        """Actualizar precios de items en carrito."""
        cart = CartService.create_anonymous_cart()
        CartService.add_product_to_cart(cart.id, self.product.id, 5)

        # Cambiar precio del producto
        self.product.precio = Decimal("75.00")
        self.product.save()

        CartService.update_prices_in_cart(cart.id)

        item = CartItem.objects.get(cart=cart, product=self.product)
        assert item.price == Decimal("75.00")
