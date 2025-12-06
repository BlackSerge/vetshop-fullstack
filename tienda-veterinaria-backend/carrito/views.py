# carrito/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.db import transaction
import uuid # <--- ¡Nueva importación!

from .models import Cart, CartItem
from productos.models import Producto
from .serializers import CartSerializer, CartItemSerializer

# Usaremos un nombre de cabecera HTTP personalizado para el session_key del carrito anónimo
CART_SESSION_KEY_HEADER = 'X-Cart-Session'

class CartView(APIView):
    permission_classes = [permissions.AllowAny] # <--- Permitir acceso a cualquiera (autenticado o anónimo)

    def _get_cart_from_request(self, request):
        """
        Intenta obtener un carrito basado en el usuario autenticado O en la session_key.
        Prioriza el usuario autenticado.
        """
        if request.user.is_authenticated:
            try:
                return Cart.objects.get(user=request.user)
            except Cart.DoesNotExist:
                pass # No hay carrito para este usuario todavía

        # Si no está autenticado o no tiene carrito, busca por session_key
        session_key_str = request.headers.get(CART_SESSION_KEY_HEADER)
        if session_key_str:
            try:
                session_uuid = uuid.UUID(session_key_str) # Intenta convertir a UUID para buscar
                # Asegurarse de que el carrito anónimo no tenga un usuario asignado
                return Cart.objects.get(session_key=session_uuid, user__isnull=True)
            except (ValueError, Cart.DoesNotExist):
                pass # session_key inválida o no existe carrito anónimo para ella
        return None

    def _create_anonymous_cart(self):
        """Crea y devuelve un nuevo carrito anónimo con un session_key generado."""
        return Cart.objects.create(session_key=uuid.uuid4(), user=None)

    def _set_cart_session_header(self, response, cart_session_key):
        """Añade la session_key del carrito a los headers de la respuesta si está presente."""
        if cart_session_key:
            response[CART_SESSION_KEY_HEADER] = str(cart_session_key)

    def get(self, request, *args, **kwargs):
        """
        Recupera el contenido del carrito.
        Si no hay un carrito existente para el usuario o la sesión, crea uno anónimo y lo devuelve.
        """
        cart = self._get_cart_from_request(request)

        if not cart:
            # Si no hay carrito existente, creamos uno anónimo
            cart = self._create_anonymous_cart()
            response_status = status.HTTP_201_CREATED # Indica que se creó un nuevo carrito
        else:
            response_status = status.HTTP_200_OK

        serializer = CartSerializer(cart, context={'request': request})
        response = Response(serializer.data, status=response_status)
        self._set_cart_session_header(response, cart.session_key) # Siempre devolver el session_key si es anónimo
        return response

    def post(self, request, *args, **kwargs):
        """
        Añade un producto al carrito o actualiza su cantidad.
        Requiere 'product_id' y 'quantity' en el cuerpo de la solicitud.
        """
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity')

        if not product_id or not quantity:
            return Response(
                {"detail": "product_id y quantity son requeridos."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response(
                    {"detail": "La cantidad debe ser un número positivo."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {"detail": "La cantidad debe ser un número entero válido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        product = get_object_or_404(Producto, id=product_id, is_active=True)

        # Obtener el carrito; si no existe, crea uno anónimo
        cart = self._get_cart_from_request(request)
        if not cart:
            cart = self._create_anonymous_cart()

        # Verificar stock disponible del producto
        if quantity > product.stock:
            response = Response(
                {"detail": f"No hay suficiente stock para {product.nombre}. Stock disponible: {product.stock}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            self._set_cart_session_header(response, cart.session_key)
            return response

        try:
            item_price = product.get_precio_actual # Obtener el precio actual (considerando oferta)

            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': quantity, 'price': item_price}
            )

            if not created:
                # Si el ítem ya existe, solo actualiza la cantidad y el precio (por si cambió)
                new_quantity = cart_item.quantity + quantity
                if new_quantity > product.stock:
                    response = Response(
                        {"detail": f"No hay suficiente stock para añadir {quantity} unidades más de {product.nombre}. Stock total disponible: {product.stock}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    self._set_cart_session_header(response, cart.session_key)
                    return response
                
                cart_item.quantity = new_quantity
                cart_item.price = item_price # Actualizar precio por si cambió
                cart_item.save()

            serializer = CartSerializer(cart, context={'request': request})
            response = Response(serializer.data, status=status.HTTP_200_OK)
            self._set_cart_session_header(response, cart.session_key)
            return response

        except Exception as e:
            response = Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            self._set_cart_session_header(response, cart.session_key)
            return response

    def put(self, request, *args, **kwargs):
        """
        Actualiza la cantidad de un ítem existente en el carrito.
        Requiere 'item_id' y 'quantity' en el cuerpo de la solicitud.
        """
        item_id = request.data.get('item_id')
        quantity = request.data.get('quantity')

        if not item_id or not quantity:
            return Response(
                {"detail": "item_id y quantity son requeridos."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = int(quantity)
            if quantity < 0:
                return Response(
                    {"detail": "La cantidad no puede ser negativa."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {"detail": "La cantidad debe ser un número entero válido."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cart = self._get_cart_from_request(request)
        if not cart:
            response = Response({"detail": "Carrito no encontrado."}, status=status.HTTP_404_NOT_FOUND)
            self._set_cart_session_header(response, None) # No se encontró un carrito, asegurar que no se envíe session_key
            return response

        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

        if quantity == 0:
            cart_item.delete()
            # Devolvemos el carrito actualizado tras la eliminación
            serializer = CartSerializer(cart, context={'request': request})
            response = Response(serializer.data, status=status.HTTP_200_OK)
            self._set_cart_session_header(response, cart.session_key)
            return response

        # Verificar stock para la nueva cantidad
        if quantity > cart_item.product.stock:
            response = Response(
                {"detail": f"No hay suficiente stock para {cart_item.product.nombre}. Stock disponible: {cart_item.product.stock}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            self._set_cart_session_header(response, cart.session_key)
            return response
        
        with transaction.atomic():
            cart_item.quantity = quantity
            cart_item.price = cart_item.product.get_precio_actual # Actualizar precio por si cambió
            cart_item.save()

        serializer = CartSerializer(cart, context={'request': request})
        response = Response(serializer.data, status=status.HTTP_200_OK)
        self._set_cart_session_header(response, cart.session_key)
        return response


    def delete(self, request, item_id=None, *args, **kwargs):
        """
        Elimina un ítem específico del carrito o vacía todo el carrito.
        """
        cart = self._get_cart_from_request(request)
        if not cart:
            response = Response({"detail": "Carrito no encontrado."}, status=status.HTTP_404_NOT_FOUND)
            self._set_cart_session_header(response, None)
            return response

        with transaction.atomic():
            if item_id:
                # Eliminar un ítem específico
                cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
                cart_item.delete()
            else:
                # Vaciar todo el carrito
                cart.items.all().delete()
            
            # Siempre devolvemos el carrito actualizado tras la eliminación
            serializer = CartSerializer(cart, context={'request': request})
            response = Response(serializer.data, status=status.HTTP_200_OK)
            self._set_cart_session_header(response, cart.session_key)
            return response

