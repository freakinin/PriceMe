
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Plus, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatCurrency } from '@/utils/currency';
import { Badge } from '@/components/ui/badge';

interface MarketAnalysisPanelProps {
    productId: number;
    productName: string;
    currentPrice: number;
    currency: string;
}

interface TrackedProduct {
    id: number;
    url: string;
    title: string;
    current_price: number;
    currency: string;
    image_url?: string;
    materials_analysis?: string[];
    quality_score?: number;
    image_quality_score?: number;
    description_score?: number;
    competitor_name?: string;
    last_scraped_at?: string;
}

export function MarketAnalysisPanel({ productId, productName, currentPrice, currency }: MarketAnalysisPanelProps) {
    const { toast } = useToast();
    const [urlInput, setUrlInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchTrackedProducts = async () => {
        try {
            setIsLoading(true);
            setError(null);
            // In a real scenario, we would filter by linked_product_id = productId
            // For now, fetching all to demonstrate (API might fail if down)
            const res = await api.get(`/competitors?productId=${productId}`);
            setTrackedProducts(res.data);
        } catch (err) {
            console.error('Failed to fetch tracked products', err);
            // Don't show error toast on mount if API is down, just set local error state
            setError('Could not load competitor data. API might be unreachable.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (productId) {
            fetchTrackedProducts();
        }
    }, [productId]);

    const handleTrackUrl = async () => {
        if (!urlInput.trim()) return;

        try {
            setIsTracking(true);
            setError(null);

            await api.post('/competitors/track', {
                url: urlInput,
                linkedProductId: productId
            });

            toast({
                title: 'Success',
                description: 'Competitor product tracked successfully',
                variant: 'success'
            });

            setUrlInput('');
            fetchTrackedProducts();

        } catch (err: any) {
            console.error('Failed to track url', err);
            const msg = err.response?.data?.error || err.message || 'Failed to track product';
            toast({
                title: 'Error',
                description: msg,
                variant: 'destructive'
            });
            setError(msg);
        } finally {
            setIsTracking(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/competitors/${id}`);
            setTrackedProducts(prev => prev.filter(p => p.id !== id));
            toast({ title: 'Deleted', description: 'Competitor removed' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete' });
        }
    };

    // Calculations
    const avgCompetitorPrice = trackedProducts.length > 0
        ? trackedProducts.reduce((sum, p) => sum + Number(p.current_price), 0) / trackedProducts.length
        : 0;

    const priceDiff = currentPrice - avgCompetitorPrice;
    const isHigher = priceDiff > 0;

    return (
        <div className="h-full flex flex-col bg-muted/10 border-l">
            {/* Header */}
            <div className="p-6 border-b bg-background">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    Market Analysis
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Compare <b>{productName}</b> with competitors.
                </p>

                {/* Stats Summary */}
                {trackedProducts.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="p-3 bg-card border rounded-md">
                            <div className="text-xs text-muted-foreground">My Price</div>
                            <div className="text-xl font-bold text-primary">{formatCurrency(currentPrice, currency)}</div>
                        </div>
                        <div className="p-3 bg-card border rounded-md">
                            <div className="text-xs text-muted-foreground">Avg. Competitor</div>
                            <div className="text-xl font-bold">{formatCurrency(avgCompetitorPrice, currency)}</div>
                            <div className={`text-xs ${isHigher ? 'text-destructive' : 'text-green-600'}`}>
                                {isHigher ? '+' : ''}{formatCurrency(priceDiff, currency)} ({isHigher ? 'Higher' : 'Lower'})
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Add New */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Add Competitor URL</label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Paste Etsy, Amazon, or Shop URL..."
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            className="flex-1"
                        />
                        <Button onClick={handleTrackUrl} disabled={isTracking || !urlInput}>
                            {isTracking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Paste a URL to automatically extract price, materials, and quality score.
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* List */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Tracked Competitors ({trackedProducts.length})</h3>

                    {isLoading && trackedProducts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground space-y-2">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto opacity-50" />
                            <p>Loading market data...</p>
                        </div>
                    ) : trackedProducts.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground text-sm">No competitors tracked yet.</p>
                        </div>
                    ) : (
                        trackedProducts.map(p => (
                            <Card key={p.id} className="overflow-hidden">
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base leading-tight font-medium line-clamp-2" title={p.title}>
                                                <a href={p.url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                                                    {p.title || 'Untitled Product'} <ExternalLink className="h-3 w-3 opacity-50" />
                                                </a>
                                            </CardTitle>
                                            <CardDescription className="text-xs">{p.competitor_name || new URL(p.url).hostname}</CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{formatCurrency(p.current_price, p.currency)}</div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs text-destructive px-2 mt-1 -mr-2"
                                                onClick={() => handleDelete(p.id)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 space-y-3">
                                    {/* Scores */}
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] font-normal">
                                            Quality: <span className="font-bold ml-1">{p.quality_score ?? '-'}/10</span>
                                        </Badge>
                                        {p.image_quality_score && (
                                            <Badge variant="outline" className="text-[10px] font-normal">
                                                Img: <span className="font-bold ml-1">{p.image_quality_score}/10</span>
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Materials */}
                                    {p.materials_analysis && Array.isArray(p.materials_analysis) && p.materials_analysis.length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-medium text-foreground">Materials: </span>
                                            {p.materials_analysis.join(', ')}
                                        </div>
                                    )}

                                    {/* Summary */}
                                    {/* {p.ai_analysis_summary && (
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded line-clamp-3">
                      {p.ai_analysis_summary}
                    </p>
                  )} */}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
