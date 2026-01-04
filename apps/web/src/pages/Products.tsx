import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import EditProductPane from '@/components/EditProductPane';

interface Product {
  id: number;
  name: string;
  sku: string | null;
  batch_size: number;
  target_price: number | null;
  markup_percentage: number | null;
  created_at: string;
  updated_at: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/products');
      console.log('Products API response:', response.data);
      if (response.data.status === 'success') {
        setProducts(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to load products');
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Products</h1>
          <p className="text-muted-foreground">Manage your product listings</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Debug: Log current state
  console.log('Products component render:', { loading, error, productsCount: products.length });

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Products</h1>
          <p className="text-muted-foreground">Manage your product listings</p>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchProducts} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Products</h1>
          <p className="text-muted-foreground">Manage your product listings</p>
        </div>
        <Button onClick={() => navigate('/products/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
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
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Target Price</TableHead>
                <TableHead>Markup %</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{formatCurrency(product.target_price)}</TableCell>
                  <TableCell>
                    {formatPercentage(product.markup_percentage)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(product.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingProductId(product.id);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // TODO: Delete product
                          console.log('Delete product:', product.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Product Pane */}
      <EditProductPane
        productId={editingProductId}
        open={editingProductId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProductId(null);
          }
        }}
        onSuccess={() => {
          setEditingProductId(null);
          fetchProducts(); // Refresh the products list
        }}
      />
    </div>
  );
}

