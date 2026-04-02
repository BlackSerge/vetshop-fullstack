import { api } from '@/shared';

const adminService = {

    getCategories: async () => {
        const response = await api.get('/productos/admin/categorias/');
        return response.data;
    },
    getCategory: async (slug: string) => {
        const response = await api.get(`/productos/admin/categorias/${slug}/`);
        return response.data;
    },
    createCategory: async (categoryData: any) => {
        const response = await api.post('/productos/admin/categorias/', categoryData);
        return response.data;
    },
    updateCategory: async (slug: string, categoryData: any) => {
        const response = await api.patch(`/productos/admin/categorias/${slug}/`, categoryData);
        return response.data;
    },
    deleteCategory: async (slug: string) => {
        await api.delete(`/productos/admin/categorias/${slug}/`);
        return true;
    },

    getProducts: async (params: Record<string, any> = {}) => {
        const cleanParams: Record<string, any> = {};
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                cleanParams[key] = params[key];
            }
        });
        const query = new URLSearchParams(cleanParams).toString();
        const response = await api.get(`/productos/admin/items/?${query}`);
        return response.data;
    },

    getProduct: async (slug: string) => {
        const response = await api.get(`/productos/admin/items/${slug}/`);
        return response.data;
    },
    createProduct: async (productData: any) => {
        const response = await api.post('/productos/admin/items/', productData);
        return response.data;
    },
    updateProduct: async (slug: string, productData: any) => {
        const response = await api.patch(`/productos/admin/items/${slug}/`, productData);
        return response.data;
    },
    deleteProduct: async (slug: string) => {
        await api.delete(`/productos/admin/items/${slug}/`);
        return true;
    },

    getProductImages: async (productSlug: string) => {
        const response = await api.get(`/productos/admin/imagenes/?product_slug=${productSlug}`); 
        return response.data;
    },
    uploadProductImage: async (formData: FormData) => {
        const response = await api.post('/productos/admin/imagenes/', formData);
        return response.data;
    },
    updateProductImage: async (imageId: number | string, imageData: any) => {
        const response = await api.patch(`/productos/admin/imagenes/${imageId}/`, imageData);
        return response.data;
    },
    deleteProductImage: async (imageId: number | string) => {
        await api.delete(`/productos/admin/imagenes/${imageId}/`);
        return true;
    },


    getUsers: async (params: Record<string, any> = {}) => {
        const cleanParams: Record<string, any> = {};
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                cleanParams[key] = params[key];
            }
        });
        const query = new URLSearchParams(cleanParams).toString();
        const response = await api.get(`/cuentas/admin/users/?${query}`);
        return response.data;
    },

    getUser: async (id: number | string | undefined) => {
        const response = await api.get(`/cuentas/admin/users/${id}/`);
        return response.data;
    },

    updateUser: async (id: number | string, userData: any) => {
        const response = await api.patch(`/cuentas/admin/users/${id}/`, userData);
        return response.data;
    },

    deleteUser: async (id: number | string) => {
        await api.delete(`/cuentas/admin/users/${id}/`);
        return true;
    },


    getUserOrders: async (userId: number | string | undefined) => {
        const response = await api.get(`/pedidos/admin/orders/?user=${userId}`);
        return response.data;
    },
    getDashboardStats: async (period = '30d') => {
        const response = await api.get(`/pedidos/admin/stats/?period=${period}`);
        return response.data;
    },
};

export default adminService;
