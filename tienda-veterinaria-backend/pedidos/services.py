
from __future__ import annotations

from decimal import Decimal
from django.db import transaction
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import stripe

from .models import Order, OrderItem
from .exceptions import (
    OrderServiceError,
    CartEmptyError,
    CartNotFoundError,
    InsufficientStockError,
    InvalidAddressError,
    StripePaymentError,
    StripeWebhookError,
    DuplicateOrderError,
    InvalidOrderStatusError,
    OrderNotFoundError,
)
from . import selectors
from carrito import selectors as cart_selectors
from carrito import services as cart_services
from productos import services as product_services
from productos import selectors as product_selectors
from usuarios.models import UserActivityLog, CustomUser


stripe.api_key = settings.STRIPE_SECRET_KEY

VIP_THRESHOLD = Decimal("500.00")


class PaymentService:

    @staticmethod
    def create_payment_intent(user_id: int, cart_id: int) -> str:
       
        try:
     
            try:
                cart = cart_selectors.get_cart_by_id(cart_id)
            except Exception:
                raise CartNotFoundError(user_id)

            if cart_selectors.cart_is_empty(cart_id):
                raise CartEmptyError()

            
            validation = cart_services.CartService.validate_cart_stock(cart_id)
            if validation["invalid_items"]:
                invalid = validation["invalid_items"][0]
                raise InsufficientStockError(invalid["product_name"])

            
            amount = int(cart.total_price * 100)


            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency="usd",
                metadata={"user_id": user_id, "cart_id": cart_id},
                automatic_payment_methods={"enabled": True},
            )

            return intent.client_secret

        except stripe.error.APIConnectionError as e:
            raise StripePaymentError(f"Conexión rechazada: {str(e)}")
        except stripe.error.StripeError as e:
            raise StripePaymentError(str(e))

    @staticmethod
    def verify_webhook_signature(payload: bytes, sig_header: str) -> dict:
      
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            return event
        except ValueError as e:
            raise StripeWebhookError("Payload inválido")
        except stripe.error.SignatureVerificationError as e:
            raise StripeWebhookError("Firma de seguridad inválida")


