import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Category {
    id: number;
    name: string;
    description?: string;
    product_count?: number; // Optional, if backend returns it
    created_at: string;
    updated_at: string;
}

export function useCategories() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            if (response.data.status === 'success') {
                return response.data.data as Category[];
            }
            return [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: Partial<Category>) => {
            const response = await api.post('/categories', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Category> }) => {
            const response = await api.put(`/categories/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: number[]) => {
            const response = await api.post('/categories/bulk-delete', { ids });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });

    return {
        categories: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        createCategory: createMutation.mutateAsync,
        updateCategory: updateMutation.mutateAsync,
        deleteCategory: deleteMutation.mutateAsync,
        bulkDeleteCategory: bulkDeleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending || bulkDeleteMutation.isPending,
        refetch: query.refetch
    };
}
