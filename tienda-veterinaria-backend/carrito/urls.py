from django.urls import path
from . import views

app_name = 'carrito'

urlpatterns = [
  
    path('cart/', views.CartView.as_view(), name='cart_detail_add_update_clear'),
    path('cart/items/<int:item_id>/', views.CartView.as_view(), name='cart_item_delete'),
]