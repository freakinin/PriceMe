import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterials } from '@/hooks/useMaterials';

export function LowStockAlerts() {
    const navigate = useNavigate();
    const { materials, isLoading } = useMaterials();

    const lowStockMaterials = materials
        .filter(m => m.stock_level != null && m.reorder_point != null && Number(m.stock_level) <= Number(m.reorder_point))
        .sort((a, b) => (Number(a.stock_level) / (Number(a.reorder_point) || 1)) - (Number(b.stock_level) / (Number(b.reorder_point) || 1)))
        .slice(0, 5);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Low Stock Alerts</CardTitle>
                    <CardDescription>Loading materials...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (lowStockMaterials.length === 0) {
        return (
            <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                            <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="font-medium">All materials stocked</p>
                            <p className="text-sm text-muted-foreground">No items below reorder point</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/materials')}>
                        View All
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-base font-medium">Low Stock Alerts</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/materials')}>
                        Manage Materials <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                </div>
                <CardDescription>{lowStockMaterials.length} materials below reorder point</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {lowStockMaterials.map((material) => (
                        <div key={material.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10">
                            <div>
                                <p className="font-medium">{material.name}</p>
                                <p className="text-xs text-muted-foreground">Reorder Point: {Math.floor(material.reorder_point)}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-orange-600 dark:text-orange-400">
                                    {Math.floor(material.stock_level)}
                                </p>
                                <div className="text-xs text-orange-600/80">
                                    Current Stock
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
