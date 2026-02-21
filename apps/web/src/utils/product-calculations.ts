
import { materialItemSchema, laborItemSchema, otherCostItemSchema } from '@/types/product-form';
import { z } from 'zod';

export const calculateMaterialCost = (
    m: z.infer<typeof materialItemSchema>,
    batchSize: number
) => {
    const unitsMade = m.units_made || 1;
    let costPerProduct = 0;
    if (m.quantity_type === 'percentage' && m.quantity_percentage) {
        const percentage = m.quantity_percentage / 100;
        if (m.per_batch) {
            costPerProduct = (m.price_per_unit * percentage) / batchSize;
        } else {
            costPerProduct = m.price_per_unit * percentage;
        }
    } else {
        costPerProduct = (m.quantity * m.price_per_unit) / unitsMade;
    }
    return costPerProduct;
};

export const calculateLaborCost = (
    l: z.infer<typeof laborItemSchema>,
    batchSize: number
) => {
    const cost = (l.time_minutes / 60) * l.hourly_rate;
    return l.per_batch ? cost / batchSize : cost;
};

export const calculateOtherCost = (
    o: z.infer<typeof otherCostItemSchema>,
    batchSize: number
) => {
    const cost = o.quantity * o.cost;
    return o.per_batch ? cost / batchSize : cost;
};
