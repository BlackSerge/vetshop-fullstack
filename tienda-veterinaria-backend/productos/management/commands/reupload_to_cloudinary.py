from django.core.management.base import BaseCommand
from cloudinary.uploader import upload
from productos.models import ImagenProducto
import os

class Command(BaseCommand):
    help = "Sube todas las imágenes de productos a Cloudinary y actualiza sus URLs"

    def handle(self, *args, **kwargs):
        imagenes = ImagenProducto.objects.all()
        total = imagenes.count()
        self.stdout.write(f"Encontradas {total} imágenes. Iniciando migración...")

        for img in imagenes:
            if not img.imagen:
                continue

            try:
                # Ruta local absoluta
                local_path = img.imagen.path

                if not os.path.exists(local_path):
                    self.stdout.write(f"Archivo no encontrado: {local_path}")
                    continue

                # Subir a Cloudinary
                result = upload(local_path, folder="productos")

                # Guardar la nueva URL en el campo imagen
                
                img.imagen = result["secure_url"]
                img.save(update_fields=['imagen'])

                self.stdout.write(f"[{img.id}] Subido y actualizado: {img.imagen}")

            except Exception as e:
                self.stdout.write(f"[{img.id}] Error: {e}")

