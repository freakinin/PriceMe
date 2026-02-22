import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type ProductsPageState, OPERATOR_LABELS } from '@/hooks/useProductsPageState';

type Props = Pick<ProductsPageState, 'activeFilters' | 'removeFilter' | 'clearAllFilters'>;

export function ProductsFilterChips({ activeFilters, removeFilter, clearAllFilters }: Props) {
  if (activeFilters.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Filters:</span>
      {activeFilters.map(filter => {
        const columnName =
          filter.column === 'name' ? 'Name' :
          filter.column === 'category' ? 'Category' :
          filter.column === 'status' ? 'Status' : 'SKU';
        const displayValue =
          filter.column === 'status'
            ? (filter.value === 'draft' ? 'Draft' :
               filter.value === 'in_progress' ? 'In Progress' :
               filter.value === 'on_sale' ? 'On Sale' : 'Inactive')
            : filter.value;

        return (
          <Badge key={filter.column} variant="secondary" className="flex items-center gap-1 px-2 py-1">
            <span className="text-xs font-medium">
              {columnName} {OPERATOR_LABELS[filter.operator] ?? filter.operator} {displayValue}
            </span>
            <button
              onClick={() => removeFilter(filter.column)}
              className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAllFilters}>
        Clear all
      </Button>
    </div>
  );
}
