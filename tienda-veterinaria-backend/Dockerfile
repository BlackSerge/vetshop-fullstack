FROM python:3.10-slim


ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1


ENV DJANGO_SETTINGS_MODULE=backend.settings.prod


WORKDIR /app


RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn whitenoise

COPY . /app/

EXPOSE 8000

CMD sh -c "python manage.py collectstatic --no-input && python manage.py migrate && gunicorn --bind 0.0.0.0:8000 backend.wsgi:application"