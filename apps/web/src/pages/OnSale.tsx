import { useEffect, useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, DollarSign, TrendingUp, Package, ShoppingCart, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/utils/currency';
import { EditableCell } from '@/components/EditableCell';
import { useProducts, type Product } from '@/hooks/useProducts';

export default function OnSale() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const { products: allProducts, isLoading: loading, updateProduct } = useProducts();

  // Filter only products with status 'on_sale'
  const products = useMemo(() => {
    return allProducts.filter(p => p.status === 'on_sale');
  }, [allProducts]);

  const [qtySold, setQtySold] = useState<Record<number, number>>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  // true = use total investment (Made × Cost), false = use COGS (Sold × Cost)
  const [useFullInvestment, setUseFullInvestment] = useState(true);

  // Initialize qty_sold from local storage
  useEffect(() => {
    if (products.length > 0) {
      const savedQtySold: Record<number, number> = {};
      products.forEach((p) => {
        const saved = localStorage.getItem(`qty_sold_${p.id}`);
        if (saved) savedQtySold[p.id] = parseInt(saved, 10);
      });
      setQtySold(prev => ({ ...prev, ...savedQtySold }));
    }
  }, [products]);

  const handleSaveField = async (productId: number, field: string, value: string | number) => {
    if (field === 'qty_sold') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      setQtySold(prev => ({ ...prev, [productId]: numValue as number }));
      localStorage.setItem(`qty_sold_${productId}`, String(numValue));
      return;
    }

    if (field === 'batch_size') {
      try {
        const batchValue = Math.round(Number(value));
        await updateProduct({ id: productId, data: { batch_size: batchValue } });
        toast({
          variant: 'success',
          title: 'Updated',
          description: 'Batch size updated successfully',
        });
      } catch (error: any) {
        console.error('Error updating batch size:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to update batch size',
        });
        throw error;
      }
    }
  };

  const formatCurrencyValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return formatCurrency(value, settings.currency);
  };

  const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return `${value.toFixed(1)}%`;
  };

  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      accessorKey: 'name',
      size: 300,
      minSize: 300,
      maxSize: 300,
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
        const product = row.original;
        return (
          <div className="font-medium py-1">{product.name}</div>
        );
      },
    },
    {
      id: 'price',
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
            Price
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
      accessorFn: (row) => row.target_price ?? 0,
      cell: ({ row }) => {
        const product = row.original;
        return <div className="py-1">{formatCurrencyValue(product.target_price)}</div>;
      },
    },
    {
      id: 'qty_sold',
      size: 100,
      minSize: 80,
      maxSize: 150,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-1 px-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Sold
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
      accessorFn: (row) => qtySold[row.id] || 0,
      cell: ({ row }) => {
        const product = row.original;
        const currentQtySold = qtySold[product.id] || 0;
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
      accessorKey: 'batch_size',
      size: 110,
      minSize: 90,
      maxSize: 150,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-1 px-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Made
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
        const product = row.original;
        return (
          <EditableCell
            value={product.batch_size}
            onSave={async (value) => handleSaveField(product.id, 'batch_size', value)}
            type="number"
          />
        );
      },
    },
    {
      id: 'stock',
      size: 100,
      minSize: 80,
      maxSize: 150,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-1 px-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Stock
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
        const qtySoldValue = qtySold[row.id] || 0;
        const batchSize = row.batch_size || 0;
        return batchSize - qtySoldValue;
      },
      cell: ({ row }) => {
        const product = row.original;
        const qtySoldValue = qtySold[product.id] || 0;
        const batchSize = product.batch_size || 0;
        const stock = batchSize - qtySoldValue;
        return (
          <div className="py-1">
            <span className={stock >= 0 ? '' : 'text-red-600'}>
              {stock}
            </span>
          </div>
        );
      },
    },
    {
      id: 'investment',
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
      accessorFn: (row) => {
        // Investment = Made × Cost Per Product (total spent to produce)
        const madeQty = row.batch_size || 0;
        const productCost = typeof row.product_cost === 'number' ? row.product_cost : 0;
        return madeQty * productCost;
      },
      cell: ({ row }) => {
        const product = row.original;
        const madeQty = product.batch_size || 0;
        const productCost = typeof product.product_cost === 'number' ? product.product_cost : 0;
        const investment = madeQty * productCost;
        return <div className="py-1">{formatCurrencyValue(investment)}</div>;
      },
    },
    {
      id: 'revenue',
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
            Revenue
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
        const qtySoldValue = qtySold[row.id] || 0;
        const price = row.target_price ?? 0;
        return qtySoldValue * price;
      },
      cell: ({ row }) => {
        const product = row.original;
        const qtySoldValue = qtySold[product.id] || 0;
        const price = product.target_price ?? 0;
        const revenue = qtySoldValue * price;
        return (
          <div className="py-1">
            <span className="font-medium">{formatCurrencyValue(revenue)}</span>
          </div>
        );
      },
    },
    {
      id: 'profit',
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
        const qtySoldValue = qtySold[row.id] || 0;
        const madeQty = row.batch_size || 0;
        const price = row.target_price ?? 0;
        const productCost = typeof row.product_cost === 'number' ? row.product_cost : 0;
        const revenue = qtySoldValue * price;
        // Use total investment or COGS based on toggle
        const cost = useFullInvestment ? (madeQty * productCost) : (qtySoldValue * productCost);
        return revenue - cost;
      },
      cell: ({ row }) => {
        const product = row.original;
        const qtySoldValue = qtySold[product.id] || 0;
        const madeQty = product.batch_size || 0;
        const price = product.target_price ?? 0;
        const productCost = typeof product.product_cost === 'number' ? product.product_cost : 0;
        const revenue = qtySoldValue * price;
        // Use total investment or COGS based on toggle
        const cost = useFullInvestment ? (madeQty * productCost) : (qtySoldValue * productCost);
        const profit = revenue - cost;
        return (
          <div className="py-1">
            <span className={profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {formatCurrencyValue(profit)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'profit_margin',
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
            Margin
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
        const qtySoldValue = qtySold[row.id] || 0;
        const madeQty = row.batch_size || 0;
        const price = row.target_price ?? 0;
        const productCost = typeof row.product_cost === 'number' ? row.product_cost : 0;
        const revenue = qtySoldValue * price;
        const cost = useFullInvestment ? (madeQty * productCost) : (qtySoldValue * productCost);
        const profit = revenue - cost;
        if (revenue > 0) {
          return (profit / revenue) * 100;
        }
        return 0;
      },
      cell: ({ row }) => {
        const product = row.original;
        const qtySoldValue = qtySold[product.id] || 0;
        const madeQty = product.batch_size || 0;
        const price = product.target_price ?? 0;
        const productCost = typeof product.product_cost === 'number' ? product.product_cost : 0;
        const revenue = qtySoldValue * price;
        const cost = useFullInvestment ? (madeQty * productCost) : (qtySoldValue * productCost);
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        return (
          <div className="py-1">
            {qtySoldValue > 0 && price > 0 ? (
              <span className={margin >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {formatPercentage(margin)}
              </span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
  ], [qtySold, settings.currency, useFullInvestment]);

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue) return true;
      const searchValue = filterValue.toLowerCase();
      const product = row.original;
      const nameMatch = product.name?.toLowerCase().includes(searchValue) || false;
      const skuMatch = product.sku?.toLowerCase().includes(searchValue) || false;
      return nameMatch || skuMatch;
    },
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      globalFilter,
    },
  });

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalRevenue = products.reduce((sum, product) => {
      const qtySoldValue = qtySold[product.id] || 0;
      const price = product.target_price ?? 0;
      return sum + (qtySoldValue * price);
    }, 0);

    // Total Investment = sum of (Made × Cost Per Product)
    const totalInvestment = products.reduce((sum, product) => {
      const madeQty = product.batch_size || 0;
      const productCost = typeof product.product_cost === 'number' ? product.product_cost : 0;
      return sum + (madeQty * productCost);
    }, 0);

    // COGS = sum of (Sold × Cost Per Product)
    const totalCOGS = products.reduce((sum, product) => {
      const qtySoldValue = qtySold[product.id] || 0;
      const productCost = typeof product.product_cost === 'number' ? product.product_cost : 0;
      return sum + (qtySoldValue * productCost);
    }, 0);

    // Use Investment or COGS based on toggle
    const totalCost = useFullInvestment ? totalInvestment : totalCOGS;
    const totalProfit = totalRevenue - totalCost;

    const totalSold = products.reduce((sum, product) => {
      return sum + (qtySold[product.id] || 0);
    }, 0);

    const totalMade = products.reduce((sum, product) => {
      return sum + (product.batch_size || 0);
    }, 0);

    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalInvestment,
      totalCost,
      totalProfit,
      totalSold,
      totalMade,
      averageMargin,
    };
  }, [products, qtySold, useFullInvestment]);

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

  return (
    <div className="p-6">
      {products.length > 0 && (
        <>
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrencyValue(analytics.totalRevenue)}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Total Profit</p>
                    <p className={`text-2xl font-bold mt-1 ${analytics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrencyValue(analytics.totalProfit)}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${analytics.totalProfit >= 0
                      ? 'bg-blue-100 dark:bg-blue-900/20'
                      : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                    <TrendingUp className={`h-6 w-6 ${analytics.totalProfit >= 0
                        ? 'text-blue-600 dark:text-blue-400'
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
                    <p className="text-sm font-medium text-muted-foreground">Products Sold</p>
                    <p className="text-2xl font-bold mt-1">{analytics.totalSold}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Avg Margin: {formatPercentage(analytics.averageMargin)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Investment</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrencyValue(analytics.totalInvestment)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.totalMade} items made
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Toggle */}
          <div className="mb-4 flex items-center justify-between">
            <div className="relative w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Profit Calculation Mode Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUseFullInvestment(!useFullInvestment)}
                    className="flex items-center gap-2 h-10"
                  >
                    {useFullInvestment ? (
                      <ToggleRight className="h-4 w-4 text-primary" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">
                      {useFullInvestment ? 'Real Profit' : 'Sold Profit'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px]">
                  <p className="text-sm">
                    {useFullInvestment
                      ? 'Real Profit: Revenue minus total investment (all items made)'
                      : 'Sold Profit: Revenue minus cost of sold items only'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </>
      )}
      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products on sale</h3>
          <p className="text-muted-foreground">
            Products with status "On Sale" will appear here
          </p>
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
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 relative overflow-hidden"
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
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
