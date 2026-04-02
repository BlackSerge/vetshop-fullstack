from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from decimal import Decimal


class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre de la Categoría")
    slug = models.SlugField(max_length=100, unique=True, blank=True, verbose_name="Slug de la Categoría")
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    parent = models.ForeignKey('self', null=True, blank=True, related_name='children', on_delete=models.SET_NULL, )
    is_active = models.BooleanField(default=True, verbose_name="Activa")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        ordering = ['nombre']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)

    def __str__(self):
        full_path = [self.nombre]
        k = self.parent
        while k is not None:
            full_path.append(k.nombre)
            k = k.parent
        return ' -> '.join(full_path[::-1])
    


PET_TYPE_CHOICES = [
    ('perro', 'Perro'),
    ('gato', 'Gato'),
    ('ave', 'Ave'),
    ('roedor', 'Roedor'),
    ('reptil', 'Reptil'),
    ('otros', 'Otros'),
]


class Producto(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Nombre del Producto")
    slug = models.SlugField(max_length=255, unique=True, blank=True, verbose_name="Slug del Producto")
    descripcion_corta = models.CharField(max_length=255, blank=True, verbose_name="Descripción Corta")
    descripcion_larga = models.TextField(blank=True, verbose_name="Descripción Larga")
    precio = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="Precio")
    precio_oferta = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="Precio de Oferta")
    categoria = models.ForeignKey(Categoria, related_name='productos', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Categoría")
    sku = models.CharField(max_length=50, unique=True, blank=True, verbose_name="SKU (Stock Keeping Unit)")
    stock = models.IntegerField(validators=[MinValueValidator(Decimal(0))], default=0, verbose_name="Cantidad en Stock")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    is_featured = models.BooleanField(default=False, verbose_name="Destacado (Home)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")
    marca = models.CharField(max_length=100, blank=True, null=True, verbose_name="Marca")
    tipo_mascota = models.CharField(
        max_length=50,
        choices=PET_TYPE_CHOICES, 
        blank=True,
        null=True,
        verbose_name="Tipo de Mascota")
    

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ['nombre']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        if not self.sku:
            import uuid
            self.sku = str(uuid.uuid4().hex)[:10].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre

    @property
    def get_precio_actual(self) -> Decimal:
        return self.precio_oferta if self.precio_oferta else self.precio
    
    @property
    def rating_average(self):
        reviews = self.reviews.all()
        if not reviews:
            return 0
        return sum(r.rating for r in reviews) / len(reviews)

    @property
    def review_count(self):
        return self.reviews.count()


from django.db import models
from cloudinary.models import CloudinaryField

class ImagenProducto(models.Model):
    producto = models.ForeignKey(Producto, related_name='imagenes', on_delete=models.CASCADE)
    imagen = CloudinaryField('imagen', blank=True, null=True)
    alt_text = models.CharField(max_length=255, blank=True)
    is_feature = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Imagen de Producto"
        verbose_name_plural = "Imágenes de Productos"
        ordering = ['order']
        unique_together = ('producto', 'order')

    def __str__(self):
        return f"Imagen para {self.producto.nombre} - {self.alt_text or self.imagen.name}"

    

class Review(models.Model):
    product = models.ForeignKey(Producto, related_name='reviews', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='reviews', on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        # Opcional: Un usuario solo puede opinar una vez por producto
        unique_together = ('product', 'user') 

    def __str__(self):
        
            return f"{self.rating}★ - {self.product.nombre}"