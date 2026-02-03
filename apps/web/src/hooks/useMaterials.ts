
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Material {
    id: number;
    name: string;
    price: number;
    quantity: number;
    unit: string;
    price_per_unit: number;
    width?: number;
    length?: number;
    details?: string;
    supplier?: string;
    supplier_link?: string;
    stock_level: number;
    reorder_point: number;
    last_purchased_date?: string;
    last_purchased_price?: number;
    last_purchased_quantity?: number;
    category?: string;
    created_at: string;
    updated_at: string;
    is_percentage_type?: boolean; // Sometimes returned from API or inferred
}

export function useMaterials() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['materials'],
        queryFn: async () => {
            const response = await api.get('/materials');
            if (response.data.status === 'success') {
                return response.data.data as Material[];
            }
            return [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: Partial<Material>) => {
            const response = await api.post('/materials', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Material> }) => {
            const response = await api.put(`/materials/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/materials/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: number[]) => {
            await api.post('/materials/bulk-delete', { ids });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: async ({ ids, data }: { ids: number[], data: { category?: string; reorder_point?: number; unit?: string } }) => {
            await api.post('/materials/bulk-update', { ids, data });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });

    return {
        materials: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        createMaterial: createMutation.mutateAsync,
        updateMaterial: updateMutation.mutateAsync,
        deleteMaterial: deleteMutation.mutateAsync,
        bulkDeleteMaterials: bulkDeleteMutation.mutateAsync,
        bulkUpdateMaterials: bulkUpdateMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending || bulkUpdateMutation.isPending,
        isDeleting: deleteMutation.isPending || bulkDeleteMutation.isPending,
        refetch: query.refetch
    };
}
