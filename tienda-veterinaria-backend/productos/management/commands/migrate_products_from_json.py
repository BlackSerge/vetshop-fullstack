from django.core.management.base import BaseCommand
import json
from pathlib import Path
from django.utils.text import slugify
from productos.models import Producto, Categoria, ImagenProducto
from django.conf import settings

class Command(BaseCommand):
    help = 'Migra productos desde archivos JSON locales'

    def handle(self, *args, **options):
    
        data_dir = Path(settings.BASE_DIR) / 'backend' / 'data' / 'products_db'
        
        if not data_dir.exists():
            self.stdout.write(self.style.ERROR(f'Directorio no encontrado: {data_dir}'))
            return

        json_files = list(data_dir.glob('*.json'))
        if not json_files:
            self.stdout.write(self.style.ERROR('No se encontraron archivos JSON en data/products_db'))
            return

        todos_file = data_dir / 'productos_todos.json'
        files_to_process = [todos_file] if todos_file.exists() else json_files

        for json_file in files_to_process:
            self.stdout.write(f'Procesando {json_file.name}...')
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    products_list = []
                    if isinstance(data, dict) and 'results' in data:
                        products_list = data['results']
                    elif isinstance(data, list):
                        products_list = data
                    else:
                        self.stdout.write(self.style.WARNING(f'Formato inesperado en {json_file.name}'))
                        continue

                    for item in products_list:
                        self.process_product(item)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error procesando {json_file.name}: {e}'))

        self.stdout.write(self.style.SUCCESS('✅ Migración completada con éxito'))

    def process_product(self, item):
        try:
           
            cat_data = item.get('categoria_info')
            categoria = None
            if cat_data:
                categoria, _ = Categoria.objects.get_or_create(
                    slug=cat_data.get('slug') or slugify(cat_data.get('nombre')),
                    defaults={
                        'nombre': cat_data.get('nombre'),
                        'is_active': cat_data.get('is_active', True),
                        'descripcion': cat_data.get('descripcion', '')
                    }
                )

            sku = item.get('sku')
            if not sku:
                sku = f"GEN-{slugify(item.get('nombre'))[:10].upper()}"

            producto, created = Producto.objects.update_or_create(
                sku=sku,
                defaults={
                    'nombre': item.get('nombre'),
                    'slug': item.get('slug') or slugify(item.get('nombre')),
                    'descripcion_corta': item.get('descripcion_corta', ''),
                    'descripcion_larga': item.get('descripcion_larga', ''),
                    'precio': item.get('precio', '0.00'),
                    'precio_oferta': item.get('precio_oferta'),
                    'stock': item.get('stock', 0),
                    'is_active': item.get('is_active', True),
                    'is_featured': item.get('is_featured', False),
                    'marca': item.get('marca'),
                    'tipo_mascota': item.get('tipo_mascota', 'otros'),
                    'categoria': categoria
                }
            )

            status = "Creado" if created else "Actualizado"
            self.stdout.write(f'  - [{status}] Product: {producto.nombre} (SKU: {sku})')

            if item.get('imagenes') and created:
                for img_data in item.get('imagenes'):
                  
                    pass

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error al procesar producto {item.get("nombre")}: {e}'))
