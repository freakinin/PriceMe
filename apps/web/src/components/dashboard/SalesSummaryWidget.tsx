import { ArrowRight, ShoppingBag, TrendingUp, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currency';
import type { Sale } from '@/hooks/useSales';

interface Settings {
  currency: string;
}

interface SalesSummaryWidgetProps {
  sales: Sale[];
  isLoading: boolean;
  settings: Settings;
  onNavigate: () => void;
}

function saleRevenue(sale: Sale): number {
  const gross = (sale.unit_price ?? 0) * (sale.quantity ?? 1);
  const discount = sale.discount_amount ?? 0;
  return Math.max(0, gross - discount);
}

export function SalesSummaryWidget({ sales, isLoading, settings, onNavigate }: SalesSummaryWidgetProps) {
  const totalRevenue = sales.reduce((sum, s) => sum + saleRevenue(s), 0);
  const totalUnits = sales.reduce((sum, s) => sum + Number(s.quantity ?? 0), 0);
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.sale_date ?? b.created_at).getTime() - new Date(a.sale_date ?? a.created_at).getTime())
    .slice(0, 3);

  return (
    <Card className="border-border border-t-[3px] border-t-emerald-500 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">Sales</CardTitle>
            <CardDescription className="text-xs">All-time recorded sales</CardDescription>
          </div>
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="flex gap-4">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-20" />
            </div>
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-3 space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              No sales recorded yet. Start tracking your revenue.
            </p>
            <Button size="sm" className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onNavigate}>
              Record a Sale
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="flex items-end gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Revenue</p>
                <p className="text-2xl font-bold text-emerald-700 tabular-nums leading-none">
                  {formatCurrency(totalRevenue, settings.currency)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Units Sold</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  <p className="text-xl font-bold text-emerald-600 tabular-nums leading-none">
                    {Number.isInteger(totalUnits) ? totalUnits : totalUnits.toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Sales</p>
                <p className="text-xl font-bold text-foreground tabular-nums leading-none">{sales.length}</p>
              </div>
            </div>

            {/* Recent sales list */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recent</p>
              {recentSales.map(sale => {
                const date = new Date(sale.sale_date ?? sale.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const revenue = saleRevenue(sale);
                return (
                  <div
                    key={sale.id}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                  >
                    <Receipt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate flex-1 min-w-0">
                      {sale.product_name ?? 'Product'}
                    </span>
                    {sale.platform && (
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0',
                        'hidden sm:inline-flex',
                      )}>
                        {sale.platform}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-emerald-700 tabular-nums shrink-0">
                      {formatCurrency(revenue, settings.currency)}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{date}</span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <button
              type="button"
              onClick={onNavigate}
              className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
            >
              View all sales
              <ArrowRight className="h-3 w-3" />
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
