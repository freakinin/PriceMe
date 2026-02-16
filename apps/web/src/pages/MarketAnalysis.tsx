import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { MarketAnalysisPanel } from '@/components/MarketAnalysisPanel';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function MarketAnalysis() {
    const [searchParams] = useSearchParams();
    const productId = searchParams.get('productId');
    const navigate = useNavigate();

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            if (!productId) return null;
            const res = await api.get(`/products/${productId}`);
            return res.data.data;
        },
        enabled: !!productId
    });

    if (!productId) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold mb-4">No Product Selected</h2>
                <Button onClick={() => navigate('/products')}>Back to Products</Button>
            </div>
        );
    }

    if (isLoading) {
        return <div className="p-8 text-center">Loading product details...</div>;
    }

    if (error || !product) {
        return (
            <div className="p-8 text-center text-red-500">
                <h2 className="text-xl font-bold mb-4">Error loading product</h2>
                <p className="mb-4">{(error as Error)?.message || 'Product not found'}</p>
                <Button onClick={() => navigate('/products')}>Back to Products</Button>
            </div>
        );
    }

    const headerPortal = document.getElementById('header-title');

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col">
            {headerPortal && createPortal(
                <div className="flex items-center text-sm text-muted-foreground w-full">
                    <span
                        className="hover:text-foreground cursor-pointer transition-colors"
                        onClick={() => navigate('/products')}
                    >
                        Products
                    </span>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-foreground">{product.name}</span>
                    <span className="mx-2">/</span>
                    <span className="text-foreground font-semibold">Competitor Analysis</span>
                </div>,
                headerPortal
            )}

            {/* Subtitle removed */}

            <div className="flex-1 h-full min-h-0">
                <MarketAnalysisPanel
                    product={product}
                    currency="USD"
                />
            </div>
        </div>
    );
}
