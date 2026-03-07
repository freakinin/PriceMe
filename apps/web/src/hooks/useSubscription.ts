import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { SubscriptionInfo, PlanName } from '@priceme/shared';

export type { SubscriptionInfo };

export function useSubscription() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['subscription'],
    queryFn: async (): Promise<SubscriptionInfo> => {
      const response = await api.get('/subscription');
      if (response.data.status === 'success') return response.data.data;
      throw new Error('Failed to load subscription');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — subscription rarely changes mid-session
  });

  const isAtLimit = (resource: 'products' | 'competitors'): boolean => {
    const data = query.data;
    if (!data) return false;
    const limit = data.limits[resource];
    if (limit === -1) return false;
    return data.usage[resource] >= limit;
  };

  const getUsagePercent = (resource: 'products' | 'competitors'): number => {
    const data = query.data;
    if (!data) return 0;
    const limit = data.limits[resource];
    if (limit === -1) return 0;
    return Math.min(100, Math.round((data.usage[resource] / limit) * 100));
  };

  const plan = query.data?.plan as PlanName | undefined;

  return {
    subscription: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    isAtLimit,
    getUsagePercent,
    isPro: plan === 'growth' || plan === 'pro',
    isBusiness: plan === 'pro',
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['subscription'] }),
  };
}
