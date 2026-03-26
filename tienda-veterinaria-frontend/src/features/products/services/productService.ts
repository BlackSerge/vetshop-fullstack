// src/services/productService.ts
import api from '../../../shared/api/axios';
import { PaginatedResponse } from '../../../shared/types';
import { Product, Category } from '../types';

export const productService = {
    getProductBySlug: async (slug: string): Promise<Product> => {
        const response = await api.get<Product>(`/productos/items/${slug}/`);
        return response.data;
    },
    getProducts: async (queryString: string): Promise<PaginatedResponse<Product>> => {
        const response = await api.get<PaginatedResponse<Product>>(`/productos/items/?${queryString}`);
        return response.data;
    },
    getCategories: async (): Promise<Category[]> => {
        const response = await api.get("/productos/categorias/");
        return Array.isArray(response.data) ? response.data : (response.data.results || []);
    },
    getBrands: async (): Promise<any> => {
        const response = await api.get("/productos/brands/");
        return response.data;
    },
    getFeaturedProducts: async (): Promise<Product[]> => {
        const response = await api.get<PaginatedResponse<Product>>('/productos/items/?featured=true&page_size=8');
        return response.data.results;
    },
    createProductReview: async (productId: string | number, payload: {rating: number, comment: string}): Promise<any> => {
        const response = await api.post(`/productos/items/${productId}/reviews/`, payload);
        return response.data;
    }
};

export default productService;

