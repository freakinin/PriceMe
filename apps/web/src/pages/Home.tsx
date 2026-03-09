import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Plus,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Box,
  BrainCircuit,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import api from '@/lib/api';
import { useCoach } from '@/hooks/useCoach';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency } from '@/utils/currency';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { GrowthChart } from '@/components/dashboard/GrowthChart';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

// ── Donut chart helpers ────────────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number) {
  const end = Math.min(endDeg, startDeg + 359.99); // prevent full-circle arc issues
  const o1 = polarToCartesian(cx, cy, outerR, startDeg);
  const o2 = polarToCartesian(cx, cy, outerR, end);
  const i1 = polarToCartesian(cx, cy, innerR, end);
  const i2 = polarToCartesian(cx, cy, innerR, startDeg);
  const large = end - startDeg > 180 ? 1 : 0;
  return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
}

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

function DonutChart({ slices, emptyText = 'No data' }: { slices: DonutSlice[]; emptyText?: string }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return <p className="text-center py-6 text-sm text-muted-foreground">{emptyText}</p>;
  }

  const cx = 50, cy = 50, outerR = 44, innerR = 28;
  let angle = -90; // start at top

  const paths = slices
    .filter(s => s.value > 0)
    .map(s => {
      const sweep = (s.value / total) * 360;
      const path = donutSlicePath(cx, cy, outerR, innerR, angle, angle + sweep);
      angle += sweep;
      return { ...s, path, pct: Math.round((s.value / total) * 100) };
    });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-[88px] h-[88px] shrink-0">
        {paths.map((p, i) => (
          <path key={i} d={p.path} fill={p.color} className="transition-opacity hover:opacity-75" />
        ))}
      </svg>
      <div className="flex-1 space-y-2 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-muted-foreground truncate">{s.label}</span>
            </div>
            <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

type ProductStatus = 'draft' | 'in_progress' | 'on_sale' | 'inactive';

