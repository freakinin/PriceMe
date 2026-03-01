import { Response } from 'express';
import { db } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const createSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  link: z.string().url('Invalid URL').optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional(),
});

const updateSupplierSchema = createSupplierSchema.partial();

export const getSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const result = await db`
      SELECT
        s.*,
        COUNT(um.id)::int AS material_count
      FROM suppliers s
      LEFT JOIN user_materials um ON um.supplier_id = s.id
      WHERE s.user_id = ${req.userId}
      GROUP BY s.id
      ORDER BY s.name ASC
    `;

    const suppliers = Array.isArray(result) ? result : result.rows || [];

    return res.status(200).json({ status: 'success', data: suppliers });
  } catch (error: any) {
    console.error('Get suppliers error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch suppliers',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

export const createSupplier = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const validatedData = createSupplierSchema.parse(req.body);
    const { name, link, phone, email, notes } = validatedData;

    const result = await db`
      INSERT INTO suppliers (user_id, name, link, phone, email, notes)
      VALUES (
        ${req.userId}, ${name}, ${link || null},
        ${phone || null}, ${email || null}, ${notes || null}
      )
      ON CONFLICT (user_id, name) DO UPDATE
        SET link = EXCLUDED.link,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            notes = EXCLUDED.notes,
            updated_at = CURRENT_TIMESTAMP
      RETURNING *, 0::int AS material_count
    `;

    const supplier = Array.isArray(result) ? result[0] : result.rows[0];

    return res.status(201).json({
      status: 'success',
      message: 'Supplier created successfully',
      data: supplier,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }
    console.error('Create supplier error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create supplier',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

export const updateSupplier = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const supplierId = parseInt(req.params.id);
    if (isNaN(supplierId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid supplier ID' });
    }

    const currentResult = await db`
      SELECT * FROM suppliers WHERE id = ${supplierId} AND user_id = ${req.userId}
    `;
    const currentRows = Array.isArray(currentResult) ? currentResult : currentResult.rows || [];
    if (currentRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Supplier not found' });
    }
    const current = currentRows[0];

    const validatedData = updateSupplierSchema.parse(req.body);

    const mergedData = {
      name: validatedData.name !== undefined ? validatedData.name : current.name,
      link: validatedData.link !== undefined ? (validatedData.link || null) : current.link,
      phone: validatedData.phone !== undefined ? (validatedData.phone || null) : current.phone,
      email: validatedData.email !== undefined ? (validatedData.email || null) : current.email,
      notes: validatedData.notes !== undefined ? (validatedData.notes || null) : current.notes,
    };

    const result = await db`
      UPDATE suppliers
      SET
        name = ${mergedData.name},
        link = ${mergedData.link},
        phone = ${mergedData.phone},
        email = ${mergedData.email},
        notes = ${mergedData.notes},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${supplierId} AND user_id = ${req.userId}
      RETURNING *
    `;

    const supplier = Array.isArray(result) ? result[0] : result.rows[0];

    return res.status(200).json({
      status: 'success',
      message: 'Supplier updated successfully',
      data: supplier,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }
    console.error('Update supplier error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update supplier',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const supplierId = parseInt(req.params.id);
    if (isNaN(supplierId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid supplier ID' });
    }

    const result = await db`
      DELETE FROM suppliers
      WHERE id = ${supplierId} AND user_id = ${req.userId}
      RETURNING id
    `;

    const deletedRows = Array.isArray(result) ? result : result.rows || [];
    if (deletedRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Supplier not found' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Supplier deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete supplier error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete supplier',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};
