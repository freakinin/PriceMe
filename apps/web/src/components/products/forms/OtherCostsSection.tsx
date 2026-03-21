
import { useState } from 'react';
import { type Control, useFieldArray } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, X, Truck, RefreshCw } from 'lucide-react';
import { AddOtherCostForm } from './AddOtherCostForm';
import { ChooseShippingModal } from './ChooseShippingModal';
import { calculateOtherCost } from '@/utils/product-calculations';
import { formatCurrency } from '@/utils/currency';
import { type ProductFormValues, type OtherCostItem, otherCostItemSchema } from '@/types/product-form';
import { z } from 'zod';

interface OtherCostsSectionProps {
    control: Control<ProductFormValues>;
    otherCosts: z.infer<typeof otherCostItemSchema>[];
    settings: { currency?: string };
    batchSize: number;
}

export function OtherCostsSection({ control, otherCosts, settings, batchSize }: OtherCostsSectionProps) {
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'other_costs',
    });

    const [shippingModalOpen, setShippingModalOpen] = useState(false);
    // null = adding new, number = replacing existing at that index
    const [changingShippingIndex, setChangingShippingIndex] = useState<number | null>(null);

    const hasShippingItem = otherCosts.some((o) => o.is_shipping);

    const handleShippingSelect = (item: OtherCostItem) => {
        if (changingShippingIndex !== null) {
            update(changingShippingIndex, item);
            setChangingShippingIndex(null);
        } else {
            append(item);
        }
    };

    const openChangeShipping = (index: number) => {
        setChangingShippingIndex(index);
        setShippingModalOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Receipt className="h-4 w-4" /> Other Costs
            </div>

            <AddOtherCostForm settings={settings} onAdd={(data) => append(data)} />

            {!hasShippingItem && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                        setChangingShippingIndex(null);
                        setShippingModalOpen(true);
                    }}
                >
                    <Truck className="h-3.5 w-3.5 mr-1.5" />
                    Add Shipping Cost
                </Button>
            )}

            <ChooseShippingModal
                open={shippingModalOpen}
                onOpenChange={(open) => {
                    setShippingModalOpen(open);
                    if (!open) setChangingShippingIndex(null);
                }}
                onSelect={handleShippingSelect}
                currency={settings?.currency}
            />

            <div className="space-y-2">
                {fields.map((field, index) => {
                    const o = otherCosts[index];
                    if (!o) return null;

                    return (
                        <Card key={field.id} className="relative">
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                            <CardContent className="p-3">
                                <div className="flex items-center gap-1.5 pr-5">
                                    {o.is_shipping && (
                                        <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                    <div className="font-medium text-sm truncate">{o.item}</div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {o.quantity} × {formatCurrency(o.cost, settings.currency)}
                                    {o.per_batch && ' / batch'}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <div className="text-sm font-semibold text-primary">
                                        {formatCurrency(calculateOtherCost(o, batchSize), settings.currency)}
                                    </div>
                                    {o.is_shipping && (
                                        <button
                                            type="button"
                                            onClick={() => openChangeShipping(index)}
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <RefreshCw className="h-3 w-3" />
                                            Change
                                        </button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
