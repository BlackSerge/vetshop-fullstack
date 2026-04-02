import { create } from 'zustand';
import cartService from '../services/cartService';
import { Cart, CartItem } from '../types';
import { Product } from '../../products/types';
import { toast } from 'react-toastify';

interface CartState {
  items: CartItem[];
  totalPrice: number;
  count: number;
  isLoading: boolean;
  isAnimating: boolean; 
  cartId: number | null;
  
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
  cartId: null,
 

setCart: (cart: Cart) => {
    const items = cart?.items || []; 
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    
    set({ 
        items: items, 
        totalPrice: Number(cart?.total_price || 0), 
        count: totalItems,
        cartId: cart?.id || null,
    });
  },

  clearLocalCart: () => {
      set({ items: [], totalPrice: 0, count: 0, cartId: null });
  },

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const data = await cartService.getCart();
      get().setCart(data);
    } catch (error) {
      console.error("Error fetching cart", error);
 
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (product: Product, quantity: number = 1) => {

    try {
      const data = await cartService.addItem({
        product_id: product.id,
        quantity,
      });
      get().setCart(data);
      toast.success(`${product.nombre} añadido al carrito`);
         
      set({ isAnimating: true });
      
      setTimeout(() => set({ isAnimating: false }), 2000);

    } catch (error: any) {
      const msg = error.response?.data?.detail || "Error al añadir";
      toast.error(msg);
    }
  },

  updateQuantity: async (itemId: number, quantity: number) => {
    if (quantity <= 0) return get().removeItem(itemId);
    
    try {
      const data = await cartService.updateQuantity({
        item_id: itemId,
        quantity,
      });
      get().setCart(data);
    } catch (error: any) {
       toast.error(error.response?.data?.detail || "Error al actualizar");
    }
  },

  removeItem: async (itemId: number) => {
    try {
      const data = await cartService.removeItem(itemId);
      get().setCart(data);
      toast.warn("Producto eliminado");
    } catch (error: any) {
      toast.error("Error al eliminar");
    }
  },

  clearCart: async (silent = false) => { 
    try {
      const data = await cartService.clearCart();
      get().setCart(data);
      
      if (!silent) { 
          toast.info("Carrito vaciado");
      }
    } catch (error) {
      
    }
  
  }
}));
