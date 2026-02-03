import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currency';
import { useSettings } from '@/hooks/useSettings';

interface SalesChartProps {
    totalCost: number;
    potentialRevenue: number;
    potentialProfit: number;
}

export function SalesChart({ totalCost, potentialRevenue, potentialProfit }: SalesChartProps) {
    const { settings } = useSettings();

    const formatValue = (val: number) => formatCurrency(val, settings.currency);

    const maxValue = Math.max(totalCost, potentialRevenue) * 1.1; // Add 10% headroom

    // Calculate heights as percentage of max value
    const costHeight = (totalCost / maxValue) * 100;
    const revenueHeight = (potentialRevenue / maxValue) * 100;

    // Profit can be negative, so we handle it differently if needed, 
    // but for a simple bar chart comparing Cost vs Revenue, we'll focus on those two bars.
    // We can visualize profit as a separate indicator or a third bar if positive.

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>Estimated potential from active products</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col h-[200px] justify-end space-y-2">
                    <div className="flex justify-around items-end h-full gap-8 px-8">
                        {/* Cost Bar */}
                        <div className="flex flex-col items-center gap-2 group w-full">
                            <div className="text-sm font-bold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                {formatValue(totalCost)}
                            </div>
                            <div
                                className="w-full max-w-[80px] bg-orange-500/20 border border-orange-500 rounded-t-lg transition-all hover:bg-orange-500/30 relative group-hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                                style={{ height: `${Math.max(costHeight, 2)}%` }} // Min 2% height
                            ></div>
                            <div className="text-sm font-medium text-muted-foreground">Est. Cost</div>
                        </div>

                        {/* Revenue Bar */}
                        <div className="flex flex-col items-center gap-2 group w-full">
                            <div className="text-sm font-bold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                {formatValue(potentialRevenue)}
                            </div>
                            <div
                                className="w-full max-w-[80px] bg-green-500/20 border border-green-500 rounded-t-lg transition-all hover:bg-green-500/30 relative group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                style={{ height: `${Math.max(revenueHeight, 2)}%` }}
                            ></div>
                            <div className="text-sm font-medium text-muted-foreground">Est. Revenue</div>
                        </div>
                    </div>
                </div>

                {/* Profit Summary */}
                <div className="mt-6 pt-4 border-t flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Net Potential Profit</span>
                    <span className={`font-bold ${potentialProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatValue(potentialProfit)}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
