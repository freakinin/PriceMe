
import { type Control, useFieldArray } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Receipt, X } from 'lucide-react';
import { AddOtherCostForm } from './AddOtherCostForm';
import { calculateOtherCost } from '@/utils/product-calculations';
import { formatCurrency } from '@/utils/currency';
import { type ProductFormValues, otherCostItemSchema } from '@/types/product-form';
import { z } from 'zod';

interface OtherCostsSectionProps {
    control: Control<ProductFormValues>;
    otherCosts: z.infer<typeof otherCostItemSchema>[];
    settings: any;
    batchSize: number;
}

export function OtherCostsSection({ control, otherCosts, settings, batchSize }: OtherCostsSectionProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'other_costs',
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Receipt className="h-4 w-4" /> Other Costs
            </div>

            <AddOtherCostForm settings={settings} onAdd={(data) => append(data)} />

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
                                <div className="font-medium text-sm truncate pr-4">{o.item}</div>
                                <div className="text-xs text-muted-foreground">
                                    {o.quantity} × {formatCurrency(o.cost, settings.currency)}
                                    {o.per_batch && ' / batch'}
                                </div>
                                <div className="text-sm font-semibold text-primary mt-1">
                                    {formatCurrency(calculateOtherCost(o, batchSize), settings.currency)}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
