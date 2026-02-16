
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ExternalLink, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Package, DollarSign, Layers, Tag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatCurrency } from '@/utils/currency';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Need to import Product type or define a subset here if strict
interface Product {
    id: number;
    name: string;
    description?: string;
    target_price: number | null;
    product_cost: number;
    profit: number | null;
    profit_margin: number | null;
    materials?: any[];
    category?: string;
    status?: string;
}

interface MarketAnalysisPanelProps {
    product: Product;
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

export function MarketAnalysisPanel({ product, currency }: MarketAnalysisPanelProps) {
    const { toast } = useToast();
    const [urlInput, setUrlInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>([]);
    const [error, setError] = useState<string | null>(null);

    const productId = product.id;
    const currentPrice = Number(product.target_price || 0);

    const fetchTrackedProducts = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await api.get(`/competitors?productId=${productId}`);
            setTrackedProducts(res.data);
        } catch (err) {
            console.error('Failed to fetch tracked products', err);
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
    const diffPercentage = avgCompetitorPrice > 0 ? (Math.abs(priceDiff) / avgCompetitorPrice) * 100 : 0;

    return (
        <div className="flex flex-col h-full bg-muted/5">
            {/* Top Insights Section */}
            <div className="px-6 py-4 bg-background border-b-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="shadow-sm border bg-card">
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Market Position</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                            <div className="text-xl font-bold flex items-center gap-2">
                                {trackedProducts.length > 0 ? (
                                    <>
                                        {isHigher ? (
                                            <span className="text-destructive flex items-center">
                                                +{diffPercentage.toFixed(0)}% <TrendingUp className="ml-1 h-3 w-3" />
                                            </span>
                                        ) : (
                                            <span className="text-green-600 flex items-center">
                                                -{diffPercentage.toFixed(0)}% <TrendingDown className="ml-1 h-3 w-3" />
                                            </span>
                                        )}
                                        <span className="text-xs font-normal text-muted-foreground">vs Average</span>
                                    </>
                                ) : (
                                    <span className="text-muted-foreground text-sm">No Competitors API Data</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border bg-card">
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avg. Competitor Price</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                            <div className="text-xl font-bold">
                                {formatCurrency(avgCompetitorPrice, currency)}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Based on {trackedProducts.length} tracked products</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border bg-card">
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">My Target Price</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                            <div className="text-xl font-bold text-primary">
                                {formatCurrency(currentPrice, currency)}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] font-normal border-primary/20 bg-primary/5 h-4 px-1.5">
                                    Cost: {formatCurrency(product.product_cost, currency)}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] font-normal border-green-500/20 bg-green-500/5 text-green-700 h-4 px-1.5">
                                    Margin: {product.profit_margin?.toFixed(0)}%
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">

                {/* Left Column: My Product Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card border rounded-lg p-4 space-y-3 sticky top-0 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-base">Product Details</h3>
                        </div>
                        <Separator />

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Description</label>
                                <p className="text-xs mt-1 leading-relaxed text-foreground/90 line-clamp-4 hover:line-clamp-none transition-all cursor-default">
                                    {product.description || 'No description provided.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                        <Tag className="h-3 w-3" /> Category
                                    </label>
                                    <p className="text-xs font-medium mt-1">{product.category || 'Uncategorized'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Status</label>
                                    <div className="mt-1">
                                        <Badge
                                            variant="secondary"
                                            className={`font-normal text-[10px] h-5 px-1.5 capitalize ${product.status === 'on_sale' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                                product.status === 'in_progress' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                                                    product.status === 'draft' ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' :
                                                        ''
                                                }`}
                                        >
                                            {product.status?.replace('_', ' ') || 'Draft'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                    <Layers className="h-3 w-3" /> Materials
                                </label>
                                {product.materials && product.materials.length > 0 ? (
                                    <ul className="mt-1.5 space-y-1">
                                        {product.materials.slice(0, 5).map((m: any, idx: number) => (
                                            <li key={idx} className="text-xs flex justify-between">
                                                <span className="text-muted-foreground truncate max-w-[150px]" title={m.name}>{m.quantity} {m.unit} {m.name}</span>
                                            </li>
                                        ))}
                                        {product.materials.length > 5 && (
                                            <li className="text-[10px] text-muted-foreground italic pt-0.5">
                                                + {product.materials.length - 5} more...
                                            </li>
                                        )}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-muted-foreground mt-1 italic">No materials listed</p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" /> Financials
                                </label>
                                <div className="mt-1.5 bg-muted/40 rounded p-2 text-xs space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Cost</span>
                                        <span className="font-mono">{formatCurrency(product.product_cost, currency)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Projected Profit</span>
                                        <span className="font-mono text-green-600">+{formatCurrency(product.profit || 0, currency)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Competitor Feed */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Add New Input */}
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="font-semibold text-sm whitespace-nowrap text-muted-foreground">Add Competitor</div>
                        <div className="flex-1 flex gap-2 max-w-xl justify-end">
                            <Input
                                placeholder="Paste product URL..."
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                className="h-9 text-sm bg-background w-full max-w-sm"
                            />
                            <Button
                                onClick={handleTrackUrl}
                                disabled={isTracking || !urlInput}
                                size="sm"
                                className="h-9 px-4 gap-1.5 font-medium shrink-0 bg-black text-white hover:bg-zinc-700 disabled:bg-black disabled:text-white disabled:opacity-100 shadow-sm transition-colors"
                            >
                                {isTracking ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                {isTracking ? 'Analyzing...' : 'Track'}
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-start gap-2 border-0">
                            <AlertCircle className="h-4 w-4 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Feed List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Competitor Feed</h3>
                            <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">{trackedProducts.length} Tracked</Badge>
                        </div>

                        {isLoading && trackedProducts.length === 0 ? (
                            <div className="text-center py-12">
                                <RefreshCw className="h-6 w-6 animate-spin mx-auto opacity-20 mb-3" />
                                <p className="text-sm text-muted-foreground">Loading market intelligence...</p>
                            </div>
                        ) : trackedProducts.length === 0 ? (
                            <div className="text-center py-8 rounded-xl bg-muted/20">
                                <Package className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                <h4 className="font-medium text-sm">No Competitors Yet</h4>
                                <p className="text-muted-foreground text-xs mt-1 max-w-xs mx-auto">
                                    Start tracking competitors to see how your product compares.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {trackedProducts.map(p => (
                                    <div key={p.id} className="bg-card rounded-lg overflow-hidden flex flex-col md:flex-row group border shadow-sm hover:shadow-md transition-shadow">
                                        {/* Image placeholder or real image if available */}
                                        {p.image_url && (
                                            <div className="w-full md:w-28 h-28 md:h-auto bg-muted shrink-0">
                                                <img src={p.image_url} alt={p.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                            </div>
                                        )}

                                        <div className="flex-1 p-3 flex flex-col justify-between gap-2">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal rounded-sm bg-muted text-muted-foreground">
                                                            {p.competitor_name || new URL(p.url).hostname.replace('www.', '')}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap opacity-60">
                                                            {p.last_scraped_at ? new Date(p.last_scraped_at).toLocaleDateString() : 'Just now'}
                                                        </span>
                                                    </div>
                                                    <a href={p.url} target="_blank" rel="noreferrer" className="block">
                                                        <h4 className="font-medium text-sm leading-snug hover:text-primary transition-colors line-clamp-2">
                                                            {p.title || 'Untitled Product'}
                                                            <ExternalLink className="inline-block h-2.5 w-2.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </h4>
                                                    </a>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-base font-bold tracking-tight">
                                                        {formatCurrency(p.current_price, p.currency)}
                                                    </div>
                                                    {p.current_price > 0 && currentPrice > 0 && (
                                                        <div className={`text-[10px] font-medium ${p.current_price > currentPrice ? 'text-green-600' : 'text-destructive'}`}>
                                                            {p.current_price > currentPrice ? 'Higher' : 'Lower'} than yours
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom Row: Tags + Actions */}
                                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-dashed">
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    {p.quality_score !== undefined && (
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                            <span>Quality:</span>
                                                            <span className={`font-bold ${p.quality_score >= 8 ? 'text-green-600' : p.quality_score < 5 ? 'text-orange-600' : ''}`}>
                                                                {p.quality_score}/10
                                                            </span>
                                                        </div>
                                                    )}
                                                    {p.materials_analysis && p.materials_analysis.length > 0 && (
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground max-w-[200px] overflow-hidden">
                                                            <span>Materials:</span>
                                                            <span className="font-medium truncate text-foreground" title={p.materials_analysis.join(', ')}>
                                                                {p.materials_analysis.join(', ')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-1.5 transition-colors"
                                                    onClick={() => handleDelete(p.id)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
