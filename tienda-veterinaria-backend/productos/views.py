"""
productos/views.py

Vistas (controllers) delgadas para el módulo de productos.
Toda la lógica de negocio está en services.py
"""

from typing import Optional
from rest_framework import generics, filters, permissions, serializers, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import Categoria, Producto, ImagenProducto, Review
from .serializers import (
    CategoriaSerializer,
    ProductoSerializer,
    ProductoCreateUpdateSerializer,
    ImagenProductoAdminSerializer,
    ReviewSerializer,
)
from .services import CategoryService, ProductService, ReviewService, ImageService
from .exceptions import (
    ProductServiceError,
    CategoryNotFoundError,
    ProductNotFoundError,
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


# --- Configuración de Paginación ---
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 100


# ========================
# CATEGORÍA VIEWS
# ========================

class CategoriaListAPIView(generics.ListAPIView):
    """Lista categorías activas (público)."""

    queryset = Categoria.objects.filter(is_active=True)
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "descripcion"]
    pagination_class = StandardResultsSetPagination


class CategoriaDetailAPIView(generics.RetrieveAPIView):
    """Detalle de categoría (público)."""

    queryset = Categoria.objects.filter(is_active=True)
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"


class CategoriaAdminListCreateAPIView(generics.ListCreateAPIView):
    """Admin: lista y crea categorías."""

    permission_classes = [permissions.IsAdminUser]
    serializer_class = CategoriaSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "descripcion"]

    def get_queryset(self):
        return selectors.get_all_categories(is_active=None)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            category = CategoryService.create_category(
                nombre=serializer.validated_data.get("nombre"),
                descripcion=serializer.validated_data.get("descripcion", ""),
                slug=serializer.validated_data.get("slug"),
            )

            return Response(
                CategoriaSerializer(category).data,
                status=status.HTTP_201_CREATED,
            )

        except DuplicateCategoryError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"detail": "Error al crear categoría"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CategoriaAdminRetrieveUpdateDestroyAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    """Admin: ve, edita y elimina categorías."""

    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = "slug"


# ========================
# PRODUCTO VIEWS
# ========================

class ProductoListAPIView(generics.ListAPIView):
    """Lista productos públicos con filtros y búsqueda."""

    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "nombre",
        "descripcion_corta",
        "descripcion_larga",
        "sku",
        "marca",
    ]
    ordering_fields = ["nombre", "precio", "created_at", "stock"]

    def get_queryset(self):
        # Extraer parámetros de filtro
        categoria_slug = self.request.query_params.get("categoria")
        is_featured = self.request.query_params.get("featured")
        price_min = self.request.query_params.get("priceMin")
        price_max = self.request.query_params.get("priceMax")
        brand = self.request.query_params.get("brand")
        pet_type = self.request.query_params.get("petType")
        search = self.request.query_params.get("search")
        order_by = self.request.query_params.get("ordering", "-created_at")

        # Convertir parámetros al tipo esperado
        featured_bool = None
        if is_featured == "true":
            featured_bool = True
        elif is_featured == "false":
            featured_bool = False

        price_min_float = None
        price_max_float = None
        try:
            if price_min:
                price_min_float = float(price_min)
            if price_max:
                price_max_float = float(price_max)
        except ValueError:
            pass

        # Usar selector con todos los filtros
        return selectors.get_filtered_products(
            is_active=True,
            categoria_slug=categoria_slug,
            is_featured=featured_bool,
            price_min=price_min_float,
            price_max=price_max_float,
            brand=brand,
            pet_type=pet_type,
            search_query=search,
            order_by=order_by,
        )


class ProductoDetailAPIView(generics.RetrieveAPIView):
    """Detalle de producto (público)."""

    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Producto.objects.filter(is_active=True)


class BrandListAPIView(APIView):
    """Lista todas las marcas únicas."""

    permission_classes = [permissions.AllowAny]

    serializer_class = serializers.ListSerializer

    @extend_schema(
        responses={200: serializers.ListField(child=serializers.CharField())},
    )

    def get(self, request, *args, **kwargs):
        brands = selectors.get_unique_brands(active_only=True)
        return Response(brands, status=status.HTTP_200_OK)


