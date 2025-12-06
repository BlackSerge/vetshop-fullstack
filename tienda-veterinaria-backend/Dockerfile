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

# CAMBIO AQUÍ: Añadimos DATABASE_URL dummy
RUN SECRET_KEY=dummy DATABASE_URL=sqlite:///dummy.db python manage.py collectstatic --no-input

EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend.wsgi:application"]