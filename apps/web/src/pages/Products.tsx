import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Inline editable cell component
function EditableCell({
  value,
  onSave,
  onCancel,
  isEditing,
  onEdit,
  type = 'text',
  formatDisplay,
  className = '',
}: {
  value: string | number | null;
  onSave: (value: string | number) => void;
  onCancel: () => void;
  isEditing: boolean;
  onEdit: () => void;
  type?: 'text' | 'number';
  formatDisplay?: (value: string | number | null) => string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const [editValue, setEditValue] = useState<string>(value?.toString() || '');

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value?.toString() || '');
  }, [value]);

  const handleSave = () => {
    if (type === 'number') {
      const numValue = parseFloat(editValue) || 0;
      onSave(numValue);
    } else {
      onSave(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <div ref={cellRef} className="relative h-full w-full">
        <Input
          ref={inputRef}
          type={type}
          step={type === 'number' ? '0.01' : undefined}
          className={`h-8 text-sm w-full pr-16 ${className}`}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
        />
        <div className="absolute right-0 top-0 h-8 flex items-center gap-0.5 pr-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleSave}
            onMouseDown={(e) => e.preventDefault()} // Prevent blur
          >
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onCancel}
            onMouseDown={(e) => e.preventDefault()} // Prevent blur
          >
            <X className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center group h-full w-full">
      <span className={`flex-1 truncate ${className}`}>
        {formatDisplay ? formatDisplay(value) : (value?.toString() || '-')}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 absolute right-0"
        onClick={onEdit}
      >
        <Edit className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface Product {
  id: number;
  name: string;
  sku: string | null;
  batch_size: number;
  target_price: number | null;
  markup_percentage: number | null;
  product_cost: number;
  profit: number | null;
  profit_margin: number | null;
  costs_percentage: number | null;
  created_at: string;
  updated_at: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [qtySold, setQtySold] = useState<Record<number, number>>({});
  const [editingField, setEditingField] = useState<{ productId: number; field: string } | null>(null);
  const [localProductData, setLocalProductData] = useState<Record<number, { name?: string; target_price?: number; qty_sold?: number }>>({});
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

  const formatCurrency = (value: string | number | null) => {
    // Handle string input (from form fields)
    if (typeof value === 'string') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return '-';
      value = numValue;
    }
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

  const handleSaveField = async (productId: number, field: string, value: string | number) => {
    try {
      // Update local state immediately for better UX
      setLocalProductData(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          [field]: value,
        },
      }));

      // Update products state
      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          if (field === 'name') {
            return { ...p, name: value as string };
          } else if (field === 'target_price') {
            const newPrice = value as number;
            const newProfit = newPrice - p.product_cost;
            const newProfitMargin = newPrice > 0 ? (newProfit / newPrice) * 100 : null;
            const newCostsPercentage = newPrice > 0 ? (p.product_cost / newPrice) * 100 : null;
            return {
              ...p,
              target_price: newPrice,
              profit: newProfit,
              profit_margin: newProfitMargin,
              costs_percentage: newCostsPercentage,
            };
          } else if (field === 'qty_sold') {
            setQtySold(prev => ({ ...prev, [productId]: value as number }));
          }
          return p;
        }
        return p;
      }));

      setEditingField(null);

      // TODO: Save to database via API
      // await api.put(`/products/${productId}`, { [field]: value });
    } catch (error) {
      console.error('Error saving field:', error);
      // Revert on error
      setEditingField(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const calculateProfitFromQty = (product: Product, qty: number) => {
    if (!product.profit || qty <= 0) return null;
    return product.profit * qty;
  };

  const getDisplayValue = (product: Product, field: string): string | number | null => {
    if (localProductData[product.id] && localProductData[product.id][field as keyof typeof localProductData[number]] !== undefined) {
      return localProductData[product.id][field as keyof typeof localProductData[number]] as string | number;
    }
    if (field === 'qty_sold') {
      return qtySold[product.id] || 0;
    }
    return product[field as keyof Product] as string | number | null;
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
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Desired Price</TableHead>
                <TableHead>Product Cost</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Profit Margin</TableHead>
                <TableHead>Costs (%)</TableHead>
                <TableHead>Qty Sold</TableHead>
                <TableHead>Profit (Qty)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const currentQtySold = getDisplayValue(product, 'qty_sold') as number;
                const displayName = getDisplayValue(product, 'name') as string;
                const displayPrice = getDisplayValue(product, 'target_price') as number | null;
                
                // Recalculate profit if price was changed locally
                const effectivePrice = displayPrice !== null ? displayPrice : product.target_price;
                const effectiveProfit = effectivePrice && product.product_cost > 0 ? effectivePrice - product.product_cost : product.profit;
                const effectiveProfitMargin = effectivePrice && effectivePrice > 0 && effectiveProfit !== null
                  ? (effectiveProfit / effectivePrice) * 100
                  : product.profit_margin;
                const effectiveCostsPercentage = effectivePrice && effectivePrice > 0
                  ? (product.product_cost / effectivePrice) * 100
                  : product.costs_percentage;
                
                const profitFromQty = calculateProfitFromQty({ ...product, profit: effectiveProfit }, currentQtySold);
                const isEditingName = editingField?.productId === product.id && editingField?.field === 'name';
                const isEditingPrice = editingField?.productId === product.id && editingField?.field === 'target_price';
                const isEditingQty = editingField?.productId === product.id && editingField?.field === 'qty_sold';

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium w-[180px]">
                      <EditableCell
                        value={displayName}
                        onSave={(value) => handleSaveField(product.id, 'name', value)}
                        onCancel={handleCancelEdit}
                        isEditing={isEditingName}
                        onEdit={() => setEditingField({ productId: product.id, field: 'name' })}
                        type="text"
                        className="font-medium"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground w-[120px]">
                      <span className="truncate block">{product.sku || '-'}</span>
                    </TableCell>
                    <TableCell className="w-[140px]">
                      <EditableCell
                        value={displayPrice}
                        onSave={(value) => handleSaveField(product.id, 'target_price', value)}
                        onCancel={handleCancelEdit}
                        isEditing={isEditingPrice}
                        onEdit={() => setEditingField({ productId: product.id, field: 'target_price' })}
                        type="number"
                        formatDisplay={formatCurrency}
                      />
                    </TableCell>
                    <TableCell className="w-[130px]">
                      {formatCurrency(product.product_cost)}
                    </TableCell>
                    <TableCell className={`w-[110px] ${effectiveProfit && effectiveProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(effectiveProfit)}
                    </TableCell>
                    <TableCell className={`w-[130px] ${effectiveProfitMargin && effectiveProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(effectiveProfitMargin)}
                    </TableCell>
                    <TableCell className="w-[110px]">
                      {formatPercentage(effectiveCostsPercentage)}
                    </TableCell>
                    <TableCell className="w-[130px]">
                      <EditableCell
                        value={currentQtySold}
                        onSave={(value) => handleSaveField(product.id, 'qty_sold', value)}
                        onCancel={handleCancelEdit}
                        isEditing={isEditingQty}
                        onEdit={() => setEditingField({ productId: product.id, field: 'qty_sold' })}
                        type="number"
                      />
                    </TableCell>
                    <TableCell className={`w-[130px] ${profitFromQty && profitFromQty >= 0 ? 'text-green-600 font-medium' : profitFromQty ? 'text-red-600 font-medium' : ''}`}>
                      {formatCurrency(profitFromQty)}
                    </TableCell>
                    <TableCell className="text-right w-[100px]">
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
                );
              })}
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

