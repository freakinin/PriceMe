import { Response } from 'express';
import { db } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { calculateProductMetrics } from './productController.js';

// Simple CSV stringifier to avoid dependencies for now
const toCSV = (data: any[], headers: string[]) => {
    const csvRows = [
        headers.join(','), // Header row
        ...data.map(row => {
            return headers.map(header => {
                const val = row[header];
                const escaped = ('' + (val ?? '')).replace(/"/g, '""'); // Escape quotes
                return `"${escaped}"`; // Quote everything
            }).join(',');
        })
    ];
    return csvRows.join('\n');
};

export const exportProducts = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        // Fetch all products
        const products = await db`
            SELECT id, name, sku, status, batch_size, target_price, created_at
            FROM products
            WHERE user_id = ${req.userId}
            ORDER BY created_at DESC
        `;
        const productsList = Array.isArray(products) ? products : products.rows || [];

        // Enrich with metrics
        const enrichedProducts = await Promise.all(productsList.map(async (product: any) => {
            const metrics = await calculateProductMetrics(product);
            return {
                ID: product.id,
                Name: product.name,
                SKU: product.sku || '',
                Status: product.status || 'draft',
                'Batch Size': product.batch_size,
                'Target Price': product.target_price || 0,
                'Total Cost': metrics.product_cost.toFixed(2),
                'Profit': (metrics.profit || 0).toFixed(2),
                'Margin (%)': (metrics.profit_margin || 0).toFixed(1),
                'Created At': new Date(product.created_at).toISOString().split('T')[0]
            };
        }));

        const headers = ['ID', 'Name', 'SKU', 'Status', 'Batch Size', 'Target Price', 'Total Cost', 'Profit', 'Margin (%)', 'Created At'];
        const csv = toCSV(enrichedProducts, headers);

        const date = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=Products_${date}.csv`);
        return res.status(200).send(csv);

    } catch (error: any) {
        console.error('Export products error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to export products' });
    }
};

export const exportMaterials = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        // Fetch user materials
        const materials = await db`
            SELECT name, quantity, unit, price_per_unit, stock_level, reorder_point, supplier, category, updated_at
            FROM user_materials
            WHERE user_id = ${req.userId}
            ORDER BY name ASC
        `;
        const materialsList = Array.isArray(materials) ? materials : materials.rows || [];

        const formattedMaterials = materialsList.map((m: any) => ({
            Name: m.name,
            Category: m.category || '',
            'Price Per Unit': m.price_per_unit,
            Unit: m.unit,
            'In Stock': m.stock_level,
            'Reorder Point': m.reorder_point,
            Vendor: m.supplier || '',
            'Last Updated': m.updated_at ? new Date(m.updated_at).toISOString().split('T')[0] : 'N/A'
        }));

        const headers = ['Name', 'Category', 'Price Per Unit', 'Unit', 'In Stock', 'Reorder Point', 'Vendor', 'Last Updated'];
        const csv = toCSV(formattedMaterials, headers);

        const date = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=Material_${date}.csv`);
        return res.status(200).send(csv);

    } catch (error: any) {
        console.error('Export materials error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to export materials' });
    }
};
