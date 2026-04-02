export interface Category {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  is_active: boolean;
}

export interface ProductImage {
  id: number;
  imagen: string; 
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
  precio: number | string; 
  precio_oferta?: number | string | null;
  get_precio_actual: number; 
  categoria?: number; 
  categoria_info?: Category; 
  sku?: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  imagenes: ProductImage[];
  marca?: string;
  tipo_mascota?: 'perro' | 'gato' | 'ave' | 'roedor' | 'reptil' | 'otros' | 'ambos';
}

