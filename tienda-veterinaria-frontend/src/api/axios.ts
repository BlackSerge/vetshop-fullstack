import axios from 'axios';
import { toast } from 'react-toastify';

// --- CONFIGURACIÓN DINÁMICA DE URL ---
// Esto permite probar en móvil dentro de la misma red Wifi.
// Si estás en localhost, usa 127.0.0.1. Si estás en 192.168.1.X, usa esa IP para el backend.
const getBaseUrl = () => {
    // 1. Si existe variable de entorno, tiene prioridad
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    
    // 2. Detección automática para desarrollo en red local (Móvil)
    const { hostname } = window.location;
    
    // Si no es localhost, asumimos que estamos accediendo por IP (ej: 192.168.1.50)
    // y que el backend corre en la misma IP en el puerto 8000.
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:8000/api`;
    }

    // 3. Fallback por defecto (PC Local)
    return 'http://127.0.0.1:8000/api';
};

const BASE_URL = getBaseUrl();

// --- CONSTANTES PARA CONTROLAR EL SPAM DE TOASTS ---
const TOAST_ID_NETWORK = "network-error";

// 1. Crear instancia
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTOR DE REQUEST ---
api.interceptors.request.use(
  (config) => {
    // A. Inyectar Token JWT
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // B. Inyectar X-Cart-Session (Para carritos anónimos)
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
  (response) => {
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

    // C. Manejo de Errores Globales
    
    // 1. Error de Red (Backend apagado o IP incorrecta en móvil)
    if (!error.response) {
        // Evitamos spammear toasts si ya hay uno activo
        if (!toast.isActive(TOAST_ID_NETWORK)) {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const msg = isMobile 
                ? "Error de conexión. Asegúrate de que el backend corre en 0.0.0.0:8000" 
                : "No se puede conectar con el servidor.";
            toast.error(msg, { toastId: TOAST_ID_NETWORK });
        }
        return Promise.reject(error);
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
          // Sesión caducada real
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
             window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    }

    return Promise.reject(error);
  }
);

export default api;