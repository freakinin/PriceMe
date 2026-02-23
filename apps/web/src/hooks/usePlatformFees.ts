import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PlatformFeeProfile, PlatformFeeProfileInput } from '@priceme/shared';

export type { PlatformFeeProfile };

export function usePlatformFees() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['platform-fees'],
    queryFn: async (): Promise<PlatformFeeProfile[]> => {
      const response = await api.get('/platform-fees');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PlatformFeeProfileInput): Promise<PlatformFeeProfile> => {
      const response = await api.post('/platform-fees', data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-fees'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PlatformFeeProfileInput }): Promise<PlatformFeeProfile> => {
      const response = await api.put(`/platform-fees/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-fees'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/platform-fees/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-fees'] }),
  });

  const getEtsyDefaults = async (country: string): Promise<PlatformFeeProfileInput> => {
    const response = await api.get('/platform-fees/etsy-defaults', { params: { country } });
    return response.data.data;
  };

  return {
    profiles: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    createProfile: createMutation.mutateAsync,
    updateProfile: updateMutation.mutateAsync,
    deleteProfile: deleteMutation.mutateAsync,
    getEtsyDefaults,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
