import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Columns } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import api from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency } from '@/utils/currency';
import EditProductPane from '@/components/EditProductPane';
import {
  calculateProfitFromPrice,
} from '@/utils/profitCalculations';
import { useToast } from '@/components/ui/use-toast';

// Inline editable cell component - matches Materials exactly
function EditableCell({
  value,
  onSave,
  type = 'text',
  formatDisplay,
  className = '',
}: {
  value: string | number | null | undefined;
  onSave: (value: string | number) => Promise<void>;
  type?: 'text' | 'number';
  formatDisplay?: (value: string | number | null | undefined) => string;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(value?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditValue(value?.toString() || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      let valueToSave: string | number;
      if (type === 'number') {
        valueToSave = parseFloat(editValue) || 0;
      } else {
        valueToSave = editValue;
      }
      await onSave(valueToSave);
      setIsEditing(false);
    } catch (error) {
      // Revert on error
      setEditValue(value?.toString() || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      // Allow tab to move to next cell
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div ref={cellRef} className="absolute inset-0 overflow-hidden">
        <input
          ref={inputRef}
          type={type === 'number' ? 'number' : 'text'}
          step={type === 'number' ? '0.01' : undefined}
          className="h-full w-full border-none outline-none px-4 py-1 text-sm bg-transparent focus:bg-background focus:outline-none focus:ring-0"
          style={{ borderRadius: 0, maxWidth: '100%', boxSizing: 'border-box' }}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
        />
      </div>
    );
  }

  // Format number display to remove trailing zeros
  const formatNumberDisplay = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '-';
    let num: number;
    if (typeof val === 'number') {
      num = val;
    } else {
      num = parseFloat(val);
      if (isNaN(num)) return val.toString();
    }
    // Remove trailing zeros: 4.0000 -> 4, 4.5000 -> 4.5, 4.1230 -> 4.123
    return num % 1 === 0 
      ? num.toString() 
      : num.toString().replace(/\.?0+$/, '');
  };

  const displayValue = formatDisplay 
    ? formatDisplay(value) 
    : (type === 'number' ? formatNumberDisplay(value) : (value?.toString() || '-'));

  const handleClick = () => {
    setIsEditing(true);
  };

  return (
    <div
      className={`relative flex items-center h-full w-full min-w-0 cursor-cell hover:bg-muted/30 py-1 transition-colors ${className}`}
      onClick={handleClick}
      onDoubleClick={handleClick}
    >
      <div className="flex-1 truncate text-sm min-w-0">
        {typeof displayValue === 'string' ? <span className="block truncate">{displayValue}</span> : displayValue}
      </div>
    </div>
  );
}

type PricingMethod = 'markup' | 'price' | 'profit' | 'margin';
type ProductStatus = 'draft' | 'in_progress' | 'on_sale' | 'inactive';

interface Product {
  id: number;
  name: string;
  sku: string | null;
  status: ProductStatus | null;
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
  const [localProductData, setLocalProductData] = useState<Record<number, { name?: string; qty_sold?: number }>>({});
  const [productPricingMethods, setProductPricingMethods] = useState<Record<number, PricingMethod>>({});
  const [productPricingValues, setProductPricingValues] = useState<Record<number, number>>({});
  const [globalPricingMethod, setGlobalPricingMethod] = useState<PricingMethod>('price');
  const [, setSavingFields] = useState<Set<number>>(new Set());
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
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
      // Set global method from first product if all products have the same method
      const firstProductMethod = products[0]?.pricing_method;
      if (firstProductMethod && products.every(p => p.pricing_method === firstProductMethod)) {
        setGlobalPricingMethod(firstProductMethod);
      } else if (!firstProductMethod) {
        // If no products have a method set, use default
        setGlobalPricingMethod('price');
      }
      
      setProductPricingMethods(prev => {
        const updated = { ...prev };
        products.forEach(product => {
          if (product.pricing_method && !updated[product.id]) {
            updated[product.id] = product.pricing_method;
          } else if (!updated[product.id]) {
            // Default to 'price' if no method is set (will use global method in display)
            updated[product.id] = product.pricing_method || 'price';
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

  const formatCurrencyValue = (value: string | number | null | undefined) => {
    return formatCurrency(value, settings.currency);
  };

  const formatPercentage = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof numValue !== 'number' || isNaN(numValue)) return '-';
    return `${numValue.toFixed(2)}%`;
  };

  const getCalculationTypeDescription = (method: PricingMethod): string => {
    switch (method) {
      case 'markup':
        return 'Enter markup percentage applied to cost. Price = Cost × (1 + Markup%).';
      case 'price':
        return 'Enter your desired selling price. Profit and margin will be calculated automatically.';
      case 'profit':
        return 'Enter desired profit amount per unit. Price = Cost + Profit.';
      case 'margin':
        return 'Enter desired profit margin percentage. Price = Cost ÷ (1 - Margin%).';
      default:
        return 'Select a calculation method for all products.';
    }
  };

  const handleGlobalMethodChange = (method: PricingMethod) => {
    setGlobalPricingMethod(method);
    
    // Apply to all products - update local state immediately
    products.forEach(product => {
      // Update local state
      setProductPricingMethods(prev => ({
        ...prev,
        [product.id]: method,
      }));
      
      // Calculate new pricing value from current target_price if available
      if (product.target_price && product.product_cost > 0) {
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
          [product.id]: newValue,
        }));
      }
    });
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
      } else if (field === 'sku') {
        updatedProduct.sku = value as string;
        updateData.sku = value as string;
      } else if (field === 'status') {
        updatedProduct.status = value as ProductStatus;
        updateData.status = value as ProductStatus;
        console.log('Status update:', { productId, field, value, updateData });
      } else if (field === 'qty_sold') {
        setQtySold(prev => ({ ...prev, [productId]: value as number }));
        setSavingFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        return; // qty_sold is not saved to DB, it's just local state
      }

      // Update products state optimistically
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));

      // Save to database
      await saveProductToDatabase(productId, updateData);

      setSavingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    } catch (error: any) {
      console.error('Error saving field:', error);
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
      // Always include status - prioritize updateData, fallback to currentProduct, then default
      if (updateData.status !== undefined) {
        updatePayload.status = updateData.status;
        console.log('Including status in payload from updateData:', updateData.status);
      } else if (currentProduct.status) {
        // Include existing status if not being updated
        updatePayload.status = currentProduct.status;
      } else {
        // Default to draft if no status exists
        updatePayload.status = 'draft';
      }
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
      
      console.log('Sending update payload:', JSON.stringify(updatePayload, null, 2));
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
    const method = productPricingMethods[product.id] || globalPricingMethod || product.pricing_method || 'price';
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

  // Helper to calculate profit from quantity
  const calculateProfitFromQty = (product: Product & { profit: number }, qty: number): number => {
    return product.profit * qty;
  };

  // Column definitions for TanStack Table
  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      size: 300,
      minSize: 300,
      maxSize: 300,
      cell: ({ row }) => {
        const product = row.original;
        const displayName = getDisplayValue(product, 'name') as string;
        return (
          <EditableCell
            value={displayName}
            onSave={async (value) => handleSaveField(product.id, 'name', value)}
            type="text"
            className="font-medium"
          />
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 140,
      minSize: 140,
      maxSize: 140,
      cell: ({ row }) => {
        const product = row.original;
        const currentStatus = (getDisplayValue(product, 'status') as ProductStatus) || 'draft';
        
        const getStatusBadge = (status: ProductStatus) => {
          const statusConfig = {
            draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' },
            in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' },
            on_sale: { label: 'On Sale', className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
            inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200' },
          };
          const config = statusConfig[status] || statusConfig.draft;
          return (
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
          );
        };

        return (
          <Select
            value={currentStatus}
            onValueChange={async (value) => {
              await handleSaveField(product.id, 'status', value);
            }}
          >
            <SelectTrigger className="h-8 border-none shadow-none px-2 hover:bg-muted/50 w-full [&>svg]:hidden">
              {getStatusBadge(currentStatus)}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft" className="pl-2 [&>span.absolute]:hidden">
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">Draft</Badge>
              </SelectItem>
              <SelectItem value="in_progress" className="pl-2 [&>span.absolute]:hidden">
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">In Progress</Badge>
              </SelectItem>
              <SelectItem value="on_sale" className="pl-2 [&>span.absolute]:hidden">
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">On Sale</Badge>
              </SelectItem>
              <SelectItem value="inactive" className="pl-2 [&>span.absolute]:hidden">
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Inactive</Badge>
              </SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      size: 150,
      minSize: 120,
      maxSize: 200,
      cell: ({ row }) => {
        const product = row.original;
        const displaySku = getDisplayValue(product, 'sku') as string;
        return (
          <EditableCell
            value={displaySku || ''}
            onSave={async (value) => handleSaveField(product.id, 'sku', value)}
            type="text"
          />
        );
      },
    },
    {
      id: 'product_cost',
      size: 120,
      minSize: 100,
      maxSize: 200,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-1 px-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Cost
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
            )}
          </Button>
        );
      },
      accessorFn: (row) => row.product_cost,
      cell: ({ row }) => {
        const product = row.original;
        return <div className="py-1">{formatCurrencyValue(product.product_cost)}</div>;
      },
    },
    {
      id: 'markup',
      size: 120,
      minSize: 100,
      maxSize: 200,
      header: 'Markup %',
      cell: ({ row }) => {
        const product = row.original;
        const method = productPricingMethods[product.id] || globalPricingMethod || product.pricing_method || 'price';
        const metrics = getCalculatedMetrics(product);
        const pricingValue = productPricingValues[product.id] ?? product.pricing_value ?? (method === 'price' ? (product.target_price || 0) : 0);
        const markupValue = method === 'markup' ? pricingValue : metrics.markup;
        
        return (
          <div className={method !== 'markup' ? 'opacity-50' : ''}>
            {method === 'markup' ? (
              <EditableCell
                value={markupValue}
                onSave={async (value) => handleSavePricingValue(product.id, 'markup', value as number)}
                type="number"
                formatDisplay={formatPercentage}
              />
            ) : (
              <div className="text-muted-foreground py-1">
                {formatPercentage(markupValue)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'price',
      size: 180,
      minSize: 150,
      maxSize: 250,
      header: 'Planned Sales Price $',
      cell: ({ row }) => {
        const product = row.original;
        const method = productPricingMethods[product.id] || globalPricingMethod || product.pricing_method || 'price';
        const metrics = getCalculatedMetrics(product);
        const pricingValue = productPricingValues[product.id] ?? product.pricing_value ?? (method === 'price' ? (product.target_price || 0) : 0);
        const priceValue = method === 'price' ? pricingValue : metrics.price;
        
        return (
          <div className={method !== 'price' ? 'opacity-50' : ''}>
            {method === 'price' ? (
              <EditableCell
                value={priceValue}
                onSave={async (value) => handleSavePricingValue(product.id, 'price', value as number)}
                type="number"
                formatDisplay={formatCurrencyValue}
              />
            ) : (
              <div className="text-muted-foreground py-1">
                {formatCurrencyValue(priceValue)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'profit',
      size: 150,
      minSize: 120,
      maxSize: 200,
      header: 'Desired Profit $',
      cell: ({ row }) => {
        const product = row.original;
        const method = productPricingMethods[product.id] || globalPricingMethod || product.pricing_method || 'price';
        const metrics = getCalculatedMetrics(product);
        const pricingValue = productPricingValues[product.id] ?? product.pricing_value ?? (method === 'price' ? (product.target_price || 0) : 0);
        const profitValue = method === 'profit' ? pricingValue : metrics.profit;
        
        return (
          <div className={method !== 'profit' ? 'opacity-50' : ''}>
            {method === 'profit' ? (
              <EditableCell
                value={profitValue}
                onSave={async (value) => handleSavePricingValue(product.id, 'profit', value as number)}
                type="number"
                formatDisplay={formatCurrencyValue}
              />
            ) : (
              <div className="text-muted-foreground py-1">
                {formatCurrencyValue(profitValue)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'margin',
      size: 150,
      minSize: 120,
      maxSize: 200,
      header: 'Desired Margin %',
      cell: ({ row }) => {
        const product = row.original;
        const method = productPricingMethods[product.id] || globalPricingMethod || product.pricing_method || 'price';
        const metrics = getCalculatedMetrics(product);
        const pricingValue = productPricingValues[product.id] ?? product.pricing_value ?? (method === 'price' ? (product.target_price || 0) : 0);
        const marginValue = method === 'margin' ? pricingValue : metrics.margin;
        
        return (
          <div className={method !== 'margin' ? 'opacity-50' : ''}>
            {method === 'margin' ? (
              <EditableCell
                value={marginValue}
                onSave={async (value) => handleSavePricingValue(product.id, 'margin', value as number)}
                type="number"
                formatDisplay={formatPercentage}
              />
            ) : (
              <div className="text-muted-foreground py-1">
                {formatPercentage(marginValue)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'calculated_profit',
      size: 120,
      minSize: 100,
      maxSize: 200,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-1 px-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Profit
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
            )}
          </Button>
        );
      },
      accessorFn: (row) => {
        const metrics = getCalculatedMetrics(row);
        return metrics.profit;
      },
      cell: ({ row }) => {
        const product = row.original;
        const metrics = getCalculatedMetrics(product);
        return (
          <div className="py-1">
            <span className={metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrencyValue(metrics.profit)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'calculated_margin',
      size: 130,
      minSize: 110,
      maxSize: 200,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-1 px-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Profit Margin
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
            )}
          </Button>
        );
      },
      accessorFn: (row) => {
        const metrics = getCalculatedMetrics(row);
        return metrics.margin;
      },
      cell: ({ row }) => {
        const product = row.original;
        const metrics = getCalculatedMetrics(product);
        return (
          <div className="py-1">
            <span className={metrics.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatPercentage(metrics.margin)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'qty_sold',
      size: 100,
      minSize: 80,
      maxSize: 150,
      header: 'Qty Sold',
      cell: ({ row }) => {
        const product = row.original;
        const currentQtySold = getDisplayValue(product, 'qty_sold') as number;
        return (
          <EditableCell
            value={currentQtySold}
            onSave={async (value) => handleSaveField(product.id, 'qty_sold', value)}
            type="number"
          />
        );
      },
    },
    {
      id: 'profit_qty',
      size: 130,
      minSize: 110,
      maxSize: 200,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-1 px-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Profit (Qty)
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
            )}
          </Button>
        );
      },
      accessorFn: (row) => {
        const currentQtySold = getDisplayValue(row, 'qty_sold') as number;
        const metrics = getCalculatedMetrics(row);
        return calculateProfitFromQty({ ...row, profit: metrics.profit }, currentQtySold);
      },
      cell: ({ row }) => {
        const product = row.original;
        const currentQtySold = getDisplayValue(product, 'qty_sold') as number;
        const metrics = getCalculatedMetrics(product);
        const profitFromQty = calculateProfitFromQty({ ...product, profit: metrics.profit }, currentQtySold);
        return (
          <div className="py-1">
            <span className={profitFromQty && profitFromQty >= 0 ? 'text-green-600 font-medium' : profitFromQty ? 'text-red-600 font-medium' : ''}>
              {formatCurrencyValue(profitFromQty)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      size: 100,
      minSize: 80,
      maxSize: 120,
      enableResizing: false,
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const product = row.original;
        return (
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
        );
      },
    },
  ], [
    products, 
    productPricingMethods, 
    productPricingValues, 
    globalPricingMethod, 
    settings.currency,
    getDisplayValue,
    getCalculatedMetrics,
    calculateProfitFromQty,
    handleSaveField,
    handleSavePricingValue,
    formatCurrencyValue,
    formatPercentage,
  ]);

  // Table instance
  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  if (loading) {
    return (
      <div className="p-6">
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
          {products.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {getCalculationTypeDescription(globalPricingMethod)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {products.length > 0 && (
            <div className="flex items-center gap-2">
              <Select
                value={globalPricingMethod}
                onValueChange={(value) => handleGlobalMethodChange(value as PricingMethod)}
              >
                <SelectTrigger className="w-[180px] h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markup">Markup %</SelectItem>
                  <SelectItem value="price">Planned Sales Price $</SelectItem>
                  <SelectItem value="profit">Desired Profit $</SelectItem>
                  <SelectItem value="margin">Desired Margin %</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {products.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Columns className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[250px]">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide && column.getCanHide())
                  .map((column) => {
                    const columnId = column.id || '';
                    return (
                      <DropdownMenuCheckboxItem
                        key={columnId}
                        className="capitalize"
                        checked={column.getIsVisible ? column.getIsVisible() : true}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={(value) => {
                          if (column.toggleVisibility) {
                            column.toggleVisibility(!!value);
                          }
                        }}
                      >
                        {columnId === 'name' ? 'Name' :
                         columnId === 'status' ? 'Status' :
                         columnId === 'sku' ? 'SKU' :
                         columnId === 'product_cost' ? 'Cost' :
                         columnId === 'markup' ? 'Markup %' :
                         columnId === 'price' ? 'Planned Sales Price $' :
                         columnId === 'profit' ? 'Desired Profit $' :
                         columnId === 'margin' ? 'Desired Margin %' :
                         columnId === 'calculated_profit' ? 'Profit' :
                         columnId === 'calculated_margin' ? 'Profit Margin' :
                         columnId === 'qty_sold' ? 'Qty Sold' :
                         columnId === 'profit_qty' ? 'Profit (Qty)' :
                         columnId === 'actions' ? 'Actions' :
                         columnId}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button onClick={() => navigate('/products/add')}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first product
          </p>
          <Button onClick={() => navigate('/products/add')}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id}
                        style={{ 
                          width: header.getSize(),
                          minWidth: header.column.columnDef.minSize,
                          maxWidth: header.column.columnDef.maxSize,
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => {
                      const isStatusColumn = cell.column.columnDef.accessorKey === 'status';
                      return (
                        <TableCell 
                          key={cell.id} 
                          className={`px-4 relative ${isStatusColumn ? 'overflow-visible whitespace-nowrap' : 'overflow-hidden'}`}
                          style={{ 
                            width: cell.column.getSize(),
                            minWidth: cell.column.columnDef.minSize,
                            maxWidth: cell.column.columnDef.maxSize,
                            boxSizing: 'border-box',
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
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

