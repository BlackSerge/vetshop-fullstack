
import { components } from '@/shared/types/api-generated';

export type AdminUser = components['schemas']['AdminUser'];
export type AdminUserDetail = components['schemas']['AdminUserDetail'];
export type Categoria = components['schemas']['Categoria'];
export type ProductoCreateUpdate = components['schemas']['ProductoCreateUpdate'];
export type Producto = components['schemas']['Producto'];
export type ImagenProductoAdmin = components['schemas']['ImagenProductoAdmin'];
export type AdminDashboardStatsResponse = components['schemas']['AdminDashboardStatsResponse'];
export type Order = components['schemas']['Order'];
export type OrderItem = components['schemas']['OrderItem'];
export type UserActivityLog = components['schemas']['UserActivityLog'];
export type PaginatedCategoriaList = components['schemas']['PaginatedCategoriaList'];
export type PaginatedProductoCreateUpdateList = components['schemas']['PaginatedProductoCreateUpdateList'];
export type PaginatedImagenProductoAdminList = components['schemas']['PaginatedImagenProductoAdminList'];


export interface GetProductsParams {
  page?: number;
  page_size?: number;
  search?: string;
  categoria?: string | number;
}


export interface GetUsersParams {
  page?: number;
  page_size?: number;
  search?: string;
}


export interface AdminUsersList {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUser[];
}


export interface AdminOrdersList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}


export interface SelectOption {
  value: string | number;
  label: string;
}


export interface FormError extends Record<string, string[] | string | undefined> {
  detail?: string;
}


export interface ProductFormState {
  nombre: string;
  descripcion_corta: string;
  descripcion_larga: string;
  precio: string | number; 
  precio_oferta: string | number | null; 
  categoria: string | number | null; 
  sku: string;
  stock: string | number; 
  is_active: boolean;
  is_featured: boolean;
  marca: string;
  tipo_mascota: string;
}

export interface ProductSubmitData {
  nombre: string;
  descripcion_corta: string;
  descripcion_larga: string;
  precio: string;
  precio_oferta: string | null; 
  categoria: number | null; 
  sku: string;
  stock: number; 
  is_active: boolean;
  is_featured: boolean;
  marca: string;
  tipo_mascota: string;
}

export interface CategoryFormState {
  nombre: string;
  slug: string;
  descripcion: string;
  is_active: boolean;
}

export interface UserFormState {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_active?: boolean;
  is_vip?: boolean;
}

export interface SuccessResponse {
  message: string;
}


export interface ErrorResponse {
  error: string;
  detail?: string;
}


export function isErrorResponse(obj: unknown): obj is ErrorResponse {
  return typeof obj === 'object' && obj !== null && 'error' in obj;
}


export function isAdminUserDetail(user: AdminUser | AdminUserDetail): user is AdminUserDetail {
  return 'activity_logs' in user && 'total_orders' in user;
}
