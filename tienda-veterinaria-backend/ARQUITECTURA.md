# Arquitectura Enterprise - Feature-Based con Service Layer

## ✅ Estado: FASE 1 COMPLETADA (Módulo: `usuarios`)

### Refactorización Aplicada en `usuarios/`

Hemos migrado de una arquitectura monolítica a una arquitectura modular, limpia y escalable:

```
ANTES (Anti-pattern)
├── views.py         ❌ Fat Controllers (lógica mixta, validaciones, DB)
├── serializers.py   ❌ Lógica de negocio mezclada
└── models.py        ❌ Métodos complejos en el modelo

DESPUÉS (Architecture Pattern) ✅
├── views.py         ✅ Thin Controllers (solo routing HTTP)
├── serializers.py   ✅ Solo validación de datos
├── services.py      ✨ NUEVA - Toda la lógica de negocio
├── selectors.py     ✨ NUEVA - Queries optimizadas (N+1 queries resuelto)
├── exceptions.py    ✨ NUEVA - Errores custom tipados
├── models.py        ✅ Solo datos y validaciones básicas
└── migrations/
```

---

## 🏗️ Patrones Implementados

### 1. **Service Layer Pattern**
Toda la lógica de negocio está centralizada en `UserService`:

```python
# ✅ BIEN - Lógica en el servicio
user = UserService.register_user(
    username=username,
    email=email,
    password=password,
    password_confirm=password_confirm,
    first_name=first_name,
    last_name=last_name,
)

# ❌ JAMÁS - Lógica en la vista
# user = CustomUser.objects.create_user(...)
```

#### Servicios Disponibles:
- `UserService.register_user()` - Registro con validaciones
- `UserService.authenticate_user()` - Login seguro + JWT
- `UserService.change_password()` - Cambio de contraseña
- `UserService.request_password_reset()` - Envío de email
- `UserService.confirm_password_reset()` - Reset con token
- `UserService.update_user_profile()` - Actualización de perfil
- `UserService.log_activity()` - Auditoría centralizada
- `UserService.generate_tokens()` - Generación de JWT

### 2. **Selector Pattern**
Queries optimizadas y reutilizables en `selectors.py`:

```python
# ✅ BIEN - Query reutilizable, tipada
user = selectors.get_user_by_email(email)
users = selectors.get_vip_users()
stats = selectors.get_user_with_stats(user_id)

# ❌ JAMÁS - Queries dispuestas en views
# user = CustomUser.objects.filter(email=email).first()
```

#### Selectores Disponibles:
- `get_user_by_id()`, `get_user_by_email()`, `get_user_by_username()`
- `user_exists()` - Verificar existencia rápida
- `get_all_users()` - Listado con filtros
- `get_user_with_stats()` - Con prefetch_related optimizado
- `get_user_activity_logs()` - Histórico de acciones
- `get_vip_users()`, `get_admin_users()`
- `search_users()` - Búsqueda completa
- `get_recent_users()` - Nuevos registros

### 3. **Exception Handling**
Errores custom, tipados y manejables:

```python
try:
    user = UserService.register_user(...)
except UserAlreadyExistsError as e:
    return Response({"detail": e.message}, status=400)
except PasswordMismatchError as e:
    return Response({"detail": e.message}, status=400)
```

#### Excepciones Disponibles:
- `UserServiceError` - Base para todas
- `UserAlreadyExistsError`, `UserNotFoundError`
- `InvalidPasswordError`, `PasswordMismatchError`
- `InvalidCredentialsError`
- `PasswordResetTokenExpiredError`, `PasswordResetTokenInvalidError`
- `UserInactiveError`
- `InsufficientPermissionsError`

### 4. **Thin Views** 
Controllers responsables solo de HTTP routing:

```python
class UserRegistrationView(generics.CreateAPIView):
    """Registra un nuevo usuario."""
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delega TODA la lógica al servicio
            user = UserService.register_user(
                username=serializer.validated_data["username"],
                email=serializer.validated_data["email"],
                password=serializer.validated_data["password"],
                password_confirm=serializer.validated_data["password2"],
            )
            
            tokens = UserService.generate_tokens(user)
            
            return Response({
                "message": "Registro exitoso",
                "user": CustomUserSerializer(user).data,
                "refresh": tokens["refresh"],
                "access": tokens["access"],
            }, status=status.HTTP_201_CREATED)
            
        except UserAlreadyExistsError as e:
            return Response({"detail": e.message}, status=400)
```

