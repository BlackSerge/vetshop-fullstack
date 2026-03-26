export interface CartItem {
  id: number;
  product_id: number; 
  product_name: string; 
  product_slug: string; 
  product_main_image: string | null; 
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Cart {
  id: number;
  user?: number | null;
  session_key?: string; 
  items: CartItem[];
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface AddToCartRequest {
  product_id: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  item_id: number;
  quantity: number;
}

