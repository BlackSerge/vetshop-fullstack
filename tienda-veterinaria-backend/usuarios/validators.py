import re
from django.core.exceptions import ValidationError

def validate_no_numeric_only(value):
  
    if str(value).isdigit():
        raise ValidationError("Este campo no puede contener solo números.")

def validate_name_complexity(value):
   
    if len(re.findall(r'[a-zA-Z]', value)) < 2:
        raise ValidationError("Debe contener al menos 2 letras.")

class ComplexPasswordValidator:
    def validate(self, password, user=None):
        if not any(char.isdigit() for char in password):
            raise ValidationError('La contraseña debe contener al menos un número.')
        if not any(char.isupper() for char in password):
            raise ValidationError('La contraseña debe contener al menos una letra mayúscula.')


    def get_help_text(self):
        return "Tu contraseña debe contener al menos un número y una letra mayúscula."