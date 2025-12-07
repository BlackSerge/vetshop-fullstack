import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url
from datetime import timedelta
import cloudinary.api
import cloudinary.uploader
import cloudinary_storage

# Carga variables de entorno desde el archivo .env
load_dotenv()

# --- RUTAS BÁSICAS ---
BASE_DIR = Path(__file__).resolve().parent.parent

# --- SEGURIDAD Y ENTORNO ---
# Usamos os.getenv para leer del .env
SECRET_KEY = os.getenv('SECRET_KEY', 'dummy-key-for-build')

# DEBUG debe ser False en producción
DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = ["localhost", "127.0.0.1", ".onrender.com"]
RENDER_EXTERNAL_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME')


# --- APLICACIONES ---
INSTALLED_APPS = [
    # 3rd party apps (CORS, REST, Cloudinary)
    "corsheaders",
    "rest_framework",
    'rest_framework_simplejwt',
    "cloudinary_storage",
    "cloudinary",

    # Django apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Local apps
    "productos",
    "usuarios",
    "carrito",
    "pedidos",
]

# --- MIDDLEWARE ---
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",       # 1️⃣ Debe ser el primero
    "django.middleware.common.CommonMiddleware",    # 2️⃣ Justo después
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    'django.middleware.locale.LocaleMiddleware',
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# --- AUTENTICACIÓN PERSONALIZADA ---
AUTH_USER_MODEL = 'usuarios.CustomUser'
LOGIN_URL = '/cuentas/iniciar-sesion/'
LOGIN_REDIRECT_URL = '/cuentas/perfil/'
LOGOUT_REDIRECT_URL = '/'

# --- CONFIGURACIÓN DE CORS / CSRF ---
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://vetshop-fullstack.vercel.app", 
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "https://vetshop-fullstack.vercel.app",
]

CORS_ALLOW_CREDENTIALS = True

# Define explícitamente los encabezados permitidos para la solicitud.
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-cart-session', # <--- Encabezado personalizado
]

# Exponer el encabezado personalizado del carrito para que el frontend pueda leerlo de las respuestas.
CORS_EXPOSE_HEADERS = ['X-Cart-Session']


# --- URLS / TEMPLATES / WSGI ---
ROOT_URLCONF = "backend.urls"
WSGI_APPLICATION = "backend.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        'DIRS': [BASE_DIR / 'templates'], 
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                'django.template.context_processors.debug',
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# --- CONFIGURACIÓN DE BASE DE DATOS ---
DB_URL_FINAL = None

# 1. Intenta construir la DATABASE_URL usando variables separadas (para local)
db_host = os.environ.get('DB_HOST')
db_name = os.environ.get('DB_NAME')

if db_host and db_name:
    DB_URL_FINAL = 'postgres://{user}:{password}@{host}:{port}/{name}'.format(
        user=os.environ.get('DB_USER'),
        password=os.environ.get('DB_PASSWORD'),
        host=db_host,
        port=os.environ.get('DB_PORT', '5432'),
        name=db_name
    )

# 2. Definir la Configuración de Django
DATABASES = {
    'default': dj_database_url.config(
        # Usará DATABASE_URL (Render) o el fallback a SQLite (local sin DATABASE_URL)
        default=os.environ.get('DATABASE_URL', f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        env='DATABASE_URL',
        conn_max_age=600
    )
}

# 3. Sobreescribir la configuración si la URL local fue construida
if DB_URL_FINAL:
    DATABASES['default'] = dj_database_url.config(default=DB_URL_FINAL, conn_max_age=600)


# --- CONFIGURACIÓN DRF / RATE LIMITING ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,

    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
        'burst': '60/min',
    },
}

# --- JWT CONFIG ---
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
}

# --- VALIDADORES DE CONTRASEÑA ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
    {'NAME': 'usuarios.validators.ComplexPasswordValidator',},
]

# --- CONFIGURACIÓN DE CORREO ELECTRÓNICO ---
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'sergiosaborit99@gmail.com'
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', 'dummy-email-password')
DEFAULT_FROM_EMAIL = 'VetShop <no-reply@vetshop.com>'

# --- STRIPE ---
STRIPE_PUBLIC_KEY = os.getenv('STRIPE_PUBLIC_KEY', 'pk_test_dummy')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', 'sk_test_dummy')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', 'whsec_dummy')

# --- CONFIGURACIÓN DE LOCALIZACIÓN ---
LANGUAGE_CODE = "en"
TIME_ZONE = "America/Havana"
USE_I18N = True
USE_TZ = True

# --- CONFIGURACIÓN DE CLOUDINARY Y ARCHIVOS ---
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ----------------------------------------
# ⚠️ LÓGICA DE PRODUCCIÓN CRÍTICA (RENDER/CLOUDINARY)
# ----------------------------------------

# Detecta si estamos en Render (o si se ha configurado Cloudinary)
if os.getenv('CLOUDINARY_CLOUD_NAME'):
    
    # 1. Configuración de Hosting
    # Si Render está presente, añádelo a ALLOWED_HOSTS
    if RENDER_EXTERNAL_HOSTNAME:
        ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

    # 2. Configuración de Seguridad SSL (Importante para Render)
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    USE_X_FORWARDED_HOST = True
    
    # 3. Lectura de Credenciales de Cloudinary (para el ORM/Storage)
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')
    
    # 4. ¡CRÍTICO! Activa el Almacenamiento en Cloudinary para MEDIA files
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    
    # 5. Configuración de Whitenoise (Archivos Estáticos)
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'