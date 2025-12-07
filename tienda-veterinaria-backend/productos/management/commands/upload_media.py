import os
import time
import cloudinary.uploader
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection # Importar conexión
from productos.models import ImagenProducto

class Command(BaseCommand):
    help = 'Sube imágenes locales a Cloudinary (Versión Robusta)'

    def handle(self, *args, **options):
        self.stdout.write("Iniciando migración robusta...")
        LOCAL_MEDIA_ROOT = os.path.join(settings.BASE_DIR, 'media')
        
        # Obtenemos solo los IDs para no mantener el cursor abierto
        ids = list(ImagenProducto.objects.values_list('id', flat=True))
        total = len(ids)
        count = 0

        for img_id in ids:
            # Cerrar conexión vieja para forzar reconexión si se cayó
            connection.close()
            
            try:
                img_obj = ImagenProducto.objects.get(id=img_id)
                name = str(img_obj.imagen)

                if not name or name.startswith('http') or 'cloudinary' in str(img_obj.imagen.storage):
                    self.stdout.write(f"Saltando {img_id} (listo)")
                    continue

                local_path = os.path.join(LOCAL_MEDIA_ROOT, name)
                if not os.path.exists(local_path):
                    # Intento alternativo (solo nombre)
                    filename = os.path.basename(name)
                    local_path = os.path.join(LOCAL_MEDIA_ROOT, 'productos', filename)
                    if not os.path.exists(local_path):
                        self.stdout.write(self.style.WARNING(f"Archivo no encontrado: {name}"))
                        continue

                self.stdout.write(f"Subiendo {img_id}: {name}...")
                
                # Subir
                upload_data = cloudinary.uploader.upload(
                    local_path, folder="productos", overwrite=True, use_filename=True, unique_filename=False
                )

                # Guardar
                img_obj.imagen.name = upload_data['public_id'] + '.' + upload_data['format']
                img_obj.save()
                
                count += 1
                self.stdout.write(self.style.SUCCESS("OK"))

                # Pausa pequeña para no saturar
                time.sleep(0.5) 

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error en {img_id}: {e}"))

        self.stdout.write(f"Terminado. {count}/{total} subidas.")