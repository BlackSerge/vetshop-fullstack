FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY tienda-veterinaria-backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn whitenoise

COPY tienda-veterinaria-backend/ /app/

# ⚠️ IMPORTANTE: NO HAY LÍNEA 'RUN ... collectstatic' AQUÍ. LA HE BORRADO.

EXPOSE 8000

# El comando final hace todo: estáticos, migraciones y servidor
CMD sh -c "python manage.py collectstatic --no-input && python manage.py migrate && gunicorn --bind 0.0.0.0:8000 backend.wsgi:application"