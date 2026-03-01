import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Supplier {
  id: number;
  user_id: number;
  name: string;
  link?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  material_count?: number;
  created_at: string;
  updated_at: string;
}

export type CreateSupplierData = {
  name: string;
  link?: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export function useSuppliers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      if (response.data.status === 'success') {
        return response.data.data as Supplier[];
      }
      return [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateSupplierData) => {
      const response = await api.post('/suppliers', data);
      return response.data.data as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateSupplierData> }) => {
      const response = await api.put(`/suppliers/${id}`, data);
      return response.data.data as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  const bulkDeleteSuppliers = async (ids: number[]) => {
    await Promise.all(ids.map((id) => api.delete(`/suppliers/${id}`)));
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  };

  return {
    suppliers: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createSupplier: createMutation.mutateAsync,
    updateSupplier: updateMutation.mutateAsync,
    deleteSupplier: deleteMutation.mutateAsync,
    bulkDeleteSuppliers,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: query.refetch,
  };
}
