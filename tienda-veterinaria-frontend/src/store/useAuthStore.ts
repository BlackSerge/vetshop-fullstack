// src/store/useAuthStore.ts
import { create } from 'zustand';
import api from '../api/axios'; // Usamos nuestra nueva instancia
import { User, AuthResponse, Cart } from '../types';
import { useCartStore } from './useCartStore'; // Para actualizar el carrito al login

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isStaff: boolean;
  isLoading: boolean;
  
  // Acciones
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, password2: string) => Promise<void>;
  logout: () => Promise<void>; // <--- OJO: Ahora es Promise porque hace petición async
  checkAuth: () => void; 
  updateProfileLocal: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isStaff: false,
  isLoading: true, 

  login: async (username, password) => {
    try {
      const { data } = await api.post<AuthResponse>('/cuentas/token/', { username, password });
      
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));

      set({ 
        user: data.user, 
        isAuthenticated: true, 
        isStaff: data.user.is_staff 
      });

      if (data.cart) {
        useCartStore.getState().setCart(data.cart);
      } else {
        useCartStore.getState().fetchCart();
      }

    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  },

  register: async (username, email, password, password2) => {
    try {
      const { data } = await api.post<AuthResponse>('/cuentas/registro/', { 
        username, email, password, password2 
      });

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));

      set({ 
        user: data.user, 
        isAuthenticated: true, 
        isStaff: data.user.is_staff 
      });
      
      if (data.cart) {
         useCartStore.getState().setCart(data.cart);
      } else {
         useCartStore.getState().fetchCart();
      }

    } catch (error) {
      console.error("Register failed", error);
      throw error;
    }
  },

  // --- LOGOUT MEJORADO CON AUDITORÍA ---
  logout: async () => {
    try {
        // Intentamos notificar al backend para el log de auditoría
        // Usamos 'await' pero atrapamos el error para que el logout local ocurra sí o sí
        await api.post('/cuentas/logout/'); 
    } catch (e) {
        console.warn("No se pudo registrar el logout en backend (pero cerramos sesión local)", e);
    } finally {
        // Limpieza local SIEMPRE ocurre, falle o no el backend
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('cart_session_key');
        
        set({ user: null, isAuthenticated: false, isStaff: false });
        
        useCartStore.getState().clearLocalCart(); 
        useCartStore.getState().fetchCart(); // Obtener nuevo carrito anónimo
    }
  },

  checkAuth: () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    if (userStr && token) {
      try {
        const user: User = JSON.parse(userStr);
        set({ 
            user, 
            isAuthenticated: true, 
            isStaff: user.is_staff || user.is_superuser,
            isLoading: false 
        });
      } catch (e) {
        set({ user: null, isAuthenticated: false, isStaff: false, isLoading: false });
      }
    } else {
      set({ user: null, isAuthenticated: false, isStaff: false, isLoading: false });
    }
  },

  updateProfileLocal: (user: User) => {
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isStaff: user.is_staff });
  }

}));