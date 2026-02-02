export interface User {
    id: number;
    email: string;
    name?: string;
    created_at: Date;
    updated_at: Date;
}
export interface UserSettings {
    id: number;
    user_id: number;
    currency: string;
    units: string[];
    created_at: Date;
    updated_at: Date;
}
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
export interface PricingData {
    id: number;
    product_id: number;
    price: number;
    currency: string;
    calculation_method?: string;
    calculation_data?: Record<string, unknown>;
    updated_at: Date;
}
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
//# sourceMappingURL=index.d.ts.map