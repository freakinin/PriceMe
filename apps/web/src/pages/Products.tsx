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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSidebar } from '@/components/ui/sidebar';
import api from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency } from '@/utils/currency';
import EditProductPane from '@/components/EditProductPane';
import {
  calculateProfitFromPrice,
} from '@/utils/profitCalculations';
import { useToast } from '@/components/ui/use-toast';

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

type PricingMethod = 'markup' | 'price' | 'profit' | 'margin';

interface Product {
  id: number;
  name: string;
  sku: string | null;
  batch_size: number;
  target_price: number | null;
  pricing_method: PricingMethod | null;
  pricing_value: number | null;
  product_cost: number;
  profit: number | null;
  profit_margin: number | null;
  costs_percentage: number | null;
  created_at: string;
  updated_at: string;
}


export default function Products() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [qtySold, setQtySold] = useState<Record<number, number>>({});
  const [editingField, setEditingField] = useState<{ productId: number; field: string } | null>(null);
  const [localProductData, setLocalProductData] = useState<Record<number, { name?: string; qty_sold?: number }>>({});
  const [productPricingMethods, setProductPricingMethods] = useState<Record<number, PricingMethod>>({});
  const [productPricingValues, setProductPricingValues] = useState<Record<number, number>>({});
  const [, setSavingFields] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { setOpen: setSidebarOpen } = useSidebar();

  useEffect(() => {
    // Close sidebar when Products page loads
    setSidebarOpen(false);
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize pricing methods and values from fetched products
  useEffect(() => {
    if (products.length > 0) {
      setProductPricingMethods(prev => {
        const updated = { ...prev };
        products.forEach(product => {
          if (product.pricing_method && !updated[product.id]) {
            updated[product.id] = product.pricing_method;
          } else if (!updated[product.id]) {
            // Default to 'price' if no method is set
            updated[product.id] = 'price';
          }
        });
        return updated;
      });
      
      setProductPricingValues(prev => {
        const updated = { ...prev };
        products.forEach(product => {
          // If pricing_value exists, use it
          if (product.pricing_value !== null && product.pricing_value !== undefined && !(product.id in updated)) {
            updated[product.id] = product.pricing_value;
          } else if (!(product.id in updated) && product.target_price && product.product_cost > 0) {
            // If no pricing_value but we have target_price, calculate it based on method
            const method = product.pricing_method || 'price';
            let calculatedValue: number;
            switch (method) {
              case 'markup':
                calculatedValue = product.target_price > product.product_cost 
                  ? ((product.target_price - product.product_cost) / product.product_cost) * 100 
                  : 0;
                break;
              case 'price':
                calculatedValue = product.target_price;
                break;
              case 'profit':
                calculatedValue = product.target_price - product.product_cost;
                break;
              case 'margin':
                calculatedValue = product.target_price > 0 
                  ? ((product.target_price - product.product_cost) / product.target_price) * 100 
                  : 0;
                break;
              default:
                calculatedValue = product.target_price;
            }
            updated[product.id] = calculatedValue;
          }
        });
        return updated;
      });
    }
  }, [products]);

  // Helper function to calculate target_price from pricing method and value
  const calculatePriceFromMethod = (method: PricingMethod, value: number, cost: number): number => {
    switch (method) {
      case 'markup':
        return cost * (1 + value / 100);
      case 'price':
        return value;
      case 'profit':
        return cost + value;
      case 'margin':
        if (value >= 100) return 0; // Prevent division by zero
        return cost / (1 - value / 100);
      default:
        return cost;
    }
  };

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

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/products/${productId}`);
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      // Refresh the products list
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete product',
      });
    }
  };

  const formatCurrencyValue = (value: string | number | null) => {
    return formatCurrency(value, settings.currency);
  };

  const formatPercentage = (value: string | number | null) => {
    if (value === null || value === undefined) return '-';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof numValue !== 'number' || isNaN(numValue)) return '-';
    return `${numValue.toFixed(2)}%`;
  };

  const handleMethodChange = (productId: number, method: PricingMethod) => {
    setProductPricingMethods(prev => ({
      ...prev,
      [productId]: method,
    }));
    // When method changes, recalculate pricing_value from current target_price if available
    const product = products.find(p => p.id === productId);
    if (product && product.target_price && product.product_cost > 0) {
      let newValue: number;
      switch (method) {
        case 'markup':
          newValue = product.target_price > product.product_cost 
            ? ((product.target_price - product.product_cost) / product.product_cost) * 100 
            : 0;
          break;
        case 'price':
          newValue = product.target_price;
          break;
        case 'profit':
          newValue = product.target_price - product.product_cost;
          break;
        case 'margin':
          newValue = product.target_price > 0 
            ? ((product.target_price - product.product_cost) / product.target_price) * 100 
            : 0;
          break;
        default:
          newValue = 0;
      }
      setProductPricingValues(prev => ({
        ...prev,
        [productId]: newValue,
      }));
    }
  };

  const handleSavePricingValue = async (productId: number, method: PricingMethod, value: number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      // Mark as saving
      setSavingFields(prev => new Set(prev).add(productId));

      // Update local state immediately
      setProductPricingValues(prev => ({
        ...prev,
        [productId]: value,
      }));

      // Calculate target_price from method and value
      const calculatedPrice = calculatePriceFromMethod(method, value, product.product_cost);
      const metrics = calculateProfitFromPrice(calculatedPrice, product.product_cost);

      // Update product state optimistically
      const updatedProduct = {
        ...product,
        pricing_method: method,
        pricing_value: value,
        target_price: calculatedPrice,
        profit: metrics.profit,
        profit_margin: metrics.margin,
        costs_percentage: calculatedPrice > 0 ? (product.product_cost / calculatedPrice) * 100 : null,
      };

      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
      setEditingField(null);

      // Save to database
      await saveProductToDatabase(productId, {
        pricing_method: method,
        pricing_value: value,
        target_price: calculatedPrice,
      });

      setSavingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    } catch (error: any) {
      console.error('Error saving pricing value:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save pricing',
      });
      setSavingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleSaveField = async (productId: number, field: string, value: string | number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      // Mark as saving
      setSavingFields(prev => new Set(prev).add(productId));

      // Update local state immediately for better UX
      setLocalProductData(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          [field]: value,
        },
      }));

      let updatedProduct = { ...product };
      let updateData: any = {};
      
      if (field === 'name') {
        updatedProduct.name = value as string;
        updateData.name = value as string;
      } else if (field === 'qty_sold') {
        setQtySold(prev => ({ ...prev, [productId]: value as number }));
        setEditingField(null);
        setSavingFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        return; // qty_sold is not saved to DB, it's just local state
      }

      // Update products state optimistically
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));

      setEditingField(null);

      // Save to database
      await saveProductToDatabase(productId, updateData);

      setSavingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    } catch (error: any) {
      console.error('Error saving field:', error);
      setEditingField(null);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save changes',
      });
      setSavingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Helper function to save product to database
  const saveProductToDatabase = async (productId: number, updateData: any) => {
    try {
      const currentProductResponse = await api.get(`/products/${productId}`);
      const currentProduct = currentProductResponse.data.data;
      
      // Map materials to expected format
      const materialsData = (currentProduct.materials || []).map((m: any) => ({
        name: m.name,
        quantity: Number(m.quantity),
        unit: m.unit,
        price_per_unit: Number(m.price_per_unit),
        units_made: m.units_made ? Number(m.units_made) : 1,
        user_material_id: m.user_material_id ? Number(m.user_material_id) : undefined,
      }));
      
      // Map labor_costs to expected format
      const laborCostsData = (currentProduct.labor_costs || []).map((l: any) => ({
        activity: l.activity,
        time_spent_minutes: Number(l.time_spent_minutes),
        hourly_rate: Number(l.hourly_rate),
        per_unit: l.per_unit !== undefined ? Boolean(l.per_unit) : true,
      }));
      
      // Map other_costs to expected format
      const otherCostsData = (currentProduct.other_costs || []).map((o: any) => ({
        item: o.item,
        quantity: Number(o.quantity),
        cost: Number(o.cost),
        per_unit: o.per_unit !== undefined ? Boolean(o.per_unit) : true,
      }));
      
      // Build update payload
      const updatePayload: any = {
        name: updateData.name ?? currentProduct.name,
        batch_size: currentProduct.batch_size || 1,
      };
      
      // Only include optional fields if they have values
      if (currentProduct.sku) updatePayload.sku = currentProduct.sku;
      if (currentProduct.description) updatePayload.description = currentProduct.description;
      if (currentProduct.category) updatePayload.category = currentProduct.category;
      
      // Handle pricing fields
      if (updateData.pricing_method !== undefined) {
        updatePayload.pricing_method = updateData.pricing_method;
      } else if (currentProduct.pricing_method) {
        updatePayload.pricing_method = currentProduct.pricing_method;
      }
      
      if (updateData.pricing_value !== undefined) {
        updatePayload.pricing_value = updateData.pricing_value;
      } else if (currentProduct.pricing_value !== null && currentProduct.pricing_value !== undefined) {
        updatePayload.pricing_value = Number(currentProduct.pricing_value);
      }
      
      if (updateData.target_price !== undefined && updateData.target_price > 0) {
        updatePayload.target_price = updateData.target_price;
      } else if (currentProduct.target_price && updateData.target_price === undefined) {
        updatePayload.target_price = Number(currentProduct.target_price);
      }
      
      // Include arrays only if they have items
      if (materialsData.length > 0) updatePayload.materials = materialsData;
      if (laborCostsData.length > 0) updatePayload.labor_costs = laborCostsData;
      if (otherCostsData.length > 0) updatePayload.other_costs = otherCostsData;
      
      await api.put(`/products/${productId}`, updatePayload);
    } catch (apiError: any) {
      console.error('Error saving to database:', apiError);
      console.error('Full error response:', JSON.stringify(apiError.response?.data, null, 2));
      
      let errorMessage = 'Failed to save changes';
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      } else if (apiError.response?.data?.issues) {
        const issues = apiError.response.data.issues;
        errorMessage = issues.map((issue: any) => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
      }
      
      throw new Error(errorMessage);
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
    // Check local product data
    if (localProductData[product.id] && localProductData[product.id][field as keyof typeof localProductData[number]] !== undefined) {
      return localProductData[product.id][field as keyof typeof localProductData[number]] as string | number;
    }
    
    if (field === 'qty_sold') {
      return qtySold[product.id] || 0;
    }
    
    // Get pricing value based on method
    if (field === 'pricing_value') {
      if (productPricingValues[product.id] !== undefined) {
        return productPricingValues[product.id];
      }
      return product.pricing_value;
    }
    
    return product[field as keyof Product] as string | number | null;
  };

  // Get calculated values for display
  const getCalculatedMetrics = (product: Product) => {
    const method = productPricingMethods[product.id] || product.pricing_method || 'price';
    const pricingValue = productPricingValues[product.id] ?? product.pricing_value ?? (product.target_price || 0);
    
    let calculatedPrice = product.target_price || 0;
    if (method && pricingValue !== null && pricingValue !== undefined) {
      calculatedPrice = calculatePriceFromMethod(method, pricingValue, product.product_cost);
    }
    
    const metrics = calculatedPrice > 0 
      ? calculateProfitFromPrice(calculatedPrice, product.product_cost)
      : { price: 0, profit: 0, margin: 0, markup: 0 };
    
    return {
      price: calculatedPrice,
      profit: metrics.profit,
      margin: metrics.margin,
      markup: metrics.markup,
    };
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
          {products.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Select a calculation method for each product. Only the selected method's input is editable.
            </p>
          )}
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
                <TableHead>Calculation Type</TableHead>
                <TableHead>Markup %</TableHead>
                <TableHead>Planned Sales Price $</TableHead>
                <TableHead>Desired Profit $</TableHead>
                <TableHead>Desired Margin %</TableHead>
                <TableHead>Product Cost</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Profit Margin</TableHead>
                <TableHead>Markup %</TableHead>
                <TableHead>Qty Sold</TableHead>
                <TableHead>Profit (Qty)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const currentQtySold = getDisplayValue(product, 'qty_sold') as number;
                const displayName = getDisplayValue(product, 'name') as string;
                const method = productPricingMethods[product.id] || product.pricing_method || 'price';
                const metrics = getCalculatedMetrics(product);
                
                // Get pricing value for display
                const pricingValue = productPricingValues[product.id] ?? product.pricing_value ?? 
                  (method === 'price' ? (product.target_price || 0) : 0);
                
                // Calculate individual values for display
                const markupValue = method === 'markup' ? pricingValue : metrics.markup;
                const priceValue = method === 'price' ? pricingValue : metrics.price;
                const profitValue = method === 'profit' ? pricingValue : metrics.profit;
                const marginValue = method === 'margin' ? pricingValue : metrics.margin;
                
                const profitFromQty = calculateProfitFromQty({ ...product, profit: metrics.profit }, currentQtySold);
                const isEditingName = editingField?.productId === product.id && editingField?.field === 'name';
                const isEditingMarkup = editingField?.productId === product.id && editingField?.field === 'pricing_value' && method === 'markup';
                const isEditingPrice = editingField?.productId === product.id && editingField?.field === 'pricing_value' && method === 'price';
                const isEditingProfit = editingField?.productId === product.id && editingField?.field === 'pricing_value' && method === 'profit';
                const isEditingMargin = editingField?.productId === product.id && editingField?.field === 'pricing_value' && method === 'margin';
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
                    <TableCell className="w-[160px]">
                      <Select
                        value={method}
                        onValueChange={(value) => handleMethodChange(product.id, value as PricingMethod)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="markup">Markup %</SelectItem>
                          <SelectItem value="price">Planned Sales Price $</SelectItem>
                          <SelectItem value="profit">Desired Profit $</SelectItem>
                          <SelectItem value="margin">Desired Margin %</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    {/* Markup % field */}
                    <TableCell className={`w-[120px] ${method !== 'markup' ? 'opacity-50' : ''}`}>
                      {method === 'markup' ? (
                        <EditableCell
                          value={markupValue}
                          onSave={(value) => {
                            handleSavePricingValue(product.id, 'markup', value as number);
                          }}
                          onCancel={handleCancelEdit}
                          isEditing={isEditingMarkup}
                          onEdit={() => setEditingField({ productId: product.id, field: 'pricing_value' })}
                          type="number"
                          formatDisplay={formatPercentage}
                        />
                      ) : (
                        <div 
                          className="text-muted-foreground cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                          onClick={() => {
                            handleMethodChange(product.id, 'markup');
                            setTimeout(() => setEditingField({ productId: product.id, field: 'pricing_value' }), 100);
                          }}
                        >
                          {formatPercentage(markupValue)}
                        </div>
                      )}
                    </TableCell>
                    {/* Planned Sales Price $ field */}
                    <TableCell className={`w-[150px] ${method !== 'price' ? 'opacity-50' : ''}`}>
                      {method === 'price' ? (
                        <EditableCell
                          value={priceValue}
                          onSave={(value) => {
                            handleSavePricingValue(product.id, 'price', value as number);
                          }}
                          onCancel={handleCancelEdit}
                          isEditing={isEditingPrice}
                          onEdit={() => setEditingField({ productId: product.id, field: 'pricing_value' })}
                          type="number"
                          formatDisplay={formatCurrencyValue}
                        />
                      ) : (
                        <div 
                          className="text-muted-foreground cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                          onClick={() => {
                            handleMethodChange(product.id, 'price');
                            setTimeout(() => setEditingField({ productId: product.id, field: 'pricing_value' }), 100);
                          }}
                        >
                          {formatCurrencyValue(priceValue)}
                        </div>
                      )}
                    </TableCell>
                    {/* Desired Profit $ field */}
                    <TableCell className={`w-[130px] ${method !== 'profit' ? 'opacity-50' : ''}`}>
                      {method === 'profit' ? (
                        <EditableCell
                          value={profitValue}
                          onSave={(value) => {
                            handleSavePricingValue(product.id, 'profit', value as number);
                          }}
                          onCancel={handleCancelEdit}
                          isEditing={isEditingProfit}
                          onEdit={() => setEditingField({ productId: product.id, field: 'pricing_value' })}
                          type="number"
                          formatDisplay={formatCurrencyValue}
                        />
                      ) : (
                        <div 
                          className="text-muted-foreground cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                          onClick={() => {
                            handleMethodChange(product.id, 'profit');
                            setTimeout(() => setEditingField({ productId: product.id, field: 'pricing_value' }), 100);
                          }}
                        >
                          {formatCurrencyValue(profitValue)}
                        </div>
                      )}
                    </TableCell>
                    {/* Desired Margin % field */}
                    <TableCell className={`w-[140px] ${method !== 'margin' ? 'opacity-50' : ''}`}>
                      {method === 'margin' ? (
                        <EditableCell
                          value={marginValue}
                          onSave={(value) => {
                            handleSavePricingValue(product.id, 'margin', value as number);
                          }}
                          onCancel={handleCancelEdit}
                          isEditing={isEditingMargin}
                          onEdit={() => setEditingField({ productId: product.id, field: 'pricing_value' })}
                          type="number"
                          formatDisplay={formatPercentage}
                        />
                      ) : (
                        <div 
                          className="text-muted-foreground cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                          onClick={() => {
                            handleMethodChange(product.id, 'margin');
                            setTimeout(() => setEditingField({ productId: product.id, field: 'pricing_value' }), 100);
                          }}
                        >
                          {formatPercentage(marginValue)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="w-[130px]">
                      {formatCurrencyValue(product.product_cost)}
                    </TableCell>
                    <TableCell className={`w-[110px] ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrencyValue(metrics.profit)}
                    </TableCell>
                    <TableCell className={`w-[130px] ${metrics.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(metrics.margin)}
                    </TableCell>
                    <TableCell className="w-[130px]">
                      {formatPercentage(metrics.markup)}
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
                      {formatCurrencyValue(profitFromQty)}
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
                          onClick={() => handleDeleteProduct(product.id, product.name)}
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

