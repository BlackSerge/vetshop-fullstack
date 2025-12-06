# 1. Usar una imagen base oficial de Python ligera
FROM python:3.10-slim

# 2. Evitar que Python genere archivos .pyc y logs en buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Establecer directorio de trabajo dentro del contenedor
WORKDIR /app

# 4. Instalar dependencias del sistema necesarias para Postgres
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 5. Copiar el archivo de requerimientos e instalar librerías
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn whitenoise # Asegurar servidores de prod

# 6. Copiar el resto del código del backend
COPY . /app/

# 7. Recolectar archivos estáticos (CSS del admin, etc)
# Nota: Usamos un dummy key porque en build no tenemos el .env real aún
RUN SECRET_KEY=dummy python manage.py collectstatic --no-input

# 8. Exponer el puerto (informativo)
EXPOSE 8000

# 9. Comando para arrancar el servidor (Gunicorn)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend.wsgi:application"]