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
import { Tag } from 'lucide-react';

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

    // Calculate total potential revenue (all products with target price)
    const totalPotentialRevenue = products.reduce((sum, product) => {
      const price = product.target_price ?? 0;
      const batchSize = product.batch_size || 1;
      return sum + (price * batchSize);
    }, 0);

    // Calculate total cost (all products)
    const totalCost = products.reduce((sum, product) => {
      const productCost = typeof product.product_cost === 'number' ? product.product_cost : 0;
      const batchSize = product.batch_size || 1;
      return sum + (productCost * batchSize);
    }, 0);

    // Calculate total potential profit
    const totalPotentialProfit = totalPotentialRevenue - totalCost;

    // Average profit margin
    const productsWithMargin = products.filter(p => p.profit_margin !== null);
    const averageMargin = productsWithMargin.length > 0
      ? productsWithMargin.reduce((sum, p) => sum + (p.profit_margin || 0), 0) / productsWithMargin.length
      : 0;

    // Category distribution
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
  // Tax only applies to positive profit — losses generate no tax liability
  const afterTaxPotentialProfit = analytics.totalPotentialProfit - Math.max(0, analytics.totalPotentialProfit) * (taxRate / 100);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {taxRate > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAfterTax(v => !v)}
                    className="flex items-center gap-2 h-9"
                  >
                    {showAfterTax ? (
                      <ToggleRight className="h-4 w-4 text-primary" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">{showAfterTax ? 'After Tax' : 'Pre-Tax'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px]">
                  <p className="text-sm">
                    {showAfterTax
                      ? `Showing potential profit after ${taxRate}% income tax`
                      : `Toggle to see potential profit after ${taxRate}% income tax`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className="bg-muted/50 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground">
            {currentDate}
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Products"
          value={analytics.totalProducts}
          description={`${analytics.onSaleProducts} currently on sale`}
          icon={Package}
          variant="info"
        />
        <StatsCard
          title="Potential Revenue"
          value={formatCurrencyValue(analytics.totalPotentialRevenue)}
          description="Based on current batch sizes"
          icon={DollarSign}
          variant="success"
        />
        <StatsCard
          title={showAfterTax ? 'After-Tax Profit' : 'Potential Profit'}
          value={formatCurrencyValue(showAfterTax ? afterTaxPotentialProfit : analytics.totalPotentialProfit)}
          description={`Avg Margin: ${formatPercentage(analytics.averageMargin)}`}
          icon={TrendingUp}
          variant={(showAfterTax ? afterTaxPotentialProfit : analytics.totalPotentialProfit) >= 0 ? "purple" : "danger"}
        />
        <StatsCard
          title="Total Cost"
          value={formatCurrencyValue(analytics.totalCost)}
          description="All products combined"
          icon={ShoppingCart}
          variant="orange"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Charts & Activity */}
        <div className="xl:col-span-2 space-y-6">
          <GrowthChart products={products} />
          <RecentActivity products={products} loading={loading} />
        </div>

        {/* Right Column: Alerts & Status */}
        <div className="space-y-6">
          <LowStockAlerts />

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Product Overview</CardTitle>
              <CardDescription>Distribution by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 transition-colors cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Draft</p>
                    </div>
                  </div>
                  <span className="font-bold">{analytics.draftProducts}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100/50 transition-colors cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">In Progress</p>
                    </div>
                  </div>
                  <span className="font-bold">{analytics.inProgressProducts}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10 hover:bg-green-100/50 transition-colors cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">On Sale</p>
                    </div>
                  </div>
                  <span className="font-bold">{analytics.onSaleProducts}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Category Overview</CardTitle>
              <CardDescription>Top categories by volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.sortedCategories.length > 0 ? (
                  analytics.sortedCategories.map(([name, count], index) => (
                    <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 transition-colors cursor-default">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${index === 0 ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                            index === 1 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                              'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                          <Tag className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{name}</p>
                        </div>
                      </div>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No categories data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-3 px-4 hover:border-black dark:hover:border-white transition-colors"
                onClick={() => navigate('/products/add')}
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Product
                </span>
                <ArrowRight className="h-4 w-4 opacity-50" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-3 px-4 hover:border-black dark:hover:border-white transition-colors"
                onClick={() => navigate('/materials')}
              >
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Manage Materials
                </span>
                <ArrowRight className="h-4 w-4 opacity-50" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-3 px-4 hover:border-black dark:hover:border-white transition-colors"
                onClick={() => navigate('/on-sale')}
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  View On Sale
                </span>
                <ArrowRight className="h-4 w-4 opacity-50" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
