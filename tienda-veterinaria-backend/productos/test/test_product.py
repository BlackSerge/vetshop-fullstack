import pytest
from productos.models import Producto, Categoria
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_product_list_api():
    cat = Categoria.objects.create(nombre="Perros", slug="perros")
    Producto.objects.create(nombre="Comida", precio=10.00, stock=5, categoria=cat)
    
    client = APIClient()
    response = client.get('/api/productos/items/')
    

    assert response.status_code == 200
    assert len(response.data['results']) == 1
    assert response.data['results'][0]['nombre'] == "Comida"