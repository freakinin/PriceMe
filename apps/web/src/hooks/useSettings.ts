import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface UserSettings {
  currency: string;
  tax_percentage: number;
  revenue_goal: number | null;
  labor_hourly_cost: number | null;
  units?: string[];
}

const defaultSettings: UserSettings = {
  currency: 'USD',
  tax_percentage: 0,
  revenue_goal: null,
  labor_hourly_cost: null,
  units: [
    // Volume
    'ml', 'L', 'fl oz', 'pt', 'qt', 'gal',
    // Weight
    'g', 'kg', 'oz', 'lb',
    // Length
    'mm', 'cm', 'm', 'in', 'ft', 'yd',
    // Area
    'm²', 'ft²',
    // Count/Pieces
    'pcs', 'piece', 'unit', 'set', 'pack', 'box', 'roll', 'sheet', 'yard'
  ],
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/settings');
      
      if (response.data && response.data.status === 'success') {
        const data = response.data.data;
        setSettings({
          currency: data.currency || 'USD',
          tax_percentage: data.tax_percentage || 0,
          revenue_goal: data.revenue_goal || null,
          labor_hourly_cost: data.labor_hourly_cost || null,
          units: data.units || ['ml', 'pcs', 'g', 'oz', 'lb', 'kg'],
        });
      } else {
        // Use defaults if no settings found
        setSettings(defaultSettings);
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      // Use defaults on error
      setSettings(defaultSettings);
      // Only set error for actual HTTP errors (not 200 with default values)
      if (err.response && err.response.status >= 400) {
        setError(err.response?.data?.message || 'Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, error, refetch: fetchSettings };
}

