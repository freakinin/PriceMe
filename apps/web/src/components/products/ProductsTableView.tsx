import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
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
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { EditableCell } from '@/components/EditableCell';
import { CategorySelect } from '@/components/CategorySelect';
import { type Product, type ProductStatus } from '@/hooks/useProducts';
import { type ProductsPageState } from '@/hooks/useProductsPageState';
import { FeeBreakdownTooltip } from '@/components/products/FeeBreakdownTooltip';

type Props = Pick<ProductsPageState,
  | 'filteredProducts'
  | 'products'
  | 'productPricingMethods'
  | 'productPricingValues'
  | 'productCategoryIds'
  | 'setProductCategoryIds'
  | 'globalPricingMethod'
  | 'categories'
  | 'handleSaveField'
  | 'handleSavePricingValue'
  | 'handleDeleteClick'
  | 'setEditingProductId'
  | 'updatingProductId'
  | 'updatingCategoryProductId'
  | 'setUpdatingCategoryProductId'
  | 'handleVariationsOpen'
  | 'updateProduct'
  | 'formatCurrencyValue'
  | 'formatPercentage'
  | 'getCalculatedMetrics'
  | 'clearAllFilters'
  | 'getFeeAwareMetrics'
> & {
  onSelectionChange: (ids: number[]) => void;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (id: string, visible: boolean) => void;
  feeAwareMode?: boolean;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' },
  in_progress: { label: 'In Progress', className: 'bg-[#F89C75] text-white border-transparent hover:bg-[#F89C75]/90' },
  on_sale: { label: 'On Sale', className: 'bg-[#11743B] text-white border-transparent hover:bg-[#11743B]/90' },
  inactive: { label: 'Inactive', className: 'bg-[#B03E52] text-white border-transparent hover:bg-[#B03E52]/90' },
};

