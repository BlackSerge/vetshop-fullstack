
from django.db.models import QuerySet, Q, Count, Sum
from typing import Optional
from .models import CustomUser, UserActivityLog


def get_user_by_id(user_id: int) -> Optional[CustomUser]:
    
    return CustomUser.objects.filter(id=user_id).first()


def get_user_by_email(email: str) -> Optional[CustomUser]:

    return CustomUser.objects.filter(email=email).first()


def get_user_by_username(username: str) -> Optional[CustomUser]:
   
    return CustomUser.objects.filter(username=username).first()


def user_exists(email: str = "", username: str = "") -> bool:
   
    query = Q()
    if email:
        query |= Q(email=email)
    if username:
        query |= Q(username=username)
    
    return CustomUser.objects.filter(query).exists() if query else False


def get_all_users(
    is_active: Optional[bool] = None,
    is_staff: Optional[bool] = None,
    is_vip: Optional[bool] = None,
    order_by: str = "-date_joined"
) -> QuerySet[CustomUser]:
   
    queryset = CustomUser.objects.all()
    
    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)
    if is_staff is not None:
        queryset = queryset.filter(is_staff=is_staff)
    if is_vip is not None:
        queryset = queryset.filter(is_vip=is_vip)
    
    return queryset.order_by(order_by)


def get_user_with_stats(user_id: int) -> Optional[CustomUser]:
   
    user = CustomUser.objects.filter(id=user_id).prefetch_related(
        'orders',
        'activity_logs'
    ).annotate(
        total_orders=Count('orders'),
        total_spent=Sum('orders__total')
    ).first()
    
    return user


def get_user_activity_logs(
    user_id: int,
    limit: int = 100,
    action: Optional[str] = None
) -> QuerySet[UserActivityLog]:
   
    queryset = UserActivityLog.objects.filter(
        user_id=user_id
    ).order_by('-timestamp')[:limit]
    
    if action:
        queryset = queryset.filter(action=action)
    
    return queryset


def get_vip_users() -> QuerySet[CustomUser]:
  
    return CustomUser.objects.filter(is_vip=True).order_by('-date_joined')


def get_admin_users() -> QuerySet[CustomUser]:
  
    return CustomUser.objects.filter(is_staff=True).order_by('username')


def search_users(query: str) -> QuerySet[CustomUser]:
  
    return CustomUser.objects.filter(
        Q(username__icontains=query) |
        Q(email__icontains=query) |
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query)
    ).order_by('username')


def get_recent_users(days: int = 7) -> QuerySet[CustomUser]:
   
    from django.utils import timezone
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=days)
    return CustomUser.objects.filter(
        date_joined__gte=cutoff_date
    ).order_by('-date_joined')
