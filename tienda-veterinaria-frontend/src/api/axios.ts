// src/api/axios.ts
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';

// Definimos la URL base
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// --- CONSTANTES PARA CONTROLAR EL SPAM DE TOASTS (NUEVO) ---
const TOAST_ID_NETWORK = "network-error";
const TOAST_ID_SERVER = "server-error";

// 1. Crear instancia
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTOR DE REQUEST ---
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // A. Inyectar Token JWT
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // B. Inyectar X-Cart-Session
    const cartSessionKey = localStorage.getItem('cart_session_key');
    if (cartSessionKey && config.headers) {
      config.headers['X-Cart-Session'] = cartSessionKey;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --- INTERCEPTOR DE RESPONSE ---
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // A. Capturar y guardar X-Cart-Session si el backend lo envía/actualiza
    const incomingSessionKey = response.headers['x-cart-session'];
    if (incomingSessionKey) {
      const currentKey = localStorage.getItem('cart_session_key');
      if (currentKey !== incomingSessionKey) {
        localStorage.setItem('cart_session_key', incomingSessionKey);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // B. Capturar X-Cart-Session incluso si la petición falló
    if (error.response?.headers?.['x-cart-session']) {
        const incomingErrorKey = error.response.headers['x-cart-session'];
        localStorage.setItem('cart_session_key', incomingErrorKey);
    }

    // C. Manejo de Errores Globales (Toast Mejorado - Anti Spam)
    
    // 1. Error de Red (Backend apagado)
    if (!error.response) {
        // Solo mostramos si NO está activo ya
        if (!toast.isActive(TOAST_ID_NETWORK)) {
            toast.error("No se puede conectar con el servidor. Intenta más tarde.", {
                toastId: TOAST_ID_NETWORK // ID único
            });
        }
        return Promise.reject(error);
    }

    // 2. Error de Servidor (500)
    if (error.response.status >= 500) {
        // Solo mostramos si NO está activo ya
        if (!toast.isActive(TOAST_ID_SERVER)) {
            toast.error("Error interno del servidor. Estamos trabajando en ello.", {
                toastId: TOAST_ID_SERVER // ID único
            });
        }
    }

    // D. Lógica de Refresh Token (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/cuentas/token/refresh/`, {
            refresh: refreshToken,
          });

          localStorage.setItem('access_token', data.access);
          
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Evitar redirigir múltiples veces si fallan varias peticiones a la vez
          if (window.location.pathname !== '/login') {
              console.error("Sesión caducada");
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
              window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;