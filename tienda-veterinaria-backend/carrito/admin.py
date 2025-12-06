
# carrito/admin.py
from django.contrib import admin
from .models import Cart, CartItem

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0 # No mostrar ítems vacíos por defecto
    fields = ['product', 'quantity', 'price']
    readonly_fields = ['price'] # El precio se guarda automáticamente

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'session_key', 'total_price', 'created_at', 'updated_at') # <--- Añade session_key
    search_fields = ('user__username', 'user__email', 'session_key__icontains')      # <--- Añade session_key con icontains
    readonly_fields = ('created_at', 'updated_at', 'total_price', 'session_key')     # <--- Añade session_key a readonly
    inlines = [CartItemInline]