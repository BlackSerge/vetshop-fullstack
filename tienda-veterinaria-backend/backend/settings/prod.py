from .base import *
import dj_database_url
import cloudinary
import cloudinary.uploader
import cloudinary.api

# --- PRODUCCIÓN ---
DEBUG = False

# Hosts permitidos (Render)
RENDER_EXTERNAL_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME')
ALLOWED_HOSTS = []
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Base de Datos
DATABASES = {
    'default': dj_database_url.config(conn_max_age=600, ssl_require=True)
}

# CORS Estricto (Tu dominio de Vercel)
CORS_ALLOWED_ORIGINS = [
    "https://vetshop-fullstack.vercel.app", 
    "https://tu-otro-dominio.vercel.app" # Añade otros si tienes
]
CSRF_TRUSTED_ORIGINS = [
    "https://vetshop-fullstack.vercel.app",
]

# --- CLOUDINARY CONFIG ---
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
}

# Configurar librería cloudinary globalmente
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True
)

# Motor de almacenamiento por defecto
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# URL Base para medios (Opcional, el storage suele manejarlo, pero esto ayuda a debug)
# MEDIA_URL = '/media/'  <-- NO USAR ESTO EN CLOUDINARY

# --- WHITENOISE (Archivos estáticos CSS/JS) ---
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Seguridad SSL
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True