import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  FileText, 
  Plus, 
  TrendingUp, 
  DollarSign,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import api from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency } from '@/utils/currency';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  draft: {
    label: 'Draft',
    icon: FileText,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  on_sale: {
    label: 'On Sale',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
  },
  inactive: {
    label: 'Inactive',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
  },
};

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

    return {
      totalProducts,
      onSaleProducts: onSaleProducts.length,
      draftProducts: draftProducts.length,
      inProgressProducts: inProgressProducts.length,
      totalPotentialRevenue,
      totalCost,
      totalPotentialProfit,
      averageMargin,
    };
  }, [products]);

  const recentProducts = useMemo(() => {
    return products
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [products]);

  const formatCurrencyValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return formatCurrency(value, settings.currency);
  };

  const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return `${value.toFixed(1)}%`;
  };

  const getStatusBadge = (status: ProductStatus | null) => {
    if (!status) return null;
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

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

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
        </h2>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold mt-1">{analytics.totalProducts}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.onSaleProducts} on sale
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Potential Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrencyValue(analytics.totalPotentialRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on batch sizes
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Potential Profit</p>
                <p className={`text-2xl font-bold mt-1 ${analytics.totalPotentialProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrencyValue(analytics.totalPotentialProfit)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg Margin: {formatPercentage(analytics.averageMargin)}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                analytics.totalPotentialProfit >= 0 
                  ? 'bg-purple-100 dark:bg-purple-900/20' 
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                <TrendingUp className={`h-6 w-6 ${
                  analytics.totalPotentialProfit >= 0 
                    ? 'text-purple-600 dark:text-purple-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold mt-1">{formatCurrencyValue(analytics.totalCost)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All products combined
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-between" 
              onClick={() => navigate('/products/add')}
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Product
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/products')}
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                View All Products
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/on-sale')}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                View On Sale Products
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/materials')}
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Manage Materials
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Product Status</CardTitle>
            <CardDescription>Overview of your products by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium">Draft</p>
                    <p className="text-sm text-muted-foreground">Not yet priced</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{analytics.draftProducts}</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">In Progress</p>
                    <p className="text-sm text-muted-foreground">Being worked on</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{analytics.inProgressProducts}</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">On Sale</p>
                    <p className="text-sm text-muted-foreground">Currently selling</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{analytics.onSaleProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Products</CardTitle>
              <CardDescription>Your most recently updated products</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/products')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first product
              </p>
              <Button onClick={() => navigate('/products/add')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Product
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProducts.map((product) => (
                    <TableRow 
                      key={product.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/products`)}
                    >
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>{formatCurrencyValue(product.target_price)}</TableCell>
                      <TableCell>{formatCurrencyValue(product.product_cost)}</TableCell>
                      <TableCell>
                        <span className={product.profit !== null && product.profit >= 0 ? 'text-green-600' : product.profit !== null ? 'text-red-600' : 'text-muted-foreground'}>
                          {formatCurrencyValue(product.profit)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={product.profit_margin !== null && product.profit_margin >= 0 ? 'text-green-600' : product.profit_margin !== null ? 'text-red-600' : 'text-muted-foreground'}>
                          {formatPercentage(product.profit_margin)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
