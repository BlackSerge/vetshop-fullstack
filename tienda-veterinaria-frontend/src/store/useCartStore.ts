import { create } from 'zustand';
import api from '../api/axios';
import { Cart, CartItem, Product } from '../types';
import { toast } from 'react-toastify';

interface CartState {
  items: CartItem[];
  totalPrice: number;
  count: number;
  isLoading: boolean;
  isAnimating: boolean; 
  
  // Acciones
  fetchCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  setCart: (cart: Cart) => void; // Para uso interno (login/fusión)
  clearLocalCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalPrice: 0,
  count: 0,
  isLoading: false,
  isAnimating: false,
 

setCart: (cart: Cart) => {
    // Protección: Si cart es null o items es undefined, usa array vacío
    const items = cart?.items || []; 
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    
    set({ 
        items: items, 
        totalPrice: Number(cart?.total_price || 0), 
        count: totalItems 
    });
  },

  clearLocalCart: () => {
      set({ items: [], totalPrice: 0, count: 0 });
  },

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<Cart>('/carrito/cart/');
      get().setCart(data);
    } catch (error) {
      console.error("Error fetching cart", error);
      // No mostramos toast aquí porque puede ser la carga inicial silenciosa
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (product, quantity = 1) => {
    // Optimistic UI Update (Opcional, por ahora hacemos fetch tras post)
    try {
      const { data } = await api.post<Cart>('/carrito/cart/', {
        product_id: product.id,
        quantity,
      });
      get().setCart(data);
      toast.success(`${product.nombre} añadido al carrito`);
          // Activar animación
      set({ isAnimating: true });
      
      // Desactivar después de 500ms
      setTimeout(() => set({ isAnimating: false }), 2000);

    } catch (error: any) {
      const msg = error.response?.data?.detail || "Error al añadir";
      toast.error(msg);
    }
  },

  updateQuantity: async (itemId, quantity) => {
    if (quantity <= 0) return get().removeItem(itemId);
    
    try {
      const { data } = await api.put<Cart>('/carrito/cart/', {
        item_id: itemId,
        quantity,
      });
      get().setCart(data);
    } catch (error: any) {
       toast.error(error.response?.data?.detail || "Error al actualizar");
    }
  },

  removeItem: async (itemId) => {
    try {
      const { data } = await api.delete<Cart>(`/carrito/cart/items/${itemId}/`);
      get().setCart(data);
      toast.warn("Producto eliminado");
    } catch (error: any) {
      toast.error("Error al eliminar");
    }
  },

  clearCart: async (silent = false) => { // Nuevo parámetro
    try {
      const { data } = await api.delete<Cart>('/carrito/cart/');
      get().setCart(data);
      
      if (!silent) { // Solo muestra toast si no es silencioso
          toast.info("Carrito vaciado");
      }
    } catch (error) {
      // ...
    }
  
  }
}));