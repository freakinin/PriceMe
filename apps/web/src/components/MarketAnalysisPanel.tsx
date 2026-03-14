
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ExternalLink, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Package, DollarSign, Layers, Tag, Edit, AlertTriangle, Trash2, Sparkles, Lightbulb, Shield, Target, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { ToastAction } from '@/components/ui/toast';
import { openSettingsAt } from '@/lib/openSettings';
import { useSubscription } from '@/hooks/useSubscription';
import { formatCurrency } from '@/utils/currency';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
    // Pre-calculated cost breakdown (passed from live edit state)
    materials_total?: number;
    labor_total?: number;
    other_total?: number;
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
    competition_level?: 'low' | 'medium' | 'high';
    notes?: string;
}

interface CompetitiveInsights {
    summary: string;
    pricing_insight: string;
    differentiation: string;
    risks: string;
    action_items: string[];
    competitors_ref?: Record<string, string>; // shortName -> URL
}

function CostPieChart({
    materialsTotal, laborTotal, otherTotal, productCost, currency
}: {
    materialsTotal: number; laborTotal: number; otherTotal: number;
    productCost: number; currency: string;
}) {
    const items = [
        { label: 'Materials', value: materialsTotal, fill: '#3b82f6' },
        { label: 'Labor',     value: laborTotal,     fill: '#a855f7' },
        { label: 'Other',     value: otherTotal,     fill: '#fb923c' },
    ].filter(s => s.value > 0);

    if (items.length === 0) return null;

    const cx = 50, cy = 50, r = 42;
    let cum = 0;
    const slices = items.map(item => {
        const pct = (item.value / productCost) * 100;
        const startRad = (cum * 3.6 - 90) * (Math.PI / 180);
        cum += pct;
        const endRad = (cum * 3.6 - 90) * (Math.PI / 180);
        return {
            ...item, pct,
            x1: cx + r * Math.cos(startRad), y1: cy + r * Math.sin(startRad),
            x2: cx + r * Math.cos(endRad),   y2: cy + r * Math.sin(endRad),
            largeArc: pct > 50 ? 1 : 0,
        };
    });

    return (
        <div className="flex items-center gap-3">
            <svg viewBox="0 0 100 100" className="w-[72px] h-[72px] shrink-0">
                {items.length === 1 ? (
                    <circle cx={cx} cy={cy} r={r} fill={items[0].fill} />
                ) : (
                    slices.map((s, i) => (
                        <path
                            key={i}
                            d={`M ${cx} ${cy} L ${s.x1} ${s.y1} A ${r} ${r} 0 ${s.largeArc} 1 ${s.x2} ${s.y2} Z`}
                            fill={s.fill}
                        />
                    ))
                )}
            </svg>
            <div className="flex-1 space-y-2 min-w-0">
                {slices.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: s.fill }} />
                            <span className="text-[10px] text-muted-foreground">{s.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-muted-foreground">{s.pct.toFixed(0)}%</span>
                            <span className="text-xs font-mono">{formatCurrency(s.value, currency)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function MarketAnalysisPanel({ product, currency }: MarketAnalysisPanelProps) {
    const { toast } = useToast();
    const { subscription, invalidate: invalidateSubscription } = useSubscription();
    const [urlInput, setUrlInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Edit dialog state
    const [editingProduct, setEditingProduct] = useState<TrackedProduct | null>(null);
    const [editForm, setEditForm] = useState({
        title: '',
        price: '',
        quality_score: '',
        competition_level: 'medium' as 'low' | 'medium' | 'high',
        notes: ''
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [refreshingId, setRefreshingId] = useState<number | null>(null);

    // AI Insights state
    const [insights, setInsights] = useState<CompetitiveInsights | null>(null);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [insightsExpanded, setInsightsExpanded] = useState(true);
    const [upgradePrompt, setUpgradePrompt] = useState<{ open: boolean; limit: number }>({ open: false, limit: 0 });

    const productId = product.id;
    const currentPrice = Number(product.target_price || 0);

    // Helper: render text with competitor names as clickable links
    const renderLinkedText = (text: string) => {
        if (!insights?.competitors_ref || Object.keys(insights.competitors_ref).length === 0) {
            return text;
        }

        const ref = insights.competitors_ref;
        const names = Object.keys(ref).sort((a, b) => b.length - a.length); // longest first to avoid partial matches

        // Build regex that matches any competitor short name (case-insensitive)
        const pattern = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const regex = new RegExp(`(${pattern})`, 'gi');

        const parts = text.split(regex);
        if (parts.length === 1) return text;

        return parts.map((part, i) => {
            const matchedName = names.find(n => n.toLowerCase() === part.toLowerCase());
            if (matchedName && ref[matchedName]) {
                return (
                    <a
                        key={i}
                        href={ref[matchedName]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                        title={matchedName}
                    >
                        {part}
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                );
            }
            return part;
        });
    };

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

    const fetchSavedInsights = async () => {
        try {
            const res = await api.get(`/competitors/insights/saved?productId=${productId}`);
            if (res.data.insights) {
                setInsights(res.data.insights);
            }
        } catch (err) {
            console.error('Failed to fetch saved insights', err);
        }
    };

    useEffect(() => {
        if (productId) {
            fetchTrackedProducts();
            fetchSavedInsights();
        }
    }, [productId]);

    const handleTrackUrl = async () => {
        if (!urlInput.trim()) return;

        try {
            setIsTracking(true);
            setError(null);

            const response = await api.post('/competitors/track', {
                url: urlInput,
                linkedProductId: productId
            });

            invalidateSubscription();

            const limit = subscription?.limits.competitors ?? -1;
            const newCount = (subscription?.usage.competitors ?? 0) + 1;
            const atLimit = limit !== -1 && newCount >= limit;
            const nearLimit = limit !== -1 && !atLimit && newCount / limit >= 0.8;

            // Check for warning in response
            if (response.data.warning) {
                toast({
                    title: 'Product Tracked with Warning',
                    description: response.data.warning,
                    variant: 'default'
                });
            } else if (atLimit) {
                toast({
                    variant: 'destructive',
                    title: 'Competitor limit reached',
                    description: `You've used all ${limit} competitor slots on your plan.`,
                    action: <ToastAction altText="Upgrade" onClick={() => openSettingsAt('subscription')}>Upgrade</ToastAction>,
                });
            } else if (nearLimit) {
                toast({
                    title: 'Almost at your competitor limit',
                    description: `${newCount} of ${limit} competitor slots used.`,
                    action: <ToastAction altText="View Plans" onClick={() => openSettingsAt('subscription')}>View Plans</ToastAction>,
                });
            } else {
                toast({
                    title: 'Success',
                    description: 'Competitor product tracked successfully',
                    variant: 'success'
                });
            }

            setUrlInput('');
            fetchTrackedProducts();

        } catch (err: any) {
            console.error('Failed to track url', err);
            if (err.response?.data?.code === 'PLAN_LIMIT_REACHED') {
                setUpgradePrompt({ open: true, limit: err.response.data.data?.limit ?? 0 });
            } else {
                const msg = err.response?.data?.error || err.message || 'Failed to track product';
                toast({ title: 'Error', description: msg, variant: 'destructive' });
                setError(msg);
            }
        } finally {
            setIsTracking(false);
        }
    };

    const handleEdit = (p: TrackedProduct) => {
        setEditingProduct(p);
        setEditForm({
            title: p.title,
            price: p.current_price.toString(),
            quality_score: p.quality_score?.toString() || '',
            competition_level: p.competition_level || 'medium',
            notes: p.notes || ''
        });
    };

    const handleUpdate = async () => {
        if (!editingProduct) return;

        try {
            setIsUpdating(true);

            await api.patch(`/competitors/${editingProduct.id}`, {
                title: editForm.title,
                current_price: parseFloat(editForm.price) || 0,
                quality_score: editForm.quality_score ? parseInt(editForm.quality_score) : null,
                competition_level: editForm.competition_level,
                notes: editForm.notes
            });

            toast({
                title: 'Updated',
                description: 'Competitor product updated successfully',
                variant: 'success'
            });

            setEditingProduct(null);
            fetchTrackedProducts();

        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.response?.data?.error || 'Failed to update',
                variant: 'destructive'
            });
        } finally {
            setIsUpdating(false);
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

    const handleRefresh = async (p: TrackedProduct) => {
        setRefreshingId(p.id);
        try {
            await api.post(`/competitors/${p.id}/refresh`);
            const res = await api.get(`/competitors?productId=${productId}`);
            setTrackedProducts(res.data);
            toast({ title: 'Synced', description: `${p.title} price updated` });
        } catch (err: any) {
            const msg = err?.response?.data?.error || 'Failed to sync price';
            toast({ variant: 'destructive', title: 'Sync failed', description: msg });
        } finally {
            setRefreshingId(null);
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
            <div className="px-6 py-4 bg-background border-b-0 space-y-4" data-tour="matour-stats">
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
                <div className="lg:col-span-1 space-y-6" data-tour="matour-product-details">
                    <div className="bg-card border rounded-lg p-4 space-y-3 sticky top-0 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-base">Product Details</h3>
                        </div>
                        <Separator />

                        <div className="space-y-4">
                            {/* Pricing Details */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" /> Pricing Details
                                </label>
                                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Your Price</span>
                                        <span className="text-sm font-bold text-primary">{formatCurrency(currentPrice, currency)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Total Cost</span>
                                        <span className="text-xs font-mono">{formatCurrency(product.product_cost, currency)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Profit / Unit</span>
                                        <span className={`text-xs font-mono font-semibold ${(product.profit || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {(product.profit || 0) >= 0 ? '+' : ''}{formatCurrency(product.profit || 0, currency)}
                                        </span>
                                    </div>
                                    <div className="border-t border-border/50 pt-2 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">Margin</span>
                                            <span className="text-xs font-semibold">{(product.profit_margin ?? 0).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">Markup</span>
                                            <span className="text-xs font-mono">
                                                {product.product_cost > 0 ? (((currentPrice - product.product_cost) / product.product_cost) * 100).toFixed(0) : 0}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">Break-even</span>
                                            <span className="text-xs font-mono text-amber-600">{formatCurrency(product.product_cost, currency)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Margin Health */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" /> Margin Health
                                </label>
                                {(() => {
                                    const margin = product.profit_margin ?? 0;
                                    const health = margin >= 40
                                        ? { label: 'Healthy', barColor: 'bg-green-500', badgeClass: 'text-green-700 bg-green-100', hint: 'Great margins — you have room to discount or run sales.' }
                                        : margin >= 20
                                        ? { label: 'Moderate', barColor: 'bg-amber-500', badgeClass: 'text-amber-700 bg-amber-100', hint: 'Decent margins. Watch costs if competitors undercut you.' }
                                        : margin > 0
                                        ? { label: 'Thin', barColor: 'bg-orange-500', badgeClass: 'text-orange-700 bg-orange-100', hint: 'Low margin — consider raising price or reducing costs.' }
                                        : { label: 'At Loss', barColor: 'bg-red-500', badgeClass: 'text-red-700 bg-red-100', hint: 'Price is below cost. Raise price or cut material spend.' };
                                    return (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${health.badgeClass}`}>{health.label}</span>
                                                <span className="text-xs font-semibold">{margin.toFixed(0)}% margin</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${health.barColor}`}
                                                    style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">{health.hint}</p>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Cost Breakdown Pie Chart */}
                            {product.product_cost > 0 && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                        <Layers className="h-3 w-3" /> Cost Breakdown
                                    </label>
                                    <CostPieChart
                                        materialsTotal={product.materials_total ?? product.product_cost}
                                        laborTotal={product.labor_total ?? 0}
                                        otherTotal={product.other_total ?? 0}
                                        productCost={product.product_cost}
                                        currency={currency}
                                    />
                                </div>
                            )}

                            {/* Category (if set) */}
                            {product.category && (
                                <div>
                                    <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                        <Tag className="h-3 w-3" /> Category
                                    </label>
                                    <p className="text-xs font-medium mt-1">{product.category}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Competitor Feed */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Add New Input */}
                    <div className="flex items-center justify-between gap-4 mb-2" data-tour="matour-add-competitor">
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
                    <div className="space-y-3" data-tour="matour-competitor-list">
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
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {(p.current_price === 0 || p.current_price === null) && (
                                                            <Badge variant="destructive" className="text-[10px] h-4 px-1.5 font-normal rounded-sm flex items-center gap-1">
                                                                <AlertTriangle className="h-2.5 w-2.5" />
                                                                Price Missing
                                                            </Badge>
                                                        )}
                                                        {p.competition_level && (
                                                            <Badge
                                                                variant="secondary"
                                                                className={`text-[10px] h-4 px-1.5 font-normal rounded-sm ${p.competition_level === 'high' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                                                    p.competition_level === 'medium' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                                                                        'bg-green-100 text-green-800 hover:bg-green-200'
                                                                    }`}
                                                            >
                                                                {p.competition_level.charAt(0).toUpperCase() + p.competition_level.slice(1)} Competition
                                                            </Badge>
                                                        )}
                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap opacity-60">
                                                            {p.last_scraped_at ? new Date(p.last_scraped_at).toLocaleDateString() : 'Just now'}
                                                        </span>
                                                    </div>
                                                    <a href={p.url} target="_blank" rel="noreferrer" className="block">
                                                        <h4 className="font-medium text-sm leading-snug hover:text-primary transition-colors line-clamp-2">
                                                            {p.title || 'Untitled Product'}
                                                        </h4>
                                                    </a>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-base font-bold tracking-tight">
                                                        {formatCurrency(p.current_price, p.currency)}
                                                    </div>
                                                    {p.current_price > 0 && currentPrice > 0 && (() => {
                                                        const diff = ((p.current_price - currentPrice) / currentPrice) * 100;
                                                        const isHigher = diff > 0;
                                                        return (
                                                            <div className={`text-[10px] font-medium flex items-center justify-end gap-0.5 ${isHigher ? 'text-green-600' : 'text-destructive'}`}>
                                                                {isHigher ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                                {isHigher ? '+' : ''}{diff.toFixed(0)}%
                                                            </div>
                                                        );
                                                    })()}
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

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                        onClick={() => handleRefresh(p)}
                                                        disabled={refreshingId === p.id}
                                                        title="Sync latest price"
                                                    >
                                                        <RefreshCw className={`h-3.5 w-3.5 ${refreshingId === p.id ? 'animate-spin' : ''}`} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                        onClick={() => handleEdit(p)}
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <a href={p.url} target="_blank" rel="noreferrer">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                            title="Open in new tab"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </a>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                        onClick={() => handleDelete(p.id)}
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Competitive Insights Card */}
            {trackedProducts.length >= 2 && (
                <div className="mt-6">
                    {!insights ? (
                        <button
                            onClick={async () => {
                                try {
                                    setIsLoadingInsights(true);
                                    const res = await api.get(`/competitors/insights?productId=${productId}`);
                                    setInsights(res.data);
                                } catch (err: any) {
                                    toast({
                                        title: 'Insights Unavailable',
                                        description: err.response?.data?.error || 'Could not generate insights. Add notes to your competitors first.',
                                        variant: 'destructive'
                                    });
                                } finally {
                                    setIsLoadingInsights(false);
                                }
                            }}
                            disabled={isLoadingInsights}
                            className="w-full py-4 px-5 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/40 bg-gradient-to-r from-primary/5 to-brand-900/5 hover:from-primary/10 hover:to-brand-900/10 transition-all duration-300 flex items-center justify-center gap-3 group cursor-pointer disabled:opacity-70"
                        >
                            {isLoadingInsights ? (
                                <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                            ) : (
                                <Sparkles className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                            )}
                            <span className="font-medium text-sm text-primary">
                                {isLoadingInsights ? 'Analyzing competitors...' : 'Generate AI Competitive Insights'}
                            </span>
                        </button>
                    ) : (
                        <div className="rounded-xl border bg-gradient-to-br from-card to-primary/[0.02] overflow-hidden">
                            <div
                                className="flex items-center justify-between px-5 py-3 border-b bg-primary/5 cursor-pointer select-none"
                                onClick={() => setInsightsExpanded(!insightsExpanded)}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                                    <h3 className="font-semibold text-sm shrink-0">AI Competitive Insights</h3>
                                    <span className="text-xs text-muted-foreground truncate ml-2 hidden sm:inline">{renderLinkedText(insights.summary)}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                    {insightsExpanded && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    setIsLoadingInsights(true);
                                                    const res = await api.get(`/competitors/insights?productId=${productId}`);
                                                    setInsights(res.data);
                                                } catch (err: any) {
                                                    toast({ title: 'Error', description: 'Failed to refresh insights', variant: 'destructive' });
                                                } finally {
                                                    setIsLoadingInsights(false);
                                                }
                                            }}
                                            disabled={isLoadingInsights}
                                            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                        >
                                            <RefreshCw className={`h-3 w-3 ${isLoadingInsights ? 'animate-spin' : ''}`} />
                                            Regenerate
                                        </button>
                                    )}
                                    {insightsExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                            </div>

                            {insightsExpanded && (
                                <div className="p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {/* Action Items — first card */}
                                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                                            <div className="flex items-center gap-1.5">
                                                <Target className="h-3.5 w-3.5 text-primary" />
                                                <span className="text-xs font-semibold uppercase tracking-wide">Actions</span>
                                            </div>
                                            {insights.action_items && insights.action_items.length > 0 && (
                                                <div className="space-y-1.5">
                                                    {insights.action_items.map((item, i) => (
                                                        <div key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                                                            <CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                                                            <span className="leading-tight">{renderLinkedText(item)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Pricing Insight */}
                                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10 space-y-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <DollarSign className="h-3.5 w-3.5 text-green-600" />
                                                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Pricing</span>
                                            </div>
                                            <p className="text-xs text-foreground leading-relaxed">{renderLinkedText(insights.pricing_insight)}</p>
                                        </div>

                                        {/* Differentiation */}
                                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 space-y-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <Lightbulb className="h-3.5 w-3.5 text-blue-600" />
                                                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Differentiate</span>
                                            </div>
                                            <p className="text-xs text-foreground leading-relaxed">{renderLinkedText(insights.differentiation)}</p>
                                        </div>

                                        {/* Risks */}
                                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 space-y-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <Shield className="h-3.5 w-3.5 text-amber-600" />
                                                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Risks</span>
                                            </div>
                                            <p className="text-xs text-foreground leading-relaxed">{renderLinkedText(insights.risks)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Competitor Product</DialogTitle>
                        <DialogDescription>
                            Update product details manually
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Product Title</Label>
                            <Input
                                id="title"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                placeholder="Enter product title"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (USD)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quality">Quality Score</Label>
                                <Input
                                    id="quality"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={editForm.quality_score}
                                    onChange={(e) => setEditForm({ ...editForm, quality_score: e.target.value })}
                                    placeholder="1-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="competition">Competition Level</Label>
                            <Select
                                value={editForm.competition_level}
                                onValueChange={(value: 'low' | 'medium' | 'high') =>
                                    setEditForm({ ...editForm, competition_level: value })
                                }
                            >
                                <SelectTrigger id="competition">
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low Competition</SelectItem>
                                    <SelectItem value="medium">Medium Competition</SelectItem>
                                    <SelectItem value="high">High Competition</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                placeholder="Add notes about this competitor..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingProduct(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={isUpdating}>
                            {isUpdating ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <UpgradePrompt
                open={upgradePrompt.open}
                onOpenChange={(open) => setUpgradePrompt((p) => ({ ...p, open }))}
                resource="competitors"
                currentLimit={upgradePrompt.limit}
                onViewPlans={() => openSettingsAt('subscription')}
            />
        </div>
    );
}
