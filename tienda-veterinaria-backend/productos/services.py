"""
productos/services.py

Capa de servicios para el módulo de productos.
Toda la lógica de negocio centralizada aquí.
"""

from __future__ import annotations
from typing import Optional, Dict, List, Tuple
from decimal import Decimal
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.db.models import Max
import uuid

from .models import Categoria, Producto, ImagenProducto, Review
from .exceptions import (
    ProductNotFoundError,
    CategoryNotFoundError,
    InvalidPriceError,
    InvalidStockError,
    InsufficientStockError,
    DuplicateReviewError,
    InvalidRatingError,
    ImageUploadError,
    DuplicateCategoryError,
    DuplicateProductError,
)
from . import selectors

CustomUser = get_user_model()


class CategoryService:
    """Servicio para operaciones de categorías."""

    @staticmethod
    @transaction.atomic
    def create_category(
        nombre: str,
        descripcion: str = "",
        slug: Optional[str] = None,
        parent_id: Optional[int] = None,
    ) -> Categoria:
        """
        Crea una nueva categoría.
        
        Args:
            nombre: Nombre de la categoría
            descripcion: Descripción
            slug: URL slug (se genera automáticamente si no se proporciona)
            parent_id: ID de la categoría padre para subcategorías
            
        Returns:
            Categoria creada
            
        Raises:
            DuplicateCategoryError: Si el nombre o slug ya existen
            CategoryNotFoundError: Si la categoría padre no existe
        """
        # Validar que no exista
        if selectors.category_exists(nombre=nombre):
            raise DuplicateCategoryError("nombre", nombre)

        # Generar slug si no se proporciona
        if not slug:
            slug = slugify(nombre)
        else:
            slug = slugify(slug)

        # Validar slug único
        if selectors.category_exists(slug=slug):
            raise DuplicateCategoryError("slug", slug)

        # Validar categoría padre
        parent = None
        if parent_id:
            parent = selectors.get_category_by_id(parent_id)
            if not parent:
                raise CategoryNotFoundError(f"parent_id={parent_id}")

        # Crear categoría
        category = Categoria.objects.create(
            nombre=nombre,
            slug=slug,
            descripcion=descripcion,
            parent=parent,
            is_active=True,
        )

        return category

    @staticmethod
    @transaction.atomic
    def update_category(
        category_id: int,
        nombre: Optional[str] = None,
        descripcion: Optional[str] = None,
        slug: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Categoria:
        """Actualiza una categoría existente."""
        category = selectors.get_category_by_id(category_id)
        if not category:
            raise CategoryNotFoundError(f"id={category_id}")

        if nombre and nombre != category.nombre:
            if selectors.category_exists(nombre=nombre):
                raise DuplicateCategoryError("nombre", nombre)
            category.nombre = nombre

        if slug:
            slug = slugify(slug)
            if slug != category.slug and selectors.category_exists(slug=slug):
                raise DuplicateCategoryError("slug", slug)
            category.slug = slug

        if descripcion is not None:
            category.descripcion = descripcion

        if is_active is not None:
            category.is_active = is_active

        category.save()
        return category


class ProductService:
    """Servicio para operaciones de productos."""

    @staticmethod
    def validate_price(price: Decimal | float) -> None:
        """Valida que el precio sea positivo."""
        try:
            price_val = Decimal(str(price))
            if price_val <= 0:
                raise InvalidPriceError(price)
        except (ValueError, TypeError):
            raise InvalidPriceError(price)

    @staticmethod
    def validate_stock(stock: int) -> None:
        """Valida que el stock no sea negativo."""
        if not isinstance(stock, int) or stock < 0:
            raise InvalidStockError(stock)

    @staticmethod
    @transaction.atomic
    def create_product(
        nombre: str,
        precio: Decimal | float,
        categoria_id: Optional[int] = None,
        descripcion_corta: str = "",
        descripcion_larga: str = "",
        precio_oferta: Optional[Decimal | float] = None,
        stock: int = 0,
        marca: Optional[str] = None,
        tipo_mascota: Optional[str] = None,
        is_featured: bool = False,
    ) -> Producto:
        """
        Crea un nuevo producto.
        
        Args:
            nombre: Nombre del producto
            precio: Precio base
            categoria_id: ID de la categoría
            descripcion_corta: Descripción corta
            descripcion_larga: Descripción completa
            precio_oferta: Precio en oferta (opcional)
            stock: Cantidad en stock
            marca: Marca del producto
            tipo_mascota: Tipo de mascota ('perro', 'gato', etc.)
            is_featured: Si se destaca en home
            
        Returns:
            Producto creado
            
        Raises:
            InvalidPriceError: Si el precio no es válido
            InvalidStockError: Si el stock es negativo
            DuplicateProductError: Si el slug ya existe
            CategoryNotFoundError: Si la categoría no existe
        """
        # Validaciones
        ProductService.validate_price(precio)
        ProductService.validate_stock(stock)

        if precio_oferta:
            ProductService.validate_price(precio_oferta)

        # Validar categoría
        categoria = None
        if categoria_id:
            categoria = selectors.get_category_by_id(categoria_id)
            if not categoria:
                raise CategoryNotFoundError(f"id={categoria_id}")

        # Generar slug
        slug = slugify(nombre)
        if selectors.product_exists(slug=slug):
            # Agregar UUID para hacerlo único
            slug = f"{slug}-{str(uuid.uuid4().hex)[:6]}"

        # Crear producto
        product = Producto.objects.create(
            nombre=nombre,
            slug=slug,
            descripcion_corta=descripcion_corta,
            descripcion_larga=descripcion_larga,
            precio=Decimal(str(precio)),
            precio_oferta=Decimal(str(precio_oferta)) if precio_oferta else None,
            categoria=categoria,
            stock=stock,
            marca=marca,
            tipo_mascota=tipo_mascota,
            is_featured=is_featured,
            is_active=True,
        )

        return product

    @staticmethod
    @transaction.atomic
    def update_product(
        product_id: int,
        nombre: Optional[str] = None,
        precio: Optional[Decimal | float] = None,
        precio_oferta: Optional[Decimal | float] = None,
        descripcion_corta: Optional[str] = None,
        descripcion_larga: Optional[str] = None,
        stock: Optional[int] = None,
        marca: Optional[str] = None,
        tipo_mascota: Optional[str] = None,
        categoria_id: Optional[int] = None,
        is_featured: Optional[bool] = None,
        is_active: Optional[bool] = None,
    ) -> Producto:
        """Actualiza un producto existente."""
        product = selectors.get_product_by_id(product_id)
        if not product:
            raise ProductNotFoundError(f"id={product_id}")

        # Validaciones
        if precio is not None:
            ProductService.validate_price(precio)
            product.precio = Decimal(str(precio))

        if precio_oferta is not None:
            if precio_oferta:
                ProductService.validate_price(precio_oferta)
                product.precio_oferta = Decimal(str(precio_oferta))
            else:
                product.precio_oferta = None

        if stock is not None:
            ProductService.validate_stock(stock)
            product.stock = stock

        # Validar categoría
        if categoria_id is not None:
            if categoria_id:
                categoria = selectors.get_category_by_id(categoria_id)
                if not categoria:
                    raise CategoryNotFoundError(f"id={categoria_id}")
                product.categoria = categoria
            else:
                product.categoria = None

        # Actualizaciones simples
        if nombre is not None:
            product.nombre = nombre
        if descripcion_corta is not None:
            product.descripcion_corta = descripcion_corta
        if descripcion_larga is not None:
            product.descripcion_larga = descripcion_larga
        if marca is not None:
            product.marca = marca
        if tipo_mascota is not None:
            product.tipo_mascota = tipo_mascota
        if is_featured is not None:
            product.is_featured = is_featured
        if is_active is not None:
            product.is_active = is_active

        product.save()
        return product

    @staticmethod
    def decrease_stock(product_id: int, quantity: int) -> Producto:
        """
        Disminuye el stock de un producto.
        
        Args:
            product_id: ID del producto
            quantity: Cantidad a disminuir
            
        Returns:
            Producto actualizado
            
        Raises:
            ProductNotFoundError: Si el producto no existe
            InsufficientStockError: Si no hay stock suficiente
        """
        product = selectors.get_product_by_id(product_id)
        if not product:
            raise ProductNotFoundError(f"id={product_id}")

        if product.stock < quantity:
            raise InsufficientStockError(
                product.nombre,
                available=product.stock,
                requested=quantity,
            )

        product.stock -= quantity
        product.save()
        return product

    @staticmethod
    def increase_stock(product_id: int, quantity: int) -> Producto:
        """Incrementa el stock de un producto."""
        product = selectors.get_product_by_id(product_id)
        if not product:
            raise ProductNotFoundError(f"id={product_id}")

        product.stock += quantity
        product.save()
        return product


class ReviewService:
    """Servicio para operaciones de reviews."""

    @staticmethod
    def validate_rating(rating: int) -> None:
        """Valida que la calificación esté entre 1 y 5."""
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            raise InvalidRatingError(rating)

    @staticmethod
    @transaction.atomic
    def create_review(
        user_id: int,
        product_id: int,
        rating: int,
        comment: str = "",
    ) -> Review:
        """
        Crea un nuevo review.
        
        Args:
            user_id: ID del usuario
            product_id: ID del producto
            rating: Calificación (1-5)
            comment: Comentario opcional
            
        Returns:
            Review creado
            
        Raises:
            InvalidRatingError: Si la calificación no es válida
            ProductNotFoundError: Si el producto no existe
            DuplicateReviewError: Si el usuario ya opinó
        """
        # Validar rating
        ReviewService.validate_rating(rating)

        # Validar producto
        product = selectors.get_product_by_id(product_id)
        if not product:
            raise ProductNotFoundError(f"id={product_id}")

        # Validar que no exista review anterior
        if selectors.user_has_reviewed_product(user_id, product_id):
            raise DuplicateReviewError(product.nombre)

        # Crear review
        user = CustomUser.objects.get(id=user_id)
        review = Review.objects.create(
            user=user,
            product=product,
            rating=rating,
            comment=comment,
        )

        return review

    @staticmethod
    @transaction.atomic
    def update_review(
        review_id: int,
        rating: Optional[int] = None,
        comment: Optional[str] = None,
    ) -> Review:
        """Actualiza un review existente."""
        review = Review.objects.filter(id=review_id).first()
        if not review:
            raise ProductNotFoundError(f"review_id={review_id}")

        if rating is not None:
            ReviewService.validate_rating(rating)
            review.rating = rating

        if comment is not None:
            review.comment = comment

        review.save()
        return review


class ImageService:
    """Servicio para operaciones de imágenes de productos."""

    @staticmethod
    def get_next_image_order(product_id: int) -> int:
        max_order = ImagenProducto.objects.filter(
            producto_id=product_id
        ).aggregate(Max('order'))['order__max']

        return 0 if max_order is None else max_order + 1

    @staticmethod
    @transaction.atomic
    def upload_image(
        product_id: int,
        imagen,
        alt_text: str = "",
        is_feature: bool = False,
    ) -> ImagenProducto:
        """
        Sube una imagen para un producto.
        
        Args:
            product_id: ID del producto
            imagen: Archivo de imagen
            alt_text: Texto alternativo
            is_feature: Si es la imagen destacada
            
        Returns:
            ImagenProducto creado
            
        Raises:
            ProductNotFoundError: Si el producto no existe
            ImageUploadError: Si hay error al subir
        """
        try:
            product = selectors.get_product_by_id(product_id)
            if not product:
                raise ProductNotFoundError(f"id={product_id}")

            # Si es feature, desactivar otros
            if is_feature:
                ImagenProducto.objects.filter(
                    producto=product,
                    is_feature=True
                ).update(is_feature=False)

            # Obtener siguiente orden
            order = ImageService.get_next_image_order(product_id)

            # Crear imagen
            image = ImagenProducto.objects.create(
                producto=product,
                imagen=imagen,
                alt_text=alt_text,
                is_feature=is_feature,
                order=order,
            )

            return image

        except ProductNotFoundError:
            raise
        except Exception as e:
            raise ImageUploadError(str(e))

    @staticmethod
    @transaction.atomic
    def update_image(
        image_id: int,
        alt_text: Optional[str] = None,
        is_feature: Optional[bool] = None,
        order: Optional[int] = None,
    ) -> ImagenProducto:
        """Actualiza propiedades de una imagen."""
        image = ImagenProducto.objects.filter(id=image_id).first()
        if not image:
            raise ImageUploadError(f"Imagen {image_id} no encontrada")

        if alt_text is not None:
            image.alt_text = alt_text

        if is_feature and is_feature != image.is_feature:
            # Desactivar otros
            ImagenProducto.objects.filter(
                producto=image.producto,
                is_feature=True,
            ).exclude(pk=image.pk).update(is_feature=False)
            image.is_feature = is_feature

        if order is not None:
            image.order = order

        image.save()
        return image
