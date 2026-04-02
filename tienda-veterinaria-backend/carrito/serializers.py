from rest_framework import serializers
from .models import Cart, CartItem
from productos.models import Producto 

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.nombre', read_only=True)
    product_slug = serializers.SlugField(source='product.slug', read_only=True)
    product_main_image = serializers.SerializerMethodField()
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = CartItem
        fields = ['id', 'product_id', 'product_name', 'product_slug', 'product_main_image', 'quantity', 'price', 'subtotal']
        read_only_fields = ['id', 'price', 'subtotal', 'product_name', 'product_slug', 'product_main_image']

    def get_product_main_image(self, obj):
        request = self.context.get('request')
        first_image = obj.product.imagenes.filter(is_feature=True).first() or \
        obj.product.imagenes.first()
        if first_image and request:
            return request.build_absolute_uri(first_image.imagen.url)
        return None

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    session_key = serializers.UUIDField(read_only=True) 

    class Meta:
        model = Cart
        fields = ['id', 'user', 'session_key', 'items', 'total_price', 'created_at', 'updated_at'] 
        read_only_fields = ['id', 'user', 'session_key', 'created_at', 'updated_at']