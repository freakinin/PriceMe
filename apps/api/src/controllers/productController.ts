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
    const { name, sku, status, description, category, batch_size, target_price, pricing_method, pricing_value, materials, labor_costs, other_costs, variants } = validatedData;

    // Start transaction: Create product
    console.log('Inserting product with userId:', req.userId);
    const productResult = await db`
      INSERT INTO products (user_id, name, sku, status, description, category, batch_size, target_price, pricing_method, pricing_value)
      VALUES (${req.userId}, ${name}, ${sku || null}, ${status || 'draft'}, ${description || null}, ${category || null}, ${batch_size || 1}, ${target_price || null}, ${pricing_method || null}, ${pricing_value || null})
      RETURNING id
    `;

    console.log('Product result type:', typeof productResult);
    console.log('Product result:', JSON.stringify(productResult, null, 2));

    // Handle Vercel Postgres result structure
    // Vercel Postgres returns results in .rows array
    let productId: number | undefined;
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

    // Insert variants if provided
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        // Insert variant
        const variantResult = await db`
          INSERT INTO product_variants (product_id, name, sku, price_override, cost_override, stock_level, is_active)
          VALUES (${productId}, ${variant.name}, ${variant.sku || null}, ${variant.price_override || null}, ${variant.cost_override || null}, ${variant.stock_level}, ${variant.is_active ?? true})
          RETURNING id
        `;

        // Handle Vercel Postgres result structure
        let variantId: number | null = null;
        if (Array.isArray(variantResult)) {
          variantId = variantResult[0]?.id;
        } else if (variantResult && typeof variantResult === 'object' && 'rows' in variantResult) {
          const rows = (variantResult as any).rows;
          if (rows && rows.length > 0) {
            variantId = rows[0].id;
          }
        } else if ((variantResult as any)?.id) {
          variantId = (variantResult as any).id;
        }

        if (variantId && variant.attributes && variant.attributes.length > 0) {
          for (const attr of variant.attributes) {
            await db`
              INSERT INTO variant_attributes (variant_id, attribute_name, attribute_value, display_order)
              VALUES (${variantId}, ${attr.attribute_name}, ${attr.attribute_value}, ${attr.display_order || 0})
            `;
          }
        }
      }
    }

    // If product status is 'on_sale', reduce stock for materials with user_material_id
    const effectiveStatus = status || 'draft';
    const effectiveBatchSize = batch_size || 1;

    if (effectiveStatus === 'on_sale' && materials && materials.length > 0) {
      console.log('Product created with on_sale status, reducing stock. Batch size:', effectiveBatchSize);

      // Reduce stock for each material that has user_material_id
      for (const material of materials) {
        if (!material.user_material_id) {
          // Skip materials without user_material_id (custom materials not in library)
          console.log('Skipping material without user_material_id:', material.name);
          continue;
        }

        // Calculate required quantity: quantity is per product, so for the batch we need: quantity * batchSize
        const requiredQuantity = material.quantity * effectiveBatchSize;

        console.log(`Reducing stock for material ${material.user_material_id}:`, {
          name: material.name,
          quantity: material.quantity,
          batch_size: effectiveBatchSize,
          required: requiredQuantity,
        });

        // Reduce stock
        await db`
          UPDATE user_materials
          SET stock_level = stock_level - ${requiredQuantity},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${material.user_material_id} AND user_id = ${req.userId}
        `;

        console.log(`Stock reduced for material ${material.user_material_id} by ${requiredQuantity}`);
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

// Helper to calculate product metrics
const calculateProductMetrics = async (product: any) => {
  // Get materials
  const materialsResult = await db`
    SELECT id, name, quantity, unit, price_per_unit, units_made, total_cost, user_material_id
    FROM materials
    WHERE product_id = ${product.id}
  `;
  const materials = Array.isArray(materialsResult) ? materialsResult : materialsResult.rows || [];
  const totalMaterialsCost = materials.reduce((sum: number, m: any) => sum + Number(m.total_cost || 0), 0);

  // Get labor costs
  const laborResult = await db`
    SELECT id, activity, time_spent_minutes, hourly_rate, total_cost, per_unit
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
    SELECT id, item, quantity, cost, total_cost, per_unit
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
    product_cost: productCost,
    profit,
    profit_margin: profitMargin,
    costs_percentage: costsPercentage,
    materials,
    labor_costs: laborCosts,
    other_costs: otherCosts,
  };
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
      SELECT id, name, sku, status, batch_size, target_price, pricing_method, pricing_value, created_at, updated_at
      FROM products
      WHERE user_id = ${req.userId}
      ORDER BY created_at DESC
    `;

    const productsList = Array.isArray(products) ? products : products.rows || [];

    // Calculate costs for each product
    const productsWithCosts = await Promise.all(
      productsList.map(async (product: any) => {
        const metrics = await calculateProductMetrics(product);

        // Get variants (basic info for list view) - order by name for stability
        const variantsResult = await db`
          SELECT id, name, sku, price_override, cost_override, stock_level, is_active
          FROM product_variants
          WHERE product_id = ${product.id}
          ORDER BY name ASC
        `;
        const variants = Array.isArray(variantsResult) ? variantsResult : variantsResult.rows || [];

        return {
          ...product,
          ...metrics,
          variants,
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
      SELECT id, name, sku, status, description, category, batch_size, target_price, pricing_method, pricing_value, created_at, updated_at
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

    // Calculate metrics and get related data
    const metrics = await calculateProductMetrics(product);

    // Get variants with attributes separately (includes more detail than list view)
    const variantsResult = await db`
      SELECT id, name, sku, price_override, cost_override, stock_level, is_active, created_at, updated_at
      FROM product_variants
      WHERE product_id = ${productId}
      ORDER BY name ASC
    `;
    const variantsRows = Array.isArray(variantsResult) ? variantsResult : variantsResult.rows || [];

    // Get attributes for all variants
    const variants = await Promise.all(variantsRows.map(async (variant: any) => {
      const attributesResult = await db`
        SELECT id, attribute_name, attribute_value, display_order
        FROM variant_attributes
        WHERE variant_id = ${variant.id}
        ORDER BY display_order ASC, id ASC
      `;
      const attributes = Array.isArray(attributesResult) ? attributesResult : attributesResult.rows || [];
      return { ...variant, attributes };
    }));

    return res.json({
      status: 'success',
      data: {
        ...product,
        ...metrics,
        variants,
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

    // Get current product to merge with updates
    const currentProductResult = await db`
      SELECT * FROM products
      WHERE id = ${productId} AND user_id = ${req.userId}
    `;
    const currentProductRows = Array.isArray(currentProductResult) ? currentProductResult : currentProductResult.rows || [];

    if (currentProductRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    const currentProduct = currentProductRows[0];

    // Helper to convert null to undefined for optional fields
    const nullToUndefined = (value: any) => value === null ? undefined : value;

    // Check if materials/labor/other_costs are explicitly provided in the request
    // Only consider them "provided" if they're an array (even if empty - empty means "clear all")
    const hasMaterials = Array.isArray(req.body.materials);
    const hasLaborCosts = Array.isArray(req.body.labor_costs);
    const hasOtherCosts = Array.isArray(req.body.other_costs);
    const hasVariants = Array.isArray(req.body.variants);

    // Merge request body with current product data for partial updates
    const updateData: any = {
      name: req.body.name ?? currentProduct.name,
      sku: req.body.sku !== undefined ? req.body.sku : nullToUndefined(currentProduct.sku),
      status: req.body.status !== undefined ? req.body.status : (nullToUndefined(currentProduct.status) || 'draft'),
      description: req.body.description !== undefined ? req.body.description : nullToUndefined(currentProduct.description),
      category: req.body.category !== undefined ? req.body.category : nullToUndefined(currentProduct.category),
      batch_size: req.body.batch_size ?? currentProduct.batch_size ?? 1,
      target_price: req.body.target_price !== undefined ? req.body.target_price : nullToUndefined(currentProduct.target_price),
      pricing_method: req.body.pricing_method !== undefined ? req.body.pricing_method : nullToUndefined(currentProduct.pricing_method),
      pricing_value: req.body.pricing_value !== undefined ? req.body.pricing_value : nullToUndefined(currentProduct.pricing_value),
    };

    // Only include materials/labor/other_costs if they were explicitly provided
    if (hasMaterials) {
      updateData.materials = req.body.materials;
    }
    if (hasLaborCosts) {
      updateData.labor_costs = req.body.labor_costs;
    }
    if (hasOtherCosts) {
      updateData.other_costs = req.body.other_costs;
    }
    if (hasVariants) {
      updateData.variants = req.body.variants;
    }

    console.log('API received body:', JSON.stringify(req.body, null, 2));
    console.log('API merged updateData:', JSON.stringify(updateData, null, 2));
    console.log('Has materials:', hasMaterials, 'Has labor:', hasLaborCosts, 'Has other:', hasOtherCosts, 'Has variants:', hasVariants);

    // Only validate with schema if we're updating materials/labor/other_costs/variants
    // Otherwise, use a simpler validation for just the product fields
    let validatedData: any;
    if (hasMaterials || hasLaborCosts || hasOtherCosts || hasVariants) {
      // Full validation including materials/labor/other_costs/variants
      validatedData = createProductSchema.parse(updateData);
    } else {
      // Partial update - only validate product fields, don't require materials/labor/other_costs/variants
      validatedData = {
        ...updateData,
        materials: undefined,
        labor_costs: undefined,
        other_costs: undefined,
        variants: undefined,
      };
      // Still validate the product fields
      createProductSchema.partial().parse(validatedData);
    }

    const { name, sku, status, description, category, batch_size, target_price, pricing_method, pricing_value } = validatedData;
    const materials = validatedData.materials;
    const labor_costs = validatedData.labor_costs;
    const other_costs = validatedData.other_costs;
    const variants = validatedData.variants;

    console.log('After validation - status:', status);
    console.log('After validation - validatedData:', JSON.stringify(validatedData, null, 2));
    console.log('Has materials:', hasMaterials, 'Has labor:', hasLaborCosts, 'Has other:', hasOtherCosts, 'Has variants:', hasVariants);

    // Check if status is changing to 'on_sale' - if so, reduce stock
    const isChangingToOnSale = status === 'on_sale' && currentProduct.status !== 'on_sale';

    // Start a manual "transaction" block
    try {
      await db`BEGIN`;

      // Update product first
      await db`
        UPDATE products
        SET name = ${name},
            sku = ${sku || null},
            description = ${description || null},
            category = ${category || null},
            status = ${status !== undefined ? status : null},
            batch_size = ${batch_size || 1},
            target_price = ${target_price || null},
            pricing_method = ${pricing_method || null},
            pricing_value = ${pricing_value || null},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${productId} AND user_id = ${req.userId}
      `;

      // If status changed to 'on_sale', reduce stock for materials
      if (isChangingToOnSale) {
        const effectiveBatchSize = batch_size || currentProduct.batch_size || 1;
        const materialsResult = await db`SELECT user_material_id, quantity FROM materials WHERE product_id = ${productId}`;
        const materialsList = Array.isArray(materialsResult) ? materialsResult : materialsResult.rows || [];

        for (const material of materialsList) {
          if (material.user_material_id) {
            const requiredQuantity = Number(material.quantity) * effectiveBatchSize;
            await db`
              UPDATE user_materials
              SET stock_level = stock_level - ${requiredQuantity}, updated_at = CURRENT_TIMESTAMP
              WHERE id = ${material.user_material_id} AND user_id = ${req.userId}
            `;
          }
        }
      }

      if (hasMaterials) {
        await db`DELETE FROM materials WHERE product_id = ${productId}`;
        if (materials && materials.length > 0) {
          for (const m of materials) {
            const unitsMade = m.units_made || 1;
            const totalCost = (m.quantity * m.price_per_unit) / unitsMade;
            await db`
              INSERT INTO materials (product_id, user_material_id, name, quantity, unit, price_per_unit, units_made, total_cost)
              VALUES (${productId}, ${m.user_material_id || null}, ${m.name}, ${m.quantity}, ${m.unit}, ${m.price_per_unit}, ${unitsMade}, ${totalCost})
            `;
          }
        }
      }

      if (hasLaborCosts) {
        await db`DELETE FROM labor_costs WHERE product_id = ${productId}`;
        if (labor_costs && labor_costs.length > 0) {
          for (const l of labor_costs) {
            const totalCost = (l.time_spent_minutes / 60) * l.hourly_rate;
            await db`
              INSERT INTO labor_costs (product_id, activity, time_spent_minutes, hourly_rate, total_cost, per_unit)
              VALUES (${productId}, ${l.activity}, ${l.time_spent_minutes}, ${l.hourly_rate}, ${totalCost}, ${l.per_unit ?? true})
            `;
          }
        }
      }

      if (hasOtherCosts) {
        await db`DELETE FROM other_costs WHERE product_id = ${productId}`;
        if (other_costs && other_costs.length > 0) {
          for (const o of other_costs) {
            const totalCost = o.quantity * o.cost;
            await db`
              INSERT INTO other_costs (product_id, item, quantity, cost, total_cost, per_unit)
              VALUES (${productId}, ${o.item}, ${o.quantity}, ${o.cost}, ${totalCost}, ${o.per_unit ?? true})
            `;
          }
        }
      }

      if (hasVariants) {
        await db`DELETE FROM product_variants WHERE product_id = ${productId}`;
        if (variants && variants.length > 0) {
          for (const v of variants) {
            const variantResult = await db`
              INSERT INTO product_variants (product_id, name, sku, price_override, cost_override, stock_level, is_active)
              VALUES (${productId}, ${v.name}, ${v.sku || null}, ${v.price_override || null}, ${v.cost_override || null}, ${v.stock_level}, ${v.is_active ?? true})
              RETURNING id
            `;
            const vId = Array.isArray(variantResult) ? variantResult[0]?.id : (variantResult as any)?.rows?.[0]?.id || (variantResult as any)?.id;

            if (vId && v.attributes && v.attributes.length > 0) {
              for (const attr of v.attributes) {
                await db`
                  INSERT INTO variant_attributes (variant_id, attribute_name, attribute_value, display_order)
                  VALUES (${vId}, ${attr.attribute_name}, ${attr.attribute_value}, ${attr.display_order || 0})
                `;
              }
            }
          }
        }
      }

      await db`COMMIT`;
      return res.json({
        status: 'success',
        message: 'Product updated successfully',
        data: { id: productId, name, sku, target_price }
      });

    } catch (innerError: any) {
      await db`ROLLBACK`;
      throw innerError;
    }

  } catch (error: any) {
    console.error('Update product error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: 'Validation failed', issues: error.issues });
    }
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update product',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) return res.status(400).json({ status: 'error', message: 'Invalid product ID' });

    const productCheck = await db`SELECT id FROM products WHERE id = ${productId} AND user_id = ${req.userId}`;
    if ((Array.isArray(productCheck) ? productCheck.length : (productCheck as any).rows?.length || 0) === 0) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    await db`DELETE FROM products WHERE id = ${productId} AND user_id = ${req.userId}`;
    return res.json({ status: 'success', message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to delete product' });
  }
};
