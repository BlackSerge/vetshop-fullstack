from django.db import models
from django.conf import settings
from productos.models import Producto 
from decimal import Decimal 
import uuid 
class Cart(models.Model):
    """
    Representa el carrito de compras de un usuario (autenticado) o anónimo (por session_key).
    Un carrito DEBE tener un 'user' O un 'session_key'.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart',
        null=True,          
        verbose_name="Usuario"
    )
    session_key = models.UUIDField( 
        default=uuid.uuid4,  
        unique=True,
        null=True,
        blank=True,
        verbose_name="Clave de Sesión Anónima"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")

    class Meta:
        verbose_name = "Carrito"
        verbose_name_plural = "Carritos"
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.pk and self.user is None and self.session_key is None:
            self.session_key = uuid.uuid4()

        super().save(*args, **kwargs)

    def __str__(self):
        if self.user:
            return f"Carrito de {self.user.username}"
        elif self.session_key:
            return f"Carrito Anónimo ({str(self.session_key)[:8]}...)"
        return "Carrito sin identificador" 

    @property
    def total_price(self):
        """Calcula el precio total de todos los ítems en el carrito."""
        return sum(item.subtotal for item in self.items.all())

class CartItem(models.Model):
    """
    Representa un ítem dentro de un carrito de compras.
    Almacena la cantidad y el precio del producto en el momento de ser añadido.
    """
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name="Carrito"
    )
    product = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        related_name='cart_items',
        verbose_name="Producto"
    )
    quantity = models.PositiveIntegerField(default=1, verbose_name="Cantidad")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio Unitario")

    class Meta:
        verbose_name = "Ítem de Carrito"
        verbose_name_plural = "Ítems de Carrito"
        unique_together = ('cart', 'product') 

    def __str__(self):
        owner_info = self.cart.user.username if self.cart.user else f"Anónimo ({str(self.cart.session_key)[:8]}...)"
        return f"{self.quantity} x {self.product.nombre} en carrito de {owner_info}"

    @property
    def subtotal(self):
        """Calcula el subtotal para este ítem."""
        return self.price * self.quantity
