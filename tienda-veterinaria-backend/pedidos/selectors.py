
from __future__ import annotations
from typing import Optional, List
from django.db.models import QuerySet, Sum, Count, DecimalField, Avg
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from django.utils import timezone
from datetime import timedelta

from .models import Order, OrderItem
from .exceptions import OrderNotFoundError




def get_order_by_id(order_id: int) -> Optional[Order]:
   
    try:
        return Order.objects.prefetch_related("items__product").get(id=order_id)
    except Order.DoesNotExist:
        raise OrderNotFoundError(order_id)


def get_user_orders(user_id: int, status: str = None) -> QuerySet:
  
    queryset = Order.objects.filter(user_id=user_id).prefetch_related(
        "items__product"
    ).order_by("-created_at")

    if status:
        queryset = queryset.filter(status=status)

    return queryset


def get_all_orders(status: str = None) -> QuerySet:

    queryset = Order.objects.all().prefetch_related(
        "items__product", "user"
    ).order_by("-created_at")

    if status:
        queryset = queryset.filter(status=status)

    return queryset


def order_exists(order_id: int) -> bool:
   
    return Order.objects.filter(id=order_id).exists()


def order_exists_for_payment_intent(payment_intent_id: str) -> bool:

    return Order.objects.filter(stripe_payment_intent_id=payment_intent_id).exists()


def get_order_by_payment_intent(payment_intent_id: str) -> Optional[Order]:
    
    try:
        return Order.objects.prefetch_related("items__product").get(
            stripe_payment_intent_id=payment_intent_id
        )
    except Order.DoesNotExist:
        return None


def get_total_user_spending(user_id: int) -> float:

    result = Order.objects.filter(
        user_id=user_id, status="PAID"
    ).aggregate(total=Sum("total", output_field=DecimalField()))
    return result["total"] or 0.0


def get_user_order_count(user_id: int) -> int:
    
    return Order.objects.filter(user_id=user_id).count()


def get_paid_order_count(user_id: int) -> int:
    
    return Order.objects.filter(user_id=user_id, status="PAID").count()




def get_total_sales() -> float:
    
    result = Order.objects.filter(status="PAID").aggregate(
        total=Sum("total", output_field=DecimalField())
    )
    return result["total"] or 0.0


def get_total_orders_count() -> int:

    return Order.objects.count()


def get_paid_orders_count() -> int:
   
    return Order.objects.filter(status="PAID").count()


def get_sales_last_n_days(days: int) -> float:
   
    date_threshold = timezone.now() - timedelta(days=days)
    result = Order.objects.filter(
        status="PAID", created_at__gte=date_threshold
    ).aggregate(total=Sum("total", output_field=DecimalField()))
    return result["total"] or 0.0


def get_orders_last_n_days(days: int) -> int:

    date_threshold = timezone.now() - timedelta(days=days)
    return Order.objects.filter(created_at__gte=date_threshold).count()


def get_top_products_sold(limit: int = 5) -> QuerySet:
    
    return (
        OrderItem.objects.filter(order__status="PAID")
        .values("product__nombre", "product__id")
        .annotate(total_quantity=Sum("quantity"), total_revenue=Sum("price"))
        .order_by("-total_quantity")[:limit]
    )


def get_daily_sales_data(days: int = 7) -> List[dict]:

    now = timezone.now()
    data = []

    for i in range(days - 1, -1, -1):
        date = now - timedelta(days=i)
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)

        daily_total = Order.objects.filter(
            status="PAID", created_at__range=(day_start, day_end)
        ).aggregate(total=Sum("total", output_field=DecimalField()))["total"] or 0.0

        data.append({
            "date": date.strftime("%d/%m"),  
            "sales": float(daily_total),
        })

    return data


def get_order_summary_by_status(days: Optional[int] = None) -> QuerySet:
    
    queryset = Order.objects.all()
    if days:
        threshold = timezone.now() - timedelta(days=days)
        queryset = queryset.filter(created_at__gte=threshold)
        
    return (
        queryset.values("status")
        .annotate(count=Count("id"), total=Sum("total", output_field=DecimalField()))
        .order_by("status")
    )


def get_period_metrics(days: int) -> dict:
   
    threshold = timezone.now() - timedelta(days=days)
    qs = Order.objects.filter(created_at__gte=threshold)
    paid_qs = qs.filter(status="PAID")
    
    
    items_count = OrderItem.objects.filter(order__in=paid_qs).aggregate(qty=Sum("quantity"))["qty"] or 0
    
    return {
        "sales": float(paid_qs.aggregate(total=Sum("total"))["total"] or 0.0),
        "orders": qs.count(),
        "customers": qs.values("user").distinct().count(),
        "items": int(items_count),
    }


