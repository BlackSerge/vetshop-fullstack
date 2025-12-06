# backend/pedidos/urls.py
from django.urls import path
from .views import CreatePaymentIntentView,StripeWebhookView,OrderListAPIView,MyOrderListAPIView,AdminDashboardStatsView


app_name = 'pedidos'

urlpatterns = [
    path('create-payment-intent/', CreatePaymentIntentView.as_view(), name='create_payment_intent'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe_webhook'),
    path('admin/orders/', OrderListAPIView.as_view(), name='admin_order_list'),
    path('my-orders/', MyOrderListAPIView.as_view(), name='my_order_list'),
    path('admin/stats/', AdminDashboardStatsView.as_view(), name='admin_stats'),
]