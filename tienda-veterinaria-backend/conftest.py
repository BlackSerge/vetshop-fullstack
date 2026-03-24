"""
conftest.py

Configuración global de pytest para todos los tests.
Define fixtures compartidas y configuración de Django.
"""

import os
import django
from django.conf import settings

# Configurar Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings.dev")
django.setup()

import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture(scope="session")
def django_db_setup():
    """Configuración de base de datos para tests."""
    settings.DATABASES["default"] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Permite acceso a DB para todos los tests marcar con @pytest.mark.django_db."""
    pass


@pytest.fixture
def clear_cache():
    """Limpia cache entre tests si es necesario."""
    from django.core.cache import cache

    cache.clear()
    yield
    cache.clear()
