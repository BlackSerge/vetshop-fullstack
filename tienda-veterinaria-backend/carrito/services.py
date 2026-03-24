"""
carrito/services.py

Capa de servicios (business logic) para el módulo de carrito.
Centraliza toda la lógica de negocio relacionada con carritos.
"""

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
    """Servicio para gestionar carritos de compras."""

    @staticmethod
    def validate_quantity(quantity: int) -> None:
        """Valida que la cantidad sea un número positivo."""
        try:
            quantity = int(quantity)
            if quantity <= 0:
                raise InvalidQuantityError(quantity)
        except (ValueError, TypeError):
            raise InvalidQuantityError(quantity)

    @staticmethod
    @transaction.atomic
    def create_anonymous_cart() -> Cart:
        """Crea un nuevo carrito anónimo con session_key generado."""
        return Cart.objects.create(session_key=uuid.uuid4(), user=None)

    @staticmethod
    @transaction.atomic
    def create_or_get_user_cart(user_id: int) -> Cart:
        """Obtiene o crea el carrito de un usuario autenticado."""
        cart, created = Cart.objects.get_or_create(user_id=user_id)
        return cart

    @staticmethod
    def get_cart(user=None, session_key=None) -> Cart:
        """
        Obtiene un carrito por usuario o session_key.
        Prioriza usuario si está autenticado.
        Si no existe, retorna None (no lo crea).
        """
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
        """
        Añade un producto al carrito o incrementa su cantidad.
        Valida stock disponible antes.
        """
        # Validar cantidad
        CartService.validate_quantity(quantity)
        quantity = int(quantity)

        # Obtener producto
        try:
            product = producto_selectors.get_product_by_id(product_id)
            if not product or not product.is_active:
                raise ProductNotFoundError(product_id)
        except Exception:
            raise ProductNotFoundError(product_id)

        # Obtener carrito
        try:
            cart = selectors.get_cart_by_id(cart_id)
        except CartNotFoundError:
            raise CartNotFoundError(cart_id=cart_id)

        # Obtener precio actual (considerando oferta)
        current_price = product.precio_oferta or product.precio

        # Verificar stock
        if quantity > product.stock:
            raise InsufficientStockError(product.nombre, product.stock, quantity)

        # Obtener o crear CartItem
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity, "price": current_price},
        )

        if not created:
            # Si ya existe, incrementar cantidad
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
        """
        Actualiza la cantidad de un ítem en el carrito.
        Si quantity=0, elimina el ítem.
        """
        # Validar cantidad (permitir 0 para eliminación)
        try:
            quantity = int(quantity)
            if quantity < 0:
                raise InvalidQuantityError(quantity)
        except (ValueError, TypeError):
            raise InvalidQuantityError(quantity)

        # Obtener carrito
        try:
            cart = selectors.get_cart_by_id(cart_id)
        except CartNotFoundError:
            raise CartNotFoundError(cart_id=cart_id)

        # Obtener ítem
        cart_item = selectors.get_cart_item_by_id(item_id, cart_id)
        if not cart_item:
            raise CartItemNotFoundError(item_id)

        if quantity == 0:
            # Eliminar el ítem
            cart_item.delete()
            return None

        # Validar stock para la nueva cantidad
        if quantity > cart_item.product.stock:
            raise InsufficientStockError(
                cart_item.product.nombre,
                cart_item.product.stock,
                quantity,
            )

        # Actualizar cantidad y precio (por si cambió)
        cart_item.quantity = quantity
        cart_item.price = cart_item.product.precio_oferta or cart_item.product.precio
        cart_item.save()

        return cart_item

    @staticmethod
    @transaction.atomic
    def remove_item_from_cart(cart_id: int, item_id: int) -> None:
        """Elimina un ítem específico del carrito."""
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
        """
        Fusiona un carrito anónimo al carrito del usuario autenticado.
        Incrementa cantidades si los productos ya existen en el carrito del usuario.
        Elimina el carrito anónimo después.
        """
        # Validar session_key
        if isinstance(anonymous_session_key, str):
            try:
                anonymous_session_key = uuid.UUID(anonymous_session_key)
            except ValueError:
                raise InvalidSessionKeyError(anonymous_session_key)

        # Obtener carrito anónimo
        try:
            anonymous_cart = selectors.get_cart_by_session_key(anonymous_session_key)
        except CartNotFoundError:
            # Si no existe carrito anónimo, no hay nada que fusionar
            return CartService.create_or_get_user_cart(user_id)

        # Obtener o crear carrito del usuario
        user_cart = CartService.create_or_get_user_cart(user_id)

        # Fusionar items
        for anon_item in anonymous_cart.items.all():
            user_item, created = CartItem.objects.get_or_create(
                cart=user_cart,
                product=anon_item.product,
                defaults={"quantity": anon_item.quantity, "price": anon_item.price},
            )

            if not created:
                # Si el producto ya existe en el carrito del usuario, incrementar cantidad
                user_item.quantity += anon_item.quantity
                user_item.price = (
                    anon_item.product.precio_oferta or anon_item.product.precio
                )
                user_item.save()

        # Eliminar carrito anónimo
        anonymous_cart.delete()

        return user_cart

    @staticmethod
    @transaction.atomic
    def validate_cart_stock(cart_id: int) -> dict:
        """
        Valida que todos los ítems del carrito tengan stock suficiente.
        Devuelve dict con items válidos e inválidos.
        """
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
        """
        Actualiza los precios de todos los ítems en el carrito.
        Útil cuando los precios de productos cambian.
        """
        for item in selectors.get_cart_items(cart_id):
            # Obtener precio actual (considerando oferta)
            current_price = item.product.precio_oferta or item.product.precio
            if item.price != current_price:
                item.price = current_price
                item.save()
