# Tienda Veterinaria Backend

API backend para e-commerce veterinario construida con **Django + Django REST Framework**, con arquitectura modular por features y capa de servicios para la lógica de negocio.

## Stack tecnológico

- Python 3
- Django 5
- Django REST Framework
- JWT (`djangorestframework-simplejwt`)
- PostgreSQL (vía `dj-database-url`)
- Stripe (pagos)
- Cloudinary (gestión de imágenes)
- Pytest (tests)

## Estructura principal

```text
backend/                 # Configuración global Django (settings, urls, wsgi/asgi)
usuarios/                # Autenticación, perfil, administración de usuarios
productos/               # Catálogo, categorías, reseñas, imágenes
carrito/                 # Carrito anónimo/autenticado
pedidos/                 # Checkout, órdenes, Stripe webhook
tests/                   # Pruebas de integración
templates/               # Plantillas de correo/HTML
```

## Variables de entorno

1. Copia una plantilla:

```bash
cp .env.example .env
```

2. Completa como mínimo:

- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLIC_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `DJANGO_SECRET_KEY`
- `DEBUG`
- `ENVIRONMENT`

> Referencia: `.env.example` y `.env.template`.

## Instalación y ejecución local

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Migraciones y base de datos

```bash
python manage.py migrate
python manage.py createsuperuser
```

### (Opcional) Cargar datos iniciales de productos

```bash
python manage.py migrate_products_from_json
```

### Levantar servidor

```bash
python manage.py runserver
```

Backend local:
- API: `http://127.0.0.1:8000/`
- Admin: `http://127.0.0.1:8000/admin/`

## Endpoints base

- `/api/cuentas/` → auth y usuarios
- `/api/productos/` → catálogo
- `/api/carrito/` → carrito
- `/api/pedidos/` → checkout, órdenes, webhook

## Documentación API (Swagger / OpenAPI)

Actualmente **no hay un endpoint Swagger/OpenAPI expuesto** en `backend/urls.py`.

Si quieres habilitar documentación automática, recomendación:
- `drf-spectacular` o `drf-yasg`
- publicar en `/api/docs/` y `/api/schema/`

## Calidad y pruebas

```bash
pytest -v
```

Puedes complementar con checks puntuales por módulo:

```bash
pytest usuarios -v
pytest productos -v
pytest carrito -v
pytest pedidos -v
```
