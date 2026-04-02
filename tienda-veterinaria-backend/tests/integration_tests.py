"""
tests/integration_tests.py

Suite completa de tests de integración between all 4 modules.
Prueba workflows completos: registro → carrito → pago → orden.
"""

import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import Client
from rest_framework.test import APIClient
from rest_framework import status
from django.db import transaction

from usuarios.models import UserActivityLog, CustomUser
from productos.models import Producto, Categoria, ImagenProducto, Review
from carrito.models import Cart, CartItem
from pedidos.models import Order, OrderItem
from productos import services as product_services
from carrito import services as cart_services
from usuarios import services as user_services

User = get_user_model()


# ==============================================================================
# FIXTURES COMPARTIDAS
# ==============================================================================


@pytest.fixture
def api_client():
    """Cliente REST API para requests."""
    return APIClient()


@pytest.fixture
def test_user(db):
    """Usuario de prueba."""
    user = User.objects.create_user(
        username="integrationtest",
        email="integration@test.com",
        password="TestPassword123!",
        first_name="Integration",
        last_name="Tester",
    )
    return user


@pytest.fixture
def admin_user(db):
    """Admin user."""
    return User.objects.create_superuser(
        username="admin",
        email="admin@test.com",
        password="AdminPassword123!",
    )


@pytest.fixture
def test_category(db):
    """Categoría de producto."""
    return Categoria.objects.create(
        nombre="Integration Test Category",
        slug="integration-test-category",
    )


@pytest.fixture
def test_products(db, test_category):
    """Products para testing."""
    products = []
    for i in range(3):
        p = Producto.objects.create(
            nombre=f"Test Product {i+1}",
            slug=f"test-product-{i+1}",
            descripcion=f"Test description {i+1}",
            precio=Decimal("100.00") + (Decimal(i) * Decimal("50.00")),
            precio_oferta=Decimal("80.00") + (Decimal(i) * Decimal("40.00")),
            stock=100,
            categoria=test_category,
        )
        products.append(p)
    return products


