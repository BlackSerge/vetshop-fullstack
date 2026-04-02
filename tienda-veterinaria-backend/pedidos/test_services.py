
import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db import transaction

from carrito.models import Cart, CartItem
from productos.models import Producto
from usuarios.models import UserActivityLog
from .models import Order, OrderItem
from .services import OrderService, PaymentService
from .exceptions import (
    CartEmptyError,
    InvalidAddressError,
    DuplicateOrderError,
    InvalidOrderStatusError,
)

User = get_user_model()



@pytest.fixture
def test_user(db):
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="TestPassword123!",
        first_name="John",
        last_name="Doe",
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="admin",
        email="admin@example.com",
        password="AdminPassword123!",
    )


@pytest.fixture
def test_product(db):
    from productos.models import Categoria

    category = Categoria.objects.create(nombre="Test Category", slug="test-category")
    return Producto.objects.create(
        nombre="Test Product",
        precio=Decimal("100.00"),
        precio_oferta=Decimal("80.00"),
        stock=50,
        categoria=category,
    )


@pytest.fixture
def test_cart(db, test_user, test_product):
    cart = Cart.objects.create(user=test_user)
    CartItem.objects.create(cart=cart, product=test_product, quantity=2, price=Decimal("80.00"))
    return cart



@pytest.mark.django_db
def test_validate_shipping_address_success():
    OrderService.validate_shipping_address(
        full_name="John Doe",
        email="john@example.com",
        address="123 Main St",
        city="Springfield",
        postal_code="12345",
    )
  

@pytest.mark.django_db
def test_validate_shipping_address_missing_field():
    with pytest.raises(InvalidAddressError):
        OrderService.validate_shipping_address(
            full_name="",  # Vacío
            email="john@example.com",
            address="123 Main St",
            city="Springfield",
            postal_code="12345",
        )




@pytest.mark.django_db
def test_extract_shipping_from_intent_with_shipping_data():
    intent = {
        "id": "pi_test",
        "shipping": {
            "name": "John Doe",
            "address": {
                "line1": "123 Main St",
                "city": "Springfield",
                "postal_code": "12345",
            },
        },
        "receipt_email": "john@example.com",
    }

    result = OrderService.extract_shipping_from_payment_intent(intent)

    assert result["full_name"] == "John Doe"
    assert result["address"] == "123 Main St"
    assert result["city"] == "Springfield"
    assert result["postal_code"] == "12345"


@pytest.mark.django_db
def test_extract_shipping_from_intent_fallback_to_charges():
    intent = {
        "id": "pi_test",
        "receipt_email": "john@example.com",
        "charges": {
            "data": [
                {
                    "billing_details": {
                        "name": "Jane Smith",
                        "email": "jane@example.com",
                        "address": {
                            "line1": "456 Oak Ave",
                            "city": "Shelbyville",
                            "postal_code": "54321",
                        },
                    }
                }
            ]
        },
    }

    result = OrderService.extract_shipping_from_payment_intent(intent)

    assert result["full_name"] == "Jane Smith"
    assert result["address"] == "456 Oak Ave"




@pytest.mark.django_db
def test_create_order_from_payment_success(test_user, test_cart, test_product):
    payment_intent = {
        "id": "pi_unique_test_123",
        "metadata": {"user_id": test_user.id, "cart_id": test_cart.id},
        "shipping": {
            "name": "John Doe",
            "address": {
                "line1": "123 Main St",
                "city": "Springfield",
                "postal_code": "12345",
            },
        },
        "receipt_email": "john@example.com",
    }

    order = OrderService.create_order_from_payment(
        test_user.id, test_cart.id, payment_intent
    )

    assert order.id is not None
    assert order.status == "PAID"
    assert order.stripe_payment_intent_id == "pi_unique_test_123"
    assert order.total == Decimal("160.00")  # 2 * $80
    assert order.items.count() == 1
    assert order.items.first().quantity == 2

    test_product.refresh_from_db()
    assert test_product.stock == 48  # 50 - 2


