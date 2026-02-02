import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name?: string | undefined;
}, {
    email: string;
    password: string;
    name?: string | undefined;
}>;
export declare const loginUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const updateUserSettingsSchema: z.ZodObject<{
    currency: z.ZodString;
    units: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    currency: string;
    units: string[];
}, {
    currency: string;
    units: string[];
}>;
export declare const createMaterialSchema: z.ZodObject<{
    name: z.ZodString;
    quantity: z.ZodNumber;
    unit: z.ZodString;
    price_per_unit: z.ZodNumber;
    user_material_id: z.ZodOptional<z.ZodNumber>;
    units_made: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    units_made: number;
    user_material_id?: number | undefined;
}, {
    name: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    user_material_id?: number | undefined;
    units_made?: number | undefined;
}>;
export declare const updateMaterialSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    unit: z.ZodOptional<z.ZodString>;
    price_per_unit: z.ZodOptional<z.ZodNumber>;
    user_material_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    units_made: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    quantity?: number | undefined;
    unit?: string | undefined;
    price_per_unit?: number | undefined;
    user_material_id?: number | undefined;
    units_made?: number | undefined;
}, {
    name?: string | undefined;
    quantity?: number | undefined;
    unit?: string | undefined;
    price_per_unit?: number | undefined;
    user_material_id?: number | undefined;
    units_made?: number | undefined;
}>;
export declare const createUserMaterialSchema: z.ZodObject<{
    name: z.ZodString;
    price: z.ZodNumber;
    quantity: z.ZodNumber;
    unit: z.ZodString;
    price_per_unit: z.ZodNumber;
    width: z.ZodOptional<z.ZodNumber>;
    length: z.ZodOptional<z.ZodNumber>;
    details: z.ZodOptional<z.ZodString>;
    supplier: z.ZodOptional<z.ZodString>;
    supplier_link: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    stock_level: z.ZodOptional<z.ZodNumber>;
    reorder_point: z.ZodOptional<z.ZodNumber>;
    last_purchased_date: z.ZodOptional<z.ZodString>;
    last_purchased_price: z.ZodOptional<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
    quantity: number;
    unit: string;
    price_per_unit: number;
    category?: string | undefined;
    length?: number | undefined;
    width?: number | undefined;
    details?: string | undefined;
    supplier?: string | undefined;
    supplier_link?: string | undefined;
    stock_level?: number | undefined;
    reorder_point?: number | undefined;
    last_purchased_date?: string | undefined;
    last_purchased_price?: number | undefined;
}, {
    name: string;
    price: number;
    quantity: number;
    unit: string;
    price_per_unit: number;
    category?: string | undefined;
    length?: number | undefined;
    width?: number | undefined;
    details?: string | undefined;
    supplier?: string | undefined;
    supplier_link?: string | undefined;
    stock_level?: number | undefined;
    reorder_point?: number | undefined;
    last_purchased_date?: string | undefined;
    last_purchased_price?: number | undefined;
}>;
export declare const updateUserMaterialSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    quantity: z.ZodOptional<z.ZodNumber>;
    unit: z.ZodOptional<z.ZodString>;
    price_per_unit: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    length: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    details: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    supplier: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    supplier_link: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    stock_level: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    reorder_point: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    last_purchased_date: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    last_purchased_price: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    category: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    category?: string | undefined;
    price?: number | undefined;
    length?: number | undefined;
    quantity?: number | undefined;
    unit?: string | undefined;
    price_per_unit?: number | undefined;
    width?: number | undefined;
    details?: string | undefined;
    supplier?: string | undefined;
    supplier_link?: string | undefined;
    stock_level?: number | undefined;
    reorder_point?: number | undefined;
    last_purchased_date?: string | undefined;
    last_purchased_price?: number | undefined;
}, {
    name?: string | undefined;
    category?: string | undefined;
    price?: number | undefined;
    length?: number | undefined;
    quantity?: number | undefined;
    unit?: string | undefined;
    price_per_unit?: number | undefined;
    width?: number | undefined;
    details?: string | undefined;
    supplier?: string | undefined;
    supplier_link?: string | undefined;
    stock_level?: number | undefined;
    reorder_point?: number | undefined;
    last_purchased_date?: string | undefined;
    last_purchased_price?: number | undefined;
}>;
export declare const createLaborSchema: z.ZodObject<{
    activity: z.ZodString;
    time_spent_minutes: z.ZodNumber;
    hourly_rate: z.ZodNumber;
    per_unit: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    activity: string;
    time_spent_minutes: number;
    hourly_rate: number;
    per_unit: boolean;
}, {
    activity: string;
    time_spent_minutes: number;
    hourly_rate: number;
    per_unit?: boolean | undefined;
}>;
export declare const updateLaborSchema: z.ZodObject<{
    activity: z.ZodOptional<z.ZodString>;
    time_spent_minutes: z.ZodOptional<z.ZodNumber>;
    hourly_rate: z.ZodOptional<z.ZodNumber>;
    per_unit: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    activity?: string | undefined;
    time_spent_minutes?: number | undefined;
    hourly_rate?: number | undefined;
    per_unit?: boolean | undefined;
}, {
    activity?: string | undefined;
    time_spent_minutes?: number | undefined;
    hourly_rate?: number | undefined;
    per_unit?: boolean | undefined;
}>;
export declare const createOtherCostSchema: z.ZodObject<{
    item: z.ZodString;
    quantity: z.ZodNumber;
    cost: z.ZodNumber;
    per_unit: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    per_unit: boolean;
    item: string;
    cost: number;
}, {
    quantity: number;
    item: string;
    cost: number;
    per_unit?: boolean | undefined;
}>;
export declare const updateOtherCostSchema: z.ZodObject<{
    item: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    cost: z.ZodOptional<z.ZodNumber>;
    per_unit: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    quantity?: number | undefined;
    per_unit?: boolean | undefined;
    item?: string | undefined;
    cost?: number | undefined;
}, {
    quantity?: number | undefined;
    per_unit?: boolean | undefined;
    item?: string | undefined;
    cost?: number | undefined;
}>;
export declare const createVariantAttributeSchema: z.ZodObject<{
    attribute_name: z.ZodString;
    attribute_value: z.ZodString;
    display_order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    attribute_name: string;
    attribute_value: string;
    display_order?: number | undefined;
}, {
    attribute_name: string;
    attribute_value: string;
    display_order?: number | undefined;
}>;
export declare const createVariantSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodNumber>;
    name: z.ZodString;
    sku: z.ZodOptional<z.ZodString>;
    price_override: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
    cost_override: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
    stock_level: z.ZodDefault<z.ZodEffects<z.ZodNumber, number, unknown>>;
    is_active: z.ZodDefault<z.ZodBoolean>;
    attributes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        attribute_name: z.ZodString;
        attribute_value: z.ZodString;
        display_order: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        attribute_name: string;
        attribute_value: string;
        display_order?: number | undefined;
    }, {
        attribute_name: string;
        attribute_value: string;
        display_order?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    stock_level: number;
    is_active: boolean;
    id?: number | undefined;
    sku?: string | undefined;
    price_override?: number | undefined;
    cost_override?: number | undefined;
    attributes?: {
        attribute_name: string;
        attribute_value: string;
        display_order?: number | undefined;
    }[] | undefined;
}, {
    name: string;
    stock_level?: unknown;
    id?: number | undefined;
    sku?: string | undefined;
    price_override?: unknown;
    cost_override?: unknown;
    is_active?: boolean | undefined;
    attributes?: {
        attribute_name: string;
        attribute_value: string;
        display_order?: number | undefined;
    }[] | undefined;
}>;
export declare const updateVariantSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    name: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    price_override: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>>;
    cost_override: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>>;
    stock_level: z.ZodOptional<z.ZodDefault<z.ZodEffects<z.ZodNumber, number, unknown>>>;
    is_active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    attributes: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        attribute_name: z.ZodString;
        attribute_value: z.ZodString;
        display_order: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        attribute_name: string;
        attribute_value: string;
        display_order?: number | undefined;
    }, {
        attribute_name: string;
        attribute_value: string;
        display_order?: number | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    stock_level?: number | undefined;
    id?: number | undefined;
    sku?: string | undefined;
    price_override?: number | undefined;
    cost_override?: number | undefined;
    is_active?: boolean | undefined;
    attributes?: {
        attribute_name: string;
        attribute_value: string;
        display_order?: number | undefined;
    }[] | undefined;
}, {
    name?: string | undefined;
    stock_level?: unknown;
    id?: number | undefined;
    sku?: string | undefined;
    price_override?: unknown;
    cost_override?: unknown;
    is_active?: boolean | undefined;
    attributes?: {
        attribute_name: string;
        attribute_value: string;
        display_order?: number | undefined;
    }[] | undefined;
}>;
export declare const createProductSchema: z.ZodObject<{
    name: z.ZodString;
    sku: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "in_progress", "on_sale", "inactive"]>>;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    batch_size: z.ZodEffects<z.ZodNumber, number, unknown>;
    target_price: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
    pricing_method: z.ZodOptional<z.ZodEnum<["markup", "price", "profit", "margin"]>>;
    pricing_value: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
    materials: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        quantity: z.ZodNumber;
        unit: z.ZodString;
        price_per_unit: z.ZodNumber;
        user_material_id: z.ZodOptional<z.ZodNumber>;
        units_made: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        quantity: number;
        unit: string;
        price_per_unit: number;
        units_made: number;
        user_material_id?: number | undefined;
    }, {
        name: string;
        quantity: number;
        unit: string;
        price_per_unit: number;
        user_material_id?: number | undefined;
        units_made?: number | undefined;
    }>, "many">>;
    labor_costs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        activity: z.ZodString;
        time_spent_minutes: z.ZodNumber;
        hourly_rate: z.ZodNumber;
        per_unit: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        activity: string;
        time_spent_minutes: number;
        hourly_rate: number;
        per_unit: boolean;
    }, {
        activity: string;
        time_spent_minutes: number;
        hourly_rate: number;
        per_unit?: boolean | undefined;
    }>, "many">>;
    other_costs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        item: z.ZodString;
        quantity: z.ZodNumber;
        cost: z.ZodNumber;
        per_unit: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        per_unit: boolean;
        item: string;
        cost: number;
    }, {
        quantity: number;
        item: string;
        cost: number;
        per_unit?: boolean | undefined;
    }>, "many">>;
    variants: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodNumber>;
        name: z.ZodString;
        sku: z.ZodOptional<z.ZodString>;
        price_override: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
        cost_override: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
        stock_level: z.ZodDefault<z.ZodEffects<z.ZodNumber, number, unknown>>;
        is_active: z.ZodDefault<z.ZodBoolean>;
        attributes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            attribute_name: z.ZodString;
            attribute_value: z.ZodString;
            display_order: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            attribute_name: string;
            attribute_value: string;
            display_order?: number | undefined;
        }, {
            attribute_name: string;
            attribute_value: string;
            display_order?: number | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        stock_level: number;
        is_active: boolean;
        id?: number | undefined;
        sku?: string | undefined;
        price_override?: number | undefined;
        cost_override?: number | undefined;
        attributes?: {
            attribute_name: string;
            attribute_value: string;
            display_order?: number | undefined;
        }[] | undefined;
    }, {
        name: string;
        stock_level?: unknown;
        id?: number | undefined;
        sku?: string | undefined;
        price_override?: unknown;
        cost_override?: unknown;
        is_active?: boolean | undefined;
        attributes?: {
            attribute_name: string;
            attribute_value: string;
            display_order?: number | undefined;
        }[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    batch_size: number;
    description?: string | undefined;
    category?: string | undefined;
    materials?: {
        name: string;
        quantity: number;
        unit: string;
        price_per_unit: number;
        units_made: number;
        user_material_id?: number | undefined;
    }[] | undefined;
    labor_costs?: {
        activity: string;
        time_spent_minutes: number;
        hourly_rate: number;
        per_unit: boolean;
    }[] | undefined;
    other_costs?: {
        quantity: number;
        per_unit: boolean;
        item: string;
        cost: number;
    }[] | undefined;
    variants?: {
        name: string;
        stock_level: number;
        is_active: boolean;
        id?: number | undefined;
        sku?: string | undefined;
        price_override?: number | undefined;
        cost_override?: number | undefined;
        attributes?: {
            attribute_name: string;
            attribute_value: string;
            display_order?: number | undefined;
        }[] | undefined;
    }[] | undefined;
    status?: "draft" | "in_progress" | "on_sale" | "inactive" | undefined;
    sku?: string | undefined;
    target_price?: number | undefined;
    pricing_method?: "markup" | "price" | "profit" | "margin" | undefined;
    pricing_value?: number | undefined;
}, {
    name: string;
    description?: string | undefined;
    category?: string | undefined;
    materials?: {
        name: string;
        quantity: number;
        unit: string;
        price_per_unit: number;
        user_material_id?: number | undefined;
        units_made?: number | undefined;
    }[] | undefined;
    labor_costs?: {
        activity: string;
        time_spent_minutes: number;
        hourly_rate: number;
        per_unit?: boolean | undefined;
    }[] | undefined;
    other_costs?: {
        quantity: number;
        item: string;
        cost: number;
        per_unit?: boolean | undefined;
    }[] | undefined;
    variants?: {
        name: string;
        stock_level?: unknown;
        id?: number | undefined;
        sku?: string | undefined;
        price_override?: unknown;
        cost_override?: unknown;
        is_active?: boolean | undefined;
        attributes?: {
            attribute_name: string;
            attribute_value: string;
            display_order?: number | undefined;
        }[] | undefined;
    }[] | undefined;
    status?: "draft" | "in_progress" | "on_sale" | "inactive" | undefined;
    sku?: string | undefined;
    batch_size?: unknown;
    target_price?: unknown;
    pricing_method?: "markup" | "price" | "profit" | "margin" | undefined;
    pricing_value?: unknown;
}>;
export declare const updateProductSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<["draft", "in_progress", "on_sale", "inactive"]>>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    batch_size: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
    target_price: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>>;
    pricing_method: z.ZodOptional<z.ZodOptional<z.ZodEnum<["markup", "price", "profit", "margin"]>>>;
    pricing_value: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>>;
    materials: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        quantity: z.ZodNumber;
        unit: z.ZodString;
        price_per_unit: z.ZodNumber;
        user_material_id: z.ZodOptional<z.ZodNumber>;
        units_made: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        quantity: number;
        unit: string;
        price_per_unit: number;
        units_made: number;
        user_material_id?: number | undefined;
    }, {
        name: string;
        quantity: number;
        unit: string;
        price_per_unit: number;
        user_material_id?: number | undefined;
        units_made?: number | undefined;
    }>, "many">>>;
    labor_costs: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        activity: z.ZodString;
        time_spent_minutes: z.ZodNumber;
        hourly_rate: z.ZodNumber;
        per_unit: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        activity: string;
        time_spent_minutes: number;
        hourly_rate: number;
        per_unit: boolean;
    }, {
        activity: string;
        time_spent_minutes: number;
        hourly_rate: number;
        per_unit?: boolean | undefined;
    }>, "many">>>;
    other_costs: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        item: z.ZodString;
        quantity: z.ZodNumber;
        cost: z.ZodNumber;
        per_unit: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        per_unit: boolean;
        item: string;
        cost: number;
    }, {
        quantity: number;
        item: string;
        cost: number;
        per_unit?: boolean | undefined;
    }>, "many">>>;
    variants: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodNumber>;
        name: z.ZodString;
        sku: z.ZodOptional<z.ZodString>;
        price_override: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
        cost_override: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
        stock_level: z.ZodDefault<z.ZodEffects<z.ZodNumber, number, unknown>>;
        is_active: z.ZodDefault<z.ZodBoolean>;
        attributes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            attribute_name: z.ZodString;
            attribute_value: z.ZodString;
            display_order: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            attribute_name: string;
            attribute_value: string;
            display_order?: number | undefined;
        }, {
            attribute_name: string;
            attribute_value: string;
            display_order?: number | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        stock_level: number;
        is_active: boolean;
        id?: number | undefined;
        sku?: string | undefined;
        price_override?: number | undefined;
        cost_override?: number | undefined;
        attributes?: {
            attribute_name: string;
            attribute_value: string;
            display_order?: number | undefined;
        }[] | undefined;
    }, {
        name: string;
        stock_level?: unknown;
        id?: number | undefined;
        sku?: string | undefined;
        price_override?: unknown;
        cost_override?: unknown;
        is_active?: boolean | undefined;
        attributes?: {
            attribute_name: string;
            attribute_value: string;
            display_order?: number | undefined;
        }[] | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    materials?: {
        name: string;
        quantity: number;
        unit: string;
        price_per_unit: number;
        units_made: number;
        user_material_id?: number | undefined;
    }[] | undefined;
    labor_costs?: {
        activity: string;
        time_spent_minutes: number;
        hourly_rate: number;
        per_unit: boolean;
    }[] | undefined;
    other_costs?: {
        quantity: number;
        per_unit: boolean;
        item: string;
        cost: number;
    }[] | undefined;
    variants?: {
        name: string;
        stock_level: number;
        is_active: boolean;
        id?: number | undefined;
        sku?: string | undefined;
        price_override?: number | undefined;
        cost_override?: number | undefined;
        attributes?: {
            attribute_name: string;
            attribute_value: string;
            display_order?: number | undefined;
        }[] | undefined;
    }[] | undefined;
    status?: "draft" | "in_progress" | "on_sale" | "inactive" | undefined;
    sku?: string | undefined;
    batch_size?: number | undefined;
    target_price?: number | undefined;
    pricing_method?: "markup" | "price" | "profit" | "margin" | undefined;
    pricing_value?: number | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    materials?: {
        name: string;
        quantity: number;
        unit: string;
        price_per_unit: number;
        user_material_id?: number | undefined;
        units_made?: number | undefined;
    }[] | undefined;
    labor_costs?: {
        activity: string;
        time_spent_minutes: number;
        hourly_rate: number;
        per_unit?: boolean | undefined;
    }[] | undefined;
    other_costs?: {
        quantity: number;
        item: string;
        cost: number;
        per_unit?: boolean | undefined;
    }[] | undefined;
    variants?: {
        name: string;
        stock_level?: unknown;
        id?: number | undefined;
        sku?: string | undefined;
        price_override?: unknown;
        cost_override?: unknown;
        is_active?: boolean | undefined;
        attributes?: {
            attribute_name: string;
            attribute_value: string;
            display_order?: number | undefined;
        }[] | undefined;
    }[] | undefined;
    status?: "draft" | "in_progress" | "on_sale" | "inactive" | undefined;
    sku?: string | undefined;
    batch_size?: unknown;
    target_price?: unknown;
    pricing_method?: "markup" | "price" | "profit" | "margin" | undefined;
    pricing_value?: unknown;
}>;
export declare const createPricingDataSchema: z.ZodObject<{
    product_id: z.ZodNumber;
    price: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    calculation_method: z.ZodOptional<z.ZodString>;
    calculation_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    price: number;
    product_id: number;
    currency: string;
    calculation_method?: string | undefined;
    calculation_data?: Record<string, unknown> | undefined;
}, {
    price: number;
    product_id: number;
    currency?: string | undefined;
    calculation_method?: string | undefined;
    calculation_data?: Record<string, unknown> | undefined;
}>;
export declare const updatePricingDataSchema: z.ZodObject<{
    product_id: z.ZodOptional<z.ZodNumber>;
    price: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    calculation_method: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    calculation_data: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    price?: number | undefined;
    product_id?: number | undefined;
    currency?: string | undefined;
    calculation_method?: string | undefined;
    calculation_data?: Record<string, unknown> | undefined;
}, {
    price?: number | undefined;
    product_id?: number | undefined;
    currency?: string | undefined;
    calculation_method?: string | undefined;
    calculation_data?: Record<string, unknown> | undefined;
}>;
export * from './template';
export * from './sales';
//# sourceMappingURL=index.d.ts.map