import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { SubscriptionInfo } from '@priceme/shared';

export type { SubscriptionInfo };

export interface UserSettings {
  currency: string;
  tax_percentage: number;
  revenue_goal: number | null;
  labor_hourly_cost: number | null;
  unit_system?: 'imperial' | 'metric';
  units?: string[];
  seller_country?: string;
  default_platform_profile_id?: number | null;
  subscription?: SubscriptionInfo;
}

const defaultSettings: UserSettings = {
  currency: 'USD',
  tax_percentage: 0,
  revenue_goal: null,
  labor_hourly_cost: null,
  unit_system: 'metric',
  units: ['ml', 'L', 'g', 'kg', 'mm', 'cm', 'm', 'm²', 'pcs'],
  seller_country: 'US',
  default_platform_profile_id: null,
};

export function useSettings() {
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        console.log('Fetching settings from API...');
        const response = await api.get('/settings');
        console.log('Settings API response:', response.data);

        if (response.data && response.data.status === 'success') {
          const data = response.data.data;
          const mappedSettings = {
            currency: data.currency || 'USD',
            tax_percentage: data.tax_percentage || 0,
            revenue_goal: data.revenue_goal || null,
            labor_hourly_cost: data.labor_hourly_cost || null,
            unit_system: data.unit_system || 'metric',
            units: data.units && Array.isArray(data.units) && data.units.length > 0
              ? data.units
              : defaultSettings.units,
            seller_country: data.seller_country || 'US',
            default_platform_profile_id: data.default_platform_profile_id ?? null,
            subscription: data.subscription ?? undefined,
          } as UserSettings;
          console.log('Mapped settings:', mappedSettings);
          return mappedSettings;
        }
        console.warn('Settings API returned non-success status:', response.data);
        return defaultSettings;
      } catch (err: any) {
        console.error('Error fetching settings:', err);
        throw err; // Allow useQuery to handle error state instead of masking it with defaults
      }
    },
    // Remove initialData to properly show loading states
    // initialData: defaultSettings,
  });

  const queryClient = useQueryClient();

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      console.log('Mutating settings:', newSettings);
      const response = await api.put('/settings', newSettings);
      return response.data;
    },
    onSuccess: () => {
      console.log('Settings mutation successful, invalidating query...');
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return {
    settings: query.data || defaultSettings,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending
  };
}

