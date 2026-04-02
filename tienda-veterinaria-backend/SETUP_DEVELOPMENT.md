"""
SETUP_DEVELOPMENT.md

Guía para configurar el backend en desarrollo apuntando a Neon Database.
"""

# SETUP DESARROLLO - BACKEND VET-SHOP

## 🚀 OPCIÓN 1: USAR NEON (Cloud - RECOMENDADO)

### Paso 1: Configurar Variables de Ambiente

Crea un archivo `.env` en la raíz del proyecto:

```env
# Database (Neon - Cloud)
DATABASE_URL=postgresql://usuario:contraseña@ep-nombrehost.neon.tech/tienda_vet_db?sslmode=require

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLIC_KEY=pk_test_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@vetshop.com

# Django
DJANGO_SECRET_KEY=tu-secret-key-muy-largo-aleatorio
DEBUG=True
ENVIRONMENT=development
```

### Paso 2: Instalar Dependencias

```bash
pip install -r requirements.txt
```

### Paso 3: Ejecutar Migraciones

```bash
python manage.py migrate
```

### Paso 4: Crear Superusuario

```bash
python manage.py createsuperuser
# Username: admin
# Email: admin@test.com
# Password: TuPassword123!
```

### Paso 5: (OPCIONAL) Cargar Datos de Productos

Si quieres cargar los productos desde los JSON locales:

```bash
# Mirar la lista de comandos disponibles
python manage.py help

# Si tienes un comando personalizado para cargar productos:
python manage.py migrate_products_from_json
```

### Paso 6: Ejecutar el Servidor

```bash
python manage.py runserver

# Deberías ver:
# Starting development server at http://127.0.0.1:8000/
```

---

## 🐘 OPCIÓN 2: USAR PostgreSQL LOCAL (Si lo tienes instalado)

### Requisitos
- PostgreSQL 12+ instalado
- PostgreSQL corriendo (`pg_isready` debe responder que está OK)

### Paso 1: Crear Base de Datos

```bash
# En PowerShell o CMD
psql -U postgres

# Dentro de psql:
CREATE DATABASE tienda_vet_db;
\q
```

### Paso 2: Configurar .env

```env
# Database (Local)
DATABASE_URL_LOCAL=postgresql://postgres:SxD13052023@localhost:5432/tienda_vet_db

# ... rest de variables igual
```

### Paso 3: Migraciones + Datos

```bash
python manage.py migrate
python manage.py migrate_products_from_json
```

---

## 📋 TROUBLESHOOTING

### Error: "connection refused"
```
❌ PostgreSQL no está corriendo
✅ Solución: Inicia esql desde Services (Windows) o `brew services start postgresql` (Mac)
```

### Error: "cannot import name 'schedule_migration'"
```
❌ startup.py no tiene la función
✅ Solución: Ya está fijo en d:\...\productos\startup.py
```

### Error: "Cloudinary credentials not found"
```
❌ Variables de ambiente no configuradas
✅ Solución: Verifica que CLOUDINARY_CLOUD_NAME esté en .env
```

### Error: "Stripe webhook signature invalid"
```
❌ STRIPE_WEBHOOK_SECRET incorrecto
✅ Solución: Copia el valor correcto desde Stripe Dashboard
```

---

## 🌍 FLUJO RECOMMENDED (Para desarrollo)

```
┌─────────────────┐
│   Desarrollo    │
│   .env file     │
│ DATABASE_URL    │ ←─ Neon Database (Same as production)
│ (Neon)          │
│   STRIPE keys   │
│ CLOUDINARY keys │
└────────┬────────┘
         │
    ✅ dev.py lee .env
    ✅ Conecta a Neon
    ✅ Usa Cloudinary
    ✅ Usa Stripe test
         │
         ▼
┌─────────────────────────────┐
│  Backend running on 8000    │
│  ✅ DB: Neon               │
│  ✅ Files: Cloudinary      │
│  ✅ Payments: Stripe (test)│
└─────────────────────────────┘
```

---

## ✅ QUICK START

**Opción rápida si tienes Neon configurado:**

```bash
# 1. Copy .env.example a .env
copy .env.example .env

# 2. Editar .env con tus credenciales Neon/Stripe/Cloudinary

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Migraciones
python manage.py migrate

# 5. Crear admin
python manage.py createsuperuser

# 6. Run
python manage.py runserver
```

**🎉 Backend ready en http://127.0.0.1:8000/**

---

## 📞 REFERENCIA RÁPIDA

| Tarea | Comando |
|-------|---------|
| Migrations | `python manage.py migrate` |
| Crear superuser | `python manage.py createsuperuser` |
| Admin panel | `http://127.0.0.1:8000/admin/` |
| API docs | `http://127.0.0.1:8000/api/docs/` |
| Tests | `pytest -v` |
| Cargar productos | `python manage.py migrate_products_from_json` |

