
import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url


load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# SECURITY / DEBUG
# ----------------------------------------
# --- SEGURIDAD ---
# Usamos os.getenv para leer del .env
SECRET_KEY = os.getenv('SECRET_KEY', 'dummy-key-for-build')

# DEBUG debe ser False en producción, pero True en local
DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = ["localhost", "127.0.0.1", ".onrender.com","192.168.75.8"] # Añadiremos render luego



MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


AUTH_USER_MODEL = 'usuarios.CustomUser' # <-- Esta línea es CRUCIAL!


# ----------------------------------------
# CORS CONFIG
# ----------------------------------------
INSTALLED_APPS = [
    "corsheaders",                # Cargar antes que django.contrib.auth, etc.
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    'rest_framework_simplejwt',
    "productos",
    "usuarios",
    "carrito",
    "pedidos",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",        # 1️⃣ Debe ser el primero
    "django.middleware.common.CommonMiddleware",    # 2️⃣ Justo después del CorsMiddleware
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    'django.middleware.locale.LocaleMiddleware',
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

FRONTEND_URL = os.getenv('FRONTEND_URL')

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

if FRONTEND_URL:
    CORS_ALLOWED_ORIGINS.append(FRONTEND_URL)
    CSRF_TRUSTED_ORIGINS.append(FRONTEND_URL)

CORS_ALLOW_CREDENTIALS = True

# --- CORRECCIÓN CRÍTICA: Eliminar CORS_ALLOW_ALL_HEADERS y usar CORS_ALLOW_HEADERS explícitamente ---
# El error indica que 'CORS_ALLOW_ALL_HEADERS = True' no está funcionando como se esperaba para 'x-cart-session'.
# La solución es ser explícito con los encabezados permitidos en las solicitudes (Request Headers).
# Comentamos/eliminamos CORS_ALLOW_ALL_HEADERS para evitar conflictos.
# CORS_ALLOW_ALL_HEADERS = True # <--- ¡COMENTADO O ELIMINADO!

# Definir explícitamente los encabezados que el frontend PUEDE ENVIAR en las solicitudes.
# Esto incluye encabezados estándar y tus encabezados personalizados.
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',        # Necesario para el token JWT
    'content-type',         # Necesario para enviar JSON
    'dnt',                  # Do Not Track header
    'origin',               # Origen de la solicitud
    'user-agent',
    'x-csrftoken',          # Token CSRF de Django (usado por SessionAuthentication, aunque JWT no lo requiere tanto)
    'x-requested-with',
    'x-cart-session',       # <--- ¡TU ENCABEZADO PERSONALIZADO PARA EL CARRITO!
]
# --- FIN CORRECCIÓN CRÍTICA ---

# Exponer el encabezado personalizado del carrito para que el frontend pueda leerlo de las respuestas.
CORS_EXPOSE_HEADERS = ['X-Cart-Session'] # <--- Ya lo habías añadido, es correcto.




LOGIN_URL = '/cuentas/iniciar-sesion/' # URL a la que redirigir si se requiere login
LOGIN_REDIRECT_URL = '/cuentas/perfil/' # URL a la que redirigir después de iniciar sesión exitosamente
LOGOUT_REDIRECT_URL = '/' # URL a la que redirigir después de cerrar sesión (o '/cuentas/iniciar-sesion/')

# ----------------------------------------
# URLS / TEMPLATES / WSGI
# ----------------------------------------
ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        'DIRS': [BASE_DIR / 'templates'], 
        "APP_DIRS": True, # Esto es clave para encontrar las plantillas de 'usuarios'
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



WSGI_APPLICATION = "backend.wsgi.application"

# ----------------------------------------
# DATABASE
# ----------------------------------------
DATABASES = {
    'default': dj_database_url.config(
        # En local usa SQLite si no hay variable DATABASE_URL
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}", 
        conn_max_age=600
    )
}

# --- Configuración de Django REST Framework (DRF) ---
REST_FRAMEWORK = {
'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,

    # --- NUEVO: RATE LIMITING ---
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle', # Para no logueados
        'rest_framework.throttling.UserRateThrottle'  # Para logueados
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',   # 100 peticiones al día para anónimos
        'user': '1000/day',  # 1000 peticiones al día para usuarios
        'burst': '60/min',   # (Opcional) Límite de ráfaga
    },
    # --- FIN RATE LIMITING ---
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12, # Asegúrate que esto coincida con tu frontend (actualmente 12)
}


# ----------------------------------------
# LANGUAGE / TIMEZONE
# ----------------------------------------
LANGUAGE_CODE = "en"
TIME_ZONE = "America/Havana"
USE_I18N = True
USE_TZ = True

# ----------------------------------------
# STATIC FILES
# ----------------------------------------
STATIC_URL = "static/"

# ----------------------------------------
# DEFAULT PRIMARY KEY
# ----------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# --- Configuración de Correo Electrónico ---
# Para desarrollo: Mostrar correos en la consola
#EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# Para producción (ejemplo con SendGrid o un SMTP genérico):
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'sergiosaborit99@gmail.com'
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', 'dummy-email-password')
DEFAULT_FROM_EMAIL = 'VetShop <no-reply@vetshop.com>'



from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',

    'JTI_CLAIM': 'jti',

    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),

}

STRIPE_PUBLIC_KEY = os.getenv('STRIPE_PUBLIC_KEY', 'pk_test_dummy')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', 'sk_test_dummy')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', 'whsec_dummy')



AUTH_PASSWORD_VALIDATORS = [
    {
        # Evita contraseñas parecidas al usuario (ej: usuario "sergio", pass "sergio123")
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },

    {
        # Evita contraseñas comunes ("123456", "password")
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        # Evita contraseñas numéricas puras ("123456789")
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'usuarios.validators.ComplexPasswordValidator',
    },
]

