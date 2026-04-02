
from __future__ import annotations
from decimal import Decimal
from django.db import transaction
from django.contrib.auth import get_user_model
import uuid

from .models import Cart, CartItem
from .exceptions import (
    CartNotFoundError,
    CartItemNotFoundError,
    InvalidQuantityError,
    InsufficientStockError,
    ProductNotFoundError,
    EmptyCartError,
    InvalidSessionKeyError,
)
from . import selectors
from productos import selectors as producto_selectors

User = get_user_model()


class CartService:

    @staticmethod
    def validate_quantity(quantity: int) -> None:

        try:
            quantity = int(quantity)
            if quantity <= 0:
                raise InvalidQuantityError(quantity)
        except (ValueError, TypeError):
            raise InvalidQuantityError(quantity)

    @staticmethod
    @transaction.atomic
    def create_anonymous_cart() -> Cart:
        return Cart.objects.create(session_key=uuid.uuid4(), user=None)

    @staticmethod
    @transaction.atomic
    def create_or_get_user_cart(user_id: int) -> Cart:
        cart, created = Cart.objects.get_or_create(user_id=user_id)
        return cart

    @staticmethod
    def get_cart(user=None, session_key=None) -> Cart:
      
        if user and user.is_authenticated:
            return selectors.get_cart_by_user(user.id)

        if session_key:
            return selectors.get_cart_by_session_key(session_key)

        return None

    @staticmethod
    @transaction.atomic
    def add_product_to_cart(
        cart_id: int,
        product_id: int,
        quantity: int,
    ) -> CartItem:
       
        CartService.validate_quantity(quantity)
        quantity = int(quantity)

        try:
            product = producto_selectors.get_product_by_id(product_id)
            if not product or not product.is_active:
                raise ProductNotFoundError(product_id)
        except Exception:
            raise ProductNotFoundError(product_id)

        try:
            cart = selectors.get_cart_by_id(cart_id)
        except CartNotFoundError:
            raise CartNotFoundError(cart_id=cart_id)

        current_price = product.precio_oferta or product.precio

        if quantity > product.stock:
            raise InsufficientStockError(product.nombre, product.stock, quantity)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity, "price": current_price},
        )

        if not created:
           
            new_quantity = cart_item.quantity + quantity
            if new_quantity > product.stock:
                raise InsufficientStockError(
                    product.nombre, product.stock, new_quantity
                )
            cart_item.quantity = new_quantity
            cart_item.price = current_price  # Actualizar por si cambió
            cart_item.save()

        return cart_item

    @staticmethod
    @transaction.atomic
    def update_cart_item(
        cart_id: int,
        item_id: int,
        quantity: int,
    ) -> CartItem:
      
        try:
            quantity = int(quantity)
            if quantity < 0:
                raise InvalidQuantityError(quantity)
        except (ValueError, TypeError):
            raise InvalidQuantityError(quantity)

        try:
            cart = selectors.get_cart_by_id(cart_id)
        except CartNotFoundError:
            raise CartNotFoundError(cart_id=cart_id)

        cart_item = selectors.get_cart_item_by_id(item_id, cart_id)
        if not cart_item:
            raise CartItemNotFoundError(item_id)

        if quantity == 0:
            cart_item.delete()
            return None

        if quantity > cart_item.product.stock:
            raise InsufficientStockError(
                cart_item.product.nombre,
                cart_item.product.stock,
                quantity,
            )

        cart_item.quantity = quantity
        cart_item.price = cart_item.product.precio_oferta or cart_item.product.precio
        cart_item.save()

        return cart_item

    @staticmethod
    @transaction.atomic
    def remove_item_from_cart(cart_id: int, item_id: int) -> None:
        
        try:
            cart = selectors.get_cart_by_id(cart_id)
        except CartNotFoundError:
            raise CartNotFoundError(cart_id=cart_id)

        cart_item = selectors.get_cart_item_by_id(item_id, cart_id)
        if not cart_item:
            raise CartItemNotFoundError(item_id)

        cart_item.delete()

    @staticmethod
    @transaction.atomic
    def clear_cart(cart_id: int) -> None:
        """Vacía completamente un carrito."""
        try:
            cart = selectors.get_cart_by_id(cart_id)
        except CartNotFoundError:
            raise CartNotFoundError(cart_id=cart_id)

        if selectors.cart_is_empty(cart_id):
            raise EmptyCartError()

        cart.items.all().delete()

    @staticmethod
    def get_cart_total(cart_id: int) -> Decimal:
        """Calcula el precio total del carrito."""
        return selectors.get_cart_total_price(cart_id)

    @staticmethod
    def get_cart_item_count(cart_id: int) -> int:
        """Obtiene la cantidad total de ítems (suma de quantities) en el carrito."""
        return selectors.get_cart_total_items(cart_id)

    @staticmethod
    @transaction.atomic
    def merge_anonymous_cart_to_user(
        user_id: int, anonymous_session_key
    ) -> Cart:
    
        if isinstance(anonymous_session_key, str):
            try:
                anonymous_session_key = uuid.UUID(anonymous_session_key)
            except ValueError:
                raise InvalidSessionKeyError(anonymous_session_key)

        try:
            anonymous_cart = selectors.get_cart_by_session_key(anonymous_session_key)
        except CartNotFoundError:
           
            return CartService.create_or_get_user_cart(user_id)

        user_cart = CartService.create_or_get_user_cart(user_id)

        for anon_item in anonymous_cart.items.all():
            user_item, created = CartItem.objects.get_or_create(
                cart=user_cart,
                product=anon_item.product,
                defaults={"quantity": anon_item.quantity, "price": anon_item.price},
            )

            if not created:
                user_item.quantity += anon_item.quantity
                user_item.price = (
                    anon_item.product.precio_oferta or anon_item.product.precio
                )
                user_item.save()

        anonymous_cart.delete()

        return user_cart

    @staticmethod
    @transaction.atomic
    def validate_cart_stock(cart_id: int) -> dict:
      
        cart_items = selectors.get_cart_items(cart_id)
        valid_items = []
        invalid_items = []

        for item in cart_items:
            if item.quantity <= item.product.stock:
                valid_items.append(item)
            else:
                invalid_items.append(
                    {
                        "item_id": item.id,
                        "product_id": item.product.id,
                        "product_name": item.product.nombre,
                        "requested_quantity": item.quantity,
                        "available_stock": item.product.stock,
                    }
                )

        return {"valid_items": valid_items, "invalid_items": invalid_items}

    @staticmethod
    @transaction.atomic
    def update_prices_in_cart(cart_id: int) -> None:
      
        for item in selectors.get_cart_items(cart_id):
            current_price = item.product.precio_oferta or item.product.precio
            if item.price != current_price:
                item.price = current_price
                item.save()
