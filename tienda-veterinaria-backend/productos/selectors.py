"""
productos/selectors.py

Capa de queries optimizadas para el módulo de productos.
"""

from __future__ import annotations
from django.db.models import QuerySet, Q, F, Case, When, DecimalField, Count, Avg, Prefetch
from django.db.models.functions import Lower
from typing import Optional, List
from .models import Categoria, Producto, ImagenProducto, Review


# ========================
# CATEGORÍA SELECTORS
# ========================

def get_category_by_id(category_id: int) -> Optional[Categoria]:
    """Obtiene categoría por ID."""
    return Categoria.objects.filter(id=category_id).first()


def get_category_by_slug(slug: str) -> Optional[Categoria]:
    """Obtiene categoría por slug."""
    return Categoria.objects.filter(slug=slug).first()


def get_all_categories(is_active: bool = True, order_by: str = "nombre") -> QuerySet[Categoria]:
    """Obtiene todas las categorías."""
    queryset = Categoria.objects.all()
    if is_active:
        queryset = queryset.filter(is_active=True)
    return queryset.order_by(order_by)


def category_exists(nombre: str = "", slug: str = "") -> bool:
    """Verifica si existe una categoría."""
    query = Q()
    if nombre:
        query |= Q(nombre=nombre)
    if slug:
        query |= Q(slug=slug)
    return Categoria.objects.filter(query).exists() if query else False


def get_categories_with_products(is_active: bool = True) -> QuerySet[Categoria]:
    """Obtiene categorías que tienen productos activos."""
    return Categoria.objects.filter(
        is_active=is_active
    ).prefetch_related(
        Prefetch('productos', queryset=Producto.objects.filter(is_active=True))
    )


# ========================
# PRODUCTO SELECTORS
# ========================

def get_product_by_id(product_id: int) -> Optional[Producto]:
    """Obtiene producto por ID."""
    return Producto.objects.filter(id=product_id, is_active=True).first()


def get_product_by_slug(slug: str) -> Optional[Producto]:
    """Obtiene producto por slug con relaciones prefetch."""
    return Producto.objects.filter(
        slug=slug,
        is_active=True
    ).prefetch_related(
        'imagenes',
        'reviews'
    ).first()


def product_exists(slug: str = "", sku: str = "") -> bool:
    """Verifica si existe un producto."""
    query = Q()
    if slug:
        query |= Q(slug=slug)
    if sku:
        query |= Q(sku=sku)
    return Producto.objects.filter(query).exists() if query else False


def get_filtered_products(
    is_active: bool = True,
    categoria_slug: Optional[str] = None,
    is_featured: Optional[bool] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    brand: Optional[str] = None,
    pet_type: Optional[str] = None,
    search_query: Optional[str] = None,
    order_by: str = "-created_at",
) -> QuerySet[Producto]:
    """
    Obtiene productos con múltiples filtros y ordenamiento.
    Optimizado con prefetch_related.
    """
    queryset = Producto.objects.all()

    # Filtro de estado
    if is_active:
        queryset = queryset.filter(is_active=True)

    # Filtro por categoría
    if categoria_slug and categoria_slug.lower() != "todos":
        try:
            category = Categoria.objects.get(slug=categoria_slug)
            queryset = queryset.filter(categoria=category)
        except Categoria.DoesNotExist:
            return queryset.none()

    # Filtro por destacado
    if is_featured is not None:
        queryset = queryset.filter(is_featured=is_featured)

    # Anotación de precio efectivo
    queryset = queryset.annotate(
        effective_price=Case(
            When(precio_oferta__isnull=False, then=F("precio_oferta")),
            default=F("precio"),
            output_field=DecimalField(),
        )
    )

    # Filtro por rango de precios
    if price_min is not None:
        queryset = queryset.filter(effective_price__gte=price_min)
    if price_max is not None:
        queryset = queryset.filter(effective_price__lte=price_max)

    # Filtro por marca
    if brand and brand.lower() != "todas":
        queryset = queryset.filter(marca__iexact=brand)

    # Filtro por tipo de mascota
    if pet_type and pet_type.lower() not in ("todos", "ambos"):
        queryset = queryset.filter(tipo_mascota__iexact=pet_type)

    # Búsqueda por texto
    if search_query:
        queryset = queryset.filter(
            Q(nombre__icontains=search_query)
            | Q(descripcion_corta__icontains=search_query)
            | Q(descripcion_larga__icontains=search_query)
            | Q(sku__icontains=search_query)
            | Q(marca__icontains=search_query)
        )

    # Prefetch para evitar N+1 queries
    queryset = queryset.prefetch_related("imagenes", "reviews")

    return queryset.order_by(order_by)


