import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ShippingMethod, ShippingMethodInput } from '@priceme/shared';

export type { ShippingMethod };

export function useShippingMethods() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: async (): Promise<ShippingMethod[]> => {
      const response = await api.get('/shipping-methods');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ShippingMethodInput): Promise<ShippingMethod> => {
      const response = await api.post('/shipping-methods', data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipping-methods'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ShippingMethodInput }): Promise<ShippingMethod> => {
      const response = await api.put(`/shipping-methods/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipping-methods'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/shipping-methods/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipping-methods'] }),
  });

  return {
    methods: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    createMethod: createMutation.mutateAsync,
    updateMethod: updateMutation.mutateAsync,
    deleteMethod: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