def get_previous_period_metrics(days: int) -> dict:
   
    now = timezone.now()
    end_threshold = now - timedelta(days=days)
    start_threshold = now - timedelta(days=days * 2)
    
    qs = Order.objects.filter(created_at__range=(start_threshold, end_threshold))
    paid_qs = qs.filter(status="PAID")
    
    items_count = OrderItem.objects.filter(order__in=paid_qs).aggregate(qty=Sum("quantity"))["qty"] or 0
    
    return {
        "sales": float(paid_qs.aggregate(total=Sum("total"))["total"] or 0.0),
        "orders": qs.count(),
        "customers": qs.values("user").distinct().count(),
        "items": int(items_count),
    }


def calculate_growth_percentage(current: float, previous: float) -> float:
   
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


def get_dashboard_trends(days: int) -> dict:
 
    curr = get_period_metrics(days)
    prev = get_previous_period_metrics(days)
    
    return {
        "sales_trend": calculate_growth_percentage(curr["sales"], prev["sales"]),
        "orders_trend": calculate_growth_percentage(curr["orders"], prev["orders"]),
        "customers_trend": calculate_growth_percentage(curr["customers"], prev["customers"]),
        "items_trend": calculate_growth_percentage(curr["items"], prev["items"]),
    }


def get_dashboard_analytics(days: int = 30) -> dict:
   
    date_threshold = timezone.now() - timedelta(days=days)
    base_qs = Order.objects.filter(created_at__gte=date_threshold)
    paid_qs = base_qs.filter(status="PAID")

    sales_stats = paid_qs.aggregate(
        total_sales=Sum("total", output_field=DecimalField()),
        avg_order=Avg("total", output_field=DecimalField()),
        count=Count("id")
    )

    return {
        "period_sales": float(sales_stats["total_sales"] or 0.0),
        "period_orders": sales_stats["count"] or 0,
        "period_avg_value": float(sales_stats["avg_order"] or 0.0),
        "total_users_active": base_qs.values("user").distinct().count(),
    }


def get_dynamic_chart_data(days: int = 7) -> List[dict]:
    
    now = timezone.now()
    start_date = now - timedelta(days=days)
    
    queryset = Order.objects.filter(
        status="PAID", 
        created_at__gte=start_date
    )

    if days <= 32:
        
        stats = (
            queryset.annotate(period=TruncDay("created_at"))
            .values("period")
            .annotate(sales=Sum("total"))
            .order_by("period")
        )
        date_format = "%d/%m"
    elif days <= 95:
       
        stats = (
            queryset.annotate(period=TruncWeek("created_at"))
            .values("period")
            .annotate(sales=Sum("total"))
            .order_by("period")
        )
        date_format = "Sem %W"
    else:
        
        stats = (
            queryset.annotate(period=TruncMonth("created_at"))
            .values("period")
            .annotate(sales=Sum("total"))
            .order_by("period")
        )
        date_format = "%b %Y"

    return [
        {
            "label": item["period"].strftime(date_format),
            "sales": float(item["sales"] or 0.0),
            "date": item["period"].isoformat()
        }
        for item in stats
    ]


def get_top_products_sold_period(days: int = 30, limit: int = 5) -> QuerySet:
   
    date_threshold = timezone.now() - timedelta(days=days)
    return (
        OrderItem.objects.filter(order__status="PAID", order__created_at__gte=date_threshold)
        .values("product__nombre", "product__id")
        .annotate(total_quantity=Sum("quantity"), total_revenue=Sum("price"))
        .order_by("-total_quantity")[:limit]
    )


def get_sales_by_category_period(days: int = 30) -> List[dict]:
    
    date_threshold = timezone.now() - timedelta(days=days)
    return list(
        OrderItem.objects.filter(order__status="PAID", order__created_at__gte=date_threshold)
        .values("product__categoria__nombre")
        .annotate(total_sales=Sum("price"), count=Count("id"))
        .order_by("-total_sales")
    )




def get_order_items(order_id: int) -> QuerySet:
    
    return OrderItem.objects.filter(order_id=order_id).select_related(
        "product__categoria"
    )


def get_order_item_count(order_id: int) -> int:
   
    result = OrderItem.objects.filter(order_id=order_id).aggregate(
        total=Sum("quantity")
    )
    return result["total"] or 0
