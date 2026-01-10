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
    const { name, sku, description, category, batch_size, target_price, pricing_method, pricing_value, materials, labor_costs, other_costs } = validatedData;

    // Start transaction: Create product
    console.log('Inserting product with userId:', req.userId);
    const productResult = await db`
      INSERT INTO products (user_id, name, sku, description, category, batch_size, target_price, pricing_method, pricing_value)
      VALUES (${req.userId}, ${name}, ${sku || null}, ${description || null}, ${category || null}, ${batch_size || 1}, ${target_price || null}, ${pricing_method || null}, ${pricing_value || null})
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
        const unitsMade = material.units_made || 1;
        const totalCost = (material.quantity * material.price_per_unit) / unitsMade;
        await db`
          INSERT INTO materials (product_id, user_material_id, name, quantity, unit, price_per_unit, units_made, total_cost)
          VALUES (${productId}, ${material.user_material_id || null}, ${material.name}, ${material.quantity}, ${material.unit}, ${material.price_per_unit}, ${unitsMade}, ${totalCost})
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
        pricing_method,
        pricing_value,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        issues: error.issues,
      });
    }
    
    console.error('Create product error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create product',
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
      SELECT id, name, sku, batch_size, target_price, pricing_method, pricing_value, created_at, updated_at
      FROM products
      WHERE user_id = ${req.userId}
      ORDER BY created_at DESC
    `;

    const productsList = Array.isArray(products) ? products : products.rows || [];

    // Calculate costs for each product
    const productsWithCosts = await Promise.all(
      productsList.map(async (product: any) => {
        // Get materials
        const materialsResult = await db`
          SELECT total_cost, quantity, price_per_unit
          FROM materials
          WHERE product_id = ${product.id}
        `;
        const materials = Array.isArray(materialsResult) ? materialsResult : materialsResult.rows || [];
        const totalMaterialsCost = materials.reduce((sum: number, m: any) => sum + Number(m.total_cost || 0), 0);

        // Get labor costs
        const laborResult = await db`
          SELECT total_cost, per_unit
          FROM labor_costs
          WHERE product_id = ${product.id}
        `;
        const laborCosts = Array.isArray(laborResult) ? laborResult : laborResult.rows || [];
        const laborPerProduct = laborCosts
          .filter((l: any) => l.per_unit)
          .reduce((sum: number, l: any) => sum + Number(l.total_cost || 0), 0);
        const laborPerBatch = laborCosts
          .filter((l: any) => !l.per_unit)
          .reduce((sum: number, l: any) => sum + Number(l.total_cost || 0), 0);
        const totalLaborCostPerProduct = laborPerProduct + (product.batch_size > 0 ? laborPerBatch / product.batch_size : 0);

        // Get other costs
        const otherCostsResult = await db`
          SELECT total_cost, per_unit
          FROM other_costs
          WHERE product_id = ${product.id}
        `;
        const otherCosts = Array.isArray(otherCostsResult) ? otherCostsResult : otherCostsResult.rows || [];
        const otherCostsPerProduct = otherCosts
          .filter((o: any) => o.per_unit)
          .reduce((sum: number, o: any) => sum + Number(o.total_cost || 0), 0);
        const otherCostsPerBatch = otherCosts
          .filter((o: any) => !o.per_unit)
          .reduce((sum: number, o: any) => sum + Number(o.total_cost || 0), 0);
        const totalOtherCostsPerProduct = otherCostsPerProduct + (product.batch_size > 0 ? otherCostsPerBatch / product.batch_size : 0);

        // Calculate total cost per product
        const productCost = totalMaterialsCost + totalLaborCostPerProduct + totalOtherCostsPerProduct;

        // Calculate profit and profit margin
        const targetPrice = product.target_price ? Number(product.target_price) : null;
        const profit = targetPrice && productCost > 0 ? targetPrice - productCost : null;
        const profitMargin = targetPrice && productCost > 0 && targetPrice > 0 
          ? ((targetPrice - productCost) / targetPrice) * 100 
          : null;
        const costsPercentage = targetPrice && productCost > 0 && targetPrice > 0
          ? (productCost / targetPrice) * 100
          : null;

        return {
          ...product,
          product_cost: productCost,
          profit,
          profit_margin: profitMargin,
          costs_percentage: costsPercentage,
        };
      })
    );

    return res.json({
      status: 'success',
      data: productsWithCosts,
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack,
      }),
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
      SELECT id, name, sku, description, category, batch_size, target_price, pricing_method, pricing_value, created_at, updated_at
      FROM products
      WHERE id = ${productId} AND user_id = ${req.userId}
    `;
    const productRows = Array.isArray(productResult) ? productResult : productResult.rows || [];

    if (productRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    const product = productRows[0];

    // Get materials
    const materialsResult = await db`
      SELECT m.id, m.name, m.quantity, m.unit, m.price_per_unit, m.units_made, m.total_cost, m.user_material_id,
             um.width, um.length
      FROM materials m
      LEFT JOIN user_materials um ON m.user_material_id = um.id
      WHERE m.product_id = ${productId}
    `;
    const materials = Array.isArray(materialsResult) ? materialsResult : materialsResult.rows || [];

    // Get labor costs
    const laborResult = await db`
      SELECT id, activity, time_spent_minutes, hourly_rate, total_cost, per_unit
      FROM labor_costs
      WHERE product_id = ${productId}
    `;
    const laborCosts = Array.isArray(laborResult) ? laborResult : laborResult.rows || [];

    // Get other costs
    const otherCostsResult = await db`
      SELECT id, item, quantity, cost, total_cost, per_unit
      FROM other_costs
      WHERE product_id = ${productId}
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
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack,
      }),
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
    const { name, sku, description, category, batch_size, target_price, pricing_method, pricing_value, materials, labor_costs, other_costs } = validatedData;

    // Check if product exists and belongs to user
    const productCheck = await db`
      SELECT id FROM products
      WHERE id = ${productId} AND user_id = ${req.userId}
    `;
    const productRows = Array.isArray(productCheck) ? productCheck : productCheck.rows || [];
    
    if (productRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Update product - handle status separately as it's optional
    const status = (req.body as any).status || null;
    
    await db`
      UPDATE products
      SET name = ${name},
          sku = ${sku || null},
          description = ${description || null},
          category = ${category || null},
          status = ${status || null},
          batch_size = ${batch_size || 1},
          target_price = ${target_price || null},
          pricing_method = ${pricing_method || null},
          pricing_value = ${pricing_value || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${productId} AND user_id = ${req.userId}
    `;

    // Delete existing related records
    await db`DELETE FROM materials WHERE product_id = ${productId}`;
    await db`DELETE FROM labor_costs WHERE product_id = ${productId}`;
    await db`DELETE FROM other_costs WHERE product_id = ${productId}`;

    // Insert new materials if provided
    if (materials && materials.length > 0) {
      for (const material of materials) {
        const unitsMade = material.units_made || 1;
        const totalCost = (material.quantity * material.price_per_unit) / unitsMade;
        await db`
          INSERT INTO materials (product_id, user_material_id, name, quantity, unit, price_per_unit, units_made, total_cost)
          VALUES (${productId}, ${material.user_material_id || null}, ${material.name}, ${material.quantity}, ${material.unit}, ${material.price_per_unit}, ${unitsMade}, ${totalCost})
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
        pricing_method,
        pricing_value,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        issues: error.issues,
      });
    }
    
    console.error('Update product error:', {
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

export const deleteProduct = async (req: AuthRequest, res: Response) => {
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

    // Check if product exists and belongs to user
    const productCheck = await db`
      SELECT id FROM products
      WHERE id = ${productId} AND user_id = ${req.userId}
    `;
    const productRows = Array.isArray(productCheck) ? productCheck : productCheck.rows || [];
    
    if (productRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Delete related records first (cascade delete)
    // Delete materials
    await db`DELETE FROM materials WHERE product_id = ${productId}`;
    
    // Delete labor costs
    await db`DELETE FROM labor_costs WHERE product_id = ${productId}`;
    
    // Delete other costs
    await db`DELETE FROM other_costs WHERE product_id = ${productId}`;
    
    // Delete the product
    await db`DELETE FROM products WHERE id = ${productId} AND user_id = ${req.userId}`;

    return res.json({
      status: 'success',
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete product',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack,
      }),
    });
  }
};
