import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

@pytest.mark.django_db # Permite acceso a la base de datos de prueba
def test_create_user():
    """Prueba que se puede crear un usuario básico"""
    user = User.objects.create_user(username='testuser', password='password123')
    assert user.username == 'testuser'
    assert user.check_password('password123') is True
    assert user.is_staff is False

@pytest.mark.django_db
def test_registration_api():
    """Prueba el endpoint de registro de la API"""
    client = APIClient()
    data = {
        'username': 'newuser',
        'email': 'new@example.com',
        'password': 'StrongPassword123!',
        'password2': 'StrongPassword123!'
    }
    response = client.post('/api/cuentas/registro/', data)
    
    assert response.status_code == status.HTTP_201_CREATED
    assert User.objects.count() == 1
    assert User.objects.get().username == 'newuser'