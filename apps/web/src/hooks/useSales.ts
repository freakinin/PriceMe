import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { createSaleSchema } from '@priceme/shared';
import { z } from 'zod';

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type Sale = CreateSaleInput & {
    id: number;
    created_at: string;
    product_name?: string;
    variant_name?: string;
    total_revenue?: number; // Calculated on backend or UI
};

export const useSales = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchSales = useCallback(async (filters?: { product_id?: number, platform?: string }) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters?.product_id) params.append('product_id', filters.product_id.toString());
            if (filters?.platform) params.append('platform', filters.platform);

            const res = await api.get(`/sales?${params.toString()}`);
            if (res.data.status === 'success') {
                setSales(res.data.data);
                return res.data.data;
            }
        } catch (error) {
            console.error('Failed to fetch sales', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch sales' });
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const addSale = async (data: CreateSaleInput) => {
        try {
            const res = await api.post('/sales', data);
            if (res.data.status === 'success') {
                toast({ title: 'Success', description: 'Sale recorded successfully' });
                return res.data.data;
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to record sale';
            toast({ variant: 'destructive', title: 'Error', description: message });
            throw error;
        }
    };

    const deleteSale = async (id: number) => {
        try {
            const res = await api.delete(`/sales/${id}`);
            if (res.data.status === 'success') {
                toast({ title: 'Success', description: 'Sale deleted successfully' });
                setSales(prev => prev.filter(s => s.id !== id));
                return true;
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to delete sale';
            toast({ variant: 'destructive', title: 'Error', description: message });
            throw error;
        }
    };

    return {
        sales,
        isLoading,
        fetchSales,
        addSale,
        deleteSale
    };
};
