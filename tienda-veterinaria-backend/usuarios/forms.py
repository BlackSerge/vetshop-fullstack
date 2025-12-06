# usuarios/forms.py
from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import CustomUser

class CustomUserCreationForm(UserCreationForm):
    # Este formulario se usa para el registro de nuevos usuarios.
    # Hereda de UserCreationForm para manejar el username, password y password2.
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        # Define qué campos del CustomUser deben aparecer en el formulario de registro.
        # Puedes añadir más campos aquí si los definiste en CustomUser.
        fields = UserCreationForm.Meta.fields + ('email',) # 'email' ya viene en AbstractUser, pero a veces no está en fields por defecto en UserCreationForm

class CustomUserChangeForm(UserChangeForm):
    # Este formulario se usa para la edición de usuarios existentes (ej. en el perfil o en el admin).
    class Meta:
        model = CustomUser
        #  UserChangeForm.Meta.fields Define qué campos del CustomUser deben aparecer en el formulario de edición.
        # Deja fuera campos como el password, ya que hay un proceso separado para cambiarlo.
        fields = ('username', 'email', 'first_name', 'last_name')
        # Si quieres permitir cambiar el username, quítalo de read_only_fields en CustomUserSerializer
