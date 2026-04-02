
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, serializers
from drf_spectacular.utils import extend_schema
from .serializers import CartSerializer
from .services import CartService
from .exceptions import (
    CartServiceError,
    CartNotFoundError,
    CartItemNotFoundError,
    InvalidQuantityError,
    InsufficientStockError,
    ProductNotFoundError,
    EmptyCartError,

)



CART_SESSION_KEY_HEADER = "X-Cart-Session"


class CartView(APIView):
    

    permission_classes = [permissions.AllowAny]
    serializer_class = CartSerializer

    class CartItemMutationSerializer(serializers.Serializer):
        product_id = serializers.IntegerField(required=False)
        item_id = serializers.IntegerField(required=False)
        quantity = serializers.IntegerField(required=False)


    def _get_cart_from_request(self, request):
       
        return CartService.get_cart(
            user=request.user,
            session_key=request.headers.get(CART_SESSION_KEY_HEADER),
        )

    def _set_cart_session_header(self, response, cart_session_key):
       
        if cart_session_key:
            response[CART_SESSION_KEY_HEADER] = str(cart_session_key)

    @extend_schema(responses={200: CartSerializer, 201: CartSerializer})
    def get(self, request, *args, **kwargs):
 
        try:
            cart = self._get_cart_from_request(request)

            if not cart:
               
                cart = CartService.create_anonymous_cart()
                response_status = status.HTTP_201_CREATED
            else:
                response_status = status.HTTP_200_OK

            serializer = CartSerializer(cart, context={"request": request})
            response = Response(serializer.data, status=response_status)
            self._set_cart_session_header(response, cart.session_key)
            return response

        except CartServiceError as e:
            response = Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
            return response
        except Exception as e:
            response = Response(
                {"detail": "Error al obtener carrito"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
            return response
        
        
    @extend_schema(
        request=CartItemMutationSerializer,
        responses={200: CartSerializer},
    )

    def post(self, request, *args, **kwargs):
      
        product_id = request.data.get("product_id")
        quantity = request.data.get("quantity")

        try:
            if not product_id or not quantity:
                return Response(
                    {"detail": "product_id y quantity son requeridos."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

       
            cart = self._get_cart_from_request(request)
            if not cart:
                cart = CartService.create_anonymous_cart()

            
            CartService.add_product_to_cart(cart.id, product_id, quantity)

            cart.refresh_from_db()
            serializer = CartSerializer(cart, context={"request": request})
            response = Response(serializer.data, status=status.HTTP_200_OK)
            self._set_cart_session_header(response, cart.session_key)
            return response

        except InvalidQuantityError as e:
            response = Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response
        except InsufficientStockError as e:
            response = Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response
        except ProductNotFoundError as e:
            response = Response({"detail": e.message}, status=status.HTTP_404_NOT_FOUND)
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response
        except CartServiceError as e:
            response = Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response
        except Exception as e:
            response = Response(
                {"detail": "Error al añadir producto"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response
        
    @extend_schema(
        request=CartItemMutationSerializer,
        responses={200: CartSerializer},
    )

    def put(self, request, *args, **kwargs):
     
        item_id = request.data.get("item_id")
        quantity = request.data.get("quantity")

        try:
            if not item_id or quantity is None:
                return Response(
                    {"detail": "item_id y quantity son requeridos."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            cart = self._get_cart_from_request(request)
            if not cart:
                response = Response(
                    {"detail": "Carrito no encontrado."},
                    status=status.HTTP_404_NOT_FOUND,
                )
                return response

            CartService.update_cart_item(cart.id, item_id, quantity)

            cart.refresh_from_db()
            serializer = CartSerializer(cart, context={"request": request})
            response = Response(serializer.data, status=status.HTTP_200_OK)
            self._set_cart_session_header(response, cart.session_key)
            return response

        except CartNotFoundError as e:
            response = Response({"detail": e.message}, status=status.HTTP_404_NOT_FOUND)
            return response
        except CartItemNotFoundError as e:
            response = Response({"detail": e.message}, status=status.HTTP_404_NOT_FOUND)
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response
        except InvalidQuantityError as e:
            response = Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response
        except InsufficientStockError as e:
            response = Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response
        except CartServiceError as e:
            response = Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response
        except Exception as e:
            response = Response(
                {"detail": "Error al actualizar carrito"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response

    @extend_schema(responses={200: CartSerializer})
    def delete(self, request, item_id=None, *args, **kwargs):
        
        try:
         
            cart = self._get_cart_from_request(request)
            if not cart:
                response = Response(
                    {"detail": "Carrito no encontrado."},
                    status=status.HTTP_404_NOT_FOUND,
                )
                return response

            if item_id:
               
                CartService.remove_item_from_cart(cart.id, item_id)
            else:
   
                CartService.clear_cart(cart.id)

            cart.refresh_from_db()
            serializer = CartSerializer(cart, context={"request": request})
            response = Response(serializer.data, status=status.HTTP_200_OK)
            self._set_cart_session_header(response, cart.session_key)
            return response

        except CartNotFoundError as e:
            response = Response({"detail": e.message}, status=status.HTTP_404_NOT_FOUND)
            return response
        except CartItemNotFoundError as e:
            response = Response({"detail": e.message}, status=status.HTTP_404_NOT_FOUND)
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response
        except EmptyCartError as e:
            response = Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response
        except CartServiceError as e:
            response = Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response
        except Exception as e:
            response = Response(
                {"detail": "Error al eliminar del carrito"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
            if cart:
                self._set_cart_session_header(response, cart.session_key)
            return response

