import { useNavigate } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency } from '@/utils/currency';
import { CheckCircle2, FileText, Clock, XCircle } from 'lucide-react';

// Reusing types locally for now, could be imported if we export them from central place
type ProductStatus = 'draft' | 'in_progress' | 'on_sale' | 'inactive';

interface Product {
    id: number;
    name: string;
    sku: string | null;
    status: ProductStatus | null;
    target_price: number | null;
    product_cost: number;
    profit: number | null;
    profit_margin: number | null;
    updated_at: string;
}

interface RecentActivityProps {
    products: Product[];
    loading: boolean;
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bgColor: string }> = {
    draft: {
        label: 'Draft',
        icon: FileText,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    in_progress: {
        label: 'In Progress',
        icon: Clock,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-900/10',
    },
    on_sale: {
        label: 'On Sale',
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    inactive: {
        label: 'Inactive',
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
    },
};

export function RecentActivity({ products, loading }: RecentActivityProps) {
    const navigate = useNavigate();
    const { settings } = useSettings();

    const getStatusBadge = (status: ProductStatus | null) => {
        if (!status) return null;
        const config = statusConfig[status] || statusConfig.draft;
        const Icon = config.icon;
        return (
            <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0 flex w-fit items-center gap-1`}>
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const formatCurrencyValue = (value: number | null | undefined): string => {
        if (value === null || value === undefined) return '-';
        return formatCurrency(value, settings.currency);
    };

    const formatPercentage = (value: number | null | undefined): string => {
        if (value === null || value === undefined) return '-';
        return `${value.toFixed(1)}%`;
    };

    // Sort by updated_at desc and take top 5
    const recentProducts = [...products]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);

    return (
        <Card>
            <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-medium">Recent Products</CardTitle>
                        <CardDescription>Recently updated items</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/products')}>
                        View All
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : recentProducts.length === 0 ? (
                    <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Get started by creating your first product
                        </p>
                        <Button onClick={() => navigate('/products/add')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Product
                        </Button>
                    </div>
                ) : (
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead className="text-right">Margin</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentProducts.map((product) => (
                                    <TableRow
                                        key={product.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => navigate(`/products/${product.id}/edit`)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{product.name}</span>
                                                {product.sku && <span className="text-xs text-muted-foreground">{product.sku}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                                        <TableCell>{formatCurrencyValue(product.target_price)}</TableCell>
                                        <TableCell className="text-right">
                                            <span className={product.profit_margin !== null && product.profit_margin >= 0 ? 'text-green-600' : product.profit_margin !== null ? 'text-red-600' : 'text-muted-foreground'}>
                                                {formatPercentage(product.profit_margin)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
