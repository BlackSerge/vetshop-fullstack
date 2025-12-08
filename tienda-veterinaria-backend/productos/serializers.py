# productos/serializers.py
from rest_framework import serializers
from .models import Categoria, Producto, ImagenProducto, Review
from django.utils.text import slugify

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'slug', 'descripcion', 'is_active']
        # <--- Volvemos a hacer 'slug' de solo lectura. ---
        # Con 'read_only_fields', el serializer ignora 'slug' en la entrada.
        # Si 'slug' es blank=True en el modelo, y tu modelo tiene lógica para generarlo
        # en el .save() si está vacío, esto permitirá la autogeneración.
        read_only_fields = [ 'created_at', 'updated_at']

def validate_slug(self, value):
        # Limpiar el slug incluso si se proporciona manualmente
        if value:
            return slugify(value)
        return value # Permitir que sea None/vacío si el modelo lo permite y se genera después

def create(self, validated_data):
        # Si no se proporciona un slug o es vacío, lo generamos desde el nombre
        if not validated_data.get('slug') and validated_data.get('nombre'):
            validated_data['slug'] = slugify(validated_data['nombre'])
        elif not validated_data.get('slug'): # Si no hay slug ni nombre
            raise serializers.ValidationError({"slug": "El slug o el nombre son requeridos."})
        
        # Validación de unicidad de slug antes de la creación
        if Categoria.objects.filter(slug=validated_data['slug']).exists():
            raise serializers.ValidationError({"slug": "Ya existe una categoría con este slug."})

        return super().create(validated_data)

def update(self, instance, validated_data):
        # Si el nombre cambia y el slug no se proporciona, o se vacía, se puede regenerar
        # O si el slug se proporciona, validarlo.
        if 'nombre' in validated_data and not validated_data.get('slug'):
            validated_data['slug'] = slugify(validated_data['nombre'])
        elif 'slug' in validated_data and not validated_data.get('slug'):
        # Si se intentó vaciar el slug al editar, podemos regenerarlo o validar si es obligatorio
            if validated_data.get('nombre'): # Si hay nombre, regenerar
                validated_data['slug'] = slugify(validated_data['nombre'])
            else: # Si no hay nombre, el slug debe ser obligatorio
                raise serializers.ValidationError({"slug": "El slug no puede estar vacío si el nombre no se proporciona."})

        # Validación de unicidad de slug al actualizar
        if 'slug' in validated_data:
            if Categoria.objects.filter(slug=validated_data['slug']).exclude(pk=instance.pk).exists():
                raise serializers.ValidationError({"slug": "Ya existe otra categoría con este slug."})

        return super().update(instance, validated_data)        


class SimpleCategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'slug'] # Solo los campos esenciales
        read_only_fields = ['id', 'nombre', 'slug'] # Asegurarse que son solo de lectura


# backend/productos/serializers.py

class ImagenProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagenProducto
        fields = ['id', 'imagen', 'alt_text', 'is_feature', 'order']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        if instance.imagen:
            # Convierte a string puro
            url = str(instance.imagen)
            # Si es una URL absoluta (Cloudinary)
            if url.startswith('https://') or url.startswith('http://'):
                representation['imagen'] = url
            else:
                # Ruta local
                request = self.context.get('request')
                if request:
                    representation['imagen'] = request.build_absolute_uri(instance.imagen.url)
                else:
                    representation['imagen'] = instance.imagen.url

        return representation

    
class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Review
        fields = ('id', 'user_name', 'rating', 'comment', 'created_at')



class ProductoSerializer(serializers.ModelSerializer):
    # Este usa el SimpleCategoriaSerializer para 'categoria_info'
    categoria_info = SimpleCategoriaSerializer(source='categoria', read_only=True) # <--- USAR SimpleCategoriaSerializer
    imagenes = ImagenProductoSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    rating_average = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'slug', 'descripcion_corta', 'descripcion_larga',
            'precio', 'precio_oferta', 'get_precio_actual', 'categoria',
            'categoria_info', 'sku', 'stock', 'is_active', 'is_featured',
            'created_at', 'updated_at', 'imagenes','marca', 'tipo_mascota',
            'rating_average', 'review_count', 'reviews' 
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at', 'get_precio_actual']


class ProductoCreateUpdateSerializer(serializers.ModelSerializer):
    # <--- USAR SimpleCategoriaSerializer AQUÍ TAMBIÉN ---
    categoria_info = SimpleCategoriaSerializer(source='categoria', read_only=True)
    # ---------------------------------------------------

    class Meta:
        model = Producto
        fields = [
            'id',
            'nombre', 'descripcion_corta', 'descripcion_larga',
            'precio', 'precio_oferta', 'categoria',
            'categoria_info',
            'sku', 'stock',
            'is_active', 'is_featured','marca','tipo_mascota', 'slug'
        ]
        read_only_fields = ['id', 'slug']
    
    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock no puede ser negativo.")
        return value
    
    def validate_precio(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser un valor positivo.")
        return value

# Nuevo: Serializer para que el ADMINISTRADOR suba/gestione imágenes
class ImagenProductoAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagenProducto
        fields = ['id', 'producto', 'imagen', 'alt_text', 'is_feature', 'order']
        read_only_fields = ['order'] 
        validators = [] 

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if representation['imagen'] and request:
            representation['imagen'] = request.build_absolute_uri(instance.imagen.url)
        return representation
    
