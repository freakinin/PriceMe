import { Filter, Download, Plus, Search, Table2, LayoutGrid, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { type ProductsPageState } from '@/hooks/useProductsPageState';
import { type PricingMethod } from '@/hooks/useProducts';

const COLUMN_LABELS: Record<string, string> = {
  name: 'Name',
  category: 'Category',
  status: 'Status',
  sku: 'SKU',
  product_cost: 'Cost',
  markup: 'Markup %',
  price: 'Planned Sales Price',
  profit: 'Desired Profit',
  margin: 'Desired Margin %',
  calculated_profit: 'Profit',
  calculated_margin: 'Profit Margin',
  actions: 'Actions',
};

const HIDEABLE_COLUMNS = ['name', 'category', 'status', 'sku', 'product_cost', 'markup', 'price', 'profit', 'margin', 'calculated_profit', 'calculated_margin', 'actions'];

type Props = Pick<ProductsPageState,
  | 'products'
  | 'categories'
  | 'globalFilter'
  | 'setGlobalFilter'
  | 'globalPricingMethod'
  | 'handleGlobalMethodChange'
  | 'activeFilters'
  | 'selectedFilterColumn'
  | 'setSelectedFilterColumn'
  | 'filterOperator'
  | 'setFilterOperator'
  | 'filterValue'
  | 'setFilterValue'
  | 'addFilter'
  | 'handleExport'
  | 'getCalculationTypeDescription'
> & {
  activeTab: 'table' | 'grid';
  onTabChange: (tab: 'table' | 'grid') => void;
  onNavigateNew: () => void;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (id: string, visible: boolean) => void;
};

export function ProductsToolbar({
  products,
  categories,
  globalFilter,
  setGlobalFilter,
  globalPricingMethod,
  handleGlobalMethodChange,
  activeFilters,
  selectedFilterColumn,
  setSelectedFilterColumn,
  filterOperator,
  setFilterOperator,
  filterValue,
  setFilterValue,
  addFilter,
  handleExport,
  getCalculationTypeDescription,
  activeTab,
  onTabChange,
  onNavigateNew,
  columnVisibility,
  onColumnVisibilityChange,
}: Props) {
  const hasProducts = products.length > 0;
  const description = getCalculationTypeDescription(globalPricingMethod);

  return (
    <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">

      {/* Left: pricing method selector + description */}
      {hasProducts && (
        <div className="flex flex-col gap-1 min-w-[180px]">
          <Select value={globalPricingMethod} onValueChange={v => handleGlobalMethodChange(v as PricingMethod)}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markup">Markup %</SelectItem>
              <SelectItem value="price">Planned Sales Price</SelectItem>
              <SelectItem value="profit">Desired Profit</SelectItem>
              <SelectItem value="margin">Desired Margin %</SelectItem>
            </SelectContent>
          </Select>
          {description && (
            <p className="text-xs text-muted-foreground px-1 leading-snug max-w-[260px]">{description}</p>
          )}
        </div>
      )}

      {/* Right: search + action icons + new */}
      <div className="flex items-center gap-2 flex-wrap">
        {hasProducts && (
          <>
            {/* Search */}
            <div className="relative w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-9 w-9" title="Filters">
                  <Filter className="h-4 w-4" />
                  {activeFilters.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-medium">
                      {activeFilters.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[300px]">
                <DropdownMenuLabel>Add Filter</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Column</label>
                    <Select
                      value={selectedFilterColumn}
                      onValueChange={v => {
                        setSelectedFilterColumn(v);
                        setFilterValue('');
                        setFilterOperator((v === 'status' || v === 'category') ? 'equals' : 'contains');
                      }}
                    >
                      <SelectTrigger className="h-8"><SelectValue placeholder="Select column..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="sku">SKU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedFilterColumn && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Operator</label>
                      <Select value={filterOperator} onValueChange={setFilterOperator}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
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

                  {selectedFilterColumn && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        {selectedFilterColumn === 'name' ? 'Name' :
                          selectedFilterColumn === 'category' ? 'Category' :
                            selectedFilterColumn === 'status' ? 'Status' : 'SKU'}
                      </label>
                      {selectedFilterColumn === 'status' ? (
                        <Select value={filterValue} onValueChange={setFilterValue}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Select status..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="on_sale">On Sale</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : selectedFilterColumn === 'category' ? (
                        <Select value={filterValue} onValueChange={setFilterValue}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Select category..." /></SelectTrigger>
                          <SelectContent>
                            {categories.map(c => (
                              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder={`Filter by ${selectedFilterColumn}...`}
                          value={filterValue}
                          onChange={e => setFilterValue(e.target.value)}
                          className="h-8"
                          onKeyDown={e => { if (e.key === 'Enter') addFilter(); }}
                        />
                      )}
                    </div>
                  )}

                  {selectedFilterColumn && filterValue && (
                    <Button size="sm" className="w-full" onClick={addFilter}>Apply Filter</Button>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Layout toggle */}
            <div className="flex items-center border rounded-md overflow-hidden h-9">
              <Button
                variant={activeTab === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-none border-0"
                onClick={() => onTabChange('table')}
                title="Table view"
              >
                <Table2 className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTab === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-none border-0 border-l"
                onClick={() => onTabChange('grid')}
                title="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            {/* Columns toggle — table only */}
            {activeTab === 'table' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" title="Toggle columns">
                    <Columns className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {HIDEABLE_COLUMNS.map(id => (
                    <DropdownMenuCheckboxItem
                      key={id}
                      checked={columnVisibility[id] !== false}
                      onSelect={e => e.preventDefault()}
                      onCheckedChange={visible => onColumnVisibilityChange(id, visible)}
                    >
                      {COLUMN_LABELS[id] ?? id}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Export — icon only */}
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleExport} title="Export CSV">
              <Download className="h-4 w-4" />
            </Button>
          </>
        )}

        <Button onClick={onNavigateNew} className="h-9">
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>
    </div>
  );
}