---

## 🔄 Flujos de Negocio Refactorizados

### Registro de Usuario
```
POST /api/cuentas/registro/
├─ Validar serializer (estructura de datos)
├─ Delegar a UserService.register_user()
│  ├─ Validar contraseñas coincidan
│  ├─ Validar fortaleza de contraseña
│  ├─ Verificar no exista email/username
│  ├─ Crear usuario atómicamente
│  └─ Registrar actividad (auditoría)
├─ Generar JWT tokens
├─ Fusionar carrito anónimo (si existe)
└─ Retornar 201 con user + tokens
```

### Autenticación (Login)
```
POST /api/cuentas/token/
├─ Delegar a UserService.authenticate_user()
│  ├─ Buscar usuario por email
│  ├─ Validar contraseña
│  ├─ Verificar usuario activo
│  ├─ Generar tokens JWT
│  └─ Registrar login en auditoría
├─ Fusionar carrito anónimo (si existe)
└─ Retornar 200 con tokens
```

### Restablecimiento de Contraseña
```
POST /api/cuentas/restablecer-contrasena/solicitar/
├─ Delegar a UserService.request_password_reset()
│  ├─ Buscar usuario
│  ├─ Generar token seguro (Django default_token_generator)
│  ├─ Renderizar email template
│  └─ Enviar email

POST /api/cuentas/restablecer-contrasena/confirmar/
├─ Delegar a UserService.confirm_password_reset()
│  ├─ Decodificar y validar UID
│  ├─ Validar token no expirado
│  ├─ Validar contraseñas coincidan
│  ├─ Validar fortaleza
│  ├─ Cambiar contraseña atómicamente
│  └─ Registrar acción en auditoría
```

---

## 📊 Mejoras Logradas

### Performance
- ✅ **N+1 Queries Resueltas**: `get_user_with_stats()` usa `prefetch_related()`
- ✅ **Queries Reutilizables**: No se repite la misma query en múltiples vistas
- ✅ **Índices Optimizados**: Email unique, índices en campos de filtro

### Seguridad
- ✅ **Validaciones Centralizadas**: Una sola fuente de verdad
- ✅ **Tokens JWT Seguros**: Generación y validación en servicio
- ✅ **Auditoría Completa**: Cada acción registrada con IP y timestamp
- ✅ **Manejo de Errores**: Excepciones custom, no expone internals

### Mantenibilidad
- ✅ **Type Hints**: Todo tipado (`typing` stubs, `from __future__ import annotations`)
- ✅ **Docstrings**: Cada función documentada (doctest compatible)
- ✅ **Modularidad**: Funciones pequeñas, reutilizables, testables
- ✅ **DRY Principle**: Cero duplicación de lógica

### Testabilidad
- ✅ **Servicios Desacoplados**: Fácil mockear dependencias
- ✅ **Excepciones Específicas**: Tests pueden assert en tipos específicos
- ✅ **Funciones Puras**: `get_user_ip()`, `validate_password_strength()` son determinísticas

---

## 🔍 Ejemplo: Antes vs Después

### ANTES (Anti-pattern)
```python
# views.py - Fat Controller mezclando TODO
class UserRegistrationView(generics.CreateAPIView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 🔴 Validación de negocio en la vista
        if serializer.validated_data['password'] != serializer.validated_data['password2']:
            return Response({'detail': 'Passwords no coinciden'}, 400)
        
        # 🔴 Query sin optimización
        if CustomUser.objects.filter(email=serializer.validated_data['email']).exists():
            return Response({'detail': 'Email exists'}, 400)
        
        # 🔴 Creación sin transacción...
        user = CustomUser.objects.create_user(...)
        
        # 🔴 Lógica de carrito aquí también
        cart = Cart.objects.get(session_key=...) 
        # ... 20 líneas más ...
```

