import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Columns, Filter, X, Search, AlertTriangle, Loader2 } from 'lucide-react';
import { ProductVariationsModal } from '@/components/products/ProductVariationsModal';
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
import { Input } from '@/components/ui/input';
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
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency } from '@/utils/currency';
import EditProductPane from '@/components/EditProductPane';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProducts, type Product, type PricingMethod, type ProductStatus } from '@/hooks/useProducts';
import { useProductPricing } from '@/hooks/useProductPricing';
import { EditableCell } from '@/components/EditableCell';
import { getCurrencySymbol } from '@/utils/currency'; // Assuming this utility is available
import api from '@/lib/api';

// Helper function to format numbers - remove trailing zeros
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



export default function Products() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const { products, isLoading: loading, error, updateProduct, deleteProduct, checkStockLevels, refetch: productsQueryRefetch } = useProducts();
  const { calculatePriceFromMethod, calculateProfitFromPrice, calculateValueFromMethod, getCalculationTypeDescription } = useProductPricing();

  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [qtySold, setQtySold] = useState<Record<number, number>>({});

  // Local state for pricing calculations while editing/viewing
  const [productPricingMethods, setProductPricingMethods] = useState<Record<number, PricingMethod>>({});
  const [productPricingValues, setProductPricingValues] = useState<Record<number, number>>({});
  const [globalPricingMethod, setGlobalPricingMethod] = useState<PricingMethod>('price');

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [selectedFilterColumn, setSelectedFilterColumn] = useState<string>('');
  const [filterOperator, setFilterOperator] = useState<string>('contains');
  const [filterValue, setFilterValue] = useState<string>('');
  const [stockWarningOpen, setStockWarningOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ productId: number; newStatus: ProductStatus } | null>(null);
  const [stockIssues, setStockIssues] = useState<Array<{ material: string; currentStock: number; required: number; shortfall: number; unit: string }>>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null);

  // Variations Modal State
  const [variationsModalOpen, setVariationsModalOpen] = useState(false);
  const [selectedProductForVariations, setSelectedProductForVariations] = useState<Product | null>(null);
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { setOpen: setSidebarOpen } = useSidebar();

  useEffect(() => {
    // Close sidebar when Products page loads
    setSidebarOpen(false);
  }, []);

  // Initialize pricing methods and values from fetched products
  useEffect(() => {
    if (products.length > 0) {
      // Set global method from first product if all products have the same method
      const firstProductMethod = products[0]?.pricing_method;
      if (firstProductMethod && products.every(p => p.pricing_method === firstProductMethod)) {
        setGlobalPricingMethod(firstProductMethod);
      } else if (!firstProductMethod) {
        setGlobalPricingMethod('price');
      }

      setProductPricingMethods(prev => {
        const updated = { ...prev };
        products.forEach(product => {
          if (!updated[product.id]) {
            updated[product.id] = product.pricing_method || 'price';
          }
        });
        return updated;
      });

      setProductPricingValues(prev => {
        const updated = { ...prev };
        products.forEach(product => {
          if (product.pricing_value !== null && product.pricing_value !== undefined && !(product.id in updated)) {
            updated[product.id] = product.pricing_value;
          } else if (!(product.id in updated) && product.target_price && product.product_cost > 0) {
            const method = product.pricing_method || 'price';
            updated[product.id] = calculateValueFromMethod(method, product.target_price, product.product_cost);
          }
        });
        return updated;
      });
    }
  }, [products, calculateValueFromMethod]);


  const handleDeleteClick = (productId: number, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete.id);
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      productsQueryRefetch();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete product',
      });
    }
  };

  const formatCurrencyValue = (value: string | number | null | undefined) => {
    return formatCurrency(value, settings?.currency || 'USD');
  };

  const formatPercentage = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof numValue !== 'number' || isNaN(numValue)) return '-';
    return `${numValue.toFixed(2)}%`;
  };

  const handleGlobalMethodChange = (method: PricingMethod) => {
    setGlobalPricingMethod(method);

    // Apply to all products - update local state immediately
    // Note: This only updates local display state, not the DB
    products.forEach(product => {
      setProductPricingMethods(prev => ({
        ...prev,
        [product.id]: method,
      }));

      // Calculate new pricing value from current target_price if available
      if (product.target_price && product.product_cost > 0) {
        const newValue = calculateValueFromMethod(method, product.target_price, product.product_cost);
        setProductPricingValues(prev => ({
          ...prev,
          [product.id]: newValue,
        }));
      }
    });

    // TODO: Consider if we should also update the DB in batches? 
    // For now, retaining existing behavior which seemed to be local-only until saved.
  };

  const handleSavePricingValue = async (productId: number, method: PricingMethod, value: number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      // Update local state immediately
      setProductPricingValues(prev => ({
        ...prev,
        [productId]: value,
      }));

      const calculatedPrice = calculatePriceFromMethod(method, value, product.product_cost);

      // Update via hook
      await updateProduct({
        id: productId,
        data: {
          pricing_method: method,
          pricing_value: value,
          target_price: calculatedPrice,
        }
      });

    } catch (error: any) {
      console.error('Error saving pricing value:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save pricing',
      });
    }
  };

  const handleSaveField = async (productId: number, field: string, value: string | number, skipStockCheck = false) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      // If changing status to 'on_sale', check stock first
      if (!skipStockCheck && field === 'status' && value === 'on_sale' && product.status !== 'on_sale') {
        const issues = await checkStockLevels(productId, product.batch_size);

        if (issues.length > 0) {
          setStockIssues(issues);
          setPendingStatusChange({ productId, newStatus: value as ProductStatus });
          setStockWarningOpen(true);
          return;
        }
      }

      if (field === 'qty_sold') {
        setQtySold(prev => ({ ...prev, [productId]: value as number }));
        return;
      }

      await updateProduct({
        id: productId,
        data: { [field]: value }
      });

    } catch (error: any) {
      console.error('Error saving field:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save changes',
      });
    }
  };


  const getDisplayValue = (product: Product, field: string): string | number | null => {
    if (field === 'qty_sold') {
      return qtySold[product.id] || 0;
    }

    if (field === 'pricing_value') {
      if (productPricingValues[product.id] !== undefined) {
        return productPricingValues[product.id];
      }
      return product.pricing_value;
    }

    return product[field as keyof Product] as string | number | null;
  };

  const getCalculatedMetrics = (product: Product) => {
    const method = productPricingMethods[product.id] || globalPricingMethod || product.pricing_method || 'price';
    const pricingValue = productPricingValues[product.id] ?? product.pricing_value ?? (product.target_price || 0);

    let calculatedPrice = product.target_price || 0;
    if (method && pricingValue !== null && pricingValue !== undefined) {
      calculatedPrice = calculatePriceFromMethod(method, pricingValue, product.product_cost);
    }

    // calculateProfitFromPrice only returns { profit, margin, markup }
    // We need to return price as well for the table usage
    const metrics = calculateProfitFromPrice(calculatedPrice, product.product_cost);

    return {
      price: calculatedPrice,
      profit: metrics.profit,
      margin: metrics.margin,
      markup: metrics.markup,
    };
  };

  // Helper to calculate profit from quantity
  // Note: calculateProfitFromPrice already returns profit, but this seems to be total profit for X quantity?
  // Looking at table column 'Total Profit': cell: ({ row }) => ... 
  // Let's assume we use the metrics for single unit, this helper might be redundant or for bulk.
  // Helper to calculate total profit from quantity
  const calculateTotalProfitFromQty = (product: Product, qty: number): number => {
    const metrics = getCalculatedMetrics(product);
    return metrics.profit * qty;
  };

  const customFilterFunctions = {
    contains: (row: any, columnId: string, filterValue: string) => {
      const value = row.getValue(columnId);
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    },
    equals: (row: any, columnId: string, filterValue: string) => {
      const value = row.getValue(columnId);
      return String(value).toLowerCase() === String(filterValue).toLowerCase();
    },
    notContains: (row: any, columnId: string, filterValue: string) => {
      const value = row.getValue(columnId);
      if (value === null || value === undefined) return true;
      return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    },
    startsWith: (row: any, columnId: string, filterValue: string) => {
      const value = row.getValue(columnId);
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
    },
    endsWith: (row: any, columnId: string, filterValue: string) => {
      const value = row.getValue(columnId);
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
    },
  };

  // Column definitions for TanStack Table
  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      size: 300,
      minSize: 300,
      maxSize: 300,
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue: any) => {
        if (!filterValue || !filterValue.value) return true;
        const operator = filterValue.operator || 'contains';
        return customFilterFunctions[operator as keyof typeof customFilterFunctions]?.(row, columnId, filterValue.value) ?? true;
      },
      cell: ({ row }) => {
        const product = row.original;
        const displayName = getDisplayValue(product, 'name') as string;
        return (
          <div className="flex items-center gap-1 group w-full">
            <EditableCell
              value={displayName}
              onSave={async (value) => handleSaveField(product.id, 'name', value)}
              type="text"
              className="font-medium flex-1 min-w-0"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setEditingProductId(product.id);
              }}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 140,
      minSize: 140,
      maxSize: 140,
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue: any) => {
        if (!filterValue || !filterValue.value) return true;
        const operator = filterValue.operator || 'equals';
        return customFilterFunctions[operator as keyof typeof customFilterFunctions]?.(row, columnId, filterValue.value) ?? true;
      },
      cell: ({ row }) => {
        const product = row.original;
        const currentStatus = (getDisplayValue(product, 'status') as ProductStatus) || 'draft';

        const getStatusBadge = (status: ProductStatus) => {
          const statusConfig = {
            draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' },
            in_progress: { label: 'In Progress', className: 'bg-[#F89C75] text-white border-transparent hover:bg-[#F89C75]/90' },
            on_sale: { label: 'On Sale', className: 'bg-[#11743B] text-white border-transparent hover:bg-[#11743B]/90' },
            inactive: { label: 'Inactive', className: 'bg-[#B03E52] text-white border-transparent hover:bg-[#B03E52]/90' },
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
            <SelectTrigger className="h-8 border-none shadow-none pl-0 hover:bg-muted/50 w-full justify-start [&>svg]:hidden">
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
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue: any) => {
        if (!filterValue || !filterValue.value) return true;
        const operator = filterValue.operator || 'contains';
        return customFilterFunctions[operator as keyof typeof customFilterFunctions]?.(row, columnId, filterValue.value) ?? true;
      },
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
      accessorKey: 'variants',
      header: 'Variants',
      size: 100,
      cell: ({ row }) => {
        const product = row.original;
        const variants = product.variants;
        const isThisRowUpdating = updatingProductId === product.id;

        if (isThisRowUpdating) {
          return (
            <div className="flex justify-start items-center h-6">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="ml-2 text-[10px] text-muted-foreground italic">Saving...</span>
            </div>
          );
        }

        if (!variants || variants.length === 0) {
          return (
            <div className="flex justify-start">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={async () => {
                  try {
                    const res = await api.get(`/products/${product.id}`);
                    if (res.data.status === 'success') {
                      setSelectedProductForVariations({ ...product, ...res.data.data });
                      setVariationsModalOpen(true);
                    }
                  } catch (e) {
                    toast({ variant: "destructive", title: "Error", description: "Failed to load product details" });
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
          );
        }
        return (
          <div className="flex justify-start">
            <Badge
              variant="outline"
              className="font-normal text-xs whitespace-nowrap cursor-pointer hover:bg-muted"
              onClick={async () => {
                try {
                  const res = await api.get(`/products/${product.id}`);
                  if (res.data.status === 'success') {
                    setSelectedProductForVariations({ ...product, ...res.data.data });
                    setVariationsModalOpen(true);
                  }
                } catch (e) {
                  toast({ variant: "destructive", title: "Error", description: "Failed to load product details" });
                }
              }}
            >
              {variants.length} variant{variants.length !== 1 ? 's' : ''}
            </Badge>
          </div>
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
          <div
            className="flex items-center justify-start cursor-pointer hover:text-foreground text-muted-foreground gap-2 w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Cost
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-50" />
            )}
          </div>
        );
      },
      accessorFn: (row) => row.product_cost,
      cell: ({ row }) => {
        const product = row.original;
        return <div className="text-left font-medium">{formatCurrencyValue(product.product_cost)}</div>;
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
          <div className={method !== 'markup' ? 'opacity-50 text-left' : 'text-left'}>
            {method === 'markup' ? (
              <EditableCell
                value={markupValue}
                onSave={async (value) => handleSavePricingValue(product.id, 'markup', value as number)}
                type="number"
                formatDisplay={formatPercentage}
                className="text-left justify-start"
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
          <div className={method !== 'price' ? 'opacity-50 text-left' : 'text-left'}>
            {method === 'price' ? (
              <EditableCell
                value={priceValue}
                onSave={async (value) => handleSavePricingValue(product.id, 'price', value as number)}
                type="number"
                formatDisplay={formatCurrencyValue}
                className="text-left justify-start font-medium"
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
          <div className={method !== 'profit' ? 'opacity-50 text-left' : 'text-left'}>
            {method === 'profit' ? (
              <EditableCell
                value={profitValue}
                onSave={async (value) => handleSavePricingValue(product.id, 'profit', value as number)}
                type="number"
                formatDisplay={formatCurrencyValue}
                className="text-left justify-start"
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
          <div className={method !== 'margin' ? 'opacity-50 text-left' : 'text-left'}>
            {method === 'margin' ? (
              <EditableCell
                value={marginValue}
                onSave={async (value) => handleSavePricingValue(product.id, 'margin', value as number)}
                type="number"
                formatDisplay={formatPercentage}
                className="text-left justify-start"
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
          <div
            className="flex items-center justify-start cursor-pointer hover:text-foreground text-muted-foreground gap-2 w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Profit
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-50" />
            )}
          </div>
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
          <div className="text-left">
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
          <div
            className="flex items-center justify-start cursor-pointer hover:text-foreground text-muted-foreground gap-2 w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Profit Margin
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-50" />
            )}
          </div>
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
          <div className="text-left">
            <span className={metrics.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatPercentage(metrics.margin)}
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
              onClick={() => handleDeleteClick(product.id, product.name)}
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
    settings?.currency,
    getDisplayValue,
    getCalculatedMetrics,
    calculateTotalProfitFromQty,
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
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue) return true;
      const searchValue = filterValue.toLowerCase();
      const name = (row.getValue('name') as string)?.toLowerCase() || '';
      const sku = (row.getValue('sku') as string)?.toLowerCase() || '';
      return name.includes(searchValue) || sku.includes(searchValue);
    },
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
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
          <Button onClick={() => productsQueryRefetch()} variant="outline" className="mt-4">
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
            <>
              {/* Search Box */}
              <div className="relative w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
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
            </>
          )}
          {products.length > 0 && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px]">
                  <DropdownMenuLabel>Add Filter</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2 space-y-3">
                    {/* Column selection */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Column</label>
                      <Select
                        value={selectedFilterColumn}
                        onValueChange={(value) => {
                          setSelectedFilterColumn(value);
                          setFilterValue('');
                          setFilterOperator(value === 'status' ? 'equals' : 'contains');
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select column..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="sku">SKU</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filter operator selection */}
                    {selectedFilterColumn && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Operator</label>
                        <Select
                          value={filterOperator}
                          onValueChange={setFilterOperator}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedFilterColumn === 'status' ? (
                              <>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="notContains">Not Equals</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="contains">Contains</SelectItem>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="notContains">Not Contains</SelectItem>
                                <SelectItem value="startsWith">Starts With</SelectItem>
                                <SelectItem value="endsWith">Ends With</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Dynamic filter input based on selected column */}
                    {selectedFilterColumn && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          {selectedFilterColumn === 'name' ? 'Name' :
                            selectedFilterColumn === 'status' ? 'Status' :
                              selectedFilterColumn === 'sku' ? 'SKU' : ''}
                        </label>
                        {selectedFilterColumn === 'status' ? (
                          <Select
                            value={filterValue}
                            onValueChange={setFilterValue}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select status..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="on_sale">On Sale</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder={`Filter by ${selectedFilterColumn}...`}
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            className="h-8"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && filterValue) {
                                table.getColumn(selectedFilterColumn)?.setFilterValue({
                                  operator: filterOperator,
                                  value: filterValue
                                });
                                setSelectedFilterColumn('');
                                setFilterValue('');
                                setFilterOperator('contains');
                              }
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* Apply button */}
                    {selectedFilterColumn && filterValue && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          table.getColumn(selectedFilterColumn)?.setFilterValue({
                            operator: filterOperator,
                            value: filterValue
                          });
                          setSelectedFilterColumn('');
                          setFilterValue('');
                          setFilterOperator('contains');
                        }}
                      >
                        Apply Filter
                      </Button>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
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
                                              columnId === 'actions' ? 'Actions' :
                                                columnId}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button onClick={() => navigate('/products/add')}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {table.getState().columnFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {table.getState().columnFilters.map((filter) => {
            const columnId = filter.id;
            const columnName = columnId === 'name' ? 'Name' :
              columnId === 'status' ? 'Status' :
                columnId === 'sku' ? 'SKU' : columnId;

            // Handle both old format (string) and new format (object with operator and value)
            const filterData = typeof filter.value === 'object' && filter.value !== null
              ? filter.value as { operator: string; value: string }
              : { operator: columnId === 'status' ? 'equals' : 'contains', value: filter.value as string };

            const operatorLabels: Record<string, string> = {
              contains: 'contains',
              equals: 'equals',
              notContains: 'not contains',
              startsWith: 'starts with',
              endsWith: 'ends with',
            };

            const operatorLabel = operatorLabels[filterData.operator] || filterData.operator;

            // Format status display value
            const displayValue = columnId === 'status'
              ? (filterData.value === 'draft' ? 'Draft' :
                filterData.value === 'in_progress' ? 'In Progress' :
                  filterData.value === 'on_sale' ? 'On Sale' :
                    filterData.value === 'inactive' ? 'Inactive' : filterData.value)
              : filterData.value;

            return (
              <Badge
                key={filter.id}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1"
              >
                <span className="text-xs font-medium">{columnName} {operatorLabel} {displayValue}</span>
                <button
                  onClick={() => {
                    table.getColumn(columnId)?.setFilterValue('');
                  }}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              table.resetColumnFilters();
              setSelectedFilterColumn('');
              setFilterValue('');
              setFilterOperator('contains');
            }}
          >
            Clear all
          </Button>
        </div>
      )}

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
            <TableHeader className="bg-[#FAFAFA]">
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
                      const isStatusColumn = cell.column.id === 'status';
                      return (
                        <TableCell
                          key={cell.id}
                          className={`p-2 relative ${isStatusColumn ? 'overflow-visible whitespace-nowrap' : 'overflow-hidden'}`}
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
          productsQueryRefetch(); // Refresh the products list
        }}
      />

      {/* Stock Warning Dialog */}
      <Dialog open={stockWarningOpen} onOpenChange={setStockWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Insufficient Stock Warning
            </DialogTitle>
            <DialogDescription>
              Some materials don't have enough stock to complete this batch. Stock will be reduced to negative values if you proceed.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-3">
              {stockIssues.map((issue, index) => (
                <div key={index} className="border rounded-lg p-3 bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="font-medium text-sm">{issue.material} ({issue.unit})</div>
                  <div className="text-sm text-muted-foreground mt-1 space-y-1">
                    <div>Current Stock: <span className="font-medium">{formatNumberDisplay(issue.currentStock)}</span></div>
                    <div>Required: <span className="font-medium">{formatNumberDisplay(issue.required)}</span></div>
                    <div className="text-red-600 dark:text-red-400 font-medium">
                      Shortfall: {formatNumberDisplay(issue.shortfall)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStockWarningOpen(false);
                setPendingStatusChange(null);
                setStockIssues([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                if (pendingStatusChange) {
                  setStockWarningOpen(false);
                  // Proceed with status change (skip stock check since we already did it)
                  await handleSaveField(pendingStatusChange.productId, 'status', pendingStatusChange.newStatus, true);
                  setPendingStatusChange(null);
                  setStockIssues([]);
                }
              }}
            >
              Proceed Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Product
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setProductToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Variations Modal */}
      {selectedProductForVariations && (
        <ProductVariationsModal
          open={variationsModalOpen}
          onOpenChange={(open) => {
            setVariationsModalOpen(open);
            if (!open) setSelectedProductForVariations(null);
          }}
          variants={selectedProductForVariations.variants || []}
          onSave={async (updatedVariants) => {
            const pid = selectedProductForVariations.id;
            try {
              setUpdatingProductId(pid);
              await updateProduct({ id: pid, data: { variants: updatedVariants } });
              toast({ title: 'Success', description: 'Variations updated successfully', variant: 'success' });
            } catch (err) {
              console.error("Failed to update variants", err);
              toast({ variant: "destructive", title: "Error", description: "Failed to update variants" });
            } finally {
              setUpdatingProductId(null);
            }
          }}
          currency={getCurrencySymbol(settings.currency)}
          baseCost={selectedProductForVariations.product_cost ?? 0}
          basePrice={selectedProductForVariations.target_price ?? 0}
        />
      )}
    </div>
  );
}

