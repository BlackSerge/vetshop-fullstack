// src/types/index.ts

// --- USUARIOS ---
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_vip: boolean;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
  cart?: Cart; // El carrito puede venir en el login/registro
}

// --- PRODUCTOS ---
export interface Category {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  is_active: boolean;
}

export interface ProductImage {
  id: number;
  imagen: string; // URL absoluta
  alt_text?: string;
  is_feature: boolean;
  order: number;
}

export interface Product {
  id: number;
  nombre: string;
  slug: string;
  descripcion_corta?: string;
  descripcion_larga?: string;
  precio: number | string; // Django DecimalField puede venir como string a veces, mejor asegurar
  precio_oferta?: number | string | null;
  get_precio_actual: number; // Propiedad calculada del backend
  categoria?: number; // ID
  categoria_info?: Category; // Objeto anidado
  sku?: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  imagenes: ProductImage[];
  marca?: string;
  tipo_mascota?: 'perro' | 'gato' | 'ave' | 'roedor' | 'reptil' | 'otros' | 'ambos';
}

// --- CARRITO ---
export interface CartItem {
  id: number;
  product_id: number; // ID para enviar al backend
  product_name: string; // Read only
  product_slug: string; // Read only
  product_main_image: string | null; // URL
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Cart {
  id: number;
  user?: number | null;
  session_key?: string; // UUID
  items: CartItem[];
  total_price: number;
  created_at: string;
  updated_at: string;
}

// --- UTILIDADES ---
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}