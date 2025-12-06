# productos/urls.py
from django.urls import path
from . import views


app_name = 'productos'

urlpatterns = [
    # --- URLs para Categorías (Acceso Público) ---
    path('categorias/', views.CategoriaListAPIView.as_view(), name='lista_categorias'),
    path('categorias/<slug:slug>/', views.CategoriaDetailAPIView.as_view(), name='detalle_categoria'),

    # --- URLs para Productos (Acceso Público) ---
    path('items/', views.ProductoListAPIView.as_view(), name='lista_productos'),
    path('items/<slug:slug>/', views.ProductoDetailAPIView.as_view(), name='detalle_producto'),
    path('brands/', views.BrandListAPIView.as_view(), name='lista_marcas'), 

    # --- URLs para Gestión de Categorías (Solo Administradores) ---
    path('admin/categorias/', views.CategoriaAdminListCreateAPIView.as_view(), name='admin_lista_crear_categorias'),
    path('admin/categorias/<slug:slug>/', views.CategoriaAdminRetrieveUpdateDestroyAPIView.as_view(), name='admin_detalle_editar_eliminar_categoria'),

    # --- URLs para Gestión de Productos (Solo Administradores) ---
    path('admin/items/', views.ProductoAdminListCreateAPIView.as_view(), name='admin_lista_crear_productos'),
    path('admin/items/<slug:slug>/', views.ProductoAdminRetrieveUpdateDestroyAPIView.as_view(), name='admin_detalle_editar_eliminar_producto'),

    # --- URLs para Gestión de Imágenes (Solo Administradores) ---
    path('admin/imagenes/', views.ImagenProductoAdminListCreateAPIView.as_view(), name='admin_lista_crear_imagenes'),
    path('admin/imagenes/<int:pk>/', views.ImagenProductoAdminRetrieveUpdateDestroyAPIView.as_view(), name='admin_detalle_editar_eliminar_imagen'),

    path('items/<int:product_id>/reviews/', views.CreateReviewAPIView.as_view(), name='create_review'),
]

