# Validación de Refactorización - Módulo `usuarios`

## ✅ Checklist de Verificación

### 1. Verificar que el código compila sin errores

```bash
# Desde la raíz del proyecto backend

# Validar sintaxis Python
python -m py_compile usuarios/views.py
python -m py_compile usuarios/services.py
python -m py_compile usuarios/selectors.py
python -m py_compile usuarios/exceptions.py

# Ejecutar linter pylint (opcional pero recomendado)
pylint usuarios/services.py
pylint usuarios/views.py
```

### 2. Ejecutar tests unitarios

```bash
# Instalar pytest y dependencias
pip install pytest pytest-django

# Ejecutar suite de tests para usuarios
pytest usuarios/test_services.py -v

# O ejecutar todos los tests del proyecto
pytest --tb=short
```

### 3. Validar contracts de API (que no cambiaron)

```bash
# Ejecutar el servidor en modo desarrollo
python manage.py runserver

# Desde otra terminal, hacer requests de prueba

# REGISTRO (POST)
curl -X POST http://localhost:8000/api/cuentas/registro/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "password2": "TestPass123!",
    "first_name": "Test",
    "last_name": "User"
  }'

# Esperado: 201 Created
# {"message": "Registro exitoso", "user": {...}, "refresh": "...", "access": "..."}

# LOGIN (POST)
curl -X POST http://localhost:8000/api/cuentas/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "TestPass123!"
  }'

# Esperado: 200 OK
# {"refresh": "...", "access": "...", "user": {...}}

# PERFIL (GET - requiere token)
TOKEN="<access_token_from_login>"
curl -X GET http://localhost:8000/api/cuentas/perfil/ \
  -H "Authorization: Bearer $TOKEN"

# Esperado: 200 OK
# {"id": 1, "username": "testuser", "email": "test@example.com", ...}

# CAMBIAR CONTRASEÑA (POST - requiere token)
curl -X POST http://localhost:8000/api/cuentas/cambiar-contrasena/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "old_password": "TestPass123!",
    "new_password": "NewPass456!",
    "new_password_confirm": "NewPass456!"
  }'

# Esperado: 200 OK
# {"message": "Contraseña actualizada con éxito"}
```

### 4. Verificar que la lógica NO cambió

```bash
# Probar escenarios de error que debían fallar antes, siguen fallando

# Registro con email duplicado
curl -X POST http://localhost:8000/api/cuentas/registro/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "anotheruser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "password2": "TestPass123!"
  }'

# Esperado: 400 Bad Request
# {"detail": "Ya existe un usuario con email: test@example.com"}

# Login con credenciales incorrectas
curl -X POST http://localhost:8000/api/cuentas/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "WrongPassword"
  }'

# Esperado: 401 Unauthorized
# {"detail": "Las credenciales proporcionadas no son válidas"}
```

### 5. Verificar auditoría

```bash
# En la shell de Django, verificar que se registran actividades

python manage.py shell

>>> from usuarios.models import UserActivityLog
>>> UserActivityLog.objects.all().values('user__email', 'action', 'timestamp').order_by('-timestamp')[:5]

# Esperado: Ver REGISTRATION, LOGIN, PASSWORD_CHANGE, etc.
```

### 6. Validar fusión de carritos anónimos

```bash
# 1. Crear carrito anónimo
curl -X GET http://localhost:8000/api/carrito/cart/ \
  -H "Content-Type: application/json"

# Guardar el header 'X-Cart-Session' que retorna

CART_SESSION="<session_uuid>"

# 2. Añadir producto al carrito anónimo
curl -X POST http://localhost:8000/api/carrito/cart/ \
  -H "Content-Type: application/json" \
  -H "X-Cart-Session: $CART_SESSION" \
  -d '{
    "product_id": 1,
    "quantity": 2
  }'

# 3. Registrar usuario (enviar mismo X-Cart-Session)
curl -X POST http://localhost:8000/api/cuentas/registro/ \
  -H "Content-Type: application/json" \
  -H "X-Cart-Session: $CART_SESSION" \
  -d '{
    "username": "cartuser",
    "email": "cartuser@example.com",
    "password": "TestPass123!",
    "password2": "TestPass123!"
  }'

# Esperado: 201 Created
# Response incluye "cart" con los items fusionados:
# {
#   "message": "Registro exitoso",
#   "user": {...},
#   "refresh": "...",
#   "access": "...",
#   "cart": {
#     "id": 1,
#     "items": [{"product": 1, "quantity": 2, "price": "..."}],
#     "total_price": "..."
#   }
# }
```

---

## 🔄 Diferencias Internas (Sin impactar API)

### Antes vs Después

| Funcionalidad | Antes | Después |
|---|---|---|
| Registro usuario | Lógica en `post()` de view | `UserService.register_user()` |
| Validación contraseña | Django built-in solo | `UserService.validate_password_strength()` |
| Búsqueda de usuario | Directo query `.filter()` | `selectors.get_user_by_email()` |
| Logs de actividad | Ad-hoc `create_log()` | `UserService.log_activity()` |
| Errores | Strings genéricos | Excepciones typed custom |
| Transacciones | Manual con decorator | `@transaction.atomic` |

**IMPORTANTE:** Estos cambios internos NO afectan los JSON de responses.

---

## 🚨 Si Algo Falla

### Error: `UserAlreadyExistsError not found`
```bash
# Verificar que exceptions.py está en usuarios/
ls -la usuarios/exceptions.py

# Verificar imports en views.py
grep "UserAlreadyExistsError" usuarios/views.py
```

### Error: `Type hint not supported`
```bash
# Verificar que tiene `from __future__ import annotations`
head -20 usuarios/services.py | grep "from __future__"

# Si no está, agregar al inicio del archivo después del docstring
```

### Error: N+1 Queries
```bash
# Debugger: Mostrar queries ejecutadas
python manage.py shell

>>> from django.db import connection
>>> from usuarios.selectors import get_user_with_stats
>>> user = get_user_with_stats(1)
>>> len(connection.queries)  # Debe ser pocas queries (~3-5), no 10+
```

---

## ✨ Beneficios Alcanzados

✅ **Lógica Centralizada**: Toda en `services.py`, no dispersa en views  
✅ **Queries Optimizadas**: `prefetch_related()` prevent N+1  
✅ **Errores Tipados**: No hay que parsear strings  
✅ **Auditoría Completa**: Cada acción registrada  
✅ **Testeable**: Servicios desacoplados, fácil mockear  
✅ **Type Safe**: Type hints en todas partes  
✅ **Transacciones Seguras**: `@transaction.atomic` en operaciones críticas  
✅ **Escalable**: Patrón Service Locator reutilizable en otros módulos  

---

## 🔜 Próximos Pasos

Una vez validado este módulo, replicar el patrón en:
1. `productos/` - Búsqueda, filtrado, reviews
2. `carrito/` - Lógica de fusión, validación de stock
3. `pedidos/` - Payment flow, stripe webhooks
4. `Limpieza general` - Tests end-to-end, documentación

---

**Remember the GOLDEN RULE:**  
> ✅ LA LÓGICA DE NEGOCIO ESTÁ INTACTA  
> ✅ LOS CONTRACTS DE API SON IDÉNTICOS  
> ✅ SOLO MOVIMOS EL CÓDIGO A UN LUGAR MEJOR
