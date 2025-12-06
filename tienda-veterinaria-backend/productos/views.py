# backend/productos/views.py

from rest_framework import generics, filters, permissions, serializers
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.db.models import Q, Case, When, F, DecimalField
from django.shortcuts import get_object_or_404
from .models import Categoria, Producto, ImagenProducto, Review
from .serializers import (
    CategoriaSerializer,
    ProductoSerializer,
    ProductoCreateUpdateSerializer,
    ImagenProductoAdminSerializer,
    ReviewSerializer
)
from rest_framework.views import APIView
from django.db.models import Value
from django.db.models.functions import Lower
from django.db.models import Max

# --- Configuración de Paginación ---
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

# --- API para Categorías (Acceso Público) ---
class CategoriaListAPIView(generics.ListAPIView):
    queryset = Categoria.objects.filter(is_active=True)
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'descripcion']
    pagination_class = StandardResultsSetPagination

class CategoriaDetailAPIView(generics.RetrieveAPIView):
    queryset = Categoria.objects.filter(is_active=True)
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

# --- API para Gestión de Categorías (Solo Administradores) ---
class CategoriaAdminListCreateAPIView(generics.ListCreateAPIView):
    queryset = Categoria.objects.all().order_by('nombre')
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'descripcion']

class CategoriaAdminRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'slug' 

    
# --- API para Productos (Acceso Público) ---
class ProductoListAPIView(generics.ListAPIView):
    queryset = Producto.objects.filter(is_active=True)
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion_corta', 'descripcion_larga', 'sku', 'marca']
    ordering_fields = ['nombre', 'precio', 'created_at', 'stock', 'effective_price']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Anotar el precio efectivo para filtrado y ordenamiento
        queryset = queryset.annotate(
            effective_price=Case(
                When(precio_oferta__isnull=False, then=F('precio_oferta')),
                default=F('precio'),
                output_field=DecimalField()
            )
        )

        # Filtro por Categoría
        categoria_slug = self.request.query_params.get('categoria', None)
        if categoria_slug and categoria_slug.lower() != 'todos':
            try:
                category = Categoria.objects.get(slug=categoria_slug)
                queryset = queryset.filter(categoria=category)
            except Categoria.DoesNotExist:
                queryset = queryset.none()
        
        # Filtro por Producto Destacado
        is_featured = self.request.query_params.get('featured', None)
        if is_featured == 'true':
            queryset = queryset.filter(is_featured=True)
        elif is_featured == 'false':
            queryset = queryset.filter(is_featured=False)
            
        # Filtro por Rango de Precios (usando effective_price)
        price_min = self.request.query_params.get('priceMin', None)
        price_max = self.request.query_params.get('priceMax', None)

        if price_min:
            try:
                min_val = float(price_min)
                queryset = queryset.filter(effective_price__gte=min_val)
            except ValueError:
                pass
        if price_max:
            try:
                max_val = float(price_max)
                queryset = queryset.filter(effective_price__lte=max_val)
            except ValueError:
                pass

        # Filtro por Marca
        brand_name = self.request.query_params.get('brand', None)
        if brand_name and brand_name.lower() != 'todas':
            queryset = queryset.filter(marca__iexact=brand_name)

        # Filtro por Tipo de Mascota
        pet_type = self.request.query_params.get('petType', None)
        if pet_type and pet_type.lower() != 'todos' and pet_type.lower() != 'ambos':
            queryset = queryset.filter(tipo_mascota__iexact=pet_type)

        # Ordenamiento por defecto si no se especifica
        if not self.request.query_params.get('ordering'):
            queryset = queryset.order_by('-created_at')

        return queryset

# <--- ¡ESTA ES LA CLASE QUE ESTABA MAL INDENTADA O FALTABA! ---
class ProductoDetailAPIView(generics.RetrieveAPIView):
    queryset = Producto.objects.filter(is_active=True) # Solo productos activos
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
# --- FIN DE LA CLASE PRODUCTODETAILAPIVIEW ---


