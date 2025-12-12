import axios from 'axios';
import { toast } from 'react-toastify';

// --- 1. FUNCIÓN PARA OBTENER LA URL DEL BACKEND ---
const getBaseUrl = () => {
    // A. Si existe la variable de entorno (Ideal para Vercel/Producción)
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    
    // Obtener datos de la URL actual del navegador
    const { hostname } = window.location;

    // B. Entorno Localhost (PC)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://127.0.0.1:8000/api';
    }

    // C. Entorno Red Local (Móvil probando en WiFi)
    // Detecta si es una IP tipo 192.168.x.x
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
        return `http://${hostname}:8000/api`;
    }

    // D. Fallback para Producción (Si olvidaste la variable de entorno)
    // Asume que el backend está en el mismo dominio bajo /api
    return '/api'; 
};

const BASE_URL = getBaseUrl();

console.log(`🔌 Conectando API a: ${BASE_URL}`); // Para depuración en consola

// IDs para evitar que se acumulen mensajes de error repetidos
const TOAST_ID_NETWORK = "network-error";
const TOAST_ID_AUTH = "auth-error";

// --- 2. CREAR INSTANCIA DE AXIOS ---
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // timeout: 10000, // Opcional: 10 segundos de espera máxima
});

// --- 3. INTERCEPTOR DE SALIDA (REQUEST) ---
api.interceptors.request.use(
  (config) => {
    // Inyectar Token de Usuario si existe
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Inyectar Sesión de Carrito Anónimo
    const cartSessionKey = localStorage.getItem('cart_session_key');
    if (cartSessionKey && config.headers) {
      config.headers['X-Cart-Session'] = cartSessionKey;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --- 4. INTERCEPTOR DE LLEGADA (RESPONSE) ---
api.interceptors.response.use(
  (response) => {
    // Guardar la sesión del carrito si el backend la envía
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

    // A. Manejo de Errores de Conexión (Network Error)
    if (!error.response) {
        if (!toast.isActive(TOAST_ID_NETWORK)) {
            // Mensaje amigable dependiendo del entorno
            let msg = "No se puede conectar con el servidor.";
            
            if (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192')) {
                msg = "Error de conexión. Asegúrate de que Django esté corriendo (python manage.py runserver 0.0.0.0:8000).";
            }
            
            console.error("🚨 Error de Red:", error);
            toast.error(msg, { toastId: TOAST_ID_NETWORK });
        }
        return Promise.reject(error);
    }

    // B. Guardar sesión de carrito incluso si hubo error (ej. validación)
    if (error.response?.headers?.['x-cart-session']) {
        localStorage.setItem('cart_session_key', error.response.headers['x-cart-session']);
    }

    // C. Manejo de Token Expirado (401)
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Intentar renovar el token
          const { data } = await axios.post(`${BASE_URL}/cuentas/token/refresh/`, {
            refresh: refreshToken,
          });

          localStorage.setItem('access_token', data.access);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          
          // Reintentar la petición original con el nuevo token
          return api(originalRequest);

        } catch (refreshError) {
          // Si falla la renovación, cerrar sesión
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          if (!toast.isActive(TOAST_ID_AUTH)) {
             toast.info("Tu sesión ha caducado. Ingresa nuevamente.", { toastId: TOAST_ID_AUTH });
             // Redirigir al login
             if (!window.location.hash.includes('login')) {
                 window.location.href = '/#/login';
             }
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No hay refresh token, limpiar y redirigir
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    }

    return Promise.reject(error);
  }
);

export default api;