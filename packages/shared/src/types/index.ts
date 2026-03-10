// Subscription / Plan types
export type PlanName = 'free' | 'starter' | 'growth' | 'pro';

export interface PlanLimits {
  products: number;             // -1 = unlimited
  competitors: number;          // -1 = unlimited
  coachInsights: number;        // -1 = unlimited; 0 = no access
  coachChatPerDay: number;      // -1 = unlimited; 0 = no access
  coachReportsPerMonth: number; // -1 = unlimited; 0 = no access
}

export interface SubscriptionInfo {
  plan: PlanName;
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  limits: PlanLimits;
  usage: {
    products: number;
    competitors: number;
  };
  current_period_end?: string | null;
  trial_ends_at?: string | null;
}

// User types
export interface User {
  id: number;
  email: string;
  name?: string;
  created_at: Date;
  updated_at: Date;
}

// User Settings types
export interface UserSettings {
  id: number;
  user_id: number;
  currency: string;
  units: string[];
  created_at: Date;
  updated_at: Date;
}

// Product types
export interface Product {
  id: number;
  user_id: number;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  batch_size: number;
  variants?: ProductVariant[];
  created_at: Date;
  updated_at: Date;
}

// Material types
export interface Material {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_cost: number;
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
  updated_at: Date;
}

// Coach types
export type ReportType = 'portfolio_analysis' | 'pricing_audit' | 'cost_reduction' | 'revenue_goal_path';

export interface CoachProfile {
  id: number;
  user_id: number;
  craft_type: string;
  sales_channels: string[];
  experience_years: string;
  primary_challenge: string;
  monthly_revenue_goal: number | null;
  completed_at: Date;
  updated_at: Date;
}

export interface CoachInsight {
  id: number;
  user_id: number;
  headline: string;
  body: string;
  action: string;
  impact_estimate: string | null;
  priority: number;
  category: string;
  related_product_id: number | null;
  related_product_name: string | null;
  status: 'unread' | 'read' | 'dismissed' | 'done';
  generated_at: Date;
}

export interface CoachChatMessage {
  id: number;
  user_id: number;
  role: 'user' | 'assistant';
  content: string;
  session_id: string;
  created_at: Date;
}

export interface CoachChatSession {
  id: number;
  session_id: string;
  title: string | null;
  created_at: Date;
  last_message_at: Date;
  message_count: number;
}

export interface CoachReport {
  id: number;
  user_id: number;
  report_type: ReportType;
  content: string;
  generated_at: Date;
}

export interface HealthScore {
  overall: number;
  margin_health: number;
  pricing_confidence: number;
  product_mix: number;
  sales_velocity: number;
  computed_at: string;
}

export interface ShopSnapshotProduct {
  id: number;
  name: string;
  status: string;
  batch_size: number;
  target_price: number | null;
  product_cost: number;
  profit_margin: number | null;
  pricing_method: string | null;
  category: string | null;
  units_sold_90d: number;
  revenue_90d: number;
  competitor_count: number;
  avg_competitor_price: number | null;
}

export interface ShopSnapshot {
  currency: string;
  revenue_goal: number | null;
  labor_hourly_cost: number | null;
  seller_country: string | null;
  products: ShopSnapshotProduct[];
  product_count: number;
  active_product_count: number;
  avg_margin: number | null;
  sales_summary: {
    total_revenue_90d: number;
    total_units_90d: number;
    best_selling_product_name: string | null;
    platform_breakdown: { platform: string; revenue: number }[];
  };
}

// Variant types
export interface VariantAttribute {
  id: number;
  variant_id: number;
  attribute_name: string;
  attribute_value: string;
  display_order: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  sku?: string;
  price_override?: number;
  cost_override?: number;
  stock_level: number;
  is_active: boolean;
  attributes?: VariantAttribute[];
  created_at: Date;
  updated_at: Date;
}

