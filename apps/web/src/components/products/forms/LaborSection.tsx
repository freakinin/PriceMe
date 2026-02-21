
import { type Control, useFieldArray } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, X } from 'lucide-react';
import { AddLaborForm } from './AddLaborForm';
import { calculateLaborCost } from '@/utils/product-calculations';
import { formatCurrency } from '@/utils/currency';
import { type ProductFormValues, laborItemSchema } from '@/types/product-form';
import { z } from 'zod';

interface LaborSectionProps {
    control: Control<ProductFormValues>;
    laborCosts: z.infer<typeof laborItemSchema>[];
    settings: any;
    batchSize: number;
}

export function LaborSection({ control, laborCosts, settings, batchSize }: LaborSectionProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'labor_costs',
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" /> Labor
            </div>

            <AddLaborForm settings={settings} onAdd={(data) => append(data)} />

            <div className="space-y-2">
                {fields.map((field, index) => {
                    const l = laborCosts[index];
                    if (!l) return null;

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
                                <div className="font-medium text-sm truncate pr-4">{l.activity}</div>
                                <div className="text-xs text-muted-foreground">
                                    {l.time_minutes} min @ {formatCurrency(l.hourly_rate, settings.currency)}/hr
                                    {l.per_batch && ' / batch'}
                                </div>
                                <div className="text-sm font-semibold text-primary mt-1">
                                    {formatCurrency(calculateLaborCost(l, batchSize), settings.currency)}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
