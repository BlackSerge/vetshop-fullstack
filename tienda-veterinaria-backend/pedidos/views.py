
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, inline_serializer 
from rest_framework import serializers
from .serializers import OrderSerializer
from .services import PaymentService, OrderService
from .exceptions import (
    CartEmptyError,
    CartNotFoundError,
    InsufficientStockError,
    StripePaymentError,
    StripeWebhookError,
    DuplicateOrderError,
    OrderNotFoundError,
)
from . import selectors
from usuarios.models import CustomUser
from productos import selectors as product_selectors


class CreatePaymentIntentView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    serializer_class = inline_serializer(
        name='CreatePaymentIntentRequest',
        fields={'cart_id': serializers.IntegerField(required=False)},
    )

    @extend_schema(
        request=serializer_class,
        responses={
            200: inline_serializer(
                name='CreatePaymentIntentResponse',
                fields={'clientSecret': serializers.CharField()},
            )
        },
    )

    def post(self, request, *args, **kwargs):
        try:
            client_secret = PaymentService.create_payment_intent(
            request.user.id, request.data.get("cart_id") 
            )
            return Response({"clientSecret": client_secret})
        except CartNotFoundError:
            return Response(
                {"error": "Carrito no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except CartEmptyError:
            return Response(
                {"error": "El carrito está vacío."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except InsufficientStockError as e:
            return Response(
                {"error": f"Stock insuficiente: {e.message}"},
                status=status.HTTP_409_CONFLICT,
            )
        except StripePaymentError as e:
            return Response(
                {"error": f"Error con Stripe: {e.message}"},
                status=status.HTTP_403_FORBIDDEN,
            )


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
  
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        request=inline_serializer(
            name='StripeWebhookPayload',
            fields={
                'id': serializers.CharField(required=False),
                'type': serializers.CharField(required=True),
                'data': serializers.DictField(required=True),
            },
        ),
        responses={200: None, 400: None},
        description='Endpoint de webhook de Stripe para procesar eventos de pago.',
    )

    @extend_schema(
        request=inline_serializer(
            name='StripeWebhookPayload',
            fields={
                'id': serializers.CharField(required=False),
                'type': serializers.CharField(required=True),
                'data': serializers.DictField(required=True),
            },
        ),
        responses={200: None, 400: None},
        description='Endpoint de webhook de Stripe para procesar eventos de pago.',
    )

    def post(self, request, *args, **kwargs):
        try:
           
            event = PaymentService.verify_webhook_signature(
                request.body, request.META.get("HTTP_STRIPE_SIGNATURE")
            )

            if event["type"] == "payment_intent.succeeded":
                payment_intent = event["data"]["object"]

                user_id = payment_intent["metadata"].get("user_id")
                cart_id = payment_intent["metadata"].get("cart_id")

                if user_id and cart_id:
                    try:
                    
                        order = OrderService.create_order_from_payment(
                            int(user_id), int(cart_id), payment_intent
                        )

                        OrderService.send_order_confirmation_email(order.id)

                    except (DuplicateOrderError, OrderNotFoundError):
                    
                        pass
                    except Exception as e:
               
                        pass

            return HttpResponse(status=200)

        except StripeWebhookError:
            return HttpResponse(status=400)


class OrderListAPIView(generics.ListAPIView):

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        status_filter = self.request.query_params.get("status")
        user_id = self.request.query_params.get("user_id")

        if status_filter:
            return selectors.get_all_orders(status=status_filter)
        elif user_id:
            return selectors.get_user_orders(int(user_id))
        else:
            return selectors.get_all_orders()


class MyOrderListAPIView(generics.ListAPIView):
   
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        status_filter = self.request.query_params.get("status")

        if status_filter:
            return selectors.get_user_orders(self.request.user.id, status=status_filter)
        else:
            return selectors.get_user_orders(self.request.user.id)


class AdminDashboardStatsView(APIView):
   
    permission_classes = [permissions.IsAdminUser]
    serializer_class = inline_serializer(
        name='AdminDashboardStatsQuery',
        fields={'period': serializers.CharField(required=False)},
    )

    @extend_schema(
        responses={
            200: inline_serializer(
                name='AdminDashboardStatsResponse',
                fields={
                    'total_sales': serializers.FloatField(),
                    'total_orders': serializers.IntegerField(),
                    'total_users': serializers.IntegerField(),
                    'total_products': serializers.IntegerField(),
                    'period_sales': serializers.FloatField(),
                    'period_orders': serializers.IntegerField(),
                    'period_avg_value': serializers.FloatField(),
                    'active_customers': serializers.IntegerField(),
                    'trends': serializers.DictField(),
                    'top_products': serializers.ListField(),
                    'chart_data': serializers.DictField(),
                    'orders_by_status': serializers.ListField(),
                    'sales_by_category': serializers.ListField(),
                    'period_days': serializers.IntegerField(),
                },
            )
        }
    )

    def get(self, request):
        period = request.query_params.get("period", "30d")
 
        period_map = {
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "1y": 365
        }
        days = period_map.get(period, 30)
        analytics = selectors.get_dashboard_analytics(days)
        trends = selectors.get_dashboard_trends(days)
        
        return Response(
            {
                "total_sales": selectors.get_total_sales(),
                "total_orders": selectors.get_total_orders_count(),
                "total_users": CustomUser.objects.count(),
                "total_products": product_selectors.get_filtered_products().count(),
                "period_sales": analytics["period_sales"],
                "period_orders": analytics["period_orders"],
                "period_avg_value": analytics["period_avg_value"],
                "active_customers": analytics["total_users_active"],
                "trends": trends,
                "top_products": list(
                    selectors.get_top_products_sold_period(days, 5).values(
                        "product__nombre", "total_quantity", "total_revenue"
                    )
                ),
                "chart_data": selectors.get_dynamic_chart_data(days),
                "orders_by_status": selectors.get_order_summary_by_status(days),
                "sales_by_category": selectors.get_sales_by_category_period(days),
                "period_days": days
            }
        
        )