export function ProductsTableView({
  filteredProducts,
  products,
  productPricingMethods,
  productPricingValues,
  productCategoryIds,
  setProductCategoryIds,
  globalPricingMethod,
  categories,
  handleSaveField,
  handleSavePricingValue,
  handleDeleteClick,
  setEditingProductId,
  updatingProductId,
  updatingCategoryProductId,
  setUpdatingCategoryProductId,
  handleVariationsOpen,
  updateProduct,
  formatCurrencyValue,
  formatPercentage,
  getCalculatedMetrics,
  getFeeAwareMetrics,
  clearAllFilters,
  onSelectionChange,
  columnVisibility,
  onColumnVisibilityChange,
  feeAwareMode = false,
}: Props) {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Sync row selection to parent
  useEffect(() => {
    const ids = table.getSelectedRowModel().flatRows.map(row => row.original.id);
    onSelectionChange(ids);
  }, [rowSelection]);

  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40, minSize: 40, maxSize: 40,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      size: 300, minSize: 300, maxSize: 300,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-1 group w-full">
            <EditableCell
              value={product.name}
              onSave={async value => handleSaveField(product.id, 'name', value)}
              type="text"
              className="font-medium flex-1 min-w-0"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-foreground"
              onClick={e => { e.stopPropagation(); setEditingProductId(product.id); }}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
    {
      id: 'category',
      accessorFn: row => categories.find(c => c.id === row.category_id)?.name || row.category || '',
      header: 'Category',
      size: 140, minSize: 120, maxSize: 200,
      cell: ({ row }) => {
        const id = row.original.id;
        const currentCategoryId = productCategoryIds[id] !== undefined ? productCategoryIds[id] : row.original.category_id;
        return (
          <CategorySelect
            value={currentCategoryId}
            isLoading={updatingCategoryProductId === id}
            onChange={async newId => {
              try {
                setProductCategoryIds(prev => ({ ...prev, [id]: newId }));
                setUpdatingCategoryProductId(id);
                await updateProduct({ id, data: { category_id: newId } });
              } finally {
                setUpdatingCategoryProductId(null);
              }
            }}
            className="h-8 w-full justify-start border-none px-2 hover:bg-muted/50 font-normal"
            placeholder="-"
          />
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 140, minSize: 140, maxSize: 140,
      cell: ({ row }) => {
        const product = row.original;
        const currentStatus = (product.status || 'draft') as ProductStatus;
        const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.draft;
        return (
          <Select value={currentStatus} onValueChange={async value => await handleSaveField(product.id, 'status', value)}>
            <SelectTrigger className="h-8 border-none shadow-none pl-0 hover:bg-muted/50 w-full justify-start [&>svg]:hidden">
              <Badge variant="outline" className={config.className}>{config.label}</Badge>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key} className="pl-2 [&>span.absolute]:hidden">
                  <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: 'competitor_count',
      header: 'Competitors',
      size: 130, minSize: 120, maxSize: 200,
      cell: ({ row }) => {
        const product = row.original;
        const count = Number(product.competitor_count || 0);
        if (count === 0) {
          return (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-primary px-2"
              onClick={e => { e.stopPropagation(); navigate(`/market-analysis?productId=${product.id}`); }}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          );
        }
        return (
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 font-normal"
            onClick={e => { e.stopPropagation(); navigate(`/market-analysis?productId=${product.id}`); }}>
            {count} {count === 1 ? 'Product' : 'Products'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      size: 150, minSize: 120, maxSize: 200,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <EditableCell
            value={product.sku || ''}
            onSave={async value => handleSaveField(product.id, 'sku', value)}
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
        if (updatingProductId === product.id) {
          return (
            <div className="flex justify-start items-center h-6">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="ml-2 text-[10px] text-muted-foreground italic">Saving...</span>
            </div>
          );
        }
        if (!variants || variants.length === 0) {
          return (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
              onClick={() => handleVariationsOpen(product)}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          );
        }
        return (
          <Badge variant="outline" className="font-normal text-xs whitespace-nowrap cursor-pointer hover:bg-muted"
            onClick={() => handleVariationsOpen(product)}>
            {variants.length} variant{variants.length !== 1 ? 's' : ''}
          </Badge>
        );
      },
    },
    {
      id: 'product_cost',
      size: 120, minSize: 100, maxSize: 200,
      header: ({ column }) => (
        <div className="flex items-center justify-start cursor-pointer hover:text-foreground text-muted-foreground gap-2 w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Cost
          {column.getIsSorted() === 'asc' ? <ArrowUp className="h-3 w-3" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="h-3 w-3" /> :
           <ArrowUpDown className="h-3 w-3 opacity-50" />}
        </div>
      ),
      accessorFn: row => row.product_cost,
      cell: ({ row }) => <div className="text-left font-medium">{formatCurrencyValue(row.original.product_cost)}</div>,
    },
    {
      id: 'markup',
      size: 120, minSize: 100, maxSize: 200,
      header: 'Markup %',
      cell: ({ row }) => {
        const product = row.original;
        const method = productPricingMethods[product.id] || globalPricingMethod || product.pricing_method || 'price';
        const metrics = getCalculatedMetrics(product);
        const pricingValue = productPricingValues[product.id] ?? product.pricing_value ?? 0;
        const markupValue = method === 'markup' ? pricingValue : metrics.markup;
        return (
          <div className={method !== 'markup' ? 'opacity-50 text-left' : 'text-left'}>
            {method === 'markup' ? (
              <EditableCell value={markupValue} onSave={async value => handleSavePricingValue(product.id, 'markup', value as number)}
                type="number" formatDisplay={formatPercentage} className="text-left justify-start" />
            ) : (
              <div className="text-muted-foreground py-1">{formatPercentage(markupValue)}</div>
            )}
          </div>
        );
      },
    },
    {
      id: 'price',
      size: 180, minSize: 150, maxSize: 250,
      header: 'Planned Sales Price $',
      cell: ({ row }) => {
        const product = row.original;
        const method = productPricingMethods[product.id] || globalPricingMethod || product.pricing_method || 'price';
        const metrics = getCalculatedMetrics(product);
        const pricingValue = productPricingValues[product.id] ?? product.pricing_value ?? 0;
        const priceValue = method === 'price' ? pricingValue : metrics.price;
        return (
          <div className={method !== 'price' ? 'opacity-50 text-left' : 'text-left'}>
            {method === 'price' ? (
              <EditableCell value={priceValue} onSave={async value => handleSavePricingValue(product.id, 'price', value as number)}
                type="number" formatDisplay={formatCurrencyValue} className="text-left justify-start font-medium" />
            ) : (
              <div className="text-muted-foreground py-1">{formatCurrencyValue(priceValue)}</div>
            )}
          </div>
        );
      },
    },
    {
      id: 'profit',
      size: 150, minSize: 120, maxSize: 200,
      header: 'Desired Profit $',
      cell: ({ row }) => {
        const product = row.original;
        const method = productPricingMethods[product.id] || globalPricingMethod || product.pricing_method || 'price';
        const metrics = getCalculatedMetrics(product);
        const pricingValue = productPricingValues[product.id] ?? product.pricing_value ?? 0;
        const profitValue = method === 'profit' ? pricingValue : metrics.profit;
        return (
          <div className={method !== 'profit' ? 'opacity-50 text-left' : 'text-left'}>
            {method === 'profit' ? (
              <EditableCell value={profitValue} onSave={async value => handleSavePricingValue(product.id, 'profit', value as number)}
                type="number" formatDisplay={formatCurrencyValue} className="text-left justify-start" />
            ) : (
              <div className="text-muted-foreground py-1">{formatCurrencyValue(profitValue)}</div>
            )}
          </div>
        );
      },
    },
    {
      id: 'margin',
      size: 150, minSize: 120, maxSize: 200,
      header: 'Desired Margin %',
      cell: ({ row }) => {
        const product = row.original;
        const method = productPricingMethods[product.id] || globalPricingMethod || product.pricing_method || 'price';
        const metrics = getCalculatedMetrics(product);
        const pricingValue = productPricingValues[product.id] ?? product.pricing_value ?? 0;
        const marginValue = method === 'margin' ? pricingValue : metrics.margin;
        return (
          <div className={method !== 'margin' ? 'opacity-50 text-left' : 'text-left'}>
            {method === 'margin' ? (
              <EditableCell value={marginValue} onSave={async value => handleSavePricingValue(product.id, 'margin', value as number)}
                type="number" formatDisplay={formatPercentage} className="text-left justify-start" />
            ) : (
              <div className="text-muted-foreground py-1">{formatPercentage(marginValue)}</div>
            )}
          </div>
        );
      },
    },
    {
      id: 'calculated_profit',
      size: 140, minSize: 110, maxSize: 220,
      header: ({ column }) => (
        <div className="flex items-center justify-start cursor-pointer hover:text-foreground text-muted-foreground gap-2 w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {feeAwareMode ? 'Net Profit' : 'Profit'}
          {column.getIsSorted() === 'asc' ? <ArrowUp className="h-3 w-3" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="h-3 w-3" /> :
           <ArrowUpDown className="h-3 w-3 opacity-50" />}
        </div>
      ),
      accessorFn: row => {
        if (feeAwareMode) {
          const fee = getFeeAwareMetrics(row);
          return fee ? fee.netProfitPreTax : getCalculatedMetrics(row).profit;
        }
        return getCalculatedMetrics(row).profit;
      },
      cell: ({ row }) => {
        if (feeAwareMode) {
          const feeMetrics = getFeeAwareMetrics(row.original);
          if (feeMetrics) {
            return (
              <div className="flex items-center gap-1.5">
                <span className={feeMetrics.netProfitPreTax >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrencyValue(feeMetrics.netProfitPreTax)}
                </span>
                <FeeBreakdownTooltip breakdown={feeMetrics} />
              </div>
            );
          }
        }
        const metrics = getCalculatedMetrics(row.original);
        return (
          <span className={metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrencyValue(metrics.profit)}
          </span>
        );
      },
    },
    {
      id: 'calculated_margin',
      size: 150, minSize: 120, maxSize: 220,
      header: ({ column }) => (
        <div className="flex items-center justify-start cursor-pointer hover:text-foreground text-muted-foreground gap-2 w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {feeAwareMode ? 'Net Margin' : 'Profit Margin'}
          {column.getIsSorted() === 'asc' ? <ArrowUp className="h-3 w-3" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="h-3 w-3" /> :
           <ArrowUpDown className="h-3 w-3 opacity-50" />}
        </div>
      ),
      accessorFn: row => {
        if (feeAwareMode) {
          const fee = getFeeAwareMetrics(row);
          return fee ? fee.netMarginPreTax : getCalculatedMetrics(row).margin;
        }
        return getCalculatedMetrics(row).margin;
      },
      cell: ({ row }) => {
        if (feeAwareMode) {
          const feeMetrics = getFeeAwareMetrics(row.original);
          if (feeMetrics) {
            return (
              <span className={feeMetrics.netMarginPreTax >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(feeMetrics.netMarginPreTax)}
              </span>
            );
          }
        }
        const metrics = getCalculatedMetrics(row.original);
        return (
          <span className={metrics.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatPercentage(metrics.margin)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      size: 100, minSize: 80, maxSize: 120,
      enableResizing: false,
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(product.id, product.name)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ], [
    productPricingMethods,
    productPricingValues,
    productCategoryIds,
    globalPricingMethod,
    categories,
    updatingProductId,
    updatingCategoryProductId,
    feeAwareMode,
    getFeeAwareMetrics,
  ]);

  const table = useReactTable({
    data: filteredProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: (updater: any) => {
      const next = typeof updater === 'function' ? updater(columnVisibility) : updater;
      Object.entries(next as Record<string, boolean>).forEach(([id, visible]) => {
        if (columnVisibility[id] !== visible) onColumnVisibilityChange(id, visible);
      });
    },
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnVisibility, rowSelection },
  });

  if (products.length === 0) {
    return null; // Parent handles empty state
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No products match your filters</h3>
        <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
        <Button variant="outline" onClick={clearAllFilters}>Clear Filters</Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#FAFAFA]">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    style={{
                      width: header.getSize(),
                      minWidth: header.column.columnDef.minSize,
                      maxWidth: header.column.columnDef.maxSize,
                    }}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className={`p-2 relative ${cell.column.id === 'status' ? 'overflow-visible whitespace-nowrap' : 'overflow-hidden'}`}
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.columnDef.minSize,
                        maxWidth: cell.column.columnDef.maxSize,
                        boxSizing: 'border-box',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
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
    </>
  );
}
