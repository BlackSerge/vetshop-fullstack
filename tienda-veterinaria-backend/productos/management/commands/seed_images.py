# backend/productos/management/commands/seed_images.py
import os
import random
from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings
from productos.models import Producto, ImagenProducto

class Command(BaseCommand):
    help = 'Asigna imágenes aleatorias de la carpeta media/seed_images a los productos sin foto'

    def handle(self, *args, **options):
        # 1. Buscar las imágenes fuente
        seed_dir = os.path.join(settings.MEDIA_ROOT, 'seed_images')
        
        if not os.path.exists(seed_dir):
            self.stdout.write(self.style.ERROR(f"No existe la carpeta: {seed_dir}"))
            return

        image_files = [f for f in os.listdir(seed_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]

        if not image_files:
            self.stdout.write(self.style.ERROR("No hay imágenes en la carpeta seed_images."))
            return

        self.stdout.write(f"Encontradas {len(image_files)} imágenes para repartir.")

        # 2. Buscar productos SIN imágenes
        productos = Producto.objects.all()
        count = 0

        for producto in productos:
            # Verificar si ya tiene imágenes
            if producto.imagenes.exists():
                continue # Saltar si ya tiene

            # Elegir una imagen al azar
            random_image_name = random.choice(image_files)
            source_path = os.path.join(seed_dir, random_image_name)

            # Crear la imagen
            with open(source_path, 'rb') as f:
                img_obj = ImagenProducto(
                    producto=producto,
                    is_feature=True, # La marcamos como principal
                    order=0
                )
                # Guardar el archivo duplicándolo en la carpeta correcta de productos
                img_obj.imagen.save(f"auto_{producto.sku}_{random_image_name}", File(f), save=True)
            
            count += 1
            self.stdout.write(f"Foto asignada a: {producto.nombre}")

        self.stdout.write(self.style.SUCCESS(f"¡Listo! Se asignaron imágenes a {count} productos."))