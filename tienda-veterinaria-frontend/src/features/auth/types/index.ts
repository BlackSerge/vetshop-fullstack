import { Cart } from '../../cart/types';

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
  cart?: Cart; 
}

export interface LoginRequest {
  username?: string;
  email?: string;
  password?: string;
}

export interface RegisterRequest {
  username?: string;
  email?: string;
  password?: string;
  password2?: string;
  first_name?: string;
  last_name?: string;
}

