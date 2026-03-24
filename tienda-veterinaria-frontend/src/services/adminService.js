// src/services/adminService.js
import api from '../api/axios';

const adminService = {
    // --- CATEGORÍAS ---
    getCategories: async () => {
        const response = await api.get('/productos/admin/categorias/');
        return response.data;
    },
    getCategory: async (slug) => {
        const response = await api.get(`/productos/admin/categorias/${slug}/`);
        return response.data;
    },
    createCategory: async (categoryData) => {
        const response = await api.post('/productos/admin/categorias/', categoryData);
        return response.data;
    },
    updateCategory: async (slug, categoryData) => {
        const response = await api.patch(`/productos/admin/categorias/${slug}/`, categoryData);
        return response.data;
    },
    deleteCategory: async (slug) => {
        await api.delete(`/productos/admin/categorias/${slug}/`);
        return true;
    },

    // --- PRODUCTOS (AQUÍ ESTÁ LA CORRECCIÓN) ---
    getProducts: async (params = {}) => {
        // 1. Limpiar parámetros: eliminamos undefined, null o strings vacíos
        const cleanParams = {};
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                cleanParams[key] = params[key];
            }
        });

        // 2. Crear query string solo con los datos válidos
        const query = new URLSearchParams(cleanParams).toString();
        
    

        const response = await api.get(`/productos/admin/items/?${query}`);
        return response.data;
    },

    getProduct: async (slug) => {
        const response = await api.get(`/productos/admin/items/${slug}/`);
        return response.data;
    },
    createProduct: async (productData) => {
        const response = await api.post('/productos/admin/items/', productData);
        return response.data;
    },
    updateProduct: async (slug, productData) => {
        const response = await api.patch(`/productos/admin/items/${slug}/`, productData);
        return response.data;
    },
    deleteProduct: async (slug) => {
        await api.delete(`/productos/admin/items/${slug}/`);
        return true;
    },

    // --- IMÁGENES DE PRODUCTO ---
    getProductImages: async (productSlug) => {
        const response = await api.get(`/productos/admin/imagenes/?product_slug=${productSlug}`); 
        return response.data;
    },
    uploadProductImage: async (formData) => {
        const response = await api.post('/productos/admin/imagenes/', formData);
        return response.data;
    },
    updateProductImage: async (imageId, imageData) => {
        const response = await api.patch(`/productos/admin/imagenes/${imageId}/`, imageData);
        return response.data;
    },
    deleteProductImage: async (imageId) => {
        await api.delete(`/productos/admin/imagenes/${imageId}/`);
        return true;
    },



// --- USUARIOS (ESTO ES LO QUE FALTABA) ---
    getUsers: async (params = {}) => {
        const cleanParams = {};
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                cleanParams[key] = params[key];
            }
        });
        const query = new URLSearchParams(cleanParams).toString();
        // Asegúrate de que la URL coincida con tu backend/urls.py
        const response = await api.get(`/cuentas/admin/users/?${query}`);
        return response.data;
    },

    getUser: async (id) => {
        const response = await api.get(`/cuentas/admin/users/${id}/`);
        return response.data;
    },

    updateUser: async (id, userData) => {
        const response = await api.patch(`/cuentas/admin/users/${id}/`, userData);
        return response.data;
    },

    deleteUser: async (id) => {
        await api.delete(`/cuentas/admin/users/${id}/`);
        return true;
    },

     // --- PEDIDOS (NUEVO) ---
    getUserOrders: async (userId) => {
        // Asumiendo que crearás este endpoint o filtrarás el general
        const response = await api.get(`/pedidos/admin/orders/?user=${userId}`);
        return response.data;
    },
    getDashboardStats: async (period = '30d') => {
        const response = await api.get(`/pedidos/admin/stats/?period=${period}`);
        return response.data;
    },
    

    
};


export default adminService;