import { api } from '@/shared';
import { Cart, AddToCartRequest, UpdateCartItemRequest } from '../types';

export const cartService = {
    getCart: async (): Promise<Cart> => {
        const response = await api.get<Cart>('/carrito/cart/');
        return response.data;
    },

    addItem: async (payload: AddToCartRequest): Promise<Cart> => {
        const response = await api.post<Cart>('/carrito/cart/', payload);
        return response.data;
    },

    updateQuantity: async (payload: UpdateCartItemRequest): Promise<Cart> => {
        const response = await api.put<Cart>('/carrito/cart/', payload);
        return response.data;
    },

    removeItem: async (itemId: number): Promise<Cart> => {
        const response = await api.delete<Cart>(`/carrito/cart/items/${itemId}/`);
        return response.data;
    },

    clearCart: async (): Promise<Cart> => {
        const response = await api.delete<Cart>('/carrito/cart/');
        return response.data;
    }
};

export default cartService;

