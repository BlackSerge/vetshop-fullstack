import json
import os
from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify
from productos.models import Categoria, Producto, ImagenProducto
from django.conf import settings # Para acceder a MEDIA_ROOT
import uuid # Para generar SKUs si no se proporcionan
import datetime # Para fechas de creación/actualización ficticias
from decimal import Decimal # Para manejar los precios

class Command(BaseCommand):
    help = 'Carga categorías, productos e imágenes desde archivos JSON de ejemplo.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Elimina todos los productos, categorías e imágenes existentes antes de cargar.'
        )

    def handle(self, *args, **kwargs):
        # 1. Definir la ruta a los archivos JSON
        # Ajusta esta ruta si tu carpeta 'data' está en otro lugar
        folder_path = os.path.join(settings.BASE_DIR, 'backend', 'data', 'products_db')
        
        if not os.path.exists(folder_path):
            raise CommandError(f"La carpeta '{folder_path}' no existe. Asegúrate de que tus JSON estén ahí.")

        json_files = [f for f in os.listdir(folder_path) if f.startswith('productos_') and f.endswith('.json')]
        
        if not json_files:
            self.stdout.write(self.style.WARNING(f"No se encontraron archivos JSON de productos en '{folder_path}'."))
            return

        self.stdout.write(self.style.SUCCESS(f"Archivos JSON de productos encontrados en '{folder_path}': {json_files}"))

        # 2. (Opcional) Limpiar datos existentes
        if kwargs['clear']:
            self.stdout.write(self.style.WARNING('Eliminando todas las ImagenProducto existentes...'))
            ImagenProducto.objects.all().delete()
            self.stdout.write(self.style.WARNING('Eliminando todos los Producto existentes...'))
            Producto.objects.all().delete()
            self.stdout.write(self.style.WARNING('Eliminando todas las Categoria existentes...'))
            Categoria.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Datos de productos, categorías e imágenes eliminados.'))
        
        # Necesitamos una lista para almacenar todos los productos de todos los JSON
        all_products_data = []

        # Cargar todos los productos de todos los archivos JSON (excepto el de 'todos')
        for filename in json_files:
            if filename == 'productos_todos.json': # El archivo 'todos' es un resumen, lo podemos ignorar
                continue
            
            file_path = os.path.join(folder_path, filename)
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'results' in data and isinstance(data['results'], list):
                    all_products_data.extend(data['results'])
                else:
                    self.stdout.write(self.style.WARNING(f"El archivo '{filename}' no contiene una lista 'results' válida."))

        if not all_products_data:
            self.stdout.write(self.style.WARNING('No se encontraron productos válidos para cargar después de procesar los JSON.'))
            return

        # 3. Crear o actualizar categorías
        # Primero recopilamos todas las categorías únicas de los productos
        unique_categories = {}
        for item in all_products_data:
            if 'categoria_info' in item and item['categoria_info']:
                cat_info = item['categoria_info']
                unique_categories[cat_info['id']] = cat_info # Usamos el ID como clave

        created_categories_count = 0
        updated_categories_count = 0

        for cat_id, cat_info in unique_categories.items():
            categoria, created = Categoria.objects.update_or_create(
                id=cat_info['id'], # Usamos el ID del JSON para mantener consistencia
                defaults={
                    'nombre': cat_info['nombre'],
                    'slug': cat_info['slug'],
                    'descripcion': cat_info.get('descripcion', ''),
                    'is_active': cat_info.get('is_active', True),
                    # parent no se define aquí para simplicidad, si lo necesitaras, tendrías que manejar la dependencia
                }
            )
            if created:
                created_categories_count += 1
                self.stdout.write(self.style.SUCCESS(f'Categoría creada: {categoria.nombre}'))
            else:
                updated_categories_count += 1
                self.stdout.write(self.style.WARNING(f'Categoría actualizada: {categoria.nombre}'))
        
        self.stdout.write(self.style.SUCCESS(f'Categorías procesadas: {created_categories_count} creadas, {updated_categories_count} actualizadas.'))


        # 4. Crear o actualizar productos e imágenes
        created_products_count = 0
        updated_products_count = 0
        created_images_count = 0

        for item in all_products_data:
            # Intentar obtener la instancia de categoría si existe
            categoria_instance = None
            if 'categoria' in item and item['categoria'] is not None:
                try:
                    categoria_instance = Categoria.objects.get(id=item['categoria'])
                except Categoria.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"Error: Categoría con ID {item['categoria']} no encontrada para el producto {item['nombre']}. Producto omitido."))
                    continue # O manejar de otra forma si la categoría es obligatoria

            producto, created = Producto.objects.update_or_create(
                slug=item['slug'], # Usamos el slug como identificador único para update_or_create
                defaults={
                    'nombre': item['nombre'],
                    'descripcion_corta': item.get('descripcion_corta', ''),
                    'descripcion_larga': item.get('descripcion_larga', ''),
                    'precio': Decimal(str(item['precio'])), # Convertir a Decimal
                    'precio_oferta': Decimal(str(item['precio_oferta'])) if item.get('precio_oferta') else None,
                    'categoria': categoria_instance,
                    'sku': item.get('sku', str(uuid.uuid4().hex)[:10].upper()),
                    'stock': item.get('stock', 0),
                    'is_active': item.get('is_active', True),
                    'is_featured': item.get('is_featured', False),
                    'created_at': item.get('created_at', datetime.datetime.now(datetime.timezone.utc)),
                    'updated_at': item.get('updated_at', datetime.datetime.now(datetime.timezone.utc)),
                    'marca': item.get('marca', None), 
                    'tipo_mascota': item.get('tipo_mascota', None),
                }
            )

            if created:
                created_products_count += 1
                self.stdout.write(self.style.SUCCESS(f'Producto creado: {producto.nombre}'))
            else:
                updated_products_count += 1
                self.stdout.write(self.style.WARNING(f'Producto actualizado: {producto.nombre}'))
            
            # Limpiar imágenes antiguas si se está actualizando (opcional, para evitar duplicados si se recarga)
            if not created:
                ImagenProducto.objects.filter(producto=producto).delete()


        # Crear o actualizar imágenes asociadas al producto
        if 'imagenes' in item and isinstance(item['imagenes'], list):
            for img_data in item['imagenes']:
                # Nota: Aquí solo creamos nuevas imágenes, no las actualizamos por su id porque no tiene sentido
                # para datos ficticios. En un caso real, la imagen se sube y se crea una nueva entrada.
                # Aquí simulamos la existencia de la imagen con la URL.
                # --- CAMBIO AQUÍ ---
                imagen = ImagenProducto.objects.create( # <--- Asigna a una sola variable
                    producto=producto,
                    imagen=img_data['imagen'],
                    alt_text=img_data.get('alt_text', ''),
                    is_feature=img_data.get('is_feature', False),
                    order=img_data.get('order', 0)
                )
                # img_created ya no es necesaria aquí.
                # --- FIN CAMBIO ---
                created_images_count += 1
                self.stdout.write(self.style.SUCCESS(f'  Imagen para {producto.nombre} creada: {imagen.imagen}'))
        
        self.stdout.write(self.style.SUCCESS(f'Productos procesados: {created_products_count} creados, {updated_products_count} actualizados.'))
        self.stdout.write(self.style.SUCCESS(f'Total de imágenes creadas: {created_images_count}.'))
        self.stdout.write(self.style.SUCCESS('Todos los datos de ejemplo han sido cargados/actualizados correctamente.'))
