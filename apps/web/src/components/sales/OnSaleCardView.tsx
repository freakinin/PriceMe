import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EditableCell } from '@/components/EditableCell';
import { type Product } from '@/hooks/useProducts';

interface Props {
  products: Product[];
  salesByProduct: Record<number, { qty: number; revenue: number; count: number }>;
  useFullInvestment: boolean;
  formatCurrencyValue: (v: number | null | undefined) => string;
  formatPercentage: (v: number | null | undefined) => string;
  onRecordSale: (product: Product) => void;
  handleSaveField: (productId: number, field: string, value: string | number) => Promise<void>;
}

export function OnSaleCardView({
  products,
  salesByProduct,
  useFullInvestment,
  formatCurrencyValue,
  formatPercentage,
  onRecordSale,
  handleSaveField,
}: Props) {
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map(product => {
        const stats = salesByProduct[product.id];
        const qtySold = stats?.qty || 0;
        const revenue = stats?.revenue || 0;
        const made = product.batch_size || 0;
        const productCost = typeof product.product_cost === 'number' ? product.product_cost : 0;
        const investment = made * productCost;
        const cost = useFullInvestment ? investment : qtySold * productCost;
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        const stock = made - qtySold;

        return (
          <Card
            key={product.id}
            className="group relative flex flex-col transition-all duration-200 hover:shadow-md"
          >
            <CardContent className="p-0 flex flex-col flex-1">
              {/* Header: name + SKU + price badge */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-base truncate">{product.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-muted-foreground shrink-0">SKU ·</span>
                      <span className="text-xs text-muted-foreground truncate">{product.sku || '—'}</span>
                    </div>
                  </div>
                  <Badge className="bg-[#11743B] text-white border-transparent shrink-0 text-xs whitespace-nowrap">
                    {formatCurrencyValue(product.target_price)}
                  </Badge>
                </div>
              </div>

              <div className="border-t" />

              {/* Metrics grid */}
              <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
                {/* Sold */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Sold</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-sm font-semibold">{qtySold}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRecordSale(product)}
                      title="Record Sale"
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-primary" />
                    </Button>
                  </div>
                </div>

                {/* Revenue */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Revenue</p>
                  <p className="text-sm font-medium mt-0.5">{formatCurrencyValue(revenue)}</p>
                </div>

                {/* Made — editable */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Made</p>
                  <div className="mt-0.5 -ml-2">
                    <EditableCell
                      value={made}
                      onSave={async value => handleSaveField(product.id, 'batch_size', value)}
                      type="number"
                    />
                  </div>
                </div>

                {/* Profit */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Profit</p>
                  <p className={`text-sm font-medium mt-0.5 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrencyValue(profit)}
                  </p>
                </div>

                {/* Stock */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Stock</p>
                  <p className={`text-sm font-medium mt-0.5 ${stock >= 0 ? '' : 'text-red-600'}`}>
                    {stock}
                  </p>
                </div>

                {/* Margin */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Margin</p>
                  {qtySold > 0 && revenue > 0 ? (
                    <p className={`text-sm font-medium mt-0.5 ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(margin)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-0.5">—</p>
                  )}
                </div>
              </div>

              <div className="border-t mt-auto" />

              {/* Footer: investment + record sale */}
              <div className="px-4 py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Investment</p>
                  <p className="text-sm font-medium mt-0.5">{formatCurrencyValue(investment)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  onClick={() => onRecordSale(product)}
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Record Sale
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
