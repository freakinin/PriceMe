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
        // 1. Group by date and sum potential revenue
        const dailyMap = new Map<string, number>();

        // Copy and sort by date ensuring valid dates
        const sortedProducts = [...products]
            .filter(p => p.created_at)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        if (sortedProducts.length === 0) return [];

        let runningTotal = 0;

        sortedProducts.forEach(product => {
            const date = new Date(product.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const revenue = (product.target_price || 0) * (product.batch_size || 1);

            // Add to today's total
            const currentDayVal = dailyMap.get(date) || 0;
            dailyMap.set(date, currentDayVal + revenue);
        });

        // 2. Convert to cumulative array
        const result: { date: string; value: number }[] = [];
        let cumulative = 0;

        // Unique cumulative points
        const uniqueDates = Array.from(new Set(sortedProducts.map(p => new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))));

        uniqueDates.forEach(date => {
            const daysRevenue = dailyMap.get(date) || 0;
            cumulative += daysRevenue;
            result.push({ date, value: cumulative });
        });

        // If only one point, duplicate it to make a line
        if (result.length === 1) {
            result.unshift({ date: 'Start', value: 0 });
        }

        return result;
    }, [products]);

    // Increased internal resolution to make fixed-size elements (text, dots) appear smaller relative to the chart
    const height = 200;
    const width = 1000;
    const padding = 20;

    if (data.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Catalog Growth</CardTitle>
                    <CardDescription>Inventory value over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    No data available
                </CardContent>
            </Card>
        );
    }

    // Scales
    const maxVal = Math.max(...data.map(d => d.value)) * 1.1; // 10% headroom

    const getX = (index: number) => {
        return padding + (index / (data.length - 1)) * (width - 2 * padding);
    };

    const getY = (value: number) => {
        return height - padding - (value / maxVal) * (height - 2 * padding);
    };

    // Generate path
    const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
    const areaPoints = `${points} ${width - padding},${height - padding} ${padding},${height - padding}`;

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-medium">Catalog Growth</CardTitle>
                <CardDescription className="text-xs">Cumulative Potential Revenue</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                {/* 
                    Container fixed height 200px. 
                    SVG preserveAspectRatio="none" ensures it stretches to fill even if width varies.
                */}
                <div className="relative w-full h-[200px]">
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-full overflow-visible"
                        preserveAspectRatio="none"
                    >
                        {/* Gradient Definition */}
                        <defs>
                            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Grid Lines (Simple horizontal) */}
                        {[0, 0.5, 1].map((p) => (
                            <line
                                key={p}
                                x1={padding}
                                y1={getY(maxVal * p)}
                                x2={width - padding}
                                y2={getY(maxVal * p)}
                                stroke="currentColor"
                                strokeOpacity="0.1"
                            />
                        ))}

                        {/* Area */}
                        <polygon points={areaPoints} fill="url(#gradient)" />

                        {/* Line */}
                        <polyline
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2"
                            points={points}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Data Points */}
                        {data.map((d, i) => (
                            <g key={i} className="group cursor-default">
                                {/* Hit area (larger invisible circle for easier hovering) */}
                                <circle
                                    cx={getX(i)}
                                    cy={getY(d.value)}
                                    r="10"
                                    className="fill-transparent"
                                />
                                {/* Visible dot */}
                                <circle
                                    cx={getX(i)}
                                    cy={getY(d.value)}
                                    r="3"
                                    className="fill-green-600 transition-all group-hover:r-5 group-hover:fill-green-500"
                                />

                                {/* Tooltip Group */}
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    {/* Tooltip Background (optional contrast) */}
                                    <rect
                                        x={getX(i) - 40}
                                        y={getY(d.value) - 35}
                                        width="80"
                                        height="24"
                                        rx="4"
                                        fill="hsl(var(--popover))"
                                        className="shadow-sm stroke-border stroke-1"
                                    />

                                    {/* Value Text */}
                                    <text
                                        x={getX(i)}
                                        y={getY(d.value) - 20}
                                        textAnchor="middle"
                                        fontSize="12"
                                        fontWeight="bold"
                                        className="fill-popover-foreground"
                                    >
                                        {formatCurrency(d.value, settings.currency)}
                                    </text>
                                </g>

                                {/* Date Label on X-Axis */}
                                <text
                                    x={getX(i)}
                                    y={height - 5}
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
