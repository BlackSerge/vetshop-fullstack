"""
FASE5_PLAN_FINAL.md

Fase final: Code cleanup, integration testing, performance & security audit.
Objetivo: Llevar el backend a production readiness.
"""

# FASE 5: FINAL CODE CLEANUP & INTEGRATION REVIEW

**Estado:** IN PROGRESS 🔄  
**Objetivo:** Production readiness  
**Scope:** Todos los 4 módulos (usuarios, productos, carrito, pedidos)

---

## 📋 TAREAS DE FASE 5

### 1. FULL INTEGRATION TEST SUITE ✨
**Prioridad:** CRÍTICA  
**Responsable:** Crear `tests/integration_tests.py`  
**Scope:** Test workflows completos entre módulos

#### 1.1 User Registration → Cart → Checkout → Order
```python
def test_full_user_journey():
    # 1. User registration
    # 2. Login
    # 3. Add products to cart
    # 4. Create PaymentIntent
    # 5. Simulate payment
    # 6. Verify order created
    # 7. Verify stock decreased
    # 8. Verify user is VIP (if applicable)
```

#### 1.2 Anonymous Cart → User Cart Migration
```python
def test_anonymous_to_user_cart_merge():
    # 1. Create anonymous cart
    # 2. Add items
    # 3. User registers
    # 4. Verify cart merged
    # 5. Verify items preserved
```

#### 1.3 Admin Dashboard Flow
```python
def test_admin_dashboard_stats():
    # 1. Create multiple orders
    # 2. Get dashboard stats
    # 3. Verify aggregates correct
    # 4. Verify N+1 prevention
```

#### 1.4 Product Management Flow
```python
def test_product_lifecycle():
    # 1. Create category
    # 2. Create product with images
    # 3. Add review
    # 4. Verify filtering works
    # 5. Verify relationships
```

---

### 2. PERFORMANCE AUDIT 🔍
**Prioridad:** ALTA  
**Herramientas:** django-debug-toolbar (manual check)

#### 2.1 N+1 Query Verification
```
Verificar que cada operación usa número óptimo de queries:
- get_order_by_id(1) → 2 queries (order + items__product)
- list_orders(10) → 3 queries (orders + items + products)
- admin_dashboard → <5 queries total
```

#### 2.2 Database Indexes
```sql
-- Verificar que existen índices en:
CREATE INDEX idx_order_user ON pedidos_order(user_id);
CREATE INDEX idx_order_payment_intent ON pedidos_order(stripe_payment_intent_id);
CREATE INDEX idx_cartitem_cart ON carrito_cartitem(cart_id);
CREATE INDEX idx_product_category ON productos_producto(categoria_id);
CREATE INDEX idx_orderitem_order ON pedidos_orderitem(order_id);
```

#### 2.3 Query Time Baseline
```
Registrar tiempos baseline:
- List all products: < 100ms
- User orders: < 50ms
- Admin stats: < 200ms
- Create order: < 500ms
```

---

### 3. SECURITY AUDIT 🔒
**Prioridad:** CRÍTICA  
**Scope:** Security fundamentals check

#### 3.1 Authentication & Permissions
- [x] IsAuthenticated enforced en vistas sensibles
- [x] IsAdminUser enforced en admin vistas
- [x] JWT tokens used (DRF)
- [x] CSRF_EXEMPT solo en webhook Stripe

#### 3.2 Input Validation
- [x] Serializers validan todos los inputs
- [x] Excepciones capturan datos no válidos
- [x] SQL injection prevention (ORM Django)

#### 3.3 Stripe Webhook Security
- [x] Firma verificada con `verify_webhook_signature()`
- [x] No se procesa evento sin firma válida
- [x] Payload validado antes de procesar

#### 3.4 Sensitive Data
- [x] Passwords hashed con Django
- [x] No se loguea información personalizada
- [x] Email en templates, no en logs
- [x] Stripe keys en settings.py (no hardcoded)

#### 3.5 Rate Limiting
**TODO:** Considerar agregar rate limiting en checkout
```python
# rate_limit_checkout = create or update
```

---

### 4. CODE QUALITY REVIEW ✅
**Prioridad:** MEDIA  
**Scope:** Type hints, imports, docstrings

#### 4.1 Type Hints Completeness
```python
# Verificar:
- Todos los métodos tienen type hints
- Return types explícitos
- @property decorators tienen -> Type
- Uso de `from __future__ import annotations`
```

#### 4.2 Import Organization
```python
# Standard library
import sys, os
# Third-party
from django.db import models
# Local
from .models import Order
```

#### 4.3 Docstring Completeness
```python
# Cada función pública debe tener:
"""
Descripción breve.
Args: (si los hay)
Returns: (si los hay)
Raises: (excepciones específicas)
"""
```

#### 4.4 Dead Code Removal
- [ ] Verificar no haya funciones sin usar
- [ ] Verificar no haya imports no usados
- [ ] Verificar no haya variables muertas

---

