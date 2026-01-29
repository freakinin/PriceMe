import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export type PricingMethod = 'markup' | 'price' | 'profit' | 'margin';
export type ProductStatus = 'draft' | 'in_progress' | 'on_sale' | 'inactive';

export interface Product {
    id: number;
    name: string;
    sku: string | null;
    status: ProductStatus | null;
    batch_size: number;
    target_price: number | null;
    pricing_method: PricingMethod | null;
    pricing_value: number | null;
    product_cost: number;
    profit: number | null;
    profit_margin: number | null;
    costs_percentage: number | null;
    created_at: string;
    updated_at: string;
    variants?: any[];
    // Include full details for update purposes (materials, labor, etc) is better handled by detailed fetch or optional include, 
    // but the current Products page seems to update mostly top-level fields OR everything via EditProductPane.
    // The inline editing in Products table touches: name, sku, status, pricing fields.
    materials?: any[];
    labor_costs?: any[];
    other_costs?: any[];
    description?: string;
    category?: string;
}

export function useProducts() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await api.get('/products');
            if (response.data.status === 'success') {
                return response.data.data as Product[];
            }
            throw new Error(response.data.message || 'Failed to load products');
        },
    });

    const createProductMutation = useMutation({
        mutationFn: async (data: Partial<Product>) => {
            const response = await api.post('/products', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    const updateProductMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const response = await api.put(`/products/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    const deleteProductMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await api.delete(`/products/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    // Helper to calculate stock issues - potentially could be its own hook
    const checkStockLevels = async (productId: number, batchSize: number) => {
        try {
            // Need to fetch full product details to get materials if not present in list
            // For now assuming we might need to fetch it freshly or use existing data if passed
            const response = await api.get(`/products/${productId}`);
            const product = response.data.data;
            const materials = product.materials || [];
            const issues: Array<{ material: string; currentStock: number; required: number; shortfall: number; unit: string }> = [];

            for (const material of materials) {
                if (material.user_material_id) {
                    try {
                        const materialResponse = await api.get(`/materials/${material.user_material_id}`);
                        if (materialResponse.data.status === 'success' && materialResponse.data.data) {
                            const libraryMaterial = materialResponse.data.data;
                            const currentStock = libraryMaterial.stock_level || 0;
                            const requiredQuantity = material.quantity * batchSize;

                            if (currentStock < requiredQuantity) {
                                issues.push({
                                    material: material.name,
                                    currentStock: currentStock,
                                    required: requiredQuantity,
                                    shortfall: requiredQuantity - currentStock,
                                    unit: material.unit,
                                });
                            }
                        }
                    } catch (e) {
                        console.error(`Error checking material ${material.user_material_id}`, e);
                        issues.push({
                            material: material.name,
                            currentStock: 0,
                            required: material.quantity * batchSize,
                            shortfall: material.quantity * batchSize,
                            unit: material.unit,
                        });
                    }
                }
            }
            return issues;
        } catch (error) {
            console.error('Error checking stock levels:', error);
            return [];
        }
    }

    return {
        products: query.data || [],
        isLoading: query.isLoading,
        error: query.error ? (query.error as Error).message : null,
        refetch: query.refetch,
        createProduct: createProductMutation.mutateAsync,
        updateProduct: updateProductMutation.mutateAsync,
        deleteProduct: deleteProductMutation.mutateAsync,
        checkStockLevels,
        isUpdating: updateProductMutation.isPending,
        isDeleting: deleteProductMutation.isPending,
        isCreating: createProductMutation.isPending
    };
}
