import { api } from '@/shared';

export const orderService = {
    createPaymentIntent: async (cartId: number): Promise<{clientSecret: string}> => {
        const response = await api.post<{clientSecret: string}>('pedidos/create-payment-intent/', { cart_id: cartId });
        return response.data;
    }
};

export default orderService;

