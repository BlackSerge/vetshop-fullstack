# start_server.sh
#!/bin/bash

# 1. Aplicar migraciones: Crea las tablas vacías en la DB de Neon
python manage.py migrate --noinput

# 2. Cargar datos: SOLO si el archivo de datos existe (se ejecuta una sola vez)
if [ -f data_inicial_produccion.json ]; then
    echo "Cargando datos iniciales..."
    python manage.py loaddata data_inicial_produccion.json
    
    # Mover el archivo para evitar una recarga en futuros despliegues
    mv data_inicial_produccion.json data_cargada_FINAL.json
fi

# 3. Iniciar el servidor Gunicorn
echo "Iniciando servidor Gunicorn..."
gunicorn backend.wsgi:application
