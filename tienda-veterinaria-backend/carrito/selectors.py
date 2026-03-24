"""
carrito/selectors.py

Capa de selectores (queries optimizadas) para el módulo de carrito.
Previene N+1 queries con prefetch_related y optimizaciones.
"""

from __future__ import annotations

from typing import Optional
from django.db.models import QuerySet, DecimalField, F, Case, When, Sum, Value
from django.contrib.auth import get_user_model

from .models import Cart, CartItem
from .exceptions import CartNotFoundError, InvalidSessionKeyError
import uuid

User = get_user_model()


# ========================
# CART SELECTORS
# ========================


def get_cart_by_id(cart_id: int) -> Optional[Cart]:
    """Obtiene un carrito por ID con items prefetched."""
    try:
        return Cart.objects.prefetch_related(
            "items__product__imagenes"
        ).get(id=cart_id)
    except Cart.DoesNotExist:
        raise CartNotFoundError(cart_id=cart_id)


def get_cart_by_user(user_id: int) -> Optional[Cart]:
    """Obtiene el carrito de un usuario autenticado."""
    try:
        return Cart.objects.prefetch_related(
            "items__product__imagenes"
        ).get(user_id=user_id)
    except Cart.DoesNotExist:
        return None


def get_cart_by_session_key(session_key) -> Optional[Cart]:
    """Obtiene un carrito anónimo por session_key."""
    if isinstance(session_key, str):
        try:
            session_key = uuid.UUID(session_key)
        except ValueError:
            raise InvalidSessionKeyError(session_key)

    try:
        return Cart.objects.prefetch_related(
            "items__product__imagenes"
        ).get(session_key=session_key, user__isnull=True)
    except Cart.DoesNotExist:
        raise CartNotFoundError(session_key=session_key)


def cart_exists(cart_id: int) -> bool:
    """Verifica si un carrito existe."""
    return Cart.objects.filter(id=cart_id).exists()


def cart_exists_for_user(user_id: int) -> bool:
    """Verifica si un usuario autenticado tiene carrito."""
    return Cart.objects.filter(user_id=user_id).exists()


def cart_exists_for_session(session_key) -> bool:
    """Verifica si existe carrito para una session_key."""
    if isinstance(session_key, str):
        try:
            session_key = uuid.UUID(session_key)
        except ValueError:
            return False

    return Cart.objects.filter(session_key=session_key, user__isnull=True).exists()


def get_cart_total_items(cart_id: int) -> int:
    """Obtiene la cantidad total de ítems en un carrito."""
    return CartItem.objects.filter(cart_id=cart_id).aggregate(
        total=Sum("quantity")
    )["total"] or 0


def get_cart_total_price(cart_id: int) -> float:
    """Calcula el precio total del carrito."""
    from decimal import Decimal

    result = CartItem.objects.filter(cart_id=cart_id).aggregate(
        total=Sum(F("quantity") * F("price"), output_field=DecimalField())
    )
    return result["total"] or Decimal("0.00")


# ========================
# CART ITEM SELECTORS
# ========================


def get_cart_item_by_id(item_id: int, cart_id: int) -> Optional[CartItem]:
    """Obtiene un ítem del carrito."""
    try:
        return CartItem.objects.select_related("product").get(
            id=item_id, cart_id=cart_id
        )
    except CartItem.DoesNotExist:
        return None


def get_cart_item_by_product(cart_id: int, product_id: int) -> Optional[CartItem]:
    """Obtiene un ítem específico por producto en un carrito."""
    try:
        return CartItem.objects.select_related("product").get(
            cart_id=cart_id, product_id=product_id
        )
    except CartItem.DoesNotExist:
        return None


def cart_has_product(cart_id: int, product_id: int) -> bool:
    """Verifica si un producto está en el carrito."""
    return CartItem.objects.filter(cart_id=cart_id, product_id=product_id).exists()


def get_cart_items(cart_id: int) -> QuerySet:
    """Obtiene todos los ítems de un carrito optimizados."""
    return CartItem.objects.filter(cart_id=cart_id).select_related(
        "product__categoria"
    ).prefetch_related("product__imagenes")


def get_cart_item_count(cart_id: int, product_id: int) -> int:
    """Obtiene la cantidad de unidades de un producto en el carrito."""
    item = CartItem.objects.filter(
        cart_id=cart_id, product_id=product_id
    ).values_list("quantity", flat=True).first()
    return item or 0


def cart_is_empty(cart_id: int) -> bool:
    """Verifica si un carrito está vacío."""
    return not CartItem.objects.filter(cart_id=cart_id).exists()
