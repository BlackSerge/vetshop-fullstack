
import os
import django
from django.conf import settings


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings.dev")
django.setup()

import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture(scope="session")
def django_db_setup():
    settings.DATABASES["default"] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    pass


@pytest.fixture
def clear_cache():
    from django.core.cache import cache

    cache.clear()
    yield
    cache.clear()
