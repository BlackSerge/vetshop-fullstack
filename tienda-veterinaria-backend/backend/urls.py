from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/cuentas/', include('usuarios.urls', namespace='usuarios_api')),
    path('api/productos/', include('productos.urls', namespace='productos_api')),
    path('api/carrito/', include('carrito.urls', namespace='carrito_api')),
    path('api/pedidos/', include('pedidos.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# --- SIRVE ARCHIVOS MEDIA Y STATIC EN DESARROLLO ---
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
