// User types
export interface User {
  id: number;
  email: string;
  name?: string;
  created_at: Date;
  updated_at: Date;
}

// Product types
export interface Product {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  category?: string;
  created_at: Date;
  updated_at: Date;
}

// Pricing data types
export interface PricingData {
  id: number;
  product_id: number;
  price: number;
  currency: string;
  calculation_method?: string;
  calculation_data?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

