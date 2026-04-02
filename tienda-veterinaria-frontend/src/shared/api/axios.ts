import axios from 'axios';
import { toast } from 'react-toastify';

const getBaseUrl = () => {
    let url = '';
    
    if (import.meta.env.VITE_API_BASE_URL) {
        url = import.meta.env.VITE_API_BASE_URL;
    } 

    else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        url = 'http://127.0.0.1:8000/api';
    } 
   
    else if (/^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname)) {
        url = `http://${window.location.hostname}:8000/api`;
    } 
  
    else {
        url = '/api';
    }

    return url.endsWith('/') ? url.slice(0, -1) : url;
};

const BASE_URL = getBaseUrl();
const TOAST_ID_NETWORK = "network-error";
const TOAST_ID_AUTH = "auth-error";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const cartSessionKey = localStorage.getItem('cart_session_key');
    if (cartSessionKey && config.headers) {
      config.headers['X-Cart-Session'] = cartSessionKey;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
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

    if (!error.response && error.code !== "ERR_CANCELED") {
        
        const url = originalRequest.url || "";

        const detailMatch = url.match(/\/productos\/items\/(\d+)\/?$/);
        if (detailMatch) {
            const id = detailMatch[1];
            return {
                data: {
                    id: parseInt(id),
                    nombre: `Producto Detalle ${id}`,
                    effective_price: 1500 + (parseInt(id) * 10),
                    precio: 2000 + (parseInt(id) * 10),
                    imagen: `https://picsum.photos/600/600?random=${id}`,
                    categoria: 'perro',
                    descripcion: 'Producto de alta calidad para tu mascota.',
                    descripcion_larga: 'Este es un producto simulado porque el backend no está disponible. Incluye todas las características premium que esperas.',
                    stock: 15,
                    reviews: [
                        { id: 1, user_name: 'Juan Perez', rating: 5, comment: 'Excelente producto!', created_at: new Date().toISOString() },
                        { id: 2, user_name: 'Maria Garcia', rating: 4, comment: 'Muy bueno, llegó rápido.', created_at: new Date().toISOString() }
                    ]
                }
            };
        }

       
        if (url.includes('/productos/items')) {
            return {
                data: {
                    results: Array.from({ length: 12 }).map((_, i) => ({
                        id: i + 1, // IDs 1 a 12
                        nombre: `Producto Ejemplo ${i + 1}`,
                        effective_price: 1500 + (i * 100),
                        precio: 2000 + (i * 100),
                        imagen: `https://picsum.photos/400/400?random=${i}`,
                        categoria: 'perro',
                        stock: 10
                    })),
                    count: 24
                }
            };
        }

    
        if (url.includes('/productos/categorias')) {
             return {
                data: [
                    { id: 1, nombre: 'Alimentos', slug: 'alimentos' },
                    { id: 2, nombre: 'Juguetes', slug: 'juguetes' },
                    { id: 3, nombre: 'Higiene', slug: 'higiene' },
                ]
             };
        }
        
   
        if (url.includes('/productos/brands')) {
            return { data: ['Royal Canin', 'Pro Plan', 'Whiskas', 'Pedigree'] };
        }

    
        if (!toast.isActive(TOAST_ID_NETWORK)) {
            let msg = "No se puede conectar con el servidor.";
            if (url?.includes('create-payment-intent')) {
                msg = "Fallo al conectar con la pasarela de pagos.";
            }
            toast.error(msg, { toastId: TOAST_ID_NETWORK });
        }
        return Promise.reject(error);
    }


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
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          if (!toast.isActive(TOAST_ID_AUTH)) {
             toast.info("Sesión caducada.", { toastId: TOAST_ID_AUTH });
             if (!window.location.hash.includes('login')) {
                 window.location.href = '/#/login';
             }
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
