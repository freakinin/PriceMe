import { Response } from 'express';
import { db } from '../utils/db.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';

const shippingMethodSchema = z.object({
  name: z.string().min(1).max(100),
  cost: z.number().min(0),
  is_free_shipping: z.boolean(),
  is_default: z.boolean().optional(),
});

function formatMethod(m: any) {
  return {
    id: m.id,
    user_id: m.user_id,
    name: m.name,
    cost: Number(m.cost),
    is_free_shipping: m.is_free_shipping,
    is_default: m.is_default,
    created_at: m.created_at,
    updated_at: m.updated_at,
  };
}

export const getShippingMethods = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const result = await db`
      SELECT * FROM shipping_methods
      WHERE user_id = ${req.userId}
      ORDER BY is_default DESC, created_at ASC
    `;
    const rows = Array.isArray(result) ? result : result.rows || [];
    return res.json({ status: 'success', data: rows.map(formatMethod) });
  } catch (error: any) {
    console.error('getShippingMethods error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch shipping methods' });
  }
};

export const createShippingMethod = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const data = shippingMethodSchema.parse(req.body);

    if (data.is_default) {
      await db`UPDATE shipping_methods SET is_default = FALSE WHERE user_id = ${req.userId}`;
    }

    const result = await db`
      INSERT INTO shipping_methods (user_id, name, cost, is_free_shipping, is_default)
      VALUES (${req.userId}, ${data.name}, ${data.cost}, ${data.is_free_shipping}, ${data.is_default ?? false})
      RETURNING *
    `;
    const rows = Array.isArray(result) ? result : result.rows || [];
    return res.status(201).json({ status: 'success', data: formatMethod(rows[0]) });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: 'Validation error', errors: error.errors });
    }
    console.error('createShippingMethod error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to create shipping method' });
  }
};

export const updateShippingMethod = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const methodId = parseInt(req.params.id, 10);
    if (isNaN(methodId)) return res.status(400).json({ status: 'error', message: 'Invalid method ID' });

    const existing = await db`
      SELECT id FROM shipping_methods WHERE id = ${methodId} AND user_id = ${req.userId}
    `;
    const existingRows = Array.isArray(existing) ? existing : existing.rows || [];
    if (existingRows.length === 0) return res.status(404).json({ status: 'error', message: 'Shipping method not found' });

    const data = shippingMethodSchema.parse(req.body);

    if (data.is_default) {
      await db`UPDATE shipping_methods SET is_default = FALSE WHERE user_id = ${req.userId}`;
    }

    const result = await db`
      UPDATE shipping_methods SET
        name = ${data.name},
        cost = ${data.cost},
        is_free_shipping = ${data.is_free_shipping},
        is_default = ${data.is_default ?? false},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${methodId} AND user_id = ${req.userId}
      RETURNING *
    `;
    const rows = Array.isArray(result) ? result : result.rows || [];
    return res.json({ status: 'success', data: formatMethod(rows[0]) });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: 'Validation error', errors: error.errors });
    }
    console.error('updateShippingMethod error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update shipping method' });
  }
};

export const deleteShippingMethod = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const methodId = parseInt(req.params.id, 10);
    if (isNaN(methodId)) return res.status(400).json({ status: 'error', message: 'Invalid method ID' });

    const result = await db`
      DELETE FROM shipping_methods
      WHERE id = ${methodId} AND user_id = ${req.userId}
      RETURNING id
    `;
    const rows = Array.isArray(result) ? result : result.rows || [];
    if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Shipping method not found' });

    return res.json({ status: 'success', message: 'Shipping method deleted' });
  } catch (error: any) {
    console.error('deleteShippingMethod error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to delete shipping method' });
  }
};
