import { Response } from 'express';
import { db } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createMaterialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().nonnegative('Price must be 0 or greater'),
  quantity: z.number().nonnegative('Quantity must be 0 or greater'),
  unit: z.string().min(1, 'Unit is required'),
  price_per_unit: z.number().nonnegative('Price per unit must be 0 or greater'),
  details: z.string().optional(),
  supplier: z.string().optional(),
  supplier_link: z.string().url().optional().or(z.literal('')),
  stock_level: z.number().nonnegative().optional(),
  reorder_point: z.number().nonnegative().optional(),
  last_purchased_date: z.string().optional(),
  last_purchased_price: z.number().nonnegative().optional(),
  category: z.string().optional(),
});

const updateMaterialSchema = createMaterialSchema.partial();

export const createMaterial = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const validatedData = createMaterialSchema.parse(req.body);
    const {
      name,
      price,
      quantity,
      unit,
      price_per_unit,
      details,
      supplier,
      supplier_link,
      stock_level,
      reorder_point,
      last_purchased_date,
      last_purchased_price,
      category,
    } = validatedData;

    const result = await db`
      INSERT INTO user_materials (
        user_id, name, price, quantity, unit, price_per_unit, details,
        supplier, supplier_link, stock_level, reorder_point,
        last_purchased_date, last_purchased_price, category
      )
      VALUES (
        ${req.userId}, ${name}, ${price}, ${quantity || 0}, ${unit}, ${price_per_unit},
        ${details || null}, ${supplier || null}, ${supplier_link || null},
        ${stock_level || 0}, ${reorder_point || 0},
        ${last_purchased_date || null}, ${last_purchased_price || null}, ${category || null}
      )
      RETURNING *
    `;

    const material = Array.isArray(result) ? result[0] : result.rows[0];

    return res.status(201).json({
      status: 'success',
      message: 'Material created successfully',
      data: material,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Create material error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create material',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

export const getMaterials = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    // Get query parameters for filtering, sorting, and searching
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string) || 'desc';
    const lowStock = req.query.lowStock === 'true';

    // Validate sort parameters - use safe defaults
    const validSortColumns = ['name', 'price', 'price_per_unit', 'stock_level', 'created_at', 'updated_at', 'category'];
    const validSortOrder = ['asc', 'desc'];
    const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrder.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Build query with all conditions
    let result;
    
    // Simple case: no filters
    if (!search && (!category || category === 'all') && !lowStock) {
      if (finalSortBy === 'created_at' && finalSortOrder === 'DESC') {
        result = await db`
          SELECT * FROM user_materials
          WHERE user_id = ${req.userId}
          ORDER BY created_at DESC
        `;
      } else if (finalSortBy === 'name' && finalSortOrder === 'ASC') {
        result = await db`
          SELECT * FROM user_materials
          WHERE user_id = ${req.userId}
          ORDER BY name ASC
        `;
      } else if (finalSortBy === 'name' && finalSortOrder === 'DESC') {
        result = await db`
          SELECT * FROM user_materials
          WHERE user_id = ${req.userId}
          ORDER BY name DESC
        `;
      } else {
        // For other sorts, fetch all and sort in memory (temporary solution)
        const allResults = await db`
          SELECT * FROM user_materials
          WHERE user_id = ${req.userId}
        `;
        const materials = Array.isArray(allResults) ? allResults : allResults.rows || [];
        materials.sort((a: any, b: any) => {
          const aVal = a[finalSortBy];
          const bVal = b[finalSortBy];
          if (aVal === null || aVal === undefined) return 1;
          if (bVal === null || bVal === undefined) return -1;
          if (finalSortOrder === 'ASC') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
          }
        });
        result = materials;
      }
    } else {
      // Complex filters - fetch all matching and sort in memory
      let baseQuery = db`
        SELECT * FROM user_materials
        WHERE user_id = ${req.userId}
      `;
      
      if (search) {
        baseQuery = db`
          SELECT * FROM user_materials
          WHERE user_id = ${req.userId}
          AND (name ILIKE ${`%${search}%`} OR supplier ILIKE ${`%${search}%`} OR category ILIKE ${`%${search}%`} OR details ILIKE ${`%${search}%`})
        `;
      }
      
      if (category && category !== 'all') {
        if (search) {
          baseQuery = db`
            SELECT * FROM user_materials
            WHERE user_id = ${req.userId}
            AND (name ILIKE ${`%${search}%`} OR supplier ILIKE ${`%${search}%`} OR category ILIKE ${`%${search}%`} OR details ILIKE ${`%${search}%`})
            AND category = ${category}
          `;
        } else {
          baseQuery = db`
            SELECT * FROM user_materials
            WHERE user_id = ${req.userId}
            AND category = ${category}
          `;
        }
      }
      
      if (lowStock) {
        if (search && category && category !== 'all') {
          baseQuery = db`
            SELECT * FROM user_materials
            WHERE user_id = ${req.userId}
            AND (name ILIKE ${`%${search}%`} OR supplier ILIKE ${`%${search}%`} OR category ILIKE ${`%${search}%`} OR details ILIKE ${`%${search}%`})
            AND category = ${category}
            AND stock_level <= reorder_point
          `;
        } else if (search) {
          baseQuery = db`
            SELECT * FROM user_materials
            WHERE user_id = ${req.userId}
            AND (name ILIKE ${`%${search}%`} OR supplier ILIKE ${`%${search}%`} OR category ILIKE ${`%${search}%`} OR details ILIKE ${`%${search}%`})
            AND stock_level <= reorder_point
          `;
        } else if (category && category !== 'all') {
          baseQuery = db`
            SELECT * FROM user_materials
            WHERE user_id = ${req.userId}
            AND category = ${category}
            AND stock_level <= reorder_point
          `;
        } else {
          baseQuery = db`
            SELECT * FROM user_materials
            WHERE user_id = ${req.userId}
            AND stock_level <= reorder_point
          `;
        }
      }
      
      const queryResult = await baseQuery;
      const materials = Array.isArray(queryResult) ? queryResult : queryResult.rows || [];
      
      // Sort in memory
      materials.sort((a: any, b: any) => {
        const aVal = a[finalSortBy];
        const bVal = b[finalSortBy];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (finalSortOrder === 'ASC') {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
      });
      
      result = materials;
    }

    const materials = Array.isArray(result) ? result : result.rows || [];

    return res.json({
      status: 'success',
      data: materials,
    });
  } catch (error: any) {
    console.error('Get materials error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch materials',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack,
        details: error,
      }),
    });
  }
};

