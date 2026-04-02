from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True, verbose_name="Correo Electrónico")
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="customuser_set", 
        related_query_name="customuser",
        
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="customuser_permissions_set", 
        related_query_name="customuser_permission",
    )


    is_vip = models.BooleanField(
        default=False, 
        verbose_name="Es Cliente VIP",
        help_text="Indica si el usuario tiene estatus VIP (Descuentos, etc.)"
    )

    def __str__(self):
        return self.username

    def __str__(self):
        return self.username if self.username else self.email

    class Meta:
        verbose_name = 'usuario'
        verbose_name_plural = 'usuarios'  
        ordering = ['username']           


class UserActivityLog(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=50) 
    details = models.TextField(blank=True, null=True) 
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Registro de Actividad"
        verbose_name_plural = "Registros de Actividad"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.timestamp}"