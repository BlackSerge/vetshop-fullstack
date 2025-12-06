# usuarios/urls.py
from django.urls import path
from . import views # <--- Asegúrate de que views se importe al principio
from rest_framework_simplejwt.views import (
    # TokenObtainPairView, # <--- ¡Ya no la usaremos directamente!
    TokenRefreshView,
    TokenVerifyView,
)

app_name = 'usuarios'

urlpatterns = [
    # --- APIs de autenticación con JWT ---
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'), # <--- ¡Usamos la vista personalizada!
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # --- APIs de usuarios personalizadas ---
    path('registro/', views.UserRegistrationView.as_view(), name='registro'),
    path('perfil/', views.UserProfileView.as_view(), name='perfil'),
    path('cambiar-contrasena/', views.ChangePasswordView.as_view(), name='cambiar_contrasena'),
    path('restablecer-contrasena/solicitar/', views.RequestPasswordResetAPIView.as_view(), name='password_reset_request'),
    path('restablecer-contrasena/confirmar/', views.ConfirmPasswordResetAPIView.as_view(), name='password_reset_confirm_api'),
    path('admin/users/', views.UserAdminListAPIView.as_view(), name='admin_user_list'),
    path('admin/users/<int:pk>/', views.UserAdminRetrieveUpdateDestroyAPIView.as_view(), name='admin_user_detail'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
]