# Dockerfile (dentro de tienda-veterinaria-backend)

FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements.txt (ahora en la subcarpeta)
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn whitenoise

# Copia todo el contenido de la subcarpeta (incluyendo start_server.sh, settings.py, data.json)
COPY . /app/

# Otorga permisos al script
RUN chmod +x start_server.sh

EXPOSE 8000

# Usaremos el Start Command de Render, pero mantenemos este CMD como fallback
CMD gunicorn --bind 0.0.0.0:8000 backend.wsgi:application