export const getMaterial = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const materialId = parseInt(req.params.id);
    if (isNaN(materialId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid material ID',
      });
    }

    const result = await db`
      SELECT * FROM user_materials
      WHERE id = ${materialId} AND user_id = ${req.userId}
    `;

    const materials = Array.isArray(result) ? result : result.rows || [];
    if (materials.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Material not found',
      });
    }

    return res.json({
      status: 'success',
      data: materials[0],
    });
  } catch (error: any) {
    console.error('Get material error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch material',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

export const updateMaterial = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const materialId = parseInt(req.params.id);
    if (isNaN(materialId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid material ID',
      });
    }

    const validatedData = updateMaterialSchema.parse(req.body);

    // Check if material exists and belongs to user
    const existingResult = await db`
      SELECT id FROM user_materials
      WHERE id = ${materialId} AND user_id = ${req.userId}
    `;
    const existing = Array.isArray(existingResult) ? existingResult : existingResult.rows || [];
    if (existing.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Material not found',
      });
    }

    // Get current material to merge with updates
    const currentResult = await db`
      SELECT * FROM user_materials
      WHERE id = ${materialId} AND user_id = ${req.userId}
    `;
    const currentMaterials = Array.isArray(currentResult) ? currentResult : currentResult.rows || [];
    if (currentMaterials.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Material not found',
      });
    }

    const current = currentMaterials[0];

    // Merge current values with updates
    const mergedData = {
      name: validatedData.name !== undefined ? validatedData.name : current.name,
      price: validatedData.price !== undefined ? validatedData.price : Number(current.price),
      quantity: validatedData.quantity !== undefined ? validatedData.quantity : Number(current.quantity),
      unit: validatedData.unit !== undefined ? validatedData.unit : current.unit,
      price_per_unit: validatedData.price_per_unit !== undefined ? validatedData.price_per_unit : Number(current.price_per_unit),
      details: validatedData.details !== undefined ? validatedData.details : current.details,
      supplier: validatedData.supplier !== undefined ? validatedData.supplier : current.supplier,
      supplier_link: validatedData.supplier_link !== undefined ? validatedData.supplier_link : current.supplier_link,
      stock_level: validatedData.stock_level !== undefined ? validatedData.stock_level : Number(current.stock_level || 0),
      reorder_point: validatedData.reorder_point !== undefined ? validatedData.reorder_point : Number(current.reorder_point || 0),
      last_purchased_date: validatedData.last_purchased_date !== undefined ? validatedData.last_purchased_date : current.last_purchased_date,
      last_purchased_price: validatedData.last_purchased_price !== undefined ? validatedData.last_purchased_price : (current.last_purchased_price ? Number(current.last_purchased_price) : null),
      category: validatedData.category !== undefined ? validatedData.category : current.category,
    };

    const finalResult = await db`
      UPDATE user_materials
      SET 
        name = ${mergedData.name},
        price = ${mergedData.price},
        quantity = ${mergedData.quantity},
        unit = ${mergedData.unit},
        price_per_unit = ${mergedData.price_per_unit},
        details = ${mergedData.details || null},
        supplier = ${mergedData.supplier || null},
        supplier_link = ${mergedData.supplier_link || null},
        stock_level = ${mergedData.stock_level},
        reorder_point = ${mergedData.reorder_point},
        last_purchased_date = ${mergedData.last_purchased_date || null},
        last_purchased_price = ${mergedData.last_purchased_price || null},
        category = ${mergedData.category || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${materialId} AND user_id = ${req.userId}
      RETURNING *
    `;

    const materials = Array.isArray(finalResult) ? finalResult : finalResult.rows || [];
    if (materials.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Material not found',
      });
    }

    return res.json({
      status: 'success',
      message: 'Material updated successfully',
      data: materials[0],
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Update material error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update material',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

export const deleteMaterial = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const materialId = parseInt(req.params.id);
    if (isNaN(materialId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid material ID',
      });
    }

    const result = await db`
      DELETE FROM user_materials
      WHERE id = ${materialId} AND user_id = ${req.userId}
      RETURNING id
    `;

    const deleted = Array.isArray(result) ? result : result.rows || [];
    if (deleted.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Material not found',
      });
    }

    return res.json({
      status: 'success',
      message: 'Material deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete material error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete material',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

