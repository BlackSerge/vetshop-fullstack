# carrito/urls.py
from django.urls import path
from . import views

app_name = 'carrito'

urlpatterns = [
    # GET: Obtener el carrito del usuario/anónimo (crea si no existe).
    # POST: Añadir o actualizar un ítem en el carrito (product_id, quantity).
    # PUT: Actualizar la cantidad de un ítem específico (item_id, quantity).
    # DELETE: Vaciar todo el carrito.
    path('cart/', views.CartView.as_view(), name='cart_detail_add_update_clear'),

    # DELETE: Eliminar un ítem específico del carrito.
    path('cart/items/<int:item_id>/', views.CartView.as_view(), name='cart_item_delete'),
]