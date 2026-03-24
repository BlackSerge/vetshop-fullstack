"""
usuarios/selectors.py

Capa de queries optimizadas para el módulo de usuarios.
Todas las consultas a la base de datos deben pasar por aquí.
Principios:
- select_related/prefetch_related para evitar N+1 queries
- Type hints explícitos
- Métodos reutilizables
"""

from django.db.models import QuerySet, Q, Count, Sum
from typing import Optional
from .models import CustomUser, UserActivityLog


def get_user_by_id(user_id: int) -> Optional[CustomUser]:
    """
    Obtiene un usuario por ID.
    
    Args:
        user_id: ID del usuario
        
    Returns:
        CustomUser o None si no existe
    """
    return CustomUser.objects.filter(id=user_id).first()


def get_user_by_email(email: str) -> Optional[CustomUser]:
    """
    Obtiene un usuario por email.
    
    Args:
        email: Email del usuario
        
    Returns:
        CustomUser o None si no existe
    """
    return CustomUser.objects.filter(email=email).first()


def get_user_by_username(username: str) -> Optional[CustomUser]:
    """
    Obtiene un usuario por username.
    
    Args:
        username: Username del usuario
        
    Returns:
        CustomUser o None si no existe
    """
    return CustomUser.objects.filter(username=username).first()


def user_exists(email: str = "", username: str = "") -> bool:
    """
    Verifica si existe un usuario con el email o username proporcionado.
    
    Args:
        email: Email a verificar
        username: Username a verificar
        
    Returns:
        True si existe, False en caso contrario
    """
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
    """
    Obtiene un queryset de usuarios con filtros opcionales.
    
    Args:
        is_active: Filtrar por estado activo
        is_staff: Filtrar por si es staff
        is_vip: Filtrar por si es VIP
        order_by: Campo por el que ordenar
        
    Returns:
        QuerySet de users filtrados y ordenados
    """
    queryset = CustomUser.objects.all()
    
    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)
    if is_staff is not None:
        queryset = queryset.filter(is_staff=is_staff)
    if is_vip is not None:
        queryset = queryset.filter(is_vip=is_vip)
    
    return queryset.order_by(order_by)


def get_user_with_stats(user_id: int) -> Optional[CustomUser]:
    """
    Obtiene un usuario con sus estadísticas (órdenes, gastos totales).
    Incluye prefetch_related para evitar N+1 queries.
    
    Args:
        user_id: ID del usuario
        
    Returns:
        CustomUser con relaciones precargadas o None
    """
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
    """
    Obtiene el historial de actividad de un usuario.
    
    Args:
        user_id: ID del usuario
        limit: Cantidad máxima de logs
        action: Filtrar por acción específica
        
    Returns:
        QuerySet de activity logs ordenados por fecha descendente
    """
    queryset = UserActivityLog.objects.filter(
        user_id=user_id
    ).order_by('-timestamp')[:limit]
    
    if action:
        queryset = queryset.filter(action=action)
    
    return queryset


def get_vip_users() -> QuerySet[CustomUser]:
    """
    Obtiene todos los usuarios VIP.
    
    Returns:
        QuerySet de usuarios VIP
    """
    return CustomUser.objects.filter(is_vip=True).order_by('-date_joined')


def get_admin_users() -> QuerySet[CustomUser]:
    """
    Obtiene todos los administradores (staff).
    
    Returns:
        QuerySet de administradores
    """
    return CustomUser.objects.filter(is_staff=True).order_by('username')


def search_users(query: str) -> QuerySet[CustomUser]:
    """
    Busca usuarios por nombre, email o username.
    
    Args:
        query: Término de búsqueda
        
    Returns:
        QuerySet de usuarios que coinciden
    """
    return CustomUser.objects.filter(
        Q(username__icontains=query) |
        Q(email__icontains=query) |
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query)
    ).order_by('username')


def get_recent_users(days: int = 7) -> QuerySet[CustomUser]:
    """
    Obtiene usuarios registrados en los últimos N días.
    
    Args:
        days: Cantidad de días hacia atrás
        
    Returns:
        QuerySet de usuarios recientes
    """
    from django.utils import timezone
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=days)
    return CustomUser.objects.filter(
        date_joined__gte=cutoff_date
    ).order_by('-date_joined')
