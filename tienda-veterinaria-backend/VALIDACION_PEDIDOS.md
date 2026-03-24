"""
VALIDACION_PEDIDOS.md

Guía de validación para la refactorización de pedidos (FASE 4).
Contiene pasos para probar manualmente la nueva arquitectura.
"""

# 1. VALIDACIÓN MANUAL - CREACIÓN DE PAYMENT INTENT

## Paso 1: Verificar que el endpoint de PaymentIntent funciona

```bash
POST /api/pedidos/crear-payment-intent/
Authorization: Bearer <user_jwt_token>
Content-Type: application/json

{
  "cart_id": 1  # ID del carrito del usuario
}
```

**Respuesta esperada:**
```json
{
  "clientSecret": "pi_1234567890_secret_jwt_here"
}
```

**Validar:**
- ✓ El frontend recibe el `clientSecret`
- ✓ El PaymentIntent se creó en Stripe (visible en Stripe Dashboard)
- ✓ La metadata contiene `user_id` y `cart_id`

---

## Paso 2: Procesar pago en el frontend

1. El frontend usa `Stripe.js` con el `clientSecret`
2. Usuario ingresa datos de tarjeta
3. Stripe emite `payment_intent.succeeded`
4. Webhook recibe el evento

---

## Paso 3: Validar Webhook de Stripe

**El webhook debe:**
- ✓ Recibir evento de Stripe en `POST /api/pedidos/webhook-stripe/`
- ✓ Verificar firma con `verify_webhook_signature()`
- ✓ Extraer `user_id` y `cart_id` de metadata
- ✓ Llamar `OrderService.create_order_from_payment()`
- ✓ Crear orden con status `PAID`
- ✓ Mover items al OrderItem
- ✓ Decrementar stock
- ✓ Vaciar carrito
- ✓ Enviar email de confirmación

**Verificar en base de datos:**
```sql
-- Debe existir orden nueva
SELECT * FROM pedidos_order WHERE stripe_payment_intent_id = 'pi_...';

-- Debe tener OrderItems
SELECT * FROM pedidos_orderitem WHERE order_id = 1;

-- Stock debe estar decrementado
SELECT nombre, stock FROM productos_producto WHERE id = 1;

-- Carrito debe estar vacío
SELECT COUNT(*) FROM carrito_cartitem WHERE cart_id = 1;
```

---

# 2. VALIDACIÓN DE EXCEPCIONES

## CartEmptyError
- Intentar crear PaymentIntent con carrito vacío → Error 400

## InsufficientStockError
- Intentar pagar cuando stock cambió → Error 409

## DuplicateOrderError
- Webhook procesa mismo PaymentIntent 2 veces → Evita duplicado

## StripeWebhookError
- Webhook con firma inválida → Error 400

---

# 3. VALIDACIÓN DE VIP UPGRADE

## Escenario: Usuario sin VIP hace compra > $500

1. Usuario tiene `is_vip = False`
2. Realiza compra por $550
3. Webhook procesa `create_order_from_payment()`
4. `_check_vip_upgrade()` se ejecuta
5. Usuario debe tener `is_vip = True` ahora

**Verificar:**
```sql
SELECT username, is_vip FROM usuarios_customuser WHERE id = 1;
SELECT * FROM usuarios_useractivitylog WHERE user_id = 1 AND action = 'VIP_UPGRADE';
```

---

# 4. VALIDACIÓN DE ENDPOINTS

## GET /api/pedidos/mis-pedidos/
- ✓ Devuelve solo pedidos del usuario autenticado
- ✓ Acepta `?status=PAID` para filtrar

## GET /api/pedidos/admin/orders/
- ✓ Solo ADMIN puede acceder
- ✓ Devuelve todos los pedidos
- ✓ Acepta `?user_id=1` para filtrar por usuario

## GET /api/pedidos/admin/stats/
- ✓ Solo ADMIN puede acceder
- ✓ Retorna: total_sales, total_orders, month_sales, top_products, chart_data

---

# 5. VALIDACIÓN DE EMAIL

El email de confirmación debe enviarse después de cada compra.

**Verificar en logs:**
```python
# Email debe estar en pytest output
assert "📧 Correo enviado a" in caplog.text
```

**Si falla:**
- El servicio debe continuar (fail_silently=True)
- La orden se crea igual
- ERROR NO debe romper el webhook

---

# 6. VALIDACIÓN DE TRANSACCIÓN ATÓMICA

