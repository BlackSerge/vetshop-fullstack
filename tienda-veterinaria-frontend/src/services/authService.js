// src/services/authService.js
import api from '../api/axios'; // <--- CAMBIO IMPORTANTE

const authService = {
    // Estos métodos devuelven la respuesta raw, el Store se encarga de guardar en localStorage
    login: async (username, password) => {
        const response = await api.post('/cuentas/token/', { username, password });
        return response.data; 
    },

    register: async (username, email, password, password2) => {
        const response = await api.post('/cuentas/registro/', { username, email, password, password2 });
        return response.data;
    },

    // El logout ahora lo maneja 100% el store, pero podemos dejar esto si queremos llamar al backend
    logout: () => {
        // Opcional: Llamada al backend para blacklist
        // localStorage ya se limpia en useAuthStore.ts
    },

    getProfile: async () => {
        const response = await api.get('/cuentas/perfil/');
        return response.data;
    },

    updateProfile: async (userData) => {
        const response = await api.patch('/cuentas/perfil/', userData);
        return response.data;
    },

    changePassword: async (old_password, new_password, new_password_confirm) => {
        const response = await api.post('/cuentas/cambiar-contrasena/', { old_password, new_password, new_password_confirm });
        return response.data;
    },

    requestPasswordReset: async (email) => {
        const response = await api.post('/cuentas/restablecer-contrasena/solicitar/', { email });
        return response.data;
    },

    confirmPasswordReset: async (uidb64, token, new_password, new_password_confirm) => {
        const response = await api.post('/cuentas/restablecer-contrasena/confirmar/', { uidb64, token, new_password, new_password_confirm });
        return response.data;
    },

    getMyOrders: async () => {
        const response = await api.get('/pedidos/my-orders/');
        return response.data; 
    },

    deleteAccount: async () => {
    await api.delete('/cuentas/perfil/'); 
    return true;
}

};

export default authService;