def get_featured_products(limit: int = 10) -> QuerySet[Producto]:
    """Obtiene productos destacados."""
    return Producto.objects.filter(
        is_active=True,
        is_featured=True
    ).prefetch_related("imagenes", "reviews").order_by("-created_at")[:limit]


def get_products_by_category(categoria_id: int, limit: Optional[int] = None) -> QuerySet[Producto]:
    """Obtiene productos por categoría."""
    queryset = Producto.objects.filter(
        categoria_id=categoria_id,
        is_active=True
    ).prefetch_related("imagenes", "reviews")

    if limit:
        queryset = queryset[:limit]

    return queryset


def get_unique_brands(active_only: bool = True) -> List[str]:
    """Obtiene todas las marcas únicas."""
    queryset = Producto.objects.filter(marca__isnull=False)
    if active_only:
        queryset = queryset.filter(is_active=True)
    
    return list(
        queryset.values_list("marca", flat=True)
        .distinct()
        .order_by(Lower("marca"))
    )


def get_product_with_stats(product_id: int) -> Optional[Producto]:
    """Obtiene producto con estadísticas (rating, cantidad de reviews)."""
    return Producto.objects.filter(
        id=product_id,
        is_active=True
    ).prefetch_related(
        Prefetch('reviews', queryset=Review.objects.select_related('user'))
    ).annotate(
        review_count=Count('reviews'),
        average_rating=Avg('reviews__rating')
    ).first()


# ========================
# IMAGEN SELECTORS
# ========================

def get_images_by_product(product_id: int) -> QuerySet[ImagenProducto]:
    """Obtiene imágenes de un producto."""
    return ImagenProducto.objects.filter(
        producto_id=product_id
    ).order_by("order")


def get_featured_image_by_product(product_id: int) -> Optional[ImagenProducto]:
    """Obtiene la imagen destacada de un producto."""
    return ImagenProducto.objects.filter(
        producto_id=product_id,
        is_feature=True
    ).first()


# ========================
# REVIEW SELECTORS
# ========================

def get_reviews_by_product(product_id: int, limit: Optional[int] = None) -> QuerySet[Review]:
    """Obtiene reviews de un producto."""
    queryset = Review.objects.filter(
        product_id=product_id
    ).select_related("user").order_by("-created_at")

    if limit:
        queryset = queryset[:limit]

    return queryset


def user_has_reviewed_product(user_id: int, product_id: int) -> bool:
    """Verifica si un usuario ya revisó un producto."""
    return Review.objects.filter(
        user_id=user_id,
        product_id=product_id
    ).exists()


def get_user_reviews(user_id: int) -> QuerySet[Review]:
    """Obtiene todas las reviews de un usuario."""
    return Review.objects.filter(
        user_id=user_id
    ).select_related("product").order_by("-created_at")


def get_average_rating_by_product(product_id: int) -> Optional[float]:
    """Calcula el rating promedio de un producto."""
    from django.db.models import Avg
    result = Review.objects.filter(product_id=product_id).aggregate(avg=Avg("rating"))
    return result["avg"]


def get_review_count_by_product(product_id: int) -> int:
    """Cuenta la cantidad de reviews de un producto."""
    return Review.objects.filter(product_id=product_id).count()
