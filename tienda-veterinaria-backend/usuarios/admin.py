
# usuarios/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from .forms import CustomUserCreationForm, CustomUserChangeForm # Los crearemos en el siguiente paso

class CustomUserAdmin(UserAdmin):
    # Añade CustomUserCreationForm y CustomUserChangeForm para que el admin de Django
    # use tus formularios personalizados al crear/editar usuarios.
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser

    # Personaliza los campos que se muestran en la lista de usuarios en el admin
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active')

    # Personaliza los campos visibles y editables en la página de detalle del usuario
    # Los 'fieldsets' son tuplas que agrupan campos.
    fieldsets = UserAdmin.fieldsets + (
        # Aquí podrías añadir un nuevo fieldset para tus campos personalizados, e.g.:
        # ('Información Adicional', {'fields': ('direccion_envio_predeterminada', 'telefono', 'fecha_nacimiento')}),
    )
    # Lo mismo para 'add_fieldsets' para cuando se crea un nuevo usuario
    add_fieldsets = UserAdmin.add_fieldsets + (
        # Aquí podrías añadir un nuevo fieldset para tus campos personalizados, e.g.:
        # ('Información Adicional', {'fields': ('direccion_envio_predeterminada', 'telefono', 'fecha_nacimiento')}),
    )


# Registra tu modelo CustomUser con tu CustomUserAdmin en el panel de administración
admin.site.register(CustomUser, CustomUserAdmin)