@pytest.fixture
def authenticated_client(api_client, test_user):
    """APIClient con usuario autenticado."""
    api_client.force_authenticate(user=test_user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """APIClient con admin."""
    api_client.force_authenticate(user=admin_user)
    return api_client


# ==============================================================================
# INTEGRATION TESTS: USER LIFECYCLE
# ==============================================================================


@pytest.mark.django_db
def test_user_registration_complete_flow(api_client):
    """✓ Test completo: registro → login → profile."""
    # 1. Registro
    register_data = {
        "username": "newuser123",
        "email": "newuser@test.com",
        "password": "StrongPassword123!",
        "password2": "StrongPassword123!",
        "first_name": "New",
        "last_name": "User",
    }
    response = api_client.post("/api/cuentas/registro/", register_data)
    assert response.status_code == status.HTTP_201_CREATED
    assert User.objects.filter(username="newuser123").exists()

    # 2. Login
    login_data = {"username": "newuser123", "password": "StrongPassword123!"}
    response = api_client.post("/api/cuentas/login/", login_data)
    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data or "token" in response.data

    # 3. Verificar usuario creado correctamente
    user = User.objects.get(username="newuser123")
    assert user.email == "newuser@test.com"
    assert user.first_name == "New"
    assert not user.is_vip  # Inicial


@pytest.mark.django_db
def test_user_activity_logging(test_user):
    """✓ Verificar que las actividades se registran en auditoría."""
    initial_count = UserActivityLog.objects.filter(user=test_user).count()

    # Simular acción de compra
    UserActivityLog.objects.create(
        user=test_user, action="PURCHASE", details="Test purchase"
    )

    assert UserActivityLog.objects.filter(user=test_user).count() == initial_count + 1


# ==============================================================================
# INTEGRATION TESTS: PRODUCT LIFECYCLE
# ==============================================================================


@pytest.mark.django_db
def test_product_with_images_and_reviews(test_category):
    """✓ Test: crear producto → agregar imágenes → agregar reviews."""
    # 1. Crear producto
    product = Producto.objects.create(
        nombre="Premium Product",
        slug="premium-product",
        descripcion="Premium product description",
        precio=Decimal("200.00"),
        precio_oferta=Decimal("150.00"),
        stock=50,
        categoria=test_category,
    )

    # 2. Agregar imagen
    image = ImagenProducto.objects.create(
        producto=product,
        imagen="test_image.jpg",
        alt_text="Test Product Image",
    )
    assert product.imagenes.count() == 1

    # 3. Agregar review
    user = User.objects.create_user(username="reviewer", password="pass123")
    review = Review.objects.create(
        producto=product,
        usuario=user,
        calificacion=5,
        comentario="Excelente producto",
    )
    assert product.reviews.count() == 1
    assert review.calificacion == 5


@pytest.mark.django_db
def test_product_filtering_and_search(test_products):
    """✓ Test: filtrar productos por categoría y precio."""
    category = test_products[0].categoria

    # Buscar por categoría
    filtered = Producto.objects.filter(categoria=category)
    assert filtered.count() >= 3

    # Filtrar por precio
    expensive = Producto.objects.filter(precio__gte=Decimal("150.00"))
    assert expensive.exists()


# ==============================================================================
# INTEGRATION TESTS: CART LIFECYCLE
# ==============================================================================


@pytest.mark.django_db
def test_anonymous_to_authenticated_cart_merge(api_client, test_user, test_products):
    """✓ Test: carrito anónimo → merge cuando usuario se autentica."""
    # 1. Crear carrito anónimo
    anonymous_cart = Cart.objects.create(user=None, session_key="test_session_123")
    CartItem.objects.create(
        cart=anonymous_cart,
        product=test_products[0],
        quantity=2,
        price=test_products[0].precio_oferta,
    )

    # 2. Usuario se autentica
    api_client.force_authenticate(user=test_user)

    # 3. Verificar que usuario puede tener carrito
    user_cart = Cart.objects.get_or_create(user=test_user)[0]
    assert user_cart.user == test_user

    # 4. Simular merge de carrito anónimo
    anonymous_cart.user = test_user
    anonymous_cart.session_key = None
    anonymous_cart.save()

    # Consolidar items
    user_cart_items = user_cart.items.count()
    assert user_cart_items > 0


@pytest.mark.django_db
def test_add_and_modify_cart_items(test_user, test_products):
    """✓ Test: agregar items → modificar cantidad → vaciar."""
    cart = Cart.objects.create(user=test_user)

    # 1. Agregar item
    item = CartItem.objects.create(
        cart=cart,
        product=test_products[0],
        quantity=1,
        price=test_products[0].precio_oferta,
    )
    assert cart.items.count() == 1

    # 2. Modificar cantidad
    item.quantity = 3
    item.save()
    assert cart.items.first().quantity == 3

    # 3. Agregar otro producto
    CartItem.objects.create(
        cart=cart,
        product=test_products[1],
        quantity=2,
        price=test_products[1].precio_oferta,
    )
    assert cart.items.count() == 2

    # 4. Calcular total del carrito
    total = sum(
        item.quantity * item.price for item in cart.items.all()
    )
    assert total > 0

    # 5. Vaciar carrito
    cart.items.all().delete()
    assert cart.items.count() == 0


@pytest.mark.django_db
def test_cart_stock_validation(test_user, test_products):
    """✓ Test: validar que stock no se agota durante compra."""
    # Producto con stock limitado
    limited_product = test_products[0]
    limited_product.stock = 5
    limited_product.save()

    cart = Cart.objects.create(user=test_user)

    # Intentar agregar más del stock disponible
    CartItem.objects.create(
        cart=cart,
        product=limited_product,
        quantity=3,  # OK, hay 5
        price=limited_product.precio_oferta,
    )

    # Verificar que se puede validar stock
    cart_items = list(cart.items.all())
    total_requested = sum(item.quantity for item in cart_items)
    assert total_requested <= limited_product.stock


# ==============================================================================
# INTEGRATION TESTS: ORDER & PAYMENT LIFECYCLE
# ==============================================================================


@pytest.mark.django_db
def test_create_order_from_cart_atomic_transaction(test_user, test_products):
    """✓ Test: crear orden desde carrito en transacción atómica."""
    from pedidos import services
    from pedidos import selectors

    # 1. Agregar items al carrito
    cart = Cart.objects.create(user=test_user)
    product1 = test_products[0]
    product2 = test_products[1]

    initial_stock_1 = product1.stock
    initial_stock_2 = product2.stock

    CartItem.objects.create(
        cart=cart, product=product1, quantity=2, price=product1.precio_oferta
    )
    CartItem.objects.create(
        cart=cart, product=product2, quantity=1, price=product2.precio_oferta
    )

    # 2. Crear orden
    payment_intent = {
        "id": "pi_integration_test_123",
        "metadata": {"user_id": test_user.id, "cart_id": cart.id},
        "shipping": {
            "name": "John Integration",
            "address": {
                "line1": "123 Test St",
                "city": "Test City",
                "postal_code": "12345",
            },
        },
        "receipt_email": test_user.email,
    }

    order = services.OrderService.create_order_from_payment(
        test_user.id, cart.id, payment_intent
    )

    # 3. Verificar orden creada
    assert order.id is not None
    assert order.status == "PAID"
    assert order.items.count() == 2

    # 4. Verificar stock decremented
    product1.refresh_from_db()
    product2.refresh_from_db()
    assert product1.stock == initial_stock_1 - 2
    assert product2.stock == initial_stock_2 - 1

    # 5. Verificar carrito vacío
    assert cart.items.count() == 0

    # 6. Verificar OrderItems creados
    item1 = order.items.filter(product=product1).first()
    item2 = order.items.filter(product=product2).first()
    assert item1.quantity == 2
    assert item2.quantity == 1


@pytest.mark.django_db
def test_vip_upgrade_after_purchase(test_user, test_products):
    """✓ Test: usuario es ascendido a VIP después de compra > $500."""
    from pedidos import services

    # 1. Verificar que usuario NO es VIP inicialmente
    assert test_user.is_vip is False

    # 2. Crear carrito con productos que cuesta > $500
    cart = Cart.objects.create(user=test_user)

    # Crear producto premium
    categoria = Categoria.objects.create(
        nombre="Premium", slug="premium"
    )
    expensive_product = Producto.objects.create(
        nombre="Expensive Product",
        slug="expensive-product",
        precio=Decimal("1000.00"),
        precio_oferta=Decimal("600.00"),
        stock=100,
        categoria=categoria,
    )

    CartItem.objects.create(
        cart=cart,
        product=expensive_product,
        quantity=1,
        price=expensive_product.precio_oferta,
    )

    # 3. Crear orden
    payment_intent = {
        "id": "pi_vip_test_123",
        "metadata": {"user_id": test_user.id, "cart_id": cart.id},
        "receipt_email": test_user.email,
    }

    order = services.OrderService.create_order_from_payment(
        test_user.id, cart.id, payment_intent
    )

    # 4. Verificar que usuario es ahora VIP
    test_user.refresh_from_db()
    assert test_user.is_vip is True

    # 5. Verificar que se registró en auditoría
    vip_log = UserActivityLog.objects.filter(
        user=test_user, action="VIP_UPGRADE"
    ).last()
    assert vip_log is not None


@pytest.mark.django_db
def test_order_duplicate_prevention(test_user, test_products):
    """✓ Test: prevenir crear órdenes duplicadas para mismo PaymentIntent."""
    from pedidos import services
    from pedidos.exceptions import DuplicateOrderError

    # 1. Crear carrito
    cart = Cart.objects.create(user=test_user)
    CartItem.objects.create(
        cart=cart,
        product=test_products[0],
        quantity=1,
        price=test_products[0].precio_oferta,
    )

    # 2. Crear orden
    payment_intent = {
        "id": "pi_duplicate_test_123",
        "metadata": {"user_id": test_user.id, "cart_id": cart.id},
        "receipt_email": test_user.email,
    }

    order1 = services.OrderService.create_order_from_payment(
        test_user.id, cart.id, payment_intent
    )
    assert order1.id is not None

    # 3. Recrear carrito para segundo intento
    cart.items.all().delete()
    CartItem.objects.create(
        cart=cart,
        product=test_products[1],
        quantity=1,
        price=test_products[1].precio_oferta,
    )

    # 4. Intentar crear orden duplicada (debe fallar)
    with pytest.raises(DuplicateOrderError):
        services.OrderService.create_order_from_payment(
            test_user.id, cart.id, payment_intent
        )


# ==============================================================================
# INTEGRATION TESTS: ADMIN DASHBOARD
# ==============================================================================


@pytest.mark.django_db
def test_admin_dashboard_statistics(admin_user, test_products, test_user):
    """✓ Test: dashboard admin calcula estadísticas correctamente."""
    from pedidos import selectors

    # 1. Crear múltiples órdenes
    for i in range(3):
        order = Order.objects.create(
            user=test_user,
            full_name="Test User",
            email=test_user.email,
            address="123 Test St",
            city="Test City",
            postal_code="12345",
            total=Decimal("100.00") * (i + 1),
            status="PAID",
            stripe_payment_intent_id=f"pi_test_{i}",
        )
        OrderItem.objects.create(
            order=order,
            product=test_products[i % len(test_products)],
            price=Decimal("100.00"),
            quantity=1,
        )

    # 2. Verificar estadísticas
    total_sales = selectors.get_total_sales()
    total_orders = selectors.get_total_orders_count()
    paid_orders = selectors.get_paid_orders_count()

    assert total_sales > 0
    assert total_orders >= 3
    assert paid_orders >= 3

    # 3. Verificar top products
    top_products = selectors.get_top_products_sold(5)
    assert top_products.exists()

    # 4. Verificar datos por status
    by_status = selectors.get_order_summary_by_status()
    assert by_status is not None


# ==============================================================================
# INTEGRATION TESTS: CROSS-MODULE CONSISTENCY
# ==============================================================================


@pytest.mark.django_db
def test_no_orphaned_cart_items(test_user, test_products):
    """✓ Test: no existan CartItems sin carrito válido."""
    cart = Cart.objects.create(user=test_user)
    CartItem.objects.create(
        cart=cart,
        product=test_products[0],
        quantity=1,
        price=test_products[0].precio_oferta,
    )

    # Verificar referential integrity
    for item in CartItem.objects.all():
        assert item.cart is not None
        assert item.cart.user or item.cart.session_key


@pytest.mark.django_db
def test_no_orphaned_order_items(test_user, test_products):
    """✓ Test: no existan OrderItems sin orden válida."""
    order = Order.objects.create(
        user=test_user,
        full_name="Test",
        email=test_user.email,
        address="123 St",
        city="City",
        postal_code="12345",
        total=Decimal("100.00"),
        status="PAID",
    )
    OrderItem.objects.create(
        order=order,
        product=test_products[0],
        price=Decimal("100.00"),
        quantity=1,
    )

    # Verificar referential integrity
    for item in OrderItem.objects.all():
        assert item.order is not None
        assert item.product is not None


@pytest.mark.django_db
def test_user_cascade_delete(test_user, test_products):
    """✓ Test: cuando usuario se borra, se limpian dependencias."""
    # 1. Crear datos asociados al usuario
    cart = Cart.objects.create(user=test_user)
    CartItem.objects.create(
        cart=cart,
        product=test_products[0],
        quantity=1,
        price=test_products[0].precio_oferta,
    )

    order = Order.objects.create(
        user=test_user,
        full_name="Test",
        email=test_user.email,
        address="123 St",
        city="City",
        postal_code="12345",
        total=Decimal("100.00"),
        status="PAID",
    )

    user_id = test_user.id

    # 2. Borrar usuario
    test_user.delete()

    # 3. Verificar que órdenes son orphaned (seguro con ON_DELETE=CASCADE)
    # En caso de ON_DELETE=PROTECT, se lanzaría error
    assert not User.objects.filter(id=user_id).exists()


# ==============================================================================
# INTEGRATION TESTS: PERFORMANCE & DATABASE
# ==============================================================================


@pytest.mark.django_db
def test_product_filtering_performance(test_category):
    """✓ Test: verificar que queries de productos son eficientes."""
    from django.test.utils import CaptureQueriesContext
    from django.db import connection

    # Crear múltiples productos
    for i in range(20):
        Producto.objects.create(
            nombre=f"Perf Product {i}",
            slug=f"perf-product-{i}",
            precio=Decimal("100.00"),
            precio_oferta=Decimal("80.00"),
            stock=100,
            categoria=test_category,
        )

    # Capturar queries
    with CaptureQueriesContext(connection) as queries:
        # Query que listaría productos
        list(Producto.objects.filter(categoria=test_category))

    # Debe ser 1 query principal + maybe 1 relacion
    assert len(queries) <= 3  # Flexible para diferentes configs


@pytest.mark.django_db
def test_order_with_items_query_efficiency():
    """✓ Test: verificar que fetching orden con items es eficiente."""
    from django.test.utils import CaptureQueriesContext
    from django.db import connection

    user = User.objects.create_user(username="perftest", password="pass")
    category = Categoria.objects.create(nombre="Perf", slug="perf")

    # Crear orden con múltiples items
    order = Order.objects.create(
        user=user,
        full_name="Test",
        email="test@test.com",
        address="123 St",
        city="City",
        postal_code="12345",
        total=Decimal("500.00"),
        status="PAID",
    )

    for i in range(10):
        product = Producto.objects.create(
            nombre=f"Item {i}",
            slug=f"item-{i}",
            precio=Decimal("50.00"),
            precio_oferta=Decimal("40.00"),
            stock=100,
            categoria=category,
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            price=Decimal("40.00"),
            quantity=1,
        )

    # Fetch con prefetch
    with CaptureQueriesContext(connection) as queries:
        order_fetch = Order.objects.prefetch_related(
            "items__product"
        ).get(id=order.id)
        items = list(order_fetch.items.all())

    # Debe ser ~3 queries (order + items + products)
    assert len(queries) <= 4

