# backend/settings/dev.py
from .base import *
import dj_database_url

# --- DESARROLLO ---
DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "*"] # Permisivo para pruebas

# Base de Datos Local (SQLite por defecto o Postgres si tienes .env)
# Si tienes DATABASE_URL en tu .env local, usará esa. Si no, SQLite.
DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600
    )
}

# CORS Local
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
# Para facilitar desarrollo en red local con móviles:
CORS_ALLOW_ALL_ORIGINS = True 

# Email en Consola (Opcional, para no gastar Gmail)
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'