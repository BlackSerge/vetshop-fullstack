import os
from django.core.management.base import BaseCommand
from productos.models import ImagenProducto
from cloudinary.uploader import upload
from django.core.files.base import ContentFile
import requests

class Command(BaseCommand):
    help = "Migra imágenes existentes a Cloudinary"

    def handle(self, *args, **kwargs):
        imagenes = ImagenProducto.objects.all()
        total = imagenes.count()
        self.stdout.write(f"Migrando {total} imágenes a Cloudinary...")

        for img in imagenes:
            try:
                old_url = img.imagen.url
                
                # Solo migrar si la URL proviene de Render
                if "render" not in old_url:
                    self.stdout.write(f"Saltando {old_url} (ya está en Cloudinary)")
                    continue

                # Descargar la imagen antigua
                response = requests.get(old_url)
                if response.status_code != 200:
                    self.stdout.write(self.style.ERROR(f"Error descargando {old_url}"))
                    continue

                imagen_bytes = ContentFile(response.content)

                # Subir a Cloudinary
                upload_result = upload(
                    imagen_bytes,
                    folder="productos/",
                    public_id=f"{img.producto.id}_{img.id}",
                    overwrite=True
                )

                new_url = upload_result.get("secure_url")

                # Guardar en el modelo
                img.imagen = new_url
                img.save()

                self.stdout.write(self.style.SUCCESS(f"Migrada: {new_url}"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error migrando imagen {img.id}: {e}"))

        self.stdout.write(self.style.SUCCESS("Migración completada."))
