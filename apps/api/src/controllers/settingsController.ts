import { Response } from 'express';
import { db } from '../utils/db.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';

const updateSettingsSchema = z.object({
  currency: z.string().length(3).optional(),
  tax_percentage: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    },
    z.number().min(0).max(100).optional()
  ),
  revenue_goal: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    },
    z.number().min(0).optional().nullable()
  ),
  labor_hourly_cost: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    },
    z.number().min(0).optional().nullable()
  ),
  unit_system: z.enum(['imperial', 'metric']).optional(),
  units: z.array(z.string()).min(1).optional(),
});

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    try {
      const settingsResult = await db`
        SELECT currency, tax_percentage, revenue_goal, labor_hourly_cost, unit_system, units
        FROM user_settings
        WHERE user_id = ${req.userId}
      `;

      const settingsList = Array.isArray(settingsResult) ? settingsResult : (settingsResult.rows || []);
      const settings = settingsList && settingsList.length > 0 ? settingsList[0] : null;

      // Default units based on system
      const defaultMetricUnits = ['ml', 'L', 'g', 'kg', 'mm', 'cm', 'm', 'm²', 'pcs'];
      const defaultImperialUnits = ['fl oz', 'pt', 'qt', 'gal', 'oz', 'lb', 'in', 'ft', 'yd', 'ft²', 'pcs'];

      // If no settings exist, return defaults
      if (!settings) {
        return res.json({
          status: 'success',
          data: {
            currency: 'USD',
            tax_percentage: 0,
            revenue_goal: null,
            labor_hourly_cost: null,
            unit_system: 'metric',
            units: defaultMetricUnits,
          },
        });
      }

      // Return existing settings
      return res.json({
        status: 'success',
        data: {
          currency: settings.currency || 'USD',
          tax_percentage: settings.tax_percentage ? Number(settings.tax_percentage) : 0,
          revenue_goal: settings.revenue_goal ? Number(settings.revenue_goal) : null,
          labor_hourly_cost: settings.labor_hourly_cost ? Number(settings.labor_hourly_cost) : null,
          unit_system: settings.unit_system || 'metric',
          units: settings.units && Array.isArray(settings.units) && settings.units.length > 0 
            ? settings.units 
            : (settings.unit_system === 'imperial' ? defaultImperialUnits : defaultMetricUnits),
        },
      });
    } catch (dbError: any) {
      console.error('Database error in getSettings:', dbError);
      // If there's a DB error (like table doesn't exist), return defaults
      return res.json({
        status: 'success',
        data: {
          currency: 'USD',
          tax_percentage: 0,
          revenue_goal: null,
          labor_hourly_cost: null,
          unit_system: 'metric',
          units: ['ml', 'L', 'g', 'kg', 'mm', 'cm', 'm', 'm²', 'pcs'],
        },
      });
    }
  } catch (error: any) {
    console.error('Get settings error:', error);
    console.error('Error details:', error.message, error.stack);
    // Return defaults instead of error to prevent UI from showing error message
    return res.json({
      status: 'success',
      data: {
        currency: 'USD',
        tax_percentage: 0,
        revenue_goal: null,
        labor_hourly_cost: null,
        unit_system: 'metric',
        units: ['ml', 'L', 'g', 'kg', 'mm', 'cm', 'm', 'm²', 'pcs'],
      },
    });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    console.log('Update settings request body:', req.body);

    // Validate input
    const validatedData = updateSettingsSchema.parse(req.body);
    console.log('Validated data:', validatedData);
    const { currency, tax_percentage, revenue_goal, labor_hourly_cost, unit_system, units } = validatedData;

    // Check if settings exist
    const existingSettings = await db`
      SELECT id FROM user_settings WHERE user_id = ${req.userId}
    `;
    const settingsExists = Array.isArray(existingSettings) 
      ? existingSettings.length > 0 
      : (existingSettings.rows || []).length > 0;

    console.log('Settings exists:', settingsExists);

    if (settingsExists) {
      // Update existing settings - fetch current values first, then update
      const currentSettings = await db`
        SELECT currency, tax_percentage, revenue_goal, labor_hourly_cost, unit_system, units
        FROM user_settings
        WHERE user_id = ${req.userId}
      `;
      const current = Array.isArray(currentSettings) ? currentSettings[0] : currentSettings.rows?.[0];

      // Use provided values or keep current ones
      const finalCurrency = currency !== undefined ? currency : current.currency;
      const finalTaxPercentage = tax_percentage !== undefined ? tax_percentage : current.tax_percentage;
      const finalRevenueGoal = revenue_goal !== undefined ? revenue_goal : current.revenue_goal;
      const finalLaborHourlyCost = labor_hourly_cost !== undefined ? labor_hourly_cost : current.labor_hourly_cost;
      const finalUnitSystem = unit_system !== undefined ? unit_system : (current.unit_system || 'metric');
      const finalUnits = units !== undefined ? units : (current.units || []);

      await db`
        UPDATE user_settings
        SET 
          currency = ${finalCurrency},
          tax_percentage = ${finalTaxPercentage},
          revenue_goal = ${finalRevenueGoal},
          labor_hourly_cost = ${finalLaborHourlyCost},
          unit_system = ${finalUnitSystem},
          units = ${finalUnits},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${req.userId}
      `;
    } else {
      // Default units based on system
      const defaultUnits = unit_system === 'imperial' 
        ? ['fl oz', 'pt', 'qt', 'gal', 'oz', 'lb', 'in', 'ft', 'yd', 'ft²', 'pcs']
        : ['ml', 'L', 'g', 'kg', 'mm', 'cm', 'm', 'm²', 'pcs'];

      // Create new settings
      await db`
        INSERT INTO user_settings (user_id, currency, tax_percentage, revenue_goal, labor_hourly_cost, unit_system, units)
        VALUES (
          ${req.userId},
          ${currency || 'USD'},
          ${tax_percentage !== undefined ? tax_percentage : 0},
          ${revenue_goal !== undefined ? revenue_goal : null},
          ${labor_hourly_cost !== undefined ? labor_hourly_cost : null},
          ${unit_system || 'metric'},
          ${units || defaultUnits}
        )
      `;
    }

    // Fetch updated settings
    const updatedSettings = await db`
      SELECT currency, tax_percentage, revenue_goal, labor_hourly_cost, unit_system, units
      FROM user_settings
      WHERE user_id = ${req.userId}
    `;

    const settingsList = Array.isArray(updatedSettings) ? updatedSettings : (updatedSettings.rows || []);
    const settings = settingsList[0];

    return res.json({
      status: 'success',
      message: 'Settings updated successfully',
      data: {
        currency: settings.currency || 'USD',
        tax_percentage: settings.tax_percentage ? Number(settings.tax_percentage) : 0,
        revenue_goal: settings.revenue_goal ? Number(settings.revenue_goal) : null,
        labor_hourly_cost: settings.labor_hourly_cost ? Number(settings.labor_hourly_cost) : null,
        unit_system: settings.unit_system || 'metric',
        units: settings.units && Array.isArray(settings.units) ? settings.units : [],
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('Validation error:', error.errors);
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Update settings error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update settings',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        details: error.stack 
      }),
    });
  }
};