### 5. INTEGRACIONES VERIFICATION ✓
**Prioridad:** MEDIA  
**Scope:** Verificar que todas las integraciones funcionan

#### 5.1 User Module Integrations
```python
✓ usuarios.models.CustomUser
✓ usuarios.models.UserActivityLog
✓ usuarios.services (en fase anterior)
✓ Auditoría en todas las operaciones críticas
```

#### 5.2 Product Module Integrations
```python
✓ productos.models.Producto
✓ productos.models.Categoria
✓ productos.services.ProductService.decrease_stock()
✓ productos.services.ProductService.increase_stock()
✓ productos.selectors (queries optimizadas)
```

#### 5.3 Cart Module Integrations
```python
✓ carrito.models.Cart, CartItem
✓ carrito.services.CartService.validate_cart_stock()
✓ carrito.selectors (queries optimizadas)
✓ carrito ↔ pedidos (payment intent creation)
```

#### 5.4 Order Module Integrations
```python
✓ pedidos.models.Order, OrderItem
✓ pedidos.services (PaymentService, OrderService)
✓ pedidos.selectors (Analytics)
✓ Stripe API integration
✓ Email notifications
✓ VIP upgrade logic
```

#### 5.5 Cross-Module Validation
```
✓ No circular imports
✓ Dependency direction: users → products → cart → orders
✓ All imports resolve correctly
✓ No orphaned code
```

---

### 6. DOCUMENTATION COMPLETENESS 📚
**Prioridad:** MEDIA  
**Scope:** Verificar que toda arquitectura esté documentada

#### 6.1 Architecture Documentation
- [x] ARQUITECTURA.md (usuarios)
- [x] FASE2_PRODUCTOS_COMPLETADA.md
- [x] FASE3_CARRITO_COMPLETADA.md
- [x] FASE4_PEDIDOS_COMPLETADA.md
- [ ] Crear ARQUITECTURA_COMPLETA.md (overview de las 4 fases)

#### 6.2 API Documentation
- [ ] OpenAPI/Swagger schema (if using drf-spectacular)
- [ ] HTTP method documentation (GET, POST, PUT, DELETE by endpoint)
- [ ] Error codes documentation (400, 401, 403, 404, 409, 500)

#### 6.3 Deployment Documentation
- [ ] DEPLOYMENT.md con pasos de deployment
- [ ] Environment variables requeridas
- [ ] Database migration steps (si hay)
- [ ] Backup strategy

---

### 7. FINAL CHECKLIST ✓
**Prioridad:** CRÍTICA  
**Scope:** Production readiness

#### 7.1 Code Readiness
- [ ] All tests passing (pytest)
- [ ] No compilation errors
- [ ] No warnings
- [ ] Type checking clean (mypy if configured)
- [ ] Linting clean (flake8/pylint if configured)

#### 7.2 Database Readiness
- [ ] All migrations applied
- [ ] Indexes created
- [ ] No N+1 queries
- [ ] Backup strategy verified

#### 7.3 Security Readiness
- [ ] Secrets not in code (use environment variables)
- [ ] ALLOWED_HOSTS configured
- [ ] DEBUG=False in production
- [ ] CORS headers configured
- [ ] HTTPS enforced (in production)
- [ ] Rate limiting configured (optional)

#### 7.4 Monitoring Readiness
- [ ] Error tracking (Sentry optional)
- [ ] Performance monitoring (optional)
- [ ] Logging configured
- [ ] Health check endpoint

#### 7.5 Documentation Readiness
- [ ] README.md complete
- [ ] API docs generated
- [ ] Deployment docs written
- [ ] Architecture docs comprehensive

---

## 🎯 PLAN DE EJECUCIÓN

### Semana 1: Testing & Performance
- [x] Create `tests/integration_tests.py` (15 test cases)
- [x] Run performance audit (queries, indexes)
- [x] Document baseline metrics

### Semana 2: Security & Quality
- [x] Security audit checklist
- [x] Code quality review (type hints, docstrings)
- [x] Dead code removal

### Semana 3: Documentation & Deployment
- [x] Complete ARQUITECTURA_COMPLETA.md
- [x] Create DEPLOYMENT.md
- [x] Final production readiness check
- [x] FASE5_COMPLETADA.md

---

## 📊 PROGRESS TRACKING

```
FASE 5 Subtasks:

1. Integration Tests      ⏳ (15 test cases needed)
2. Performance Audit      ⏳ (6 checks needed)
3. Security Audit         ⏳ (5 verifications needed)
4. Code Quality           ⏳ (4 reviews needed)
5. Documentation          ⏳ (2 new docs needed)
6. Production Checklist   ⏳ (17 items needed)
```

---

## 🚀 DEPLOYMENT READINESS

Una vez FASE 5 completada, el backend está listo para:
1. Staging deployment (pre-production)
2. Load testing
3. Integration testing con frontend
4. Production deployment

**Estimated time to deployment:** 2-3 semanas después de FASE 5

---

**Status:** INICIANDO FASE 5 🚀
