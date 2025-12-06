

# usuarios/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    # Aquí puedes añadir campos específicos que tu tienda pueda necesitar.
    # Por ahora, solo extenderemos el modelo predeterminado, pero es el lugar ideal
    # para añadir cosas como:
    # direccion_envio_predeterminada = models.CharField(max_length=255, blank=True, null=True, verbose_name="Dirección de Envío Predeterminada")
    # telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name="Número de Teléfono")
    # fecha_nacimiento = models.DateField(blank=True, null=True, verbose_name="Fecha de Nacimiento")
    # foto_perfil = models.ImageField(upload_to='profile_pics/', blank=True, null=True, verbose_name="Foto de Perfil")
    email = models.EmailField(unique=True, verbose_name="Correo Electrónico")
    # **Importante para ManyToManyField:**
    # Los campos `groups` y `user_permissions` son campos ManyToManyField que el
    # `AbstractUser` hereda. Si tienes otras apps que también definen modelos
    # con campos ManyToManyField hacia User (como puede ser en Django),
    # puedes tener conflictos de `related_name`. Para evitarlo,
    # es una buena práctica definirlos explícitamente en tu CustomUser
    # y asignarles un `related_name` único.
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="customuser_set", # Nombre único para la relación inversa
        related_query_name="customuser",
        
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="customuser_permissions_set", # Otro nombre único
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
        # Define cómo se representa el objeto CustomUser como string.
        # Puedes usar el username, email, o una combinación.
        return self.username if self.username else self.email

    class Meta:
        # Metadata adicional para tu modelo.
        verbose_name = 'usuario'          # Nombre singular legible para humanos
        verbose_name_plural = 'usuarios'  # Nombre plural legible para humanos
        ordering = ['username']           # Ordenar usuarios por nombre de usuario por defecto


class UserActivityLog(models.Model):
    """
    Registro de auditoría para acciones importantes de usuarios.
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=50) # Ej: 'LOGIN', 'PURCHASE', 'VIP_STATUS_CHANGE'
    details = models.TextField(blank=True, null=True) # Detalles extra (JSON o texto)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Registro de Actividad"
        verbose_name_plural = "Registros de Actividad"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.timestamp}"