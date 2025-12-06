# 1. Imagen base
FROM python:3.10-slim

# 2. Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Directorio de trabajo en el contenedor
WORKDIR /app

# 4. Dependencias del sistema
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 5. Copiar requirements desde la subcarpeta y instalar
# OJO: Esto asume que el contexto de Docker es la RAÍZ del repo
COPY tienda-veterinaria-backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn whitenoise

# 6. Copiar todo el código del backend
COPY tienda-veterinaria-backend/ /app/

# 7. Recolectar estáticos
RUN SECRET_KEY=dummy python manage.py collectstatic --no-input

# 8. Puerto y Comando
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend.wsgi:application"]