### DESPUÉS (Service Layer Pattern)
```python
# views.py - Thin Controller (solo HTTP)
class UserRegistrationView(generics.CreateAPIView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # ✅ Delegar TODO al servicio
            user = UserService.register_user(
                username=serializer.validated_data["username"],
                email=serializer.validated_data["email"],
                password=serializer.validated_data["password"],
                password_confirm=serializer.validated_data["password2"],
            )
            tokens = UserService.generate_tokens(user)
            merged_cart = _merge_anonymous_cart(request, user)  # Logica separada
            
            return Response({...}, status=201)
            
        except UserAlreadyExistsError as e:  # ✅ Errores específicos
            return Response({"detail": e.message}, 400)
```

```python
# services.py - Lógica de negocio limpia
class UserService:
    @staticmethod
    @transaction.atomic  # ✅ Transacción garantizada
    def register_user(username, email, password, password_confirm, ...):
        # ✅ Validaciones específicas
        if password != password_confirm:
            raise PasswordMismatchError()
        
        UserService.validate_password_strength(password)
        
        # ✅ Query reutilizable y tipada
        if selectors.user_exists(email=email, username=username):
            raise UserAlreadyExistsError("email", email)
        
        # ✅ Creación atómica
        user = CustomUser.objects.create_user(...)
        
        # ✅ Auditoría
        UserService.log_activity(user, "REGISTRATION", ...)
        
        return user
```

---

## 🚀 Próximas Fases

### FASE 2: Refactorización de `productos`
- [ ] Crear `productos/services.py` (búsqueda, filtrado, reviews)
- [ ] Crear `productos/selectors.py` (queries complejas)
- [ ] Crear `productos/exceptions.py`
- [ ] Refactorizar `views.py` (ProductoListAPIView, BrandListAPIView, etc.)

### FASE 3: Refactorización de `carrito`
- [ ] Crear `carrito/services.py` (merge cart logic)
- [ ] Crear `carrito/selectors.py` (stock validation)
- [ ] Refactorizar views (CartView)

### FASE 4: Refactorización de `pedidos`
- [ ] Crear `pedidos/services.py` (payment flow, Stripe)
- [ ] Crear `pedidos/selectors.py` (admin stats, filtering)
- [ ] Refactorizar webhook handling

### FASE 5: Limpieza y Optimización
- [ ] Eliminar código duplicado
- [ ] Tests unitarios completos
- [ ] Performance profiling
- [ ] Documentación arquitectura completa

---

## 📚 Guía Rápida para Nuevos Cambios

### Cuando Agregar Nuevas Funcionalidades:

1. **Define el nuevo servicio en `services.py`:**
   ```python
   @staticmethod
   def tu_nueva_funcion(param1: str, param2: int) -> ReturnType:
       """Documentación clara."""
       # Tu lógica aquí
   ```

2. **Si necesitas queries, crea un selector en `selectors.py`:**
   ```python
   def get_users_by_criterio(criterio: str) -> QuerySet[CustomUser]:
       return CustomUser.objects.filter(...).select_related(...)
   ```

3. **Define excepciones si es necesario:**
   ```python
   class TuExcepcionError(UserServiceError):
       def __init__(self, msg):
           super().__init__(msg, code="TU_ERROR")
   ```

4. **En la vista, solo delega:**
   ```python
   try:
       resultado = UserService.tu_nueva_funcion(params)
       return Response({...}, 200)
   except TuExcepcionError as e:
       return Response({"detail": e.message}, 400)
   ```

---

## ✨ Resumen de Cambios

| Aspecto | Antes | Después |
|--------|-------|---------|
| **Lógica de negocio** | Views + Serializers | `services.py` |
| **Queries DB** | Views + Models | `selectors.py` |
| **Errores** | strings genéricos | Custom exceptions |
| **Type Safety** | Ninguno | Type hints completos |
| **Atomicidad** | Manual | `@transaction.atomic` |
| **Auditoría** | Ad-hoc | `log_activity()` |
| **Reutilización** | Duplicación | Funciones compartidas |
| **Testabilidad** | Difícil | Fácil (mocking) |

---

**Última Actualización:** 2026-03-19
**Estado:** FASE 1 ✅ | FASE 2-5 ⏳