class OrderService:

    @staticmethod
    def validate_shipping_address(
        full_name: str, email: str, address: str, city: str, postal_code: str
    ) -> None:
       
        required_fields = {
            "full_name": full_name,
            "email": email,
            "address": address,
            "city": city,
            "postal_code": postal_code,
        }

        missing = [name for name, value in required_fields.items() if not value]
        if missing:
            raise InvalidAddressError(missing)

    @staticmethod
    def extract_shipping_from_payment_intent(payment_intent: dict) -> dict:
        
        shipping = payment_intent.get("shipping") or {}
        address_info = shipping.get("address") or {}

        full_name = shipping.get("name")
        email = payment_intent.get("receipt_email")
        address = address_info.get("line1")
        city = address_info.get("city")
        postal_code = address_info.get("postal_code")

        if not address:
            charges = payment_intent.get("charges", {}).get("data", [])
            if charges:
                billing = charges[0].get("billing_details", {})
                billing_address = billing.get("address", {})

                full_name = full_name or billing.get("name")
                email = email or billing.get("email")
                address = billing_address.get("line1")
                city = billing_address.get("city")
                postal_code = billing_address.get("postal_code")

        return {
            "full_name": full_name,
            "email": email,
            "address": address,
            "city": city,
            "postal_code": postal_code,
        }

    @staticmethod
    @transaction.atomic
    def create_order_from_payment(
        user_id: int, cart_id: int, payment_intent: dict, shipping_data: dict = None
    ) -> Order:
      
        payment_intent_id = payment_intent.get("id")
        if selectors.order_exists_for_payment_intent(payment_intent_id):
            raise DuplicateOrderError(payment_intent_id)

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            raise OrderServiceError(f"Usuario id={user_id} no encontrado")

        try:
            cart = cart_selectors.get_cart_by_id(cart_id)
        except Exception:
            raise CartNotFoundError(user_id)

        if cart_selectors.cart_is_empty(cart_id):
            raise CartEmptyError()

      
        validation = cart_services.CartService.validate_cart_stock(cart_id)
        if validation["invalid_items"]:
            invalid = validation["invalid_items"][0]
            raise InsufficientStockError(invalid["product_name"])

        if not shipping_data:
            shipping_data = OrderService.extract_shipping_from_payment_intent(
                payment_intent
            )

        full_name = shipping_data.get("full_name") or f"{user.first_name} {user.last_name}"
        email = shipping_data.get("email") or user.email
        address = shipping_data.get("address") or "Dirección no provista"
        city = shipping_data.get("city") or ""
        postal_code = shipping_data.get("postal_code") or ""

  
        with transaction.atomic():

            order = Order.objects.create(
                user=user,
                full_name=full_name,
                email=email,
                address=address,
                city=city,
                postal_code=postal_code,
                total=cart.total_price,
                status="PAID",
                stripe_payment_intent_id=payment_intent_id,
            )


            for cart_item in cart.items.all():

                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    price=cart_item.price,
                    quantity=cart_item.quantity,
                )

                try:
                    product_services.ProductService.decrease_stock(
                        cart_item.product.id, cart_item.quantity
                    )
                except Exception as e:
                
                    raise InsufficientStockError(cart_item.product.nombre)

            
            cart.items.all().delete()

           
            UserActivityLog.objects.create(
                user=user,
                action="PURCHASE",
                details=f"Orden #{order.id} creada por ${order.total}",
            )

      
            OrderService._check_vip_upgrade(user)

        return order

    @staticmethod
    def _check_vip_upgrade(user: CustomUser) -> None:
      
        if user.is_vip:
            return  

        total_spent = selectors.get_total_user_spending(user.id)

        if total_spent >= VIP_THRESHOLD:
            user.is_vip = True
            user.save()

            UserActivityLog.objects.create(
                user=user,
                action="VIP_UPGRADE",
                details=f"Ascendido automáticamente por superar ${VIP_THRESHOLD} en compras.",
            )

    @staticmethod
    def send_order_confirmation_email(order_id: int) -> None:
      
        try:
            order = selectors.get_order_by_id(order_id)
        except OrderNotFoundError:
            return

        try:
            subject = f"Confirmación de Pedido #{order.id} - VetShop"
            html_message = render_to_string(
                "pedidos/email_confirmacion.html", {"order": order, "user": order.user}
            )
            plain_message = strip_tags(html_message)

            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [order.email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            pass

    @staticmethod
    def update_order_status(order_id: int, new_status: str) -> Order:
        
        try:
            order = selectors.get_order_by_id(order_id)
        except OrderNotFoundError:
            raise OrderNotFoundError(order_id)

        valid_statuses = ["PENDING", "PAID", "SHIPPED", "CANCELLED"]
        if new_status not in valid_statuses:
            raise InvalidOrderStatusError(order.status, f"cambiar a {new_status}")

        order.status = new_status
        order.save()

        UserActivityLog.objects.create(
            user=order.user,
            action="ORDER_STATUS_UPDATE",
            details=f"Orden #{order.id} cambió a estado {new_status}",
        )

        return order

    @staticmethod
    @transaction.atomic
    def cancel_order(order_id: int) -> Order:
       
        try:
            order = selectors.get_order_by_id(order_id)
        except OrderNotFoundError:
            raise OrderNotFoundError(order_id)

        if order.status != "PENDING":
            raise InvalidOrderStatusError(order.status, "CANCEL")

        for item in order.items.all():
            try:
                product_services.ProductService.increase_stock(
                    item.product.id, item.quantity
                )
            except Exception:
                raise OrderServiceError("Error al devolver stock")

        order.status = "CANCELLED"
        order.save()

        UserActivityLog.objects.create(
            user=order.user,
            action="ORDER_CANCELLED",
            details=f"Orden #{order.id} cancelada",
        )

        return order