class ProductoAdminListCreateAPIView(generics.ListCreateAPIView):
    """Admin: lista y crea productos."""

    permission_classes = [permissions.IsAdminUser]
    serializer_class = ProductoCreateUpdateSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "descripcion_corta", "sku", "marca"]

    def get_queryset(self):
        categoria_slug = self.request.query_params.get("categoria")
        try:
            return selectors.get_filtered_products(
                is_active=None,
                categoria_slug=categoria_slug,
            )
        except:
            return Producto.objects.all().order_by("-created_at")

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            categoria = serializer.validated_data.get("categoria")
            product = ProductService.create_product(
                nombre=serializer.validated_data.get("nombre"),
                precio=serializer.validated_data.get("precio"),
                categoria_id=categoria.id if categoria else None,
                descripcion_corta=serializer.validated_data.get("descripcion_corta", ""),
                descripcion_larga=serializer.validated_data.get("descripcion_larga", ""),
                precio_oferta=serializer.validated_data.get("precio_oferta"),
                stock=serializer.validated_data.get("stock", 0),
                marca=serializer.validated_data.get("marca"),
                tipo_mascota=serializer.validated_data.get("tipo_mascota"),
                is_featured=serializer.validated_data.get("is_featured", False),
            )

            return Response(
                ProductoSerializer(product).data,
                status=status.HTTP_201_CREATED,
            )

        except (InvalidPriceError, InvalidStockError, DuplicateProductError) as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        except CategoryNotFoundError as e:
            return Response({"detail": e.message}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(
                {"detail": "Error al crear producto"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProductoAdminRetrieveUpdateDestroyAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    """Admin: ve, edita y elimina productos."""

    queryset = Producto.objects.all()
    permission_classes = [permissions.IsAdminUser]
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.request.method == "GET":
            return ProductoSerializer
        return ProductoCreateUpdateSerializer

    def put(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            product = ProductService.update_product(
                product_id=instance.id,
                nombre=serializer.validated_data.get("nombre"),
                precio=serializer.validated_data.get("precio"),
                precio_oferta=serializer.validated_data.get("precio_oferta"),
                descripcion_corta=serializer.validated_data.get("descripcion_corta"),
                descripcion_larga=serializer.validated_data.get("descripcion_larga"),
                stock=serializer.validated_data.get("stock"),
                marca=serializer.validated_data.get("marca"),
                tipo_mascota=serializer.validated_data.get("tipo_mascota"),
                categoria_id=serializer.validated_data.get("categoria").id if serializer.validated_data.get("categoria") else None,
                is_featured=serializer.validated_data.get("is_featured"),
            )

            return Response(
                ProductoSerializer(product).data,
                status=status.HTTP_200_OK,
            )

        except (InvalidPriceError, InvalidStockError) as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        except ProductNotFoundError as e:
            return Response({"detail": e.message}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(
                {"detail": "Error al actualizar producto"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ========================
# IMAGEN VIEWS
# ========================

class ImagenProductoAdminListCreateAPIView(generics.ListCreateAPIView):
    """Admin: lista y crea (sube) imágenes."""

    permission_classes = [permissions.IsAdminUser]
    serializer_class = ImagenProductoAdminSerializer
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        product_slug = self.request.query_params.get("product_slug")
        if product_slug:
            try:
                product = selectors.get_product_by_slug(product_slug)
                if product:
                    return selectors.get_images_by_product(product.id)
            except:
                pass
        return ImagenProducto.objects.all().order_by("producto__nombre", "order")

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            product_id = serializer.validated_data.get("producto")
            if not product_id:
                return Response(
                    {"detail": "El ID del producto es requerido"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            image = ImageService.upload_image(
                product_id=product_id.id if hasattr(product_id, "id") else product_id,
                imagen=serializer.validated_data.get("imagen"),
                alt_text=serializer.validated_data.get("alt_text", ""),
                is_feature=serializer.validated_data.get("is_feature", False),
            )

            return Response(
                ImagenProductoAdminSerializer(image, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )

        except ProductNotFoundError as e:
            return Response({"detail": e.message}, status=status.HTTP_404_NOT_FOUND)
        except ImageUploadError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"detail": "Error al subir imagen"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ImagenProductoAdminRetrieveUpdateDestroyAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    """Admin: ve, edita y elimina imágenes."""

    queryset = ImagenProducto.objects.all()
    serializer_class = ImagenProductoAdminSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = "pk"
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            image = ImageService.update_image(
                image_id=instance.id,
                alt_text=serializer.validated_data.get("alt_text"),
                is_feature=serializer.validated_data.get("is_feature"),
                order=serializer.validated_data.get("order"),
            )

            return Response(
                ImagenProductoAdminSerializer(image, context={"request": request}).data,
                status=status.HTTP_200_OK,
            )

        except ImageUploadError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"detail": "Error al actualizar imagen"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ========================
# REVIEW VIEWS
# ========================

class CreateReviewAPIView(generics.CreateAPIView):
    """Crea un review para un producto."""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        product_id = self.kwargs.get("product_id")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            review = ReviewService.create_review(
                user_id=request.user.id,
                product_id=product_id,
                rating=serializer.validated_data.get("rating"),
                comment=serializer.validated_data.get("comment", ""),
            )

            return Response(
                ReviewSerializer(review).data,
                status=status.HTTP_201_CREATED,
            )

        except InvalidRatingError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        except DuplicateReviewError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        except ProductNotFoundError as e:
            return Response({"detail": e.message}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(
                {"detail": "Error al crear review"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            
            )