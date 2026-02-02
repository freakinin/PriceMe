import { Response } from 'express';
import { db } from '../utils/db.js';
import { createSaleSchema } from '@priceme/shared';
import { AuthRequest } from '../middleware/auth.js';

export const createSale = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const validatedData = createSaleSchema.parse(req.body);
        const {
            product_id,
            variant_id,
            sale_date,
            quantity,
            unit_price,
            discount_amount,
            discount_percentage,
            coupon_code,
            platform,
            customer_name,
            notes,
        } = validatedData;

        // Calculate derived discount if one is provided but not the other
        let finalDiscountAmount = discount_amount;
        let finalDiscountPercentage = discount_percentage;

        // If valid numeric values. Note: schema defaults to 0.
        if (discount_amount > 0 && discount_percentage === 0) {
            // Calculate percentage: (amount / (price * qty)) * 100
            const totalValue = unit_price * quantity;
            if (totalValue > 0) {
                finalDiscountPercentage = Number(((discount_amount / totalValue) * 100).toFixed(2));
            }
        } else if (discount_percentage > 0 && discount_amount === 0) {
            // Calculate amount: (price * qty) * (percent / 100)
            const totalValue = unit_price * quantity;
            finalDiscountAmount = Number((totalValue * (discount_percentage / 100)).toFixed(2));
        }

        const result = await db`
      INSERT INTO sales (
        user_id, product_id, variant_id, sale_date, quantity, unit_price,
        discount_amount, discount_percentage, coupon_code, platform, customer_name, notes
      )
      VALUES (
        ${req.userId}, ${product_id}, ${variant_id || null}, ${sale_date || new Date().toISOString()},
        ${quantity}, ${unit_price}, ${finalDiscountAmount}, ${finalDiscountPercentage},
        ${coupon_code || null}, ${platform || null}, ${customer_name || null}, ${notes || null}
      )
      RETURNING *
    `;

        return res.status(201).json({
            status: 'success',
            data: result.rows[0],
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ status: 'error', message: 'Validation error', errors: error.errors });
        }
        console.error('Error creating sale:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to create sale' });
    }
};

export const getSales = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const { product_id, platform } = req.query;

        // Use SQL logic for optional parameters to avoid dynamic query building issues with @vercel/postgres
        const pid = product_id ? Number(product_id) : null;
        const plat = platform ? String(platform) : null;

        const sales = await db`
        SELECT s.*, p.name as product_name, v.name as variant_name
        FROM sales s
        JOIN products p ON s.product_id = p.id
        LEFT JOIN product_variants v ON s.variant_id = v.id
        WHERE s.user_id = ${req.userId}
        AND (${pid}::int IS NULL OR s.product_id = ${pid}::int)
        AND (${plat}::text IS NULL OR s.platform = ${plat}::text)
        ORDER BY s.sale_date DESC
    `;

        return res.json({
            status: 'success',
            data: sales.rows,
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch sales' });
    }
};

export const deleteSale = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }
        const { id } = req.params;

        const result = await db`
            DELETE FROM sales 
            WHERE id = ${id} AND user_id = ${req.userId}
            RETURNING id
        `;

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Sale not found or not authorized' });
        }

        return res.json({ status: 'success', message: 'Sale deleted successfully' });
    } catch (error) {
        console.error('Error deleting sale:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to delete sale' });
    }
};
