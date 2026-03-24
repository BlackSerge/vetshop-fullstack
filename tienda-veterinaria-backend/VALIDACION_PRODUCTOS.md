# VALIDACIÓN Y TESTING - MÓDULO PRODUCTOS

Este documento describe cómo se valida y testea la refactorización del módulo `productos` que implementa la capa de servicios.

## 📋 Tabla de Contenidos

1. [Validación Manual (Endpoints)](#validación-manual-endpoints)
2. [Unit Tests (Test Services)](#unit-tests-test-services)
3. [Integration Tests](#integration-tests)
4. [Casos de Uso Críticos](#casos-de-uso-críticos)
5. [Troubleshooting](#troubleshooting)

---

## 🔍 Validación Manual (Endpoints)

Estos tests verifican que los endpoints públicos siguen funcionando exactamente como antes.

### 1. GET `/api/productos/categorias/` (Lista Categorías Públicas)

```bash
curl -X GET "http://localhost:8000/api/productos/categorias/" \
     -H "Content-Type: application/json"
```

**Validación:**
- ✅ Status 200 OK
- ✅ Devuelve lista de categorías activas
- ✅ Cada categoría tiene: `id`, `nombre`, `slug`, `descripcion`, `is_active`

### 2. GET `/api/productos/categorias/{slug}/` (Detalle Categoría)

```bash
curl -X GET "http://localhost:8000/api/productos/categorias/alimentos/" \
     -H "Content-Type: application/json"
```

**Validación:**
- ✅ Status 200 OK
- ✅ Devuelve una categoría específica

### 3. GET `/api/productos/items/` (Lista Productos - Con Filtros)

```bash
# Sin filtros
curl -X GET "http://localhost:8000/api/productos/items/" \
     -H "Content-Type: application/json"

# Con filtro de categoría
curl -X GET "http://localhost:8000/api/productos/items/?categoria=alimentos" \
     -H "Content-Type: application/json"

# Con filtro de precio
curl -X GET "http://localhost:8000/api/productos/items/?priceMin=10&priceMax=100" \
     -H "Content-Type: application/json"

# Con filtro de marca
curl -X GET "http://localhost:8000/api/productos/items/?brand=RoyalCanin" \
     -H "Content-Type: application/json"

# Con filtro de tipo de mascota
curl -X GET "http://localhost:8000/api/productos/items/?petType=perro" \
     -H "Content-Type: application/json"

# Con búsqueda (search)
curl -X GET "http://localhost:8000/api/productos/items/?search=alimento" \
     -H "Content-Type: application/json"

# Con produtos destacados
curl -X GET "http://localhost:8000/api/productos/items/?featured=true" \
     -H "Content-Type: application/json"

# Combinado
curl -X GET "http://localhost:8000/api/productos/items/?categoria=alimentos&priceMin=20&priceMax=150&featured=true" \
     -H "Content-Type: application/json"
```

**Validación:**
- ✅ Status 200 OK
- ✅ Filtros funcionan correctamente
- ✅ Paginación funciona (12 items por página por defecto)
- ✅ Búsqueda es case-insensitive
- ✅ Devuelve `effective_price` (considera precio oferta)

### 4. GET `/api/productos/items/{slug}/` (Detalle Producto)

```bash
curl -X GET "http://localhost:8000/api/productos/items/alimento-premium/" \
     -H "Content-Type: application/json"
```

**Validación:**
- ✅ Status 200 OK
- ✅ Devuelve todas las imágenes del producto
- ✅ Devuelve todos los reviews
- ✅ Calcula `average_rating` y `review_count`

### 5. GET `/api/productos/brands/` (Lista de Marcas)

```bash
curl -X GET "http://localhost:8000/api/productos/brands/" \
     -H "Content-Type: application/json"
```

**Validación:**
- ✅ Status 200 OK
- ✅ Devuelve lista de marcas únicas
- ✅ Marcas están ordenadas alfabéticamente

### 6. POST `/api/productos/items/{product_id}/reviews/` (Crear Review - Autenticado)

```bash
curl -X POST "http://localhost:8000/api/productos/items/1/reviews/" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     -d '{
        "rating": 5,
        "comment": "Excelente producto"
     }'
```

**Validación:**
- ✅ Status 201 Created (primer review del usuario)
- ✅ Status 400 si el usuario ya tiene review para este producto
- ✅ Status 400 si rating está fuera del rango 1-5
- ✅ Status 404 si el producto no existe
- ✅ Status 401 si no está autenticado

---

## 🧪 Unit Tests (Test Services)

Ejecutar los tests del módulo servicios:

```bash
# Ejecutar todos los tests de productos
pytest tienda-veterinaria-backend/productos/test_services.py -v

# Ejecutar un test específico
pytest tienda-veterinaria-backend/productos/test_services.py::TestCategoryService::test_create_category_success -v

# Ejecutar una clase de tests
pytest tienda-veterinaria-backend/productos/test_services.py::TestProductService -v

# Con coverage
pytest tienda-veterinaria-backend/productos/test_services.py --cov=productos.services --cov-report=html
```

### Cobertura de Tests

#### **TestCategoryService**
- ✅ `test_create_category_success` - Crear categoría válida
- ✅ `test_create_category_duplicate_error` - Rechazar duplicado
- ✅ `test_update_category_success` - Actualizar categoría
- ✅ `test_update_category_not_found` - Error si no existe

#### **TestProductService**
- ✅ `test_validate_price_success` - Validación de precio
- ✅ `test_validate_price_negative` - Rechazar precio negativo
- ✅ `test_validate_price_zero` - Rechazar precio cero
- ✅ `test_validate_stock_success` - Validación de stock
- ✅ `test_validate_stock_negative` - Rechazar stock negativo
- ✅ `test_create_product_success` - Crear producto válido
- ✅ `test_create_product_invalid_price` - Error con precio inválido
- ✅ `test_create_product_invalid_stock` - Error con stock inválido
- ✅ `test_create_product_category_not_found` - Error si categoría no existe
- ✅ `test_update_product_success` - Actualizar producto
- ✅ `test_update_product_not_found` - Error si no existe
- ✅ `test_decrease_stock_success` - Disminuir stock
- ✅ `test_decrease_stock_insufficient` - Error si stock insuficiente
- ✅ `test_increase_stock_success` - Aumentar stock
- ✅ `test_increase_stock_not_found` - Error si producto no existe

#### **TestReviewService**
- ✅ `test_validate_rating_valid_range` - Validcar rating 1-5
- ✅ `test_validate_rating_too_low` - Rechazar rating < 1
- ✅ `test_validate_rating_too_high` - Rechazar rating > 5
- ✅ `test_create_review_success` - Crear review válido
- ✅ `test_create_review_duplicate` - Rechazar segundo review del mismo usuario
- ✅ `test_create_review_invalid_product` - Error si producto no existe
- ✅ `test_create_review_invalid_rating` - Error si rating inválido
- ✅ `test_update_review_success` - Actualizar review
- ✅ `test_update_review_invalid_rating` - Error si rating inválido

#### **TestImageService**
- ✅ `test_get_next_image_order_first_image` - Orden para primera imagen
- ✅ `test_get_next_image_order_multiple_images` - Orden Auto-incrementada
- ✅ `test_update_image_success` - Actualizar imagen
- ✅ `test_update_image_not_found` - Error si imagen no existe

---

## 🔗 Integration Tests

Verfique que los nuevos servicios funcionan correctamente con la capa HTTP.

### Test 1: Flujo Completo de Creación de Producto (Admin)

```bash
# 1. Obtener token admin
curl -X POST "http://localhost:8000/api/usuarios/token/" \
     -H "Content-Type: application/json" \
     -d '{
        "email": "admin@test.com",
        "password": "AdminPassword123!"
     }'
# Guardar el token en: $TOKEN

# 2. Crear categoría (admin)
curl -X POST "http://localhost:8000/api/productos/admin/categorias/" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
        "nombre": "Juguetes para Perros",
        "descripcion": "Juguetes seguros"
     }'
# La categoría se crea con slug auto-generado

# 3. Crear producto en esa categoría
curl -X POST "http://localhost:8000/api/productos/admin/items/" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
        "nombre": "Pelota Tennis",
        "precio": "15.99",
        "categoria": 1,
        "stock": 500,
        "marca": "Kong",
        "tipo_mascota": "perro"
     }'

# 4. Subir imagen del producto
curl -X POST "http://localhost:8000/api/productos/admin/imagenes/" \
     -H "Authorization: Bearer $TOKEN" \
     -F "producto=1" \
     -F "imagen=@/path/to/image.jpg" \
     -F "alt_text=Pelota de tenis"

# 5. Ver el producto en la API pública
curl -X GET "http://localhost:8000/api/productos/items/pelota-tennis/" \
     -H "Content-Type: application/json"

# ✅ El producto debe aparecer con su imagen y slug
```

### Test 2: Flujo de Reviews

```bash
# 1. Autenticarse como usuario regular
curl -X POST "http://localhost:8000/api/usuarios/token/" \
     -H "Content-Type: application/json" \
     -d '{
        "email": "user@test.com",
        "password": "UserPassword123!"
     }'
# Guardar: $USER_TOKEN

# 2. Crear un review para un producto
curl -X POST "http://localhost:8000/api/productos/items/1/reviews/" \
     -H "Authorization: Bearer $USER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
        "rating": 5,
        "comment": "¡Excelente pelota!"
     }'
# ✅ Status 201

# 3. Intentar crear otro review del mismo usuaria (debe fallar)
curl -X POST "http://localhost:8000/api/productos/items/1/reviews/" \
     -H "Authorization: Bearer $USER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
        "rating": 4,
        "comment": "Mejor dicho, muy buena"
     }'
# ✅ Status 400 "Ya has valorado este producto"

# 4. Ver el producto actualizado (debe mostrar el review)
curl -X GET "http://localhost:8000/api/productos/items/1/" \
     -H "Content-Type: application/json"
# ✅ El review debe aparecer en la lista de reviews
```

### Test 3: Control de Stock

```bash
# En un carrito/checkout se debe decrementar el stock
# Esto se realiza desde el módulo pedidos, pero validamos aquí

# 1. Ver stock actual del producto
curl -X GET "http://localhost:8000/api/productos/items/1/" \
     -H "Content-Type: application/json"
# Anotate: stock_actual = X

# 2. En pedidos se llama ProductService.decrease_stock(1, cantidad) 
# Esto disminuye automáticamente

# 3. Ver stock actualizado
curl -X GET "http://localhost:8000/api/productos/items/1/" \
     -H "Content-Type: application/json"
# ✅ stock debe ser stock_actual - cantidad
```

---

## 🎯 Casos de Uso Críticos

Estos son los casos que **DEBEN** funcionar exactamente como antes:

### 1. ✅ Filtrado de Productos por Atributos Múltiples

```bash
curl -X GET "http://localhost:8000/api/productos/items/?categoria=alimentos&brand=RoyalCanin&petType=perro&priceMin=20&priceMax=150&featured=true" \
     -H "Content-Type: application/json"
```

**Validación:**
- Debe devolver SOLO productos que cumplan TODOS los filtros
- Anterior: `views.py` con Case/When. Ahora: `selectors.get_filtered_products()`
- Status 200 OK

### 2. ✅ Prevención de Reviews Duplicados

```bash
# El mismo usuario NO puede hacer 2 reviews al mismo producto
# Esto está validado en: ReviewService.create_review()
```

**Validación:**
- Primer POST: 201 Created
- Segundo POST: 400 Bad Request con mensaje "Ya has valorado..."

### 3. ✅ Auto-incremento de Order de Imágenes

```bash
# Cuando se suben imágenes, deben auto-incrementar el campo 'order'
# Esto está en: ImageService.get_next_image_order()
```

**Validación:**
- Primera imagen: `order=0`
- Segunda imagen: `order=1`
- Tercera imagen: `order=2`

### 4. ✅ Control de Stock Transaccional

```bash
# Cuando se crea una orden, el stock se disminuye atómicamente
# Esto está en: ProductService.decrease_stock() con @transaction.atomic
```

**Validación:**
- No permite decrementar más stock del disponible (InsufficientStockError)
- La operación es transaccional (todo o nada)

### 5. ✅ Generación de Slug Automático

```bash
# Cuando se crea una categoría o producto sin slug, se genera automáticamente
# Esto está en: CategoryService.create_category() y ProductService.create_product()
```

**Validación:**
- "Alimentos para Perros" → slug `"alimentos-para-perros"`
- Slugs duplicados: Si intenta crear con mismo nombre, lanza `DuplicateCategoryError`

---

## 🐛 Troubleshooting

### Error: "ModuleNotFoundError: No module named 'productos.selectors'"

**Causa:** Las nuevas capas de servicios no están instaladas.

**Solución:**
```bash
# Asegúrate de que estés en el directorio del backend
cd tienda-veterinaria-backend

# Reinicia el servidor Django
python manage.py runserver

# Si persiste, recarga el módulo en Python
python -c "import productos.selectors; print('OK')"
```

---

### Error: "ProductNotFoundError: Product with id=123 not found"

**Causa:** Estás intentando acceder a un producto que no existe.

**Solución:**
- Verifica que el `product_id` sea válido
- Usa un producto que exista en la BD

---

### Error: "DuplicateReviewError: User has already reviewed this product"

**Causa:** El usuario ya tiene un review para este producto.

**Solución:**
- Esto es correcto. Si el usuario quiere cambiar su review, debe actualizar el existente (PUT)
- Alternativamente, eliminamos el review anterior antes de crear uno nuevo

---

### Error: "InsufficientStockError"

**Causa:** Intentas comprar más cantidad de la disponible.

**Solución:**
- Esto es correcto. El inventario se protege
- El usuario debe reducir la cantidad en el carrito

---

## 📊 Matriz de Compatibilidad

| Funcionalidad | Antes (Fat Views) | Ahora (Services) | Compatible |
|---|---|---|---|
| Lista de categorías | `CategoriaListAPIView.get_queryset()` | `selectors.get_all_categories()` | ✅ |
| Detalle de categoría | `CategoriaDetailAPIView` | Selector + Vistas delgadas | ✅ |
| Filtrado de productos | 6 IFs en `get_queryset()` | `selectors.get_filtered_products()` | ✅ |
| Búsqueda de productos | `search_fields` + ORM | `get_filtered_products(search_query=...)` | ✅ |
| Precio efectivo (oferta) | `Case/When en QuerySet` | `selectors.get_filtered_products()` auto-calcula | ✅ |
| Creación de producto | Validación en serializer | `ProductService.create_product()` | ✅ |
| Creación de review | `perform_create()` en vista | `ReviewService.create_review()` | ✅ |
| Prevención de reviews dup. | `Review.objects.filter().exists()` | `selectors.user_has_reviewed_product()` | ✅ |
| Auto-order de imágenes | Cálculo en `perform_create()` | `ImageService.get_next_image_order()` | ✅ |
| Upload a Cloudinary | Serializer + Model | `ImageService.upload_image()` | ✅ |

---

## ✨ Resumen

✅ **FASE 2 (productos) - CASI COMPLETA**

- ✅ Capa de excepciones (`exceptions.py`)
- ✅ Capa de selectores (`selectors.py`)
- ✅ Capa de servicios (`services.py`)
- ✅ Vistas refactorizadas a controladores delgados (`views.py`)
- ✅ Tests completos (`test_services.py`)
- ✅ Documentación de validación (este archivo)

**Próximos pasos:** FASE 3 (carrito) y FASE 4 (pedidos)
