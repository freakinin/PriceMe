import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Plus,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileText,
  ToggleLeft,
  ToggleRight,
  Tag,
  Sparkles,
  Box,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import api from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency } from '@/utils/currency';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { GrowthChart } from '@/components/dashboard/GrowthChart';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

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
      totalPotentialRevenue,
      totalCost,
      totalPotentialProfit,
      averageMargin,
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

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cn("animate-slide-up stagger-1")}>
          <StatsCard
            title="Total Products"
            value={analytics.totalProducts}
            description={`${analytics.onSaleProducts} currently on sale`}
            icon={Package}
            variant="info"
          />
        </div>
        <div className={cn("animate-slide-up stagger-2")}>
          <StatsCard
            title="Potential Revenue"
            value={formatCurrencyValue(analytics.totalPotentialRevenue)}
            description="Based on current batch sizes"
            icon={DollarSign}
            variant="success"
          />
        </div>
        <div className={cn("animate-slide-up stagger-3")}>
          <StatsCard
            title={showAfterTax ? 'After-Tax Profit' : 'Potential Profit'}
            value={formatCurrencyValue(showAfterTax ? afterTaxPotentialProfit : analytics.totalPotentialProfit)}
            description={`Avg margin: ${formatPercentage(analytics.averageMargin)}`}
            icon={TrendingUp}
            variant={(showAfterTax ? afterTaxPotentialProfit : analytics.totalPotentialProfit) >= 0 ? "purple" : "danger"}
          />
        </div>
        <div className={cn("animate-slide-up stagger-4")}>
          <StatsCard
            title="Total Cost"
            value={formatCurrencyValue(analytics.totalCost)}
            description="All products combined"
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
          <LowStockAlerts />

          {/* Product Status Overview */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Product Status</CardTitle>
              <CardDescription className="text-xs">Distribution across your catalog</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  label: 'Draft',
                  count: analytics.draftProducts,
                  icon: FileText,
                  bg: 'bg-zinc-100 dark:bg-zinc-800',
                  text: 'text-zinc-500',
                  dot: 'bg-zinc-400',
                },
                {
                  label: 'In Progress',
                  count: analytics.inProgressProducts,
                  icon: Clock,
                  bg: 'bg-amber-50 dark:bg-amber-900/10',
                  text: 'text-amber-600 dark:text-amber-400',
                  dot: 'bg-amber-400',
                },
                {
                  label: 'On Sale',
                  count: analytics.onSaleProducts,
                  icon: CheckCircle2,
                  bg: 'bg-emerald-50 dark:bg-emerald-900/10',
                  text: 'text-emerald-600 dark:text-emerald-400',
                  dot: 'bg-emerald-500',
                },
              ].map(({ label, count, icon: Icon, bg, text, dot }) => (
                <div
                  key={label}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg transition-colors',
                    bg,
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', dot)} />
                    <Icon className={cn('h-3.5 w-3.5', text)} />
                    <span className={cn('text-sm font-medium', text)}>{label}</span>
                  </div>
                  <span className={cn('text-sm font-bold tabular-nums', text)}>{count}</span>
                </div>
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
              {analytics.sortedCategories.length > 0 ? (
                <div className="space-y-2">
                  {analytics.sortedCategories.map(([name, count], index) => {
                    const pct = Math.round((count / analytics.totalProducts) * 100);
                    const colors = [
                      { bar: 'bg-violet-400', text: 'text-violet-700' },
                      { bar: 'bg-sky-400', text: 'text-sky-700' },
                      { bar: 'bg-emerald-400', text: 'text-emerald-700' },
                      { bar: 'bg-amber-400', text: 'text-amber-700' },
                      { bar: 'bg-zinc-400', text: 'text-zinc-700' },
                    ];
                    const c = colors[index] ?? colors[4];
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Tag className={cn('h-3 w-3', c.text)} />
                            <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{name}</span>
                          </div>
                          <span className="text-xs font-bold tabular-nums text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', c.bar)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-6 text-sm text-muted-foreground">
                  No categories yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
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
                  onClick: () => navigate('/on-sale'),
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
        </div>
      </div>
    </div>
  );
}
