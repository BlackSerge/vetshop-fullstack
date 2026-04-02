
from django.contrib import admin
from .models import Categoria, Producto, ImagenProducto

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'slug',  'is_active')
    list_filter = ('is_active',)
    search_fields = ('nombre', 'descripcion',)
    prepopulated_fields = {'slug': ('nombre',)}

class ImagenProductoInline(admin.TabularInline):
    model = ImagenProducto
    extra = 1
    fields = ['imagen', 'alt_text', 'is_feature', 'order']

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria', 'precio', 'precio_oferta', 'stock', 'is_active', 'is_featured', 'created_at')
    list_filter = ('is_active', 'is_featured', 'categoria','marca', 'tipo_mascota')
    search_fields = ('nombre', 'descripcion_corta', 'descripcion_larga', 'sku','marca', 'tipo_mascota')
    prepopulated_fields = {'slug': ('nombre',)}
    inlines = [ImagenProductoInline] # El administrador puede subir imágenes aquí
    fieldsets = (
        (None, {
            'fields': ('nombre', 'slug', 'descripcion_corta', 'descripcion_larga')
        }),
        ('Detalles de Precio y Categoría', {
            'fields': ('precio', 'precio_oferta', 'categoria','marca', 'tipo_mascota')
        }),
        ('Inventario y Estado', {
            'fields': ('sku', 'stock', 'is_active', 'is_featured')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        })
    )
    readonly_fields = ('created_at', 'updated_at')