import { Edit, PackagePlus, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EditableCell } from '@/components/EditableCell';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/utils/currency';
import { type Material } from '@/hooks/useMaterials';

interface Props {
  materials: Material[];
  updateMaterial: (id: number, updates: Partial<Material>) => Promise<void>;
  onEdit: (material: Material) => void;
  onAddStock: (material: Material) => void;
  onDelete: (material: Material) => void;
  getStockBadgeVariant: (material: Material) => 'destructive' | 'secondary' | 'default';
  formatDate: (dateString?: string) => string;
  currency: string;
  availableUnits: string[];
}

export function MaterialsCardView({
  materials,
  updateMaterial,
  onEdit,
  onAddStock,
  onDelete,
  getStockBadgeVariant,
  formatDate,
  currency,
  availableUnits,
}: Props) {
  if (materials.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">No results found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {materials.map(material => {
        const stockVariant = getStockBadgeVariant(material);
        const stockBadgeClass =
          stockVariant === 'destructive'
            ? 'bg-red-500 text-white'
            : stockVariant === 'secondary'
            ? 'bg-yellow-500 text-white'
            : 'bg-green-500 text-white';

        const quantity = Number(material.quantity) || 0;
        const totalInvestment = Number(material.price) || 0;
        const avgCost = quantity > 0 ? totalInvestment / quantity : 0;
        const lastPrice = Number(material.price_per_unit) || 0;
        const lastTotal =
          (Number(material.last_purchased_quantity) || 0) *
          (Number(material.last_purchased_price) || 0);

        const formattedStock = Number.isInteger(Number(material.stock_level))
          ? Number(material.stock_level).toString()
          : parseFloat(Number(material.stock_level).toFixed(2)).toString();

        return (
          <Card
            key={material.id}
            className="group relative flex flex-col transition-all duration-200 hover:shadow-md"
          >
            <CardContent className="p-0 flex flex-col flex-1">
              {/* Header: name + category */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-base truncate flex-1">{material.name}</p>
                  {material.category && (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {material.category}
                    </Badge>
                  )}
                </div>
                {material.supplier && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground truncate">{material.supplier}</span>
                    {material.supplier_link && (
                      <a
                        href={material.supplier_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary shrink-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t" />

              {/* Metrics grid */}
              <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
                {/* Stock Level */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Stock</p>
                  <div className="mt-0.5">
                    <Badge variant={stockVariant} className={`${stockBadgeClass} text-xs`}>
                      {formattedStock}
                    </Badge>
                  </div>
                </div>

                {/* Price/Unit — editable */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Price / Unit</p>
                  <div className="mt-0.5 -ml-2">
                    <EditableCell
                      value={material.price_per_unit}
                      onSave={async value => {
                        const newPpu = Number(value) || 0;
                        const qty = Number(material.quantity) || 0;
                        await updateMaterial(material.id, {
                          price_per_unit: newPpu,
                          price: newPpu * qty,
                        });
                      }}
                      type="number"
                      formatDisplay={val => formatCurrency(Number(val) || 0, currency)}
                    />
                    {avgCost !== lastPrice && avgCost > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-2">
                        Avg: {formatCurrency(avgCost, currency)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Reorder Point — editable */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Reorder At</p>
                  <div className="mt-0.5 -ml-2">
                    <EditableCell
                      value={material.reorder_point}
                      onSave={async value =>
                        updateMaterial(material.id, { reorder_point: value as number })
                      }
                      type="number"
                    />
                  </div>
                </div>

                {/* Investment */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Investment</p>
                  <p className="text-sm font-medium mt-0.5">
                    {formatCurrency(totalInvestment, currency)}
                  </p>
                </div>

                {/* Unit — editable */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Unit</p>
                  <div className="mt-0.5 -ml-2">
                    <EditableCell
                      value={material.unit}
                      onSave={async value =>
                        updateMaterial(material.id, { unit: value as string })
                      }
                      type="select"
                      options={availableUnits}
                    />
                  </div>
                </div>

                {/* Last Purchased */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Last Bought</p>
                  <p className="text-sm mt-0.5">{formatDate(material.last_purchased_date)}</p>
                  {lastTotal > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      {formatCurrency(lastTotal, currency)}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t mt-auto" />

              {/* Footer: actions */}
              <div className="px-4 py-3 flex items-center justify-end gap-0.5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => onEdit(material)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit material</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => onAddStock(material)}
                      >
                        <PackagePlus className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add stock / Restock</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onDelete(material)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete material</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
