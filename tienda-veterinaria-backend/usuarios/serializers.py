# usuarios/serializers.py
from rest_framework import serializers
from .models import CustomUser , UserActivityLog
from django.contrib.auth.password_validation import validate_password # Para validación de contraseña
from .validators import validate_no_numeric_only
from django.db.models import Sum



class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined','is_staff', 
            'is_superuser', 'is_vip')
        read_only_fields = ('username', 'date_joined', 'email' ,'is_staff', 'is_superuser', 'is_vip') # Email no editable, es el identificador principal

class UserRegistrationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(validators=[validate_no_numeric_only])
    first_name = serializers.CharField(validators=[validate_no_numeric_only], required=False)
    last_name = serializers.CharField(validators=[validate_no_numeric_only], required=False)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password], style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name') # Puedes añadir first_name, last_name
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return data

    def create(self, validated_data):
        validated_data.pop('password2') # Eliminar el campo de confirmación de contraseña
        user = CustomUser.objects.create_user(**validated_data)
        return user
    
class UserProfileUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(validators=[validate_no_numeric_only])
    first_name = serializers.CharField(validators=[validate_no_numeric_only], required=False)
    last_name = serializers.CharField(validators=[validate_no_numeric_only], required=False)
    
    
    class Meta:
        model = CustomUser
        # Devolvemos username y roles para que el frontend no pierda datos
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_vip')
        # username y roles son solo lectura aquí
        read_only_fields = ('id', 'username', 'is_staff', 'is_vip')

        
class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(required=True, validators=[validate_password], style={'input_type': 'password'})
    new_password_confirm = serializers.CharField(required=True, style={'input_type': 'password'})

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña anterior es incorrecta.")
        return value

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "Las nuevas contraseñas no coinciden."})
        return data
    


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined', 'is_vip')
        read_only_fields = ('date_joined',)


# --- SERIALIZER PARA LOGS ---
class UserActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivityLog
        fields = ('id', 'action', 'details', 'ip_address', 'timestamp')

# --- SERIALIZER PARA DETALLE DE ADMIN (Completo) ---
# backend/usuarios/serializers.py

class AdminUserDetailSerializer(serializers.ModelSerializer):
    activity_logs = UserActivityLogSerializer(many=True, read_only=True)
    
    # Campos Calculados (Estadísticas)
    total_orders = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    last_order_date = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'is_staff', 'is_active', 'is_vip', 'date_joined', 'last_login',
            'activity_logs', 
            'total_orders', 'total_spent', 'last_order_date' # <--- NUEVOS
        )
        read_only_fields = ('date_joined', 'last_login', 'activity_logs')

    def get_total_orders(self, obj):
        # Cuenta todas las órdenes asociadas al usuario
        return obj.orders.count()

    def get_total_spent(self, obj):
        # Suma el total solo de las órdenes PAGADAS ('PAID')
        total = obj.orders.filter(status='PAID').aggregate(Sum('total'))['total__sum']
        return total or 0.00 # Devuelve 0 si es None

    def get_last_order_date(self, obj):
        last_order = obj.orders.order_by('-created_at').first()
        return last_order.created_at if last_order else None