import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { CategorySelect } from '@/components/CategorySelect';
import { type PricingMethod, type ProductStatus } from '@/hooks/useProducts';
import { type ProductsPageState } from '@/hooks/useProductsPageState';
import { FeeBreakdownTooltip } from '@/components/products/FeeBreakdownTooltip';

type Props = Pick<ProductsPageState,
  | 'filteredProducts'
  | 'products'
  | 'productCategoryIds'
  | 'setProductCategoryIds'
  | 'handleSaveField'
  | 'handleDeleteClick'
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
  feeAwareMode?: boolean;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  in_progress: { label: 'In Progress', className: 'bg-[#F89C75] text-white border-transparent' },
  on_sale: { label: 'On Sale', className: 'bg-[#11743B] text-white border-transparent' },
  inactive: { label: 'Inactive', className: 'bg-[#B03E52] text-white border-transparent' },
};

export function ProductsGridView({
  filteredProducts,
  products,
  productCategoryIds,
  setProductCategoryIds,
  handleSaveField,
  handleDeleteClick,
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
  feeAwareMode = false,
}: Props) {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Sync to parent
  useEffect(() => {
    onSelectionChange([...selectedIds]);
  }, [selectedIds]);

  // Reset selection when filtered products change
  useEffect(() => {
    setSelectedIds(prev => {
      const validIds = new Set(filteredProducts.map(p => p.id));
      const next = new Set([...prev].filter(id => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredProducts]);

  if (products.length === 0) return null;

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredProducts.map(product => {
        const metrics = getCalculatedMetrics(product);
        const feeMetrics = feeAwareMode ? getFeeAwareMetrics(product) : null;
        const method = (product.pricing_method || 'price') as PricingMethod;
        // Use pricingValue (user's desired input) for non-price methods so the card always
        // shows what the user set — even when product_cost=0 causes calculated metrics to be 0.
        const activeMetric: { label: string; value: number; isPercent: boolean } = {
          markup: { label: 'Markup %', value: metrics.pricingValue, isPercent: true },
          price: { label: 'Sales Price', value: metrics.price, isPercent: false },
          profit: { label: 'Desired Profit', value: metrics.pricingValue, isPercent: false },
          margin: { label: 'Desired Margin', value: metrics.pricingValue, isPercent: true },
        }[method] ?? { label: 'Sales Price', value: metrics.price, isPercent: false };
        const secondaryMetric = method === 'price'
          ? { label: 'Markup %', value: formatPercentage(metrics.markup) }
          : { label: 'Sales Price', value: formatCurrencyValue(metrics.price) };

        const isSelected = selectedIds.has(product.id);
        const currentStatus = (product.status || 'draft') as ProductStatus;
        const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.draft;
        const currentCategoryId = productCategoryIds[product.id] !== undefined
          ? productCategoryIds[product.id]
          : product.category_id;
        const variantCount = product.variants?.length || 0;
        const competitorCount = Number(product.competitor_count || 0);

        return (
          <Card
            key={product.id}
            className={`group relative flex flex-col transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-primary shadow-sm' : ''}`}
          >
            <CardContent className="p-0 flex flex-col flex-1">
              {/* Header: checkbox + status */}
              <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelect(product.id)}
                  aria-label="Select product"
                />
                <Select
                  value={currentStatus}
                  onValueChange={async v => await handleSaveField(product.id, 'status', v)}
                >
                  <SelectTrigger className="h-auto w-auto border-none shadow-none p-0 focus:ring-0 [&>svg]:ml-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-60">
                    <Badge variant="outline" className={statusConfig.className}>{statusConfig.label}</Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key} className="pl-2 [&>span.absolute]:hidden">
                        <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Name + SKU */}
              <div className="px-4 pb-3">
                <p className="font-semibold text-base truncate">{product.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-muted-foreground shrink-0">SKU ·</span>
                  <span className="text-xs text-muted-foreground truncate">{product.sku || '—'}</span>
                </div>
              </div>

              <div className="border-t" />

              {/* Pricing metrics */}
              <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
                {/* Cost — read-only */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Cost</p>
                  <p className="text-sm font-medium mt-0.5">{formatCurrencyValue(product.product_cost)}</p>
                </div>

                {/* Active pricing metric — read-only */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{activeMetric.label}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${metrics.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`} title="Pricing driver" />
                    <p className="text-sm font-semibold">
                      {activeMetric.isPercent ? formatPercentage(activeMetric.value) : formatCurrencyValue(activeMetric.value)}
                    </p>
                  </div>
                </div>

                {/* Secondary metric — calculated, read-only */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{secondaryMetric.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{secondaryMetric.value}</p>
                </div>

                {/* Profit — calculated, color-coded */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    {feeAwareMode ? 'Net Profit' : 'Profit'}
                  </p>
                  {feeMetrics ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className={`text-sm font-medium ${feeMetrics.netProfitPreTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrencyValue(feeMetrics.netProfitPreTax)}
                      </p>
                      <FeeBreakdownTooltip breakdown={feeMetrics} />
                    </div>
                  ) : (
                    <p className={`text-sm font-medium mt-0.5 ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrencyValue(metrics.profit)}
                    </p>
                  )}
                </div>

                {/* Margin — calculated, color-coded */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    {feeAwareMode ? 'Net Margin' : 'Margin'}
                  </p>
                  <p className={`text-sm font-medium mt-0.5 ${(feeMetrics ? feeMetrics.netMarginPreTax : metrics.margin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(feeMetrics ? feeMetrics.netMarginPreTax : metrics.margin)}
                  </p>
                </div>

                {/* Category — inline select */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Category</p>
                  <div className="mt-0.5 -ml-2">
                    <CategorySelect
                      value={currentCategoryId}
                      isLoading={updatingCategoryProductId === product.id}
                      onChange={async newId => {
                        try {
                          setProductCategoryIds(prev => ({ ...prev, [product.id]: newId }));
                          setUpdatingCategoryProductId(product.id);
                          await updateProduct({ id: product.id, data: { category_id: newId } });
                        } finally {
                          setUpdatingCategoryProductId(null);
                        }
                      }}
                      className="h-6 text-xs border-none px-2 hover:bg-muted/50 font-normal"
                      placeholder="-"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t mt-auto" />

              {/* Footer: badges + actions */}
              <div className="px-4 py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Competitors */}
                  {competitorCount === 0 ? (
                    <Button variant="ghost" size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => navigate(`/market-analysis?productId=${product.id}`)}>
                      <Plus className="h-3 w-3 mr-1" /> Competitors
                    </Button>
                  ) : (
                    <Badge variant="secondary"
                      className="text-xs cursor-pointer hover:bg-secondary/80 font-normal"
                      onClick={() => navigate(`/market-analysis?productId=${product.id}`)}>
                      {competitorCount} competitor{competitorCount !== 1 ? 's' : ''}
                    </Badge>
                  )}

                  {/* Variants */}
                  {updatingProductId === product.id ? (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  ) : variantCount === 0 ? (
                    <Button variant="ghost" size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => handleVariationsOpen(product)}>
                      <Plus className="h-3 w-3 mr-1" /> Variants
                    </Button>
                  ) : (
                    <Badge variant="outline"
                      className="text-xs cursor-pointer hover:bg-muted font-normal"
                      onClick={() => handleVariationsOpen(product)}>
                      {variantCount} variant{variantCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(`/products/${product.id}/edit`)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => handleDeleteClick(product.id, product.name)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
