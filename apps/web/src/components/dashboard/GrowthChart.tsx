import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency } from '@/utils/currency';

interface Product {
    id: number;
    created_at: string;
    target_price: number | null;
    batch_size: number;
    status: string | null;
}

interface GrowthChartProps {
    products: Product[];
}

export function GrowthChart({ products }: GrowthChartProps) {
    const { settings } = useSettings();

    const data = useMemo(() => {
        // Only include products with a target price set
        const pricedProducts = products.filter(p => p.target_price !== null && p.target_price > 0);

        const sortedProducts = [...pricedProducts]
            .filter(p => p.created_at)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        if (sortedProducts.length === 0) return [];

        const dailyMap = new Map<string, number>();
        sortedProducts.forEach(product => {
            const date = new Date(product.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const revenue = (product.target_price || 0) * (product.batch_size || 1);
            const currentDayVal = dailyMap.get(date) || 0;
            dailyMap.set(date, currentDayVal + revenue);
        });

        const result: { date: string; value: number }[] = [];
        let cumulative = 0;

        const uniqueDates = Array.from(new Set(
            sortedProducts.map(p => new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        ));

        uniqueDates.forEach(date => {
            cumulative += dailyMap.get(date) || 0;
            result.push({ date, value: cumulative });
        });

        if (result.length === 1) {
            result.unshift({ date: 'Start', value: 0 });
        }

        return result;
    }, [products]);

    const height = 200;
    const width = 1000;
    const paddingTop = 20;
    const paddingBottom = 30;
    const paddingLeft = 60;
    const paddingRight = 20;

    if (data.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-base font-medium">Catalog Growth</CardTitle>
                    <CardDescription className="text-xs">Potential Revenue Over Time</CardDescription>
                </CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    No priced products yet
                </CardContent>
            </Card>
        );
    }

    const maxVal = Math.max(...data.map(d => d.value)) * 1.15;

    const getX = (index: number) => {
        return paddingLeft + (index / (data.length - 1)) * (width - paddingLeft - paddingRight);
    };

    const getY = (value: number) => {
        return paddingTop + (1 - value / maxVal) * (height - paddingTop - paddingBottom);
    };

    const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
    const areaPoints = `${paddingLeft},${getY(0)} ${points} ${width - paddingRight},${getY(0)}`;

    // Y-axis labels: 0, mid, max
    const yLabels = [0, maxVal * 0.5, maxVal].map(v => ({
        value: v,
        y: getY(v),
        label: formatCurrency(v, settings.currency),
    }));

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-medium">Catalog Growth</CardTitle>
                <CardDescription className="text-xs">Potential Revenue Over Time</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="relative w-full h-[200px]">
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-full overflow-visible"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id="brand-gradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#c2410c" stopOpacity="0.18" />
                                <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Grid Lines */}
                        {yLabels.map(({ y }, i) => (
                            <line
                                key={i}
                                x1={paddingLeft}
                                y1={y}
                                x2={width - paddingRight}
                                y2={y}
                                stroke="currentColor"
                                strokeOpacity="0.08"
                                strokeDasharray={i > 0 ? '4 4' : undefined}
                            />
                        ))}

                        {/* Y-axis labels */}
                        {yLabels.map(({ y, label }, i) => (
                            <text
                                key={i}
                                x={paddingLeft - 6}
                                y={y + 4}
                                textAnchor="end"
                                fontSize="9"
                                className="fill-muted-foreground select-none"
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                                {label}
                            </text>
                        ))}

                        {/* Area fill */}
                        <polygon points={areaPoints} fill="url(#brand-gradient)" />

                        {/* Line */}
                        <polyline
                            fill="none"
                            stroke="#c2410c"
                            strokeWidth="2.5"
                            points={points}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Data Points */}
                        {data.map((d, i) => (
                            <g key={i} className="group cursor-default">
                                <circle cx={getX(i)} cy={getY(d.value)} r="10" className="fill-transparent" />
                                <circle
                                    cx={getX(i)}
                                    cy={getY(d.value)}
                                    r="3.5"
                                    fill="#c2410c"
                                    className="transition-all group-hover:r-5"
                                />

                                {/* Hover tooltip */}
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <rect
                                        x={getX(i) - 44}
                                        y={getY(d.value) - 36}
                                        width="88"
                                        height="24"
                                        rx="4"
                                        fill="hsl(var(--popover))"
                                        className="shadow-sm stroke-border stroke-1"
                                    />
                                    <text
                                        x={getX(i)}
                                        y={getY(d.value) - 20}
                                        textAnchor="middle"
                                        fontSize="12"
                                        fontWeight="600"
                                        className="fill-popover-foreground"
                                    >
                                        {formatCurrency(d.value, settings.currency)}
                                    </text>
                                </g>

                                {/* X-axis date label */}
                                <text
                                    x={getX(i)}
                                    y={height - 6}
                                    textAnchor="middle"
                                    fontSize="10"
                                    className="fill-muted-foreground select-none"
                                >
                                    {d.date}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>
            </CardContent>
        </Card>
    );
}
