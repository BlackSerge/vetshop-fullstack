from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in
from django.db.models.signals import post_save
from .models import CustomUser, UserActivityLog
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in
from django.db.models.signals import post_save
from .models import CustomUser, UserActivityLog

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    ip = request.META.get('REMOTE_ADDR')
    UserActivityLog.objects.create(user=user, action='LOGIN', ip_address=ip, details="Inicio de sesión exitoso")

@receiver(post_save, sender=CustomUser)
def log_user_registration(sender, instance, created, **kwargs):
    if created:
        UserActivityLog.objects.create(
            user=instance, 
            action='REGISTER', 
            details="Cuenta creada"
        )

@receiver(post_save, sender=CustomUser)
def log_user_changes(sender, instance, created, **kwargs):
    if not created:
        pass 
