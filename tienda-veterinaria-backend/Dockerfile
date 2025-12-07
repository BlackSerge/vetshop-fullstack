# tienda-veterinaria-backend/Dockerfile

# 1. Imagen base
FROM python:3.10-slim

# 2. Variables de entorno básicas
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# --- NUEVO: Forzar uso de settings de producción en Docker ---
ENV DJANGO_SETTINGS_MODULE=backend.settings.prod

# 3. Directorio de trabajo
WORKDIR /app

# 4. Dependencias del sistema
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 5. Instalar librerías Python
# Asumiendo que el contexto de build es la carpeta 'tienda-veterinaria-backend'
# Si tu contexto es la raíz del repo, cambia a COPY tienda-veterinaria-backend/requirements.txt /app/
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn whitenoise

# 6. Copiar código fuente
COPY . /app/

# 7. Exponer puerto
EXPOSE 8000

# 8. Comando de inicio (Migrar, Estáticos, Gunicorn)
# Usamos sh -c para encadenar comandos de forma segura
CMD sh -c "python manage.py collectstatic --no-input && python manage.py migrate && gunicorn --bind 0.0.0.0:8000 backend.wsgi:application"