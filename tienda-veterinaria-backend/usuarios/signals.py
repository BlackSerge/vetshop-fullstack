# backend/usuarios/signals.py
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.db.models.signals import post_save
from .models import CustomUser, UserActivityLog

from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_login_failed
from django.db.models.signals import post_save
from .models import CustomUser, UserActivityLog

# 1. LOG LOGIN (Ya lo tienes, asegúrate de que esté así)
@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    ip = request.META.get('REMOTE_ADDR')
    UserActivityLog.objects.create(user=user, action='LOGIN', ip_address=ip, details="Inicio de sesión exitoso")

# 2. LOG REGISTRO (Nuevo usuario creado)
@receiver(post_save, sender=CustomUser)
def log_user_registration(sender, instance, created, **kwargs):
    if created:
        # No tenemos request aquí fácilmente para la IP, pero registramos el evento
        UserActivityLog.objects.create(
            user=instance, 
            action='REGISTER', 
            details="Cuenta creada"
        )

# 3. Detección de Cambios de Rol (VIP/Staff)
@receiver(post_save, sender=CustomUser)
def log_user_changes(sender, instance, created, **kwargs):
    if not created:
        # Necesitamos comparar con el estado anterior, pero en post_save ya cambió.
        # Una técnica común es guardar el estado anterior en pre_save o inferir.
        # Para simplificar, asumimos que si is_vip es True y antes no lo era...
        pass 
        # Implementaremos la lógica VIP automática real cuando tengamos el modelo de Pedidos.