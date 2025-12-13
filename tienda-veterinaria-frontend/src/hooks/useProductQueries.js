import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../api/axios';

// --- HOOK: LISTA DE PRODUCTOS CON FILTROS ---
export const useProducts = (filters, page, pageSize) => {
  return useQuery({
    queryKey: ['products', filters, page], 
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.categorySlug && filters.categorySlug !== "todos") {
        params.append("categoria", filters.categorySlug);
      }
      if (filters.search) params.append("search", filters.search);
      if (filters.priceMin) params.append("priceMin", filters.priceMin);
      if (filters.priceMax) params.append("priceMax", filters.priceMax);
      if (filters.brand && filters.brand !== "Todas") params.append("brand", filters.brand);
      
      if (filters.petType && filters.petType !== "todos") {
        params.append("petType", filters.petType.toLowerCase());
      }
      
      if (filters.sort) {
        let backendSort = "";
        switch (filters.sort) {
          case "price-asc": backendSort = "effective_price"; break;
          case "price-desc": backendSort = "-effective_price"; break;
          case "name-asc": backendSort = "nombre"; break;
          case "name-desc": backendSort = "-nombre"; break;
          default: break;
        }
        if (backendSort) params.append("ordering", backendSort);
      }
      
      params.append("page", page.toString());
      params.append("page_size", pageSize.toString());

      const response = await api.get(`/productos/items/?${params.toString()}`);
      return response.data;
    },
    placeholderData: keepPreviousData, // Mantiene los datos anteriores para paginación suave
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// --- HOOK: DETALLE DE PRODUCTO ---
export const useProductDetail = (id) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
        if (!id) return null;
        const response = await api.get(`/productos/items/${id}/`);
        return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, 
  });
};

// --- HOOK: CATEGORÍAS ---
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get("/productos/categorias/");
      return Array.isArray(response.data) ? response.data : (response.data.results || []);
    },
    staleTime: 1000 * 60 * 60, 
  });
};

// --- HOOK: MARCAS ---
export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await api.get("/productos/brands/");
      return response.data;
    },
    staleTime: 1000 * 60 * 60, 
  });
};