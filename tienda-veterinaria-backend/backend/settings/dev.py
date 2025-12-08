# backend/settings/dev.py
from .base import *
import dj_database_url
import os

DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "*"]

DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv("DATABASE_URL_LOCAL", f"postgres://postgres:SxD13052023@localhost:5432/tienda_vet_db"),
        conn_max_age=600,
        ssl_require=False
    )
}

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
}

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_ALL_ORIGINS = True