interface Product {
  id: number;
  name: string;
  sku: string | null;
  status: ProductStatus | null;
  batch_size: number;
  target_price: number | null;
  product_cost: number;
  profit: number | null;
  profit_margin: number | null;
  category_id?: number | null;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAfterTax, setShowAfterTax] = useState(false);
  const { categories } = useCategories();
  const { profile, isProfileLoading } = useCoach();
  const [nudgeDismissed, setNudgeDismissed] = useState(
    () => localStorage.getItem('cravio_coach_nudge_dismissed') === '1'
  );
  const showCoachNudge = !isProfileLoading && !profile && !nudgeDismissed;

  const handleNudgeDismiss = () => {
    localStorage.setItem('cravio_coach_nudge_dismissed', '1');
    setNudgeDismissed(true);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      if (response.data.status === 'success') {
        setProducts(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const totalProducts = products.length;
    const onSaleProducts = products.filter(p => p.status === 'on_sale');
    const draftProducts = products.filter(p => p.status === 'draft');
    const inProgressProducts = products.filter(p => p.status === 'in_progress');
    const unpricedProducts = products.filter(p => p.target_price === null || p.target_price === 0);
    const pricedProducts = products.filter(p => p.target_price !== null && p.target_price > 0);

    const totalPotentialRevenue = products.reduce((sum, product) => {
      const price = product.target_price ?? 0;
      const batchSize = product.batch_size || 1;
      return sum + (price * batchSize);
    }, 0);

    const totalCost = products.reduce((sum, product) => {
      const productCost = typeof product.product_cost === 'number' ? product.product_cost : 0;
      const batchSize = product.batch_size || 1;
      return sum + (productCost * batchSize);
    }, 0);

    const totalPotentialProfit = totalPotentialRevenue - totalCost;

    const productsWithMargin = products.filter(p => p.profit_margin !== null);
    const averageMargin = productsWithMargin.length > 0
      ? productsWithMargin.reduce((sum, p) => sum + (p.profit_margin || 0), 0) / productsWithMargin.length
      : 0;

    const categoryStats = products.reduce((acc, product) => {
      const catId = product.category_id;
      const catName = categories.find(c => c.id === catId)?.name || 'Uncategorized';
      acc[catName] = (acc[catName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedCategories = Object.entries(categoryStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      totalProducts,
      onSaleProducts: onSaleProducts.length,
      draftProducts: draftProducts.length,
      inProgressProducts: inProgressProducts.length,
      unpricedProducts: unpricedProducts.length,
      pricedProducts: pricedProducts.length,
      totalPotentialRevenue,
      totalCost,
      totalPotentialProfit,
      averageMargin,
      productsWithMarginCount: productsWithMargin.length,
      sortedCategories,
    };
  }, [products, categories]);

  const formatCurrencyValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return formatCurrency(value, settings.currency);
  };

  const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return `${value.toFixed(1)}%`;
  };

  const taxRate = settings.tax_percentage || 0;
  const afterTaxPotentialProfit = analytics.totalPotentialProfit - Math.max(0, analytics.totalPotentialProfit) * (taxRate / 100);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || '';
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">

      {/* ── Welcome Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-foreground">
            {firstName ? `Good to see you, ${firstName}.` : 'Welcome back.'}
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Here's a snapshot of your pricing studio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {taxRate > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAfterTax(v => !v)}
                    className="flex items-center gap-2 h-8 text-xs"
                  >
                    {showAfterTax
                      ? <ToggleRight className="h-3.5 w-3.5 text-primary" />
                      : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                    {showAfterTax ? 'After Tax' : 'Pre-Tax'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px]">
                  <p className="text-xs">
                    {showAfterTax
                      ? `Showing profit after ${taxRate}% income tax`
                      : `Toggle to see profit after ${taxRate}% income tax`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className="bg-muted/70 border border-border px-3 py-1.5 rounded-full text-xs text-muted-foreground">
            {currentDate}
          </div>
        </div>
      </div>

      {/* ── Coach profile nudge ── */}
      {showCoachNudge && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-500/25 bg-brand-100 px-4 py-3 text-brand-900 animate-in fade-in duration-300">
          <div className="h-8 w-8 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="h-4 w-4 text-brand-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">
              Get AI pricing insights built for your craft
            </p>
            <p className="text-xs text-brand-700/70 mt-0.5">
              Set up your Coach profile — takes 60 seconds.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-brand-700 hover:text-brand-900 hover:bg-brand-500/10 text-xs h-7 px-3 flex-shrink-0"
            onClick={() => navigate('/onboarding')}
          >
            Set up now
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
          <button
            type="button"
            onClick={handleNudgeDismiss}
            className="text-brand-700/50 hover:text-brand-700 transition-colors flex-shrink-0 ml-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Stats Grid ── */}
      {analytics.totalProducts === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-brand-100 flex items-center justify-center">
            <Package className="h-8 w-8 text-brand-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No products yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Add your first product to start tracking costs, setting prices, and watching your margins.
            </p>
          </div>
          <Button onClick={() => navigate('/products/add')} className="mt-2">
            <Plus className="h-4 w-4 mr-2" />
            Add First Product
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="tour-stats-grid">
            <div className={cn("animate-slide-up stagger-1")}>
              <StatsCard
                title="Total Products"
                value={analytics.totalProducts}
                description={
                  analytics.unpricedProducts > 0
                    ? `${analytics.onSaleProducts} on sale · ${analytics.unpricedProducts} unpriced`
                    : `${analytics.onSaleProducts} currently on sale`
                }
                icon={Package}
                variant="info"
              />
            </div>
            <div className={cn("animate-slide-up stagger-2")}>
              <StatsCard
                title="Potential Revenue"
                value={formatCurrencyValue(analytics.totalPotentialRevenue)}
                description={`${analytics.pricedProducts} of ${analytics.totalProducts} products priced`}
                icon={DollarSign}
                variant="success"
              />
            </div>
            <div className={cn("animate-slide-up stagger-3")}>
              <StatsCard
                title={showAfterTax ? 'After-Tax Profit' : 'Potential Profit'}
                value={formatCurrencyValue(showAfterTax ? afterTaxPotentialProfit : analytics.totalPotentialProfit)}
                description={`Avg margin: ${formatPercentage(analytics.averageMargin)} across ${analytics.productsWithMarginCount} products`}
                icon={TrendingUp}
                variant={(showAfterTax ? afterTaxPotentialProfit : analytics.totalPotentialProfit) >= 0 ? "purple" : "danger"}
              />
            </div>
            <div className={cn("animate-slide-up stagger-4")}>
              <StatsCard
                title="Total Cost"
                value={formatCurrencyValue(analytics.totalCost)}
                description={`Across all ${analytics.totalProducts} products`}
                icon={ShoppingCart}
                variant="orange"
              />
            </div>
          </div>

          {/* ── Main Content Grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left: Charts + Activity */}
            <div className="xl:col-span-2 space-y-6">
              <GrowthChart products={products} />
              <RecentActivity products={products} loading={loading} />
            </div>

            {/* Right: Sidebar widgets */}
            <div className="space-y-6">

              {/* Product Status Overview — most actionable, first */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">Product Status</CardTitle>
                  <CardDescription className="text-xs">Distribution across your catalog</CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart
                    slices={[
                      { label: 'Draft',       value: analytics.draftProducts,      color: '#a1a1aa' },
                      { label: 'In Progress', value: analytics.inProgressProducts,  color: '#f59e0b' },
                      { label: 'On Sale',     value: analytics.onSaleProducts,      color: '#10b981' },
                    ]}
                    emptyText="No products yet"
                  />
                </CardContent>
              </Card>

              {/* Quick Actions — second */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    {
                      label: 'Add New Product',
                      description: 'Set costs & target price',
                      icon: Plus,
                      onClick: () => navigate('/products/add'),
                      accent: 'hover:border-primary/40 hover:bg-primary/5',
                      iconBg: 'bg-primary/10 text-primary',
                    },
                    {
                      label: 'Manage Materials',
                      description: 'Track your inventory',
                      icon: Box,
                      onClick: () => navigate('/materials'),
                      accent: 'hover:border-sky-300 hover:bg-sky-50',
                      iconBg: 'bg-sky-100 text-sky-600',
                    },
                    {
                      label: 'View On Sale',
                      description: 'Active listings',
                      icon: Sparkles,
                      onClick: () => navigate('/products?status=on_sale'),
                      accent: 'hover:border-emerald-300 hover:bg-emerald-50',
                      iconBg: 'bg-emerald-100 text-emerald-600',
                    },
                  ].map(({ label, description, icon: Icon, onClick, accent, iconBg }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg border border-border',
                        'text-left transition-all duration-150 group',
                        accent,
                      )}
                    >
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-none mb-0.5">{label}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Category Overview */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">Top Categories</CardTitle>
                  <CardDescription className="text-xs">By product volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart
                    slices={analytics.sortedCategories.map(([name, count], i) => ({
                      label: name,
                      value: count,
                      color: ['#c2410c', '#38bdf8', '#34d399', '#fdba74', '#a08060'][i] ?? '#a08060',
                    }))}
                    emptyText="No categories yet"
                  />
                </CardContent>
              </Card>

              {/* Low Stock Alerts — last */}
              <LowStockAlerts />

            </div>
          </div>
        </>
      )}

    </div>
  );
}
