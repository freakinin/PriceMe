import { useState, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, ExternalLink, Package, Columns, X, Info, PackagePlus, AlertTriangle } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
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
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency } from '@/utils/currency';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import EditMaterialDialog from '@/components/EditMaterialDialog';

interface Material {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  price_per_unit: number;
  width?: number;
  length?: number;
  details?: string;
  supplier?: string;
  supplier_link?: string;
  stock_level: number;
  reorder_point: number;
  last_purchased_date?: string;
  last_purchased_price?: number;
  last_purchased_quantity?: number;
  category?: string;
  created_at: string;
  updated_at: string;
}

// Editable cell component for inline editing
function EditableCell({
  value,
  onSave,
  type = 'text',
  formatDisplay,
  className = '',
  options,
}: {
  value: string | number | null | undefined;
  onSave: (value: string | number) => Promise<void>;
  type?: 'text' | 'number' | 'select';
  formatDisplay?: (value: string | number | null | undefined) => ReactNode;
  className?: string;
  options?: string[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  // Format number to remove trailing zeros
  const formatEditValue = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined || val === '') return '';
    if (type === 'number') {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num)) return '';
      // Remove trailing zeros and unnecessary decimals
      return num % 1 === 0 ? Math.round(num).toString() : parseFloat(num.toFixed(2)).toString();
    }
    return val.toString();
  };
  const [editValue, setEditValue] = useState<string>(formatEditValue(value));
  const [isSaving, setIsSaving] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditValue(formatEditValue(value));
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
      setEditValue(formatEditValue(value));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(formatEditValue(value));
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

  if (isEditing || (type === 'select' && selectOpen)) {
    if (type === 'select' && options) {
      return (
        <div ref={cellRef} className="absolute inset-0">
          <Select
            open={selectOpen}
            value={editValue}
            onValueChange={(val) => {
              setEditValue(val);
              // Auto-save on select change
              setTimeout(() => {
                onSave(val).then(() => {
                  setIsEditing(false);
                  setSelectOpen(false);
                });
              }, 0);
            }}
            onOpenChange={(open) => {
              setSelectOpen(open);
              if (!open && !isSaving) {
                setIsEditing(false);
              }
            }}
          >
            <SelectTrigger className="h-full w-full border-none shadow-none rounded-none px-2 py-1 text-sm focus:ring-0 focus:outline-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div ref={cellRef} className="absolute inset-0">
        <input
          ref={inputRef}
          type={type === 'number' ? 'number' : 'text'}
          step={type === 'number' ? '0.01' : undefined}
          className="h-full w-full border-none outline-none px-2 py-1 text-sm bg-transparent focus:bg-background focus:outline-none focus:ring-0"
          style={{ borderRadius: 0 }}
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
    if (type === 'select' && options) {
      // For select, immediately open the dropdown
      setSelectOpen(true);
      setIsEditing(true);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div
      className={`relative flex items-center h-full w-full cursor-cell hover:bg-muted/30 px-2 py-1 transition-colors ${className}`}
      onClick={handleClick}
      onDoubleClick={handleClick}
    >
      <div className="flex-1 truncate text-sm">
        {typeof displayValue === 'string' ? <span>{displayValue}</span> : displayValue}
      </div>
    </div>
  );
}

export default function Materials() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const { setOpen: setSidebarOpen } = useSidebar();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    supplier: false,
    supplier_link: false,
  });
  const [selectedFilterColumn, setSelectedFilterColumn] = useState<string>('');
  const [filterOperator, setFilterOperator] = useState<string>('contains');
  const [filterValue, setFilterValue] = useState<string>('');
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addStockMaterial, setAddStockMaterial] = useState<Material | null>(null);
  const [addStockQuantity, setAddStockQuantity] = useState<string>('');
  const [addStockPrice, setAddStockPrice] = useState<string>('');
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);
  const [deleteConfirmMaterial, setDeleteConfirmMaterial] = useState<Material | null>(null);

  useEffect(() => {
    // Close sidebar when Materials page loads
    setSidebarOpen(false);
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await api.get('/materials');
      if (response.data.status === 'success') {
        setMaterials(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load materials',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMaterial = async (id: number, updates: Partial<Material>) => {
    try {
      const response = await api.put(`/materials/${id}`, updates);
      if (response.data.status === 'success') {
        // Update local state optimistically
        setMaterials((prev) =>
          prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
        );
        toast({
          variant: 'success',
          title: 'Updated',
          description: 'Material updated successfully',
        });
      }
    } catch (error: any) {
      console.error('Error updating material:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update material',
      });
      throw error; // Re-throw to let EditableCell handle revert
    }
  };

  const handleDelete = (material: Material) => {
    setDeleteConfirmMaterial(material);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmMaterial) return;

    try {
      await api.delete(`/materials/${deleteConfirmMaterial.id}`);
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Material deleted successfully',
      });
      setDeleteConfirmMaterial(null);
      fetchMaterials();
    } catch (error: any) {
      console.error('Error deleting material:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete material',
      });
    }
  };

  const handleAddStock = async () => {
    if (!addStockMaterial) return;
    
    const quantityToAdd = Number(addStockQuantity) || 0;
    const newPricePerUnit = Number(addStockPrice) || 0;
    
    if (quantityToAdd <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid quantity',
      });
      return;
    }

    setIsAddingStock(true);
    try {
      const currentQuantity = Number(addStockMaterial.quantity) || 0;
      const currentStock = Number(addStockMaterial.stock_level) || 0;
      const newQuantity = currentQuantity + quantityToAdd;
      const newStock = currentStock + quantityToAdd;
      
      // If new price is provided, update price_per_unit and recalculate total price
      const updateData: Partial<Material> = {
        quantity: newQuantity,
        stock_level: newStock,
        last_purchased_date: new Date().toISOString().split('T')[0],
      };
      
      const existingPricePerUnit = Number(addStockMaterial.price_per_unit) || 0;
      const existingTotalCost = Number(addStockMaterial.price) || 0;
      
      if (newPricePerUnit > 0 && newPricePerUnit !== existingPricePerUnit) {
        // Calculate new total investment (old total + new purchase)
        const newPurchaseCost = quantityToAdd * newPricePerUnit;
        const newTotalInvestment = existingTotalCost + newPurchaseCost;
        
        updateData.price_per_unit = newPricePerUnit; // Last purchase price
        updateData.price = newTotalInvestment; // Total investment
        updateData.last_purchased_price = newPricePerUnit;
        updateData.last_purchased_quantity = quantityToAdd;
      } else {
        // Same price or no price change - just add to investment
        const priceToUse = newPricePerUnit > 0 ? newPricePerUnit : existingPricePerUnit;
        const newPurchaseCost = quantityToAdd * priceToUse;
        updateData.price = existingTotalCost + newPurchaseCost;
        updateData.last_purchased_price = priceToUse;
        updateData.last_purchased_quantity = quantityToAdd;
      }

      await updateMaterial(addStockMaterial.id, updateData);
      
      // Reset and close dialog
      setAddStockMaterial(null);
      setAddStockQuantity('');
      setAddStockPrice('');
      fetchMaterials(); // Refresh to get updated data
    } catch (error) {
      console.error('Error adding stock:', error);
    } finally {
      setIsAddingStock(false);
    }
  };

  const getCategories = () => {
    const categories = new Set<string>();
    materials.forEach(m => {
      if (m.category) categories.add(m.category);
    });
    return Array.from(categories).sort();
  };

  const getStockBadgeVariant = (material: Material) => {
    const stockLevel = Number(material.stock_level) || 0;
    const reorderPoint = Number(material.reorder_point) || 0;
    
    // If stock is at or below reorder point, it's critical (red)
    if (stockLevel <= reorderPoint) {
      return 'destructive'; // Red
    }
    
    // Calculate how far above the reorder point we are
    // Use ratio for better scaling: if reorder is 10, stock of 30 is 3x = good
    // If reorder is 3, stock of 5 is only 1.67x = getting close
    const ratio = reorderPoint > 0 ? stockLevel / reorderPoint : Infinity;
    
    // If stock is less than 2x the reorder point, it's getting close (yellow/orange)
    // Example: reorder 10, stock 15 = 1.5x → yellow
    // Example: reorder 3, stock 5 = 1.67x → yellow
    if (ratio < 2) {
      return 'secondary'; // Yellow/Warning
    }
    
    // Stock is well above reorder point (more than 2x) = green/good
    return 'default'; // Green
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get available units from settings
  const availableUnits = useMemo(() => {
    return settings.units && settings.units.length > 0 
      ? [...settings.units].sort() 
      : ['ml', 'L', 'g', 'kg', 'mm', 'cm', 'm', 'm²', 'pcs'];
  }, [settings.units]);

  // Custom filter functions
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

  // Column definitions with inline editing
  const columns = useMemo<ColumnDef<Material>[]>(
    () => [
      {
        accessorKey: 'name',
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue: any) => {
          if (!filterValue || !filterValue.value) return true;
          const operator = filterValue.operator || 'contains';
          return customFilterFunctions[operator as keyof typeof customFilterFunctions]?.(row, columnId, filterValue.value) ?? true;
        },
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-2"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Material
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
        cell: ({ row }) => {
          const material = row.original;
          return (
            <EditableCell
              value={material.name}
              onSave={async (value) => {
                await updateMaterial(material.id, { name: value as string });
              }}
              type="text"
            />
          );
        },
      },
      {
        accessorKey: 'unit',
        header: 'Unit',
        cell: ({ row }) => {
          const material = row.original;
          return (
            <EditableCell
              value={material.unit}
              onSave={async (value) => {
                await updateMaterial(material.id, { unit: value as string });
              }}
              type="select"
              options={availableUnits}
            />
          );
        },
      },
      {
        accessorKey: 'price_per_unit',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-2"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Price/Unit
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
        cell: ({ row }) => {
          const material = row.original;
          const quantity = Number(material.quantity) || 0;
          const totalInvestment = Number(material.price) || 0;
          const avgCost = quantity > 0 ? totalInvestment / quantity : 0;
          const lastPrice = Number(material.price_per_unit) || 0;
          
          return (
            <div className="px-2 py-1">
              <EditableCell
                value={material.price_per_unit}
                onSave={async (value) => {
                  const newPricePerUnit = Number(value) || 0;
                  const qty = Number(material.quantity) || 0;
                  const newPrice = newPricePerUnit * qty;
                  await updateMaterial(material.id, {
                    price_per_unit: newPricePerUnit,
                    price: newPrice,
                  });
                }}
                type="number"
                formatDisplay={(val) => formatCurrency(Number(val) || 0, settings.currency)}
              />
              {avgCost !== lastPrice && avgCost > 0 && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Avg: {formatCurrency(avgCost, settings.currency)}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'price',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-2"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Investment
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
        cell: ({ row }) => {
          const material = row.original;
          return (
            <div className="text-sm px-2 py-1">
              {formatCurrency(material.price, settings.currency)}
            </div>
          );
        },
      },
      {
        accessorKey: 'supplier',
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue: any) => {
          if (!filterValue || !filterValue.value) return true;
          const operator = filterValue.operator || 'contains';
          return customFilterFunctions[operator as keyof typeof customFilterFunctions]?.(row, columnId, filterValue.value) ?? true;
        },
        header: 'Supplier',
        cell: ({ row }) => {
          const material = row.original;
          return (
            <EditableCell
              value={material.supplier}
              onSave={async (value) => {
                await updateMaterial(material.id, { supplier: value as string });
              }}
              type="text"
            />
          );
        },
      },
      {
        accessorKey: 'supplier_link',
        header: 'Link',
        cell: ({ row }) => {
          const link = row.getValue('supplier_link') as string | undefined;
          return link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              Link
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            '-'
          );
        },
      },
      {
        accessorKey: 'stock_level',
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue: any) => {
          if (!filterValue || !filterValue.value) return true;
          const operator = filterValue.operator || 'equals';
          return customFilterFunctions[operator as keyof typeof customFilterFunctions]?.(row, columnId, filterValue.value) ?? true;
        },
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-2"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Stock Level
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
        cell: ({ row }) => {
          const material = row.original;
          const stockLevel = material.stock_level;
          const variant = getStockBadgeVariant(material);
          // Ensure stockLevel is a number
          const stockNum = Number(stockLevel) || 0;
          // Format stock level to remove trailing zeros
          const formattedStock = Number.isInteger(stockNum) 
            ? stockNum.toString()
            : parseFloat(stockNum.toFixed(2)).toString();
          
          // Determine color based on variant
          const badgeClassName = 
            variant === 'destructive' 
              ? 'bg-red-500 text-white' 
              : variant === 'secondary'
              ? 'bg-yellow-500 text-white'
              : 'bg-green-500 text-white';
          
          return (
            <Badge 
              variant={variant}
              className={badgeClassName}
            >
              {formattedStock}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'reorder_point',
        header: () => (
          <div className="flex items-center gap-1.5">
            <span>Reorder Point</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>The minimum stock level at which you should reorder this material. When stock level drops to or below this point, the material will be flagged as "Low Stock".</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
        cell: ({ row }) => {
          const material = row.original;
          return (
            <EditableCell
              value={material.reorder_point}
              onSave={async (value) => {
                await updateMaterial(material.id, { reorder_point: value as number });
              }}
              type="number"
            />
          );
        },
      },
      {
        accessorKey: 'last_purchased_date',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-2"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Last Purchased
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
        cell: ({ row }) => {
          const material = row.original;
          const lastQty = Number(material.last_purchased_quantity) || 0;
          const lastPrice = Number(material.last_purchased_price) || 0;
          const lastTotal = lastQty * lastPrice;
          
          return (
            <div className="text-sm">
              <div>{formatDate(material.last_purchased_date)}</div>
              {lastTotal > 0 && (
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(lastTotal, settings.currency)}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue: any) => {
          if (!filterValue || !filterValue.value) return true;
          const operator = filterValue.operator || 'equals';
          return customFilterFunctions[operator as keyof typeof customFilterFunctions]?.(row, columnId, filterValue.value) ?? true;
        },
        header: 'Category',
        cell: ({ row }) => {
          const material = row.original;
          return (
            <EditableCell
              value={material.category}
              onSave={async (value) => {
                await updateMaterial(material.id, { category: value as string });
              }}
              type="select"
              options={getCategories()}
              formatDisplay={(val) =>
                val ? <Badge variant="outline">{val as string}</Badge> : '-'
              }
            />
          );
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const material = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingMaterial(material)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit material</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setAddStockMaterial(material);
                        // Format price to remove trailing zeros
                        const price = Number(material.price_per_unit) || 0;
                        setAddStockPrice(price % 1 === 0 ? price.toString() : parseFloat(price.toFixed(2)).toString());
                      }}
                    >
                      <PackagePlus className="h-4 w-4 text-green-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add stock / Restock</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(material)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete material</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        },
      },
    ],
    [settings.currency, availableUnits, materials]
  );

  // Filter materials based on out of stock toggle
  const filteredMaterials = useMemo(() => {
    if (!showOutOfStockOnly) return materials;
    return materials.filter(m => {
      const stock = Number(m.stock_level) || 0;
      const reorderPoint = Number(m.reorder_point) || 0;
      return stock <= reorderPoint; // Out of stock or below reorder point
    });
  }, [materials, showOutOfStockOnly]);

  // Table instance
  const table = useReactTable({
    data: filteredMaterials,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const material = row.original;
      const searchValue = String(filterValue || '').toLowerCase();
      return !!(
        material.name.toLowerCase().includes(searchValue) ||
        (material.supplier && material.supplier.toLowerCase().includes(searchValue)) ||
        (material.category && material.category.toLowerCase().includes(searchValue)) ||
        (material.details && material.details.toLowerCase().includes(searchValue))
      );
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div></div>
        <div className="flex items-center gap-3">
          {materials.length > 0 && (
            <>
              {/* Search Box */}
              <div className="relative w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                  placeholder="Search by name or supplier..."
                  value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 h-10"
            />
          </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={showOutOfStockOnly ? "default" : "outline"} 
                      size="icon"
                      onClick={() => setShowOutOfStockOnly(!showOutOfStockOnly)}
                      className={showOutOfStockOnly ? "bg-red-500 hover:bg-red-600" : ""}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showOutOfStockOnly ? "Showing out of stock only" : "Show out of stock only"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                          setFilterOperator(value === 'category' || value === 'stock_level' ? 'equals' : 'contains');
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select column..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                          <SelectItem value="supplier">Supplier</SelectItem>
                          <SelectItem value="stock_level">Stock Level</SelectItem>
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
                            {selectedFilterColumn === 'category' || selectedFilterColumn === 'stock_level' ? (
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
                           selectedFilterColumn === 'category' ? 'Category' :
                           selectedFilterColumn === 'supplier' ? 'Supplier' :
                           selectedFilterColumn === 'stock_level' ? 'Stock Level' : ''}
                        </label>
                        {selectedFilterColumn === 'category' ? (
                          <Select
                            value={filterValue}
                            onValueChange={setFilterValue}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                            <SelectContent>
            {getCategories().map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
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
                const columnLabels: Record<string, string> = {
                  name: 'Material',
                  unit: 'Unit',
                  price_per_unit: 'Price/Unit',
                  price: 'Investment',
                  supplier: 'Supplier',
                  supplier_link: 'Link',
                  stock_level: 'Stock Level',
                  reorder_point: 'Reorder Point',
                  last_purchased_date: 'Last Purchased',
                  category: 'Category',
                };
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
                          {columnLabels[columnId] || columnId}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
            </>
          )}
          <Button onClick={() => setIsAddDialogOpen(true)}>
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
                             columnId === 'category' ? 'Category' :
                             columnId === 'supplier' ? 'Supplier' :
                             columnId === 'stock_level' ? 'Stock Level' : columnId;
            
            // Handle both old format (string) and new format (object with operator and value)
            const filterData = typeof filter.value === 'object' && filter.value !== null 
              ? filter.value as { operator: string; value: string }
              : { operator: columnId === 'category' || columnId === 'stock_level' ? 'equals' : 'contains', value: filter.value as string };
            
            const operatorLabels: Record<string, string> = {
              contains: 'contains',
              equals: 'equals',
              notContains: 'not contains',
              startsWith: 'starts with',
              endsWith: 'ends with',
            };
            
            const operatorLabel = operatorLabels[filterData.operator] || filterData.operator;
            const displayValue = filterData.value;
            
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

      {/* Materials Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No materials yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first material
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
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
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-0 relative">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit/Add Material Side Pane */}
      <EditMaterialDialog
        material={editingMaterial}
        open={editingMaterial !== null || isAddDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMaterial(null);
            setIsAddDialogOpen(false);
          }
        }}
        onSuccess={() => {
          setEditingMaterial(null);
          setIsAddDialogOpen(false);
          fetchMaterials();
        }}
        existingCategories={getCategories()}
      />

      {/* Add Stock Dialog */}
      <Dialog open={addStockMaterial !== null} onOpenChange={(open) => {
        if (!open) {
          setAddStockMaterial(null);
          setAddStockQuantity('');
          setAddStockPrice('');
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="sr-only">Add Stock</DialogTitle>
            <DialogDescription className="text-base text-foreground">
              Add stock for <span className="font-semibold">{addStockMaterial?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-quantity">Quantity to Add *</Label>
              <Input
                id="add-quantity"
                type="number"
                min="1"
                placeholder="Enter quantity..."
                value={addStockQuantity}
                onChange={(e) => setAddStockQuantity(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {addStockQuantity && Number(addStockQuantity) > 0 ? (
                  <>
                    Stock: {Math.round(Number(addStockMaterial?.stock_level || 0))} → <span className="font-medium text-green-600">{Math.round(Number(addStockMaterial?.stock_level || 0) + Number(addStockQuantity))}</span>
                  </>
                ) : (
                  <>Current stock: {Math.round(Number(addStockMaterial?.stock_level || 0))}</>
                )}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-price">Price per Unit ({settings.currency})</Label>
              <Input
                id="add-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave empty to keep current price"
                value={addStockPrice}
                onChange={(e) => setAddStockPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Current price: {formatCurrency(Number(addStockMaterial?.price_per_unit || 0), settings.currency)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAddStockMaterial(null);
                setAddStockQuantity('');
                setAddStockPrice('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddStock}
              disabled={isAddingStock || !addStockQuantity || Number(addStockQuantity) <= 0}
            >
              {isAddingStock ? 'Adding...' : 'Add Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmMaterial !== null} onOpenChange={(open) => {
        if (!open) setDeleteConfirmMaterial(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Material</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteConfirmMaterial?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmMaterial(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
