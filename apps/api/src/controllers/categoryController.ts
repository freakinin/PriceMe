import { Response } from 'express';
import { db } from '../utils/db.js';
import { createCategorySchema, updateCategorySchema, bulkDeleteSchema } from '@priceme/shared';
import { AuthRequest } from '../middleware/auth.js';

export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized',
            });
        }

        const categories = await db`
            SELECT c.id, c.name, c.description, c.created_at, c.updated_at, COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            WHERE c.user_id = ${req.userId}
            GROUP BY c.id
            ORDER BY c.name ASC
        `;

        return res.json({
            status: 'success',
            data: Array.isArray(categories) ? categories : categories.rows || [],
        });
    } catch (error: any) {
        console.error('Get categories error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch categories',
            ...(process.env.NODE_ENV === 'development' && {
                error: error.message,
                stack: error.stack,
            }),
        });
    }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized',
            });
        }

        const validatedData = createCategorySchema.parse(req.body);
        const { name, description } = validatedData;

        // Check if category already exists for this user
        const existingCategory = await db`
      SELECT id FROM categories
      WHERE user_id = ${req.userId} AND name = ${name}
    `;
        const existingRows = Array.isArray(existingCategory) ? existingCategory : existingCategory.rows || [];

        if (existingRows.length > 0) {
            return res.status(409).json({
                status: 'error',
                message: 'Category with this name already exists',
            });
        }

        const result = await db`
      INSERT INTO categories (user_id, name, description)
      VALUES (${req.userId}, ${name}, ${description || null})
      RETURNING id, name, description, created_at, updated_at
    `;

        const row = Array.isArray(result) ? result[0] : (result as any).rows[0];

        return res.status(201).json({
            status: 'success',
            message: 'Category created successfully',
            data: row,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                issues: error.issues,
            });
        }

        console.error('Create category error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to create category',
            ...(process.env.NODE_ENV === 'development' && {
                error: error.message,
                stack: error.stack,
            }),
        });
    }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized',
            });
        }

        const categoryId = parseInt(req.params.id);
        if (isNaN(categoryId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid category ID',
            });
        }

        const validatedData = updateCategorySchema.parse(req.body);
        const { name, description } = validatedData;

        // Check if category exists
        const categoryCheck = await db`
        SELECT id FROM categories WHERE id = ${categoryId} AND user_id = ${req.userId}
    `;
        const checkRows = Array.isArray(categoryCheck) ? categoryCheck : categoryCheck.rows || [];
        if (checkRows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Category not found',
            });
        }

        // If updating name, check for duplicates
        if (name) {
            const duplicateCheck = await db`
            SELECT id FROM categories
            WHERE user_id = ${req.userId} AND name = ${name} AND id != ${categoryId}
        `;
            const duplicateRows = Array.isArray(duplicateCheck) ? duplicateCheck : duplicateCheck.rows || [];
            if (duplicateRows.length > 0) {
                return res.status(409).json({
                    status: 'error',
                    message: 'Category with this name already exists',
                });
            }
        }

        const result = await db`
      UPDATE categories
      SET
        name = COALESCE(${name || null}, name),
        description = COALESCE(${description || null}, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${categoryId} AND user_id = ${req.userId}
      RETURNING id, name, description, created_at, updated_at
    `;

        const row = Array.isArray(result) ? result[0] : (result as any).rows[0];

        return res.json({
            status: 'success',
            message: 'Category updated successfully',
            data: row,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                issues: error.issues,
            });
        }

        console.error('Update category error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to update category',
            ...(process.env.NODE_ENV === 'development' && {
                error: error.message,
                stack: error.stack,
            }),
        });
    }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized',
            });
        }

        const categoryId = parseInt(req.params.id);
        if (isNaN(categoryId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid category ID',
            });
        }

        // Check if category exists
        const categoryCheck = await db`
        SELECT id FROM categories WHERE id = ${categoryId} AND user_id = ${req.userId}
    `;
        const checkRows = Array.isArray(categoryCheck) ? categoryCheck : categoryCheck.rows || [];
        if (checkRows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Category not found',
            });
        }

        // Unassign products from this category first
        await db`
            UPDATE products 
            SET category_id = NULL, category = NULL
            WHERE category_id = ${categoryId} AND user_id = ${req.userId}
        `;

        await db`
            DELETE FROM categories
            WHERE id = ${categoryId} AND user_id = ${req.userId}
        `;

        return res.json({
            status: 'success',
            message: 'Category deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete category error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to delete category',
            ...(process.env.NODE_ENV === 'development' && {
                error: error.message,
                stack: error.stack,
            }),
        });
    }
};

export const bulkDeleteCategories = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const validatedData = bulkDeleteSchema.parse(req.body);
        const { ids } = validatedData;

        // Unassign products from these categories first
        await db`
            UPDATE products 
            SET category_id = NULL, category = NULL
            WHERE category_id = ANY(${ids as any}::int[]) AND user_id = ${req.userId}
        `;

        const result = await db`
            DELETE FROM categories 
            WHERE id = ANY(${ids as any}::int[]) AND user_id = ${req.userId}
            RETURNING id
        `;

        const deletedCount = Array.isArray(result) ? result.length : (result as any).rowCount;

        return res.json({
            status: 'success',
            message: `${deletedCount} categories deleted successfully`,
            data: { deletedCount }
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ status: 'error', message: 'Validation failed', issues: error.issues });
        }
        console.error('Bulk delete categories error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to bulk delete categories' });
    }
};