Si ocurre error durante `create_order_from_payment()`, TODA la transacción se revierte:

**Escenario de rollback:**
1. Crear orden exitosamente
2. Intentar decrementar stock (fallo intencional)
3. Toda la transacción se revierte
4. No debe quedar orden, items, ni cambios en stock

```python
# Test de rollback
with transaction.atomic():
    order = Order.objects.create(...)  # OK
    ProductService.decrease_stock(999, 1)  # Fuerza error
    # Aquí rollback automático
```

---

# 7. TEST SUITE - PYTEST

Ejecutar tests de servicios:

```bash
pytest pedidos/test_services.py -v
```

**Salida esperada: 15+ tests pasando**

```
test_validate_shipping_address_success ✓
test_validate_shipping_address_missing_field ✓
test_extract_shipping_from_intent_with_shipping_data ✓
test_create_order_from_payment_success ✓
test_create_order_from_payment_duplicate_prevention ✓
test_vip_upgrade_automatic ✓
test_update_order_status_success ✓
test_cancel_order_success ✓
... (15+ tests)
```

---

# 8. CHECKING DE INTEGRACIONES CROSS-MODULE

**From carrito:**
```python
from carrito import selectors, services
cart_selectors.get_cart_by_id(cart_id)  # ✓ Se importa y usa
cart_services.CartService.validate_cart_stock()  # ✓ Se valida stock
```

**From productos:**
```python
from productos import services as product_services
product_services.ProductService.decrease_stock(product_id, qty)  # ✓ Decreases stock
product_services.ProductService.increase_stock(product_id, qty)  # ✓ For cancels
```

**From usuarios:**
```python
from usuarios.models import UserActivityLog, CustomUser
UserActivityLog.objects.create(user=user, action='PURCHASE', ...)  # ✓ Logs activity
CustomUser.objects.get(id=user_id)  # ✓ Gets user
```

---

# 9. PERFORMANCE CHECKS

## N+1 Prevention
```python
# selectors.get_order_by_id() usa prefetch_related("items__product")
# Debe ejecutar solo 2 queries (order + items con producto)
```

Verificar con django-debug-toolbar:
- Orden con 10 items = 2 queries (no 11)
- Listar 20 órdenes = 3 queries (no 21)

---

# 10. SECURITY VALIDATION

## Webhook Signature
- ✓ `verify_webhook_signature()` valida con STRIPE_WEBHOOK_SECRET
- ✓ Firma inválida retorna 400
- ✓ Sin firma retorna 400

## User Authorization
- ✓ CreatePaymentIntentView requiere IsAuthenticated
- ✓ MyOrderListAPIView requiere IsAuthenticated
- ✓ OrderListAPIView requiere IsAdminUser
- ✓ AdminDashboardStatsView requiere IsAdminUser

---

# 11. BACKWARDS COMPATIBILITY CHECK

✓ **API Contracts preservados:**
- POST `/api/pedidos/crear-payment-intent/` - Mismo request/response
- POST `/api/pedidos/webhook-stripe/` - Mismo manejo de eventos
- GET `/api/pedidos/mis-pedidos/` - Mismo response format
- GET `/api/pedidos/admin/orders/` - Mismo response format
- GET `/api/pedidos/admin/stats/` - Mismo response format

✓ **Database unchanged:**
- No hay nuevas columnas en Order
- No hay nuevas columnas en OrderItem
- Migraciones Django no necesarias

✓ **No breaking changes:**
- Todos los endpoints existentes funcionan igual
- Payloads de request/response idénticos

---

# 12. MEMORY CHECK

**Import chain:**
1. views.py → services (PaymentService, OrderService)
2. services → exceptions, selectors
3. selectors → Django ORM (no external)
4. exceptions → (no dependencias)

**Circular imports:** ✓ NONE

---

## ACTA DE COMPLETACIÓN

- ✓ FASE 4: pedidos refactorizado 100%
- ✓ Exceptions.py creado (10 tipos)
- ✓ Selectors.py creado (20+ funciones)
- ✓ Services.py creado (PaymentService + OrderService)
- ✓ Views.py refactorizado (5 thin controllers)
- ✓ Test_services.py creado (15+ test cases)
- ✓ VALIDACION_PEDIDOS.md creado (este archivo)
- ✓ Documentación de validación lista
- ✓ Documentación continuada en FASE4_PEDIDOS_COMPLETADA.md
