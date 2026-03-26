import api from '../../../shared/api/axios';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';

const authService = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/cuentas/token/', credentials);
        return response.data; 
    },

    register: async (userData: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post('/cuentas/registro/', userData);
        return response.data;
    },

    logout: async (): Promise<void> => {
        // Opcional: Llamada al backend si existe endpoint de blacklist
        // await api.post('/cuentas/logout/');
    },

    getProfile: async (): Promise<User> => {
        const response = await api.get('/cuentas/perfil/');
        return response.data;
    },

    updateProfile: async (userData: Partial<User>): Promise<User> => {
        const response = await api.patch('/cuentas/perfil/', userData);
        return response.data;
    },

    changePassword: async (old_password: string, new_password: string, new_password_confirm: string): Promise<any> => {
        const response = await api.post('/cuentas/cambiar-contrasena/', { old_password, new_password, new_password_confirm });
        return response.data;
    },

    requestPasswordReset: async (email: string): Promise<any> => {
        const response = await api.post('/cuentas/restablecer-contrasena/solicitar/', { email });
        return response.data;
    },

    confirmPasswordReset: async (uidb64: string, token: string, new_password: string, new_password_confirm: string): Promise<any> => {
        const response = await api.post('/cuentas/restablecer-contrasena/confirmar/', { uidb64, token, new_password, new_password_confirm });
        return response.data;
    },

    getMyOrders: async (): Promise<any[]> => {
        const response = await api.get('/pedidos/my-orders/');
        return response.data; 
    },

    deleteAccount: async (): Promise<boolean> => {
        await api.delete('/cuentas/perfil/'); 
        return true;
    }
};

export default authService;

