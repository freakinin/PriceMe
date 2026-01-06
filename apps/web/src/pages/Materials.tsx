import { useState, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, ExternalLink, Package, Eye, Info } from 'lucide-react';
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
  const [editValue, setEditValue] = useState<string>(value?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
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
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    supplier: false,
    supplier_link: false,
  });
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      await api.delete(`/materials/${id}`);
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Material deleted successfully',
      });
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

  const getCategories = () => {
    const categories = new Set<string>();
    materials.forEach(m => {
      if (m.category) categories.add(m.category);
    });
    return Array.from(categories).sort();
  };

  const isLowStock = (material: Material) => {
    return material.stock_level <= material.reorder_point;
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
  const units = useMemo(() => {
    return settings.units && settings.units.length > 0
      ? settings.units
      : ['ml', 'L', 'fl oz', 'pt', 'qt', 'gal', 'g', 'kg', 'oz', 'lb', 'mm', 'cm', 'm', 'in', 'ft', 'yd', 'm²', 'ft²', 'pcs', 'piece', 'unit', 'set', 'pack', 'box', 'roll', 'sheet', 'yard'];
  }, [settings.units]);

  // Filter materials based on category and low stock
  const filteredMaterials = useMemo(() => {
    let filtered = materials;

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }

    // Apply low stock filter
    if (lowStockFilter) {
      filtered = filtered.filter(m => isLowStock(m));
    }

    return filtered;
  }, [materials, categoryFilter, lowStockFilter]);

  // Column definitions with inline editing
  const columns = useMemo<ColumnDef<Material>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-3"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Name
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
        accessorKey: 'price_per_unit',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-3"
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
          return (
            <EditableCell
              value={material.price_per_unit}
              onSave={async (value) => {
                const newPricePerUnit = value as number;
                const newPrice = newPricePerUnit * material.quantity;
                await updateMaterial(material.id, {
                  price_per_unit: newPricePerUnit,
                  price: newPrice,
                });
              }}
              type="number"
              formatDisplay={(val) => formatCurrency(val as number, settings.currency)}
            />
          );
        },
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        cell: ({ row }) => {
          const material = row.original;
          return (
            <EditableCell
              value={material.quantity}
              onSave={async (value) => {
                const newQuantity = value as number;
                const newPrice = material.price_per_unit * newQuantity;
                await updateMaterial(material.id, {
                  quantity: newQuantity,
                  price: newPrice,
                });
              }}
              type="number"
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
              options={units}
            />
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
              className="h-8 -ml-3"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Total Price
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
        accessorKey: 'details',
        header: 'Details',
        cell: ({ row }) => {
          const material = row.original;
          return (
            <EditableCell
              value={material.details}
              onSave={async (value) => {
                await updateMaterial(material.id, { details: value as string });
              }}
              type="text"
              className="max-w-[200px]"
            />
          );
        },
      },
      {
        accessorKey: 'supplier',
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
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-3"
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
          return (
            <EditableCell
              value={stockLevel}
              onSave={async (value) => {
                await updateMaterial(material.id, { stock_level: value as number });
              }}
              type="number"
              formatDisplay={() => (
                <Badge variant={isLowStock(material) ? 'destructive' : 'default'}>
                  {stockLevel}
                </Badge>
              )}
            />
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
        header: 'Last Purchased',
        cell: ({ row }) => {
          const material = row.original;
          return (
            <div className="text-sm">
              <div>{formatDate(material.last_purchased_date)}</div>
              {material.last_purchased_price && (
                <div className="text-muted-foreground">
                  {formatCurrency(material.last_purchased_price, settings.currency)}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => {
          const material = row.original;
          return (
            <EditableCell
              value={material.category}
              onSave={async (value) => {
                await updateMaterial(material.id, { category: value as string });
              }}
              type="text"
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
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingMaterial(material)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(material.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        },
      },
    ],
    [settings.currency, units, materials]
  );

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
        <div>
          <h1 className="text-2xl font-semibold mb-2">Materials</h1>
          <p className="text-muted-foreground">Manage your material inventory</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {getCategories().map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={lowStockFilter ? 'default' : 'outline'}
          onClick={() => setLowStockFilter(!lowStockFilter)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Low Stock
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                const columnLabels: Record<string, string> = {
                  name: 'Name',
                  price: 'Price',
                  quantity: 'Quantity',
                  unit: 'Unit',
                  price_per_unit: 'Price/Unit',
                  details: 'Details',
                  supplier: 'Supplier',
                  supplier_link: 'Link',
                  stock_level: 'Stock Level',
                  reorder_point: 'Reorder Point',
                  last_purchased_date: 'Last Purchased',
                  category: 'Category',
                };
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {columnLabels[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
    </div>
  );
}
