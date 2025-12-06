import api from '../api/axios';

const productService = {
    getProductBySlug: async (slug) => {
        const response = await api.get(`/productos/items/${slug}/`);
        return response.data;
    },
    // Futuro: getRelatedProducts(slug)
};

export default productService;