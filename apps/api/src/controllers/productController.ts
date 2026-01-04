import { Response } from 'express';
import { db } from '../utils/db.js';
import { createProductSchema } from '@priceme/shared';
import { AuthRequest } from '../middleware/auth.js';

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    // Validate input
    const validatedData = createProductSchema.parse(req.body);
    const { name, sku, description, category, batch_size, target_price, markup_percentage, materials, labor_costs, other_costs } = validatedData;

    // Start transaction: Create product
    console.log('Inserting product with userId:', req.userId);
    const productResult = await db`
      INSERT INTO products (user_id, name, sku, description, category, batch_size, target_price, markup_percentage)
      VALUES (${req.userId}, ${name}, ${sku || null}, ${description || null}, ${category || null}, ${batch_size || 1}, ${target_price || null}, ${markup_percentage || null})
      RETURNING id
    `;

    console.log('Product result type:', typeof productResult);
    console.log('Product result:', JSON.stringify(productResult, null, 2));

    // Handle Vercel Postgres result structure
    // Vercel Postgres returns results in .rows array
    let productId: number;
    if (Array.isArray(productResult)) {
      productId = productResult[0]?.id;
    } else if (productResult && typeof productResult === 'object' && 'rows' in productResult) {
      const rows = (productResult as any).rows;
      if (rows && rows.length > 0) {
        productId = rows[0].id;
      }
    } else if ((productResult as any)?.id) {
      productId = (productResult as any).id;
    }

    if (!productId) {
      console.error('Failed to extract product ID. Result structure:', productResult);
      throw new Error(`Failed to get product ID from database result. Result: ${JSON.stringify(productResult)}`);
    }

    console.log('Product created with ID:', productId);

    // Insert materials if provided
    if (materials && materials.length > 0) {
      for (const material of materials) {
        const totalCost = material.quantity * material.price_per_unit;
        await db`
          INSERT INTO materials (product_id, name, quantity, unit, price_per_unit, total_cost)
          VALUES (${productId}, ${material.name}, ${material.quantity}, ${material.unit}, ${material.price_per_unit}, ${totalCost})
        `;
      }
    }

    // Insert labor costs if provided
    if (labor_costs && labor_costs.length > 0) {
      for (const labor of labor_costs) {
        const totalCost = (labor.time_spent_minutes / 60) * labor.hourly_rate;
        await db`
          INSERT INTO labor_costs (product_id, activity, time_spent_minutes, hourly_rate, total_cost, per_unit)
          VALUES (${productId}, ${labor.activity}, ${labor.time_spent_minutes}, ${labor.hourly_rate}, ${totalCost}, ${labor.per_unit ?? true})
        `;
      }
    }

    // Insert other costs if provided
    if (other_costs && other_costs.length > 0) {
      for (const cost of other_costs) {
        const totalCost = cost.quantity * cost.cost;
        await db`
          INSERT INTO other_costs (product_id, item, quantity, cost, total_cost, per_unit)
          VALUES (${productId}, ${cost.item}, ${cost.quantity}, ${cost.cost}, ${totalCost}, ${cost.per_unit ?? true})
        `;
      }
    }

    return res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: {
        id: productId,
        name,
        sku,
        batch_size,
        target_price,
        markup_percentage,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Create product error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      cause: error.cause,
    });
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to create product'
      : 'Failed to create product';
    
    return res.status(500).json({
      status: 'error',
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack,
      }),
    });
  }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const products = await db`
      SELECT id, name, sku, batch_size, target_price, markup_percentage, created_at, updated_at
      FROM products
      WHERE user_id = ${req.userId}
      ORDER BY created_at DESC
    `;

    const productsList = Array.isArray(products) ? products : products.rows || [];

    return res.json({
      status: 'success',
      data: productsList,
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products',
    });
  }
};