@pytest.mark.django_db
def test_create_order_from_payment_duplicate_prevention(test_user, test_cart, test_product):
    payment_intent = {
        "id": "pi_duplicate_test",
        "metadata": {"user_id": test_user.id, "cart_id": test_cart.id},
        "shipping": {
            "name": "John Doe",
            "address": {
                "line1": "123 Main St",
                "city": "Springfield",
                "postal_code": "12345",
            },
        },
    }

    order1 = OrderService.create_order_from_payment(
        test_user.id, test_cart.id, payment_intent
    )
    assert order1.id is not None

    test_cart.items.all().delete()
    CartItem.objects.create(
        cart=test_cart, product=test_product, quantity=1, price=Decimal("80.00")
    )

    
    with pytest.raises(DuplicateOrderError):
        OrderService.create_order_from_payment(
            test_user.id, test_cart.id, payment_intent
        )


@pytest.mark.django_db
def test_create_order_empty_cart(test_user, test_product):
    empty_cart = Cart.objects.create(user=test_user)

    payment_intent = {
        "id": "pi_empty_cart_test",
        "metadata": {"user_id": test_user.id, "cart_id": empty_cart.id},
    }

    with pytest.raises(CartEmptyError):
        OrderService.create_order_from_payment(
            test_user.id, empty_cart.id, payment_intent
        )




@pytest.mark.django_db
def test_vip_upgrade_automatic(test_user, test_cart, test_product):
    test_product.precio_oferta = Decimal("1000.00")
    test_product.save()

    test_cart.items.all().delete()
    CartItem.objects.create(
        cart=test_cart, product=test_product, quantity=1, price=Decimal("1000.00")
    )

    payment_intent = {
        "id": "pi_vip_test",
        "metadata": {"user_id": test_user.id, "cart_id": test_cart.id},
    }

    assert test_user.is_vip is False

    order = OrderService.create_order_from_payment(
        test_user.id, test_cart.id, payment_intent
    )

    test_user.refresh_from_db()
    assert test_user.is_vip is True

    activity = UserActivityLog.objects.filter(user=test_user, action="VIP_UPGRADE").last()
    assert activity is not None



@pytest.mark.django_db
def test_update_order_status_success(test_user, test_cart):

    order = Order.objects.create(
        user=test_user,
        full_name="John Doe",
        email="john@example.com",
        address="123 Main St",
        city="Springfield",
        postal_code="12345",
        total=Decimal("100.00"),
        status="PENDING",
    )

    updated_order = OrderService.update_order_status(order.id, "PAID")

    assert updated_order.status == "PAID"

    activity = UserActivityLog.objects.filter(
        user=test_user, action="ORDER_STATUS_UPDATE"
    ).last()
    assert activity is not None


@pytest.mark.django_db
def test_update_order_status_invalid(test_user):
    order = Order.objects.create(
        user=test_user,
        full_name="John Doe",
        email="john@example.com",
        address="123 Main St",
        city="Springfield",
        postal_code="12345",
        total=Decimal("100.00"),
        status="PENDING",
    )

    with pytest.raises(InvalidOrderStatusError):
        OrderService.update_order_status(order.id, "INVALID_STATUS")


@pytest.mark.django_db
def test_cancel_order_success(test_user, test_product):
    order = Order.objects.create(
        user=test_user,
        full_name="John Doe",
        email="john@example.com",
        address="123 Main St",
        city="Springfield",
        postal_code="12345",
        total=Decimal("160.00"),
        status="PENDING",
    )

    OrderItem.objects.create(
        order=order, product=test_product, price=Decimal("80.00"), quantity=2
    )

    initial_stock = test_product.stock

    cancelled_order = OrderService.cancel_order(order.id)

    assert cancelled_order.status == "CANCELLED"

    test_product.refresh_from_db()
    assert test_product.stock == initial_stock + 2


@pytest.mark.django_db
def test_cancel_order_not_pending(test_user):

    order = Order.objects.create(
        user=test_user,
        full_name="John Doe",
        email="john@example.com",
        address="123 Main St",
        city="Springfield",
        postal_code="12345",
        total=Decimal("100.00"),
        status="PAID",  # Ya pagada
    )

    with pytest.raises(InvalidOrderStatusError):
        OrderService.cancel_order(order.id)




@pytest.mark.django_db
def test_verify_webhook_signature_invalid():
   
    from .exceptions import StripeWebhookError

    payload = b'{"type": "payment_intent.succeeded"}'
    invalid_sig = "invalid_signature_header"

    with pytest.raises(StripeWebhookError):
        PaymentService.verify_webhook_signature(payload, invalid_sig)
