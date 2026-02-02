import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../utils/db';
import { createTemplateSchema } from '@priceme/shared';

// Get all templates for the authenticated user
export const getTemplates = async (req: AuthRequest, res: Response) => {
    try {
        const templates = await db`
      SELECT * FROM product_templates 
      WHERE user_id = ${req.userId}
      ORDER BY name ASC
    `;

        return res.json({
            status: 'success',
            data: Array.isArray(templates) ? templates : templates.rows || [],
        });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch templates',
        });
    }
};

// Create a new template (optionally from a product)
export const createTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const validatedData = createTemplateSchema.parse(req.body);

        const {
            name,
            description,
            category,
            default_batch_size,
            default_pricing_method,
            default_markup_percentage,
            materials,
            labor_costs,
            other_costs,
            variants
        } = validatedData;

        // Convert arrays to JSON strings properly if they aren't already objects
        // The driver should handle objects -> JSONB but we check to be safe
        const materialsJson = materials ? JSON.stringify(materials) : '[]';
        const laborCostsJson = labor_costs ? JSON.stringify(labor_costs) : '[]';
        const otherCostsJson = other_costs ? JSON.stringify(other_costs) : '[]';
        const variantsJson = variants ? JSON.stringify(variants) : '[]';

        const result = await db`
      INSERT INTO product_templates (
        user_id, 
        name, 
        description, 
        category, 
        default_batch_size, 
        default_pricing_method, 
        default_markup_percentage,
        materials_json,
        labor_costs_json,
        other_costs_json,
        variants_json
      )
      VALUES (
        ${req.userId}, 
        ${name}, 
        ${description || null}, 
        ${category || null}, 
        ${default_batch_size || 1}, 
        ${default_pricing_method || null}, 
        ${default_markup_percentage || null},
        ${materialsJson}::jsonb,
        ${laborCostsJson}::jsonb,
        ${otherCostsJson}::jsonb,
        ${variantsJson}::jsonb
      )
      RETURNING id
    `;

        const id = Array.isArray(result) ? result[0].id : result.rows[0].id;

        return res.status(201).json({
            status: 'success',
            message: 'Template created successfully',
            data: { id, name },
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid input data',
                errors: error.errors,
            });
        }
        console.error('Error creating template:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to create template',
        });
    }
};

// Get a single template
export const getTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const templateId = parseInt(req.params.id);
        if (isNaN(templateId)) {
            return res.status(400).json({ status: 'error', message: 'Invalid template ID' });
        }

        const template = await db`
      SELECT * FROM product_templates 
      WHERE id = ${templateId} AND user_id = ${req.userId}
    `;

        const rows = Array.isArray(template) ? template : template.rows || [];
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Template not found' });
        }

        return res.json({
            status: 'success',
            data: rows[0],
        });
    } catch (error) {
        console.error('Error fetching template:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch template' });
    }
};

// Delete a template
export const deleteTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const templateId = parseInt(req.params.id);
        if (isNaN(templateId)) {
            return res.status(400).json({ status: 'error', message: 'Invalid template ID' });
        }

        const result = await db`
      DELETE FROM product_templates 
      WHERE id = ${templateId} AND user_id = ${req.userId}
      RETURNING id
    `;

        const rows = Array.isArray(result) ? result : result.rows || [];
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Template not found or unauthorized' });
        }

        return res.json({
            status: 'success',
            message: 'Template deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting template:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to delete template' });
    }
};