export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product ID',
      });
    }

    // Get product
    const productResult = await db`
      SELECT id, name, sku, description, category, batch_size, target_price, markup_percentage, created_at, updated_at
      FROM products
      WHERE id = ${productId} AND user_id = ${req.userId}
    `;

    const products = Array.isArray(productResult) ? productResult : productResult.rows || [];
    if (products.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    const product = products[0];

    // Get materials
    const materialsResult = await db`
      SELECT id, name, quantity, unit, price_per_unit, total_cost
      FROM materials
      WHERE product_id = ${productId}
      ORDER BY created_at ASC
    `;
    const materials = Array.isArray(materialsResult) ? materialsResult : materialsResult.rows || [];

    // Get labor costs
    const laborResult = await db`
      SELECT id, activity, time_spent_minutes, hourly_rate, total_cost, per_unit
      FROM labor_costs
      WHERE product_id = ${productId}
      ORDER BY created_at ASC
    `;
    const laborCosts = Array.isArray(laborResult) ? laborResult : laborResult.rows || [];

    // Get other costs
    const otherCostsResult = await db`
      SELECT id, item, quantity, cost, total_cost, per_unit
      FROM other_costs
      WHERE product_id = ${productId}
      ORDER BY created_at ASC
    `;
    const otherCosts = Array.isArray(otherCostsResult) ? otherCostsResult : otherCostsResult.rows || [];

    return res.json({
      status: 'success',
      data: {
        ...product,
        materials,
        labor_costs: laborCosts,
        other_costs: otherCosts,
      },
    });
  } catch (error: any) {
    console.error('Get product error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product',
    });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product ID',
      });
    }

    // Validate input
    const validatedData = createProductSchema.parse(req.body);
    const { name, sku, description, category, batch_size, target_price, markup_percentage, materials, labor_costs, other_costs } = validatedData;

    // Check if product exists and belongs to user
    const productCheck = await db`
      SELECT id FROM products
      WHERE id = ${productId} AND user_id = ${req.userId}
    `;
    const productExists = Array.isArray(productCheck) ? productCheck.length > 0 : (productCheck.rows || []).length > 0;
    
    if (!productExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Update product
    await db`
      UPDATE products
      SET name = ${name},
          sku = ${sku || null},
          description = ${description || null},
          category = ${category || null},
          batch_size = ${batch_size || 1},
          target_price = ${target_price || null},
          markup_percentage = ${markup_percentage || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${productId} AND user_id = ${req.userId}
    `;

    // Delete existing materials, labor costs, and other costs
    await db`DELETE FROM materials WHERE product_id = ${productId}`;
    await db`DELETE FROM labor_costs WHERE product_id = ${productId}`;
    await db`DELETE FROM other_costs WHERE product_id = ${productId}`;

    // Insert new materials if provided
    if (materials && materials.length > 0) {
      for (const material of materials) {
        const totalCost = material.quantity * material.price_per_unit;
        await db`
          INSERT INTO materials (product_id, name, quantity, unit, price_per_unit, total_cost)
          VALUES (${productId}, ${material.name}, ${material.quantity}, ${material.unit}, ${material.price_per_unit}, ${totalCost})
        `;
      }
    }

    // Insert new labor costs if provided
    if (labor_costs && labor_costs.length > 0) {
      for (const labor of labor_costs) {
        const totalCost = (labor.time_spent_minutes / 60) * labor.hourly_rate;
        await db`
          INSERT INTO labor_costs (product_id, activity, time_spent_minutes, hourly_rate, total_cost, per_unit)
          VALUES (${productId}, ${labor.activity}, ${labor.time_spent_minutes}, ${labor.hourly_rate}, ${totalCost}, ${labor.per_unit ?? true})
        `;
      }
    }

    // Insert new other costs if provided
    if (other_costs && other_costs.length > 0) {
      for (const cost of other_costs) {
        const totalCost = cost.quantity * cost.cost;
        await db`
          INSERT INTO other_costs (product_id, item, quantity, cost, total_cost, per_unit)
          VALUES (${productId}, ${cost.item}, ${cost.quantity}, ${cost.cost}, ${totalCost}, ${cost.per_unit ?? true})
        `;
      }
    }

    return res.json({
      status: 'success',
      message: 'Product updated successfully',
      data: {
        id: productId,
        name,
        sku,
        batch_size,
        target_price,
        markup_percentage,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Update product error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to update product'
      : 'Failed to update product';
    
    return res.status(500).json({
      status: 'error',
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack,
      }),
    });
  }
};