# --- API para obtener todas las Marcas únicas ---
class BrandListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        unique_brands = Producto.objects.filter(marca__isnull=False) \
                                        .values_list('marca', flat=True) \
                                        .distinct() \
                                        .order_by(Lower('marca'))
        return Response(list(unique_brands), status=200)


# --- API para Gestión de Productos (CRUD - Solo Administradores) ---
class ProductoAdminListCreateAPIView(generics.ListCreateAPIView):
    queryset = Producto.objects.all().order_by('-created_at')
    serializer_class = ProductoCreateUpdateSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'descripcion_corta', 'sku', 'marca']

    def get_queryset(self):
        queryset = super().get_queryset()

        categoria_slug = self.request.query_params.get('categoria', None)
        if categoria_slug:
            try:
                category = Categoria.objects.get(slug=categoria_slug)
                queryset = queryset.filter(categoria=category)
            except Categoria.DoesNotExist:
                queryset = queryset.none()
        return queryset

class ProductoAdminRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Producto.objects.all()
    # Quitamos serializer_class fijo y usamos get_serializer_class
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'slug'

    def get_serializer_class(self):
        # Si estamos leyendo (GET), queremos ver todos los detalles, incluidas las imágenes
        if self.request.method == 'GET':
            return ProductoSerializer 
        # Si estamos escribiendo (PUT, PATCH, DELETE), usamos el serializer de escritura
        return ProductoCreateUpdateSerializer

# --- API para Gestión de Imágenes de Productos (CRUD - Solo Administradores) ---
class ImagenProductoAdminListCreateAPIView(generics.ListCreateAPIView):
    queryset = ImagenProducto.objects.all().order_by('producto__nombre', 'order')
    serializer_class = ImagenProductoAdminSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        product_slug = self.request.query_params.get('product_slug', None)
        if product_slug:
            try:
                producto = Producto.objects.get(slug=product_slug)
                queryset = queryset.filter(producto=producto)
            except Producto.DoesNotExist:
                queryset = queryset.none()
        return queryset

    def perform_create(self, serializer):
        producto_id = self.request.data.get('producto')
        if not producto_id:
            raise serializers.ValidationError({"producto": "El ID del producto es requerido para subir una imagen."})
        try:
            producto = Producto.objects.get(id=producto_id)
        except Producto.DoesNotExist:
            raise serializers.ValidationError({"producto": "El producto especificado no existe."})
        
        if serializer.validated_data.get('is_feature', False):
            ImagenProducto.objects.filter(producto=producto, is_feature=True).update(is_feature=False)
            
        # --- LÓGICA DE ORDEN AUTOMÁTICO (SOLUCIÓN AL ERROR 400) ---
        # Buscamos el orden máximo actual para este producto
        max_order = ImagenProducto.objects.filter(producto=producto).aggregate(Max('order'))['order__max']
        
        # Si no hay imágenes, max_order es None, así que empezamos en 0. Si hay, sumamos 1.
        next_order = 0 if max_order is None else max_order + 1
        
        # Guardamos asignando el orden calculado
        serializer.save(producto=producto, order=next_order)

class ImagenProductoAdminRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ImagenProducto.objects.all()
    serializer_class = ImagenProductoAdminSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'pk'
    parser_classes = [MultiPartParser, FormParser]
    
    def perform_update(self, serializer):
        if 'is_feature' in serializer.validated_data and serializer.validated_data['is_feature']:
            self.get_object().producto.imagenes.filter(is_feature=True).exclude(pk=self.get_object().pk).update(is_feature=False)
        serializer.save()


class CreateReviewAPIView(generics.CreateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_id')
        product = get_object_or_404(Producto, id=product_id)
        
        # Validación: ¿El usuario ya opinó?
        if Review.objects.filter(product=product, user=self.request.user).exists():
            raise serializers.ValidationError("Ya has valorado este producto.")
            
        serializer.save(user=self.request.user, product=product)