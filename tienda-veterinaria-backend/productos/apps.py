# backend/productos/apps.py
from django.apps import AppConfig

class ProductosConfig(AppConfig):
    name = 'productos'
    verbose_name = "Productos"

    def ready(self):
        # Cargar el scheduler para ejecutar la migracion en background
        try:
            from .startup import schedule_migration
            schedule_migration(delay_seconds=10)
        except Exception as e:
            # No queremos que un error aquí impida el arranque
            print("No se pudo iniciar la tarea automática de migración:", e)
