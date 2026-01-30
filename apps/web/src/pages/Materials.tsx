
import { useState, useEffect, useMemo } from 'react';

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
import { useToast } from '@/components/ui/use-toast';
import EditMaterialDialog from '@/components/EditMaterialDialog';
import { useMaterials, type Material } from '@/hooks/useMaterials';
import { EditableCell } from '@/components/EditableCell';



export default function Materials() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const { setOpen: setSidebarOpen } = useSidebar();

  // Use custom hook for materials
  const { materials, isLoading: loading, updateMaterial: updateMaterialMutation, deleteMaterial: deleteMaterialMutation } = useMaterials();

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
  }, []);

  const updateMaterial = async (id: number, updates: Partial<Material>) => {
    try {
      await updateMaterialMutation({ id, data: updates });
      toast({
        variant: 'success',
        title: 'Updated',
        description: 'Material updated successfully',
      });
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
      await deleteMaterialMutation(deleteConfirmMaterial.id);
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Material deleted successfully',
      });
      setDeleteConfirmMaterial(null);
    } catch (error: any) {
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
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid quantity' });
      return;
    }

    setIsAddingStock(true);
    try {
      const currentQuantity = Number(addStockMaterial.quantity) || 0;
      const currentStock = Number(addStockMaterial.stock_level) || 0;
      const newQuantity = currentQuantity + quantityToAdd;
      const newStock = currentStock + quantityToAdd;

      const updateData: Partial<Material> = {
        quantity: newQuantity,
        stock_level: newStock,
        last_purchased_date: new Date().toISOString().split('T')[0],
      };

      const existingPricePerUnit = Number(addStockMaterial.price_per_unit) || 0;
      const existingTotalCost = Number(addStockMaterial.price) || 0;

      if (newPricePerUnit > 0 && newPricePerUnit !== existingPricePerUnit) {
        const newPurchaseCost = quantityToAdd * newPricePerUnit;
        const newTotalInvestment = existingTotalCost + newPurchaseCost;
        updateData.price_per_unit = newPricePerUnit;
        updateData.price = newTotalInvestment;
        updateData.last_purchased_price = newPricePerUnit;
        updateData.last_purchased_quantity = quantityToAdd;
      } else {
        const priceToUse = newPricePerUnit > 0 ? newPricePerUnit : existingPricePerUnit;
        const newPurchaseCost = quantityToAdd * priceToUse;
        updateData.price = existingTotalCost + newPurchaseCost;
        updateData.last_purchased_price = priceToUse;
        updateData.last_purchased_quantity = quantityToAdd;
      }

      await updateMaterial(addStockMaterial.id, updateData);

      setAddStockMaterial(null);
      setAddStockQuantity('');
      setAddStockPrice('');
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
    if (stockLevel <= reorderPoint) return 'destructive';
    const ratio = reorderPoint > 0 ? stockLevel / reorderPoint : Infinity;
    if (ratio < 2) return 'secondary';
    return 'default';
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
              {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-3 w-3" /> : <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />}
            </Button>
          );
        },
        cell: ({ row }) => (
          <EditableCell
            value={row.original.name}
            onSave={async (value) => updateMaterial(row.original.id, { name: value as string })}
            type="text"
          />
        ),
      },
      {
        accessorKey: 'unit',
        header: 'Unit',
        cell: ({ row }) => (
          <EditableCell
            value={row.original.unit}
            onSave={async (value) => updateMaterial(row.original.id, { unit: value as string })}
            type="select"
            options={availableUnits}
          />
        ),
      },
      {
        accessorKey: 'price_per_unit',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Price/Unit
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-3 w-3" /> : <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />}
          </Button>
        ),
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
                  await updateMaterial(material.id, { price_per_unit: newPricePerUnit, price: newPrice });
                }}
                type="number"
                formatDisplay={(val) => formatCurrency(Number(val) || 0, settings.currency)}
              />
              {avgCost !== lastPrice && avgCost > 0 && <div className="text-xs text-muted-foreground mt-0.5">Avg: {formatCurrency(avgCost, settings.currency)}</div>}
            </div>
          );
        },
      },
      {
        accessorKey: 'price',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Investment
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-3 w-3" /> : <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />}
          </Button>
        ),
        cell: ({ row }) => <div className="text-sm px-2 py-1">{formatCurrency(row.original.price, settings.currency)}</div>,
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
        cell: ({ row }) => (
          <EditableCell
            value={row.original.supplier}
            onSave={async (value) => updateMaterial(row.original.id, { supplier: value as string })}
            type="text"
          />
        ),
      },
      {
        accessorKey: 'supplier_link',
        header: 'Link',
        cell: ({ row }) => {
          const link = row.getValue('supplier_link') as string | undefined;
          return link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">Link <ExternalLink className="h-3 w-3" /></a>
          ) : '-';
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
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Stock Level
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-3 w-3" /> : <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />}
          </Button>
        ),
        cell: ({ row }) => {
          const material = row.original;
          const variant = getStockBadgeVariant(material);
          const formattedStock = Number.isInteger(Number(material.stock_level)) ? Number(material.stock_level).toString() : parseFloat(Number(material.stock_level).toFixed(2)).toString();
          const badgeClassName = variant === 'destructive' ? 'bg-red-500 text-white' : variant === 'secondary' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white';

          return <Badge variant={variant} className={badgeClassName}>{formattedStock}</Badge>;
        },
      },
      {
        accessorKey: 'reorder_point',
        header: () => <div className="flex items-center gap-1.5"><span>Reorder Point</span><TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="max-w-xs"><p>The minimum stock level at which you should reorder this material. When stock level drops to or below this point, the material will be flagged as "Low Stock".</p></TooltipContent></Tooltip></TooltipProvider></div>,
        cell: ({ row }) => (
          <EditableCell
            value={row.original.reorder_point}
            onSave={async (value) => updateMaterial(row.original.id, { reorder_point: value as number })}
            type="number"
          />
        ),
      },
      {
        accessorKey: 'last_purchased_date',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Last Purchased
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-3 w-3" /> : <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />}
          </Button>
        ),
        cell: ({ row }) => {
          const material = row.original;
          const lastTotal = (Number(material.last_purchased_quantity) || 0) * (Number(material.last_purchased_price) || 0);
          return (
            <div className="text-sm">
              <div>{formatDate(material.last_purchased_date)}</div>
              {lastTotal > 0 && <div className="text-xs text-muted-foreground">{formatCurrency(lastTotal, settings.currency)}</div>}
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
        cell: ({ row }) => (
          <EditableCell
            value={row.original.category}
            onSave={async (value) => updateMaterial(row.original.id, { category: value as string })}
            type="select"
            options={getCategories()}
            formatDisplay={(val) => val ? <Badge variant="outline">{val as string}</Badge> : '-'}
          />
        ),
      },
      {
        id: 'actions',
        enableHiding: false,
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const material = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setEditingMaterial(material)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Edit material</p></TooltipContent></Tooltip></TooltipProvider>
              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => { setAddStockMaterial(material); const price = Number(material.price_per_unit) || 0; setAddStockPrice(price % 1 === 0 ? price.toString() : parseFloat(price.toFixed(2)).toString()); }}><PackagePlus className="h-4 w-4 text-green-600" /></Button></TooltipTrigger><TooltipContent><p>Add stock / Restock</p></TooltipContent></Tooltip></TooltipProvider>
              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleDelete(material)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TooltipTrigger><TooltipContent><p>Delete material</p></TooltipContent></Tooltip></TooltipProvider>
            </div>
          );
        },
      },
    ],
    [settings.currency, availableUnits, materials]
  );

  const filteredMaterials = useMemo(() => {
    if (!showOutOfStockOnly) return materials;
    return materials.filter(m => (Number(m.stock_level) || 0) <= (Number(m.reorder_point) || 0));
  }, [materials, showOutOfStockOnly]);

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
      return !!(material.name.toLowerCase().includes(searchValue) || (material.supplier && material.supplier.toLowerCase().includes(searchValue)) || (material.category && material.category.toLowerCase().includes(searchValue)) || (material.details && material.details.toLowerCase().includes(searchValue)));
    },
    state: { sorting, columnFilters, columnVisibility, globalFilter },
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div></div>
        <div className="flex items-center gap-3">
          {materials.length > 0 && (
            <>
              <div className="relative w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or supplier..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9 h-10" />
              </div>
              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant={showOutOfStockOnly ? "default" : "outline"} size="icon" onClick={() => setShowOutOfStockOnly(!showOutOfStockOnly)} className={showOutOfStockOnly ? "bg-red-500 hover:bg-red-600" : ""}><AlertTriangle className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>{showOutOfStockOnly ? "Showing out of stock only" : "Show out of stock only"}</p></TooltipContent></Tooltip></TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px]">
                  <DropdownMenuLabel>Add Filter</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Column</label>
                      <Select value={selectedFilterColumn} onValueChange={(value) => { setSelectedFilterColumn(value); setFilterValue(''); setFilterOperator(value === 'category' || value === 'stock_level' ? 'equals' : 'contains'); }}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Select column..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                          <SelectItem value="supplier">Supplier</SelectItem>
                          <SelectItem value="stock_level">Stock Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedFilterColumn && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Operator</label>
                        <Select value={filterOperator} onValueChange={setFilterOperator}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {selectedFilterColumn === 'category' || selectedFilterColumn === 'stock_level' ? (
                              <><SelectItem value="equals">Equals</SelectItem><SelectItem value="notContains">Not Equals</SelectItem></>
                            ) : (
                              <><SelectItem value="contains">Contains</SelectItem><SelectItem value="equals">Equals</SelectItem><SelectItem value="notContains">Not Contains</SelectItem><SelectItem value="startsWith">Starts With</SelectItem><SelectItem value="endsWith">Ends With</SelectItem></>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {selectedFilterColumn && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">{selectedFilterColumn === 'name' ? 'Name' : selectedFilterColumn === 'category' ? 'Category' : selectedFilterColumn === 'supplier' ? 'Supplier' : selectedFilterColumn === 'stock_level' ? 'Stock Level' : ''}</label>
                        {selectedFilterColumn === 'category' ? (
                          <Select value={filterValue} onValueChange={setFilterValue}><SelectTrigger className="h-8"><SelectValue placeholder="Select category..." /></SelectTrigger><SelectContent>{getCategories().map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select>
                        ) : (
                          <Input placeholder={`Filter by ${selectedFilterColumn}...`} value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="h-8" onKeyDown={(e) => { if (e.key === 'Enter' && filterValue) { table.getColumn(selectedFilterColumn)?.setFilterValue({ operator: filterOperator, value: filterValue }); setSelectedFilterColumn(''); setFilterValue(''); setFilterOperator('contains'); } }} />
                        )}
                      </div>
                    )}
                    {selectedFilterColumn && filterValue && <Button size="sm" className="w-full" onClick={() => { table.getColumn(selectedFilterColumn)?.setFilterValue({ operator: filterOperator, value: filterValue }); setSelectedFilterColumn(''); setFilterValue(''); setFilterOperator('contains'); }}>Apply Filter</Button>}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><Columns className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[250px]">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table.getAllColumns().filter((column) => column.getCanHide && column.getCanHide()).map((column) => <DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible ? column.getIsVisible() : true} onSelect={(e) => e.preventDefault()} onCheckedChange={(value) => { if (column.toggleVisibility) column.toggleVisibility(!!value); }}>{column.id === 'supplier_link' ? 'Link' : column.id === 'price_per_unit' ? 'Price/Unit' : column.id === 'price' ? 'Investment' : column.id === 'stock_level' ? 'Stock Level' : column.id === 'reorder_point' ? 'Reorder Point' : column.id === 'last_purchased_date' ? 'Last Purchased' : column.id}</DropdownMenuCheckboxItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button onClick={() => setIsAddDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> New</Button>
        </div>
      </div>

      {table.getState().columnFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {table.getState().columnFilters.map((filter) => {
            const columnId = filter.id;
            const filterData = typeof filter.value === 'object' && filter.value !== null ? filter.value as { operator: string; value: string } : { operator: columnId === 'category' || columnId === 'stock_level' ? 'equals' : 'contains', value: filter.value as string };
            return <Badge key={filter.id} variant="secondary" className="flex items-center gap-1 px-2 py-1"><span className="text-xs font-medium">{columnId} {filterData.operator} {filterData.value}</span><button onClick={() => table.getColumn(columnId)?.setFilterValue('')} className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"><X className="h-3 w-3" /></button></Badge>;
          })}
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { table.resetColumnFilters(); setSelectedFilterColumn(''); setFilterValue(''); setFilterOperator('contains'); }}>Clear all</Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : materials.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center"><Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">No materials yet</h3><p className="text-muted-foreground mb-4">Get started by adding your first material</p><Button onClick={() => setIsAddDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Material</Button></div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id} className="p-0 relative">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)
              ) : (
                <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <EditMaterialDialog material={editingMaterial} open={editingMaterial !== null || isAddDialogOpen} onOpenChange={(open) => { if (!open) { setEditingMaterial(null); setIsAddDialogOpen(false); } }} onSuccess={() => { setEditingMaterial(null); setIsAddDialogOpen(false); }} existingCategories={getCategories()} />

      <Dialog open={addStockMaterial !== null} onOpenChange={(open) => { if (!open) { setAddStockMaterial(null); setAddStockQuantity(''); setAddStockPrice(''); } }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle className="sr-only">Add Stock</DialogTitle><DialogDescription className="text-base text-foreground">Add stock for <span className="font-semibold">{addStockMaterial?.name}</span></DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-quantity">Quantity to Add *</Label>
              <Input id="add-quantity" type="number" min="1" placeholder="Enter quantity..." value={addStockQuantity} onChange={(e) => setAddStockQuantity(e.target.value)} autoFocus />
              <p className="text-xs text-muted-foreground">{addStockQuantity && Number(addStockQuantity) > 0 ? <>Stock: {Math.round(Number(addStockMaterial?.stock_level || 0))} → <span className="font-medium text-green-600">{Math.round(Number(addStockMaterial?.stock_level || 0) + Number(addStockQuantity))}</span></> : <>Current stock: {Math.round(Number(addStockMaterial?.stock_level || 0))}</>}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-price">Price per Unit ({settings.currency})</Label>
              <Input id="add-price" type="number" step="0.01" min="0" placeholder="Leave empty to keep current price" value={addStockPrice} onChange={(e) => setAddStockPrice(e.target.value)} />
              <p className="text-xs text-muted-foreground">Current price: {formatCurrency(Number(addStockMaterial?.price_per_unit || 0), settings.currency)}</p>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setAddStockMaterial(null); setAddStockQuantity(''); setAddStockPrice(''); }}>Cancel</Button><Button onClick={handleAddStock} disabled={isAddingStock || !addStockQuantity || Number(addStockQuantity) <= 0}>{isAddingStock ? 'Adding...' : 'Add Stock'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmMaterial !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmMaterial(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Material</DialogTitle><DialogDescription>Are you sure you want to delete <strong>{deleteConfirmMaterial?.name}</strong>? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0"><Button variant="outline" onClick={() => setDeleteConfirmMaterial(null)}>Cancel</Button><Button variant="destructive" onClick={confirmDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
