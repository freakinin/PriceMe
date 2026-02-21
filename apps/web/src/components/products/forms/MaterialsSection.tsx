
import { type Control, useFieldArray } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Save, X } from 'lucide-react';
import { AddMaterialForm } from './AddMaterialForm';
import { calculateMaterialCost } from '@/utils/product-calculations';
import { formatCurrency } from '@/utils/currency';
import type { ProductFormValues } from '@/types/product-form';
import { materialItemSchema } from '@/types/product-form';
import { z } from 'zod';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface MaterialsSectionProps {
    control: Control<ProductFormValues>;
    materials: z.infer<typeof materialItemSchema>[];
    settings: any;
    batchSize: number;
}

export function MaterialsSection({ control, materials, settings, batchSize }: MaterialsSectionProps) {
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'materials',
    });
    const { toast } = useToast();

    const handleSaveToLibrary = async (material: z.infer<typeof materialItemSchema>, index: number) => {
        if (material.user_material_id) return;

        try {
            let quantity = 0;
            let stockLevel = 0;

            if (material.quantity_type === 'percentage') {
                stockLevel = material.stock_level || 1;
                quantity = stockLevel;
            } else {
                quantity = material.quantity || 0;
                stockLevel = material.stock_level || quantity;
            }

            const price = quantity * material.price_per_unit;

            const response = await api.post('/materials', {
                name: material.name,
                price: price,
                quantity: quantity,
                unit: material.unit,
                price_per_unit: material.price_per_unit,
                stock_level: stockLevel,
            });

            if (response.data.status === 'success') {
                const savedMaterial = response.data.data;
                // Update specific item in array
                const updated = { ...material, user_material_id: savedMaterial.id, stock_level: savedMaterial.stock_level || 0 };
                update(index, updated);

                toast({
                    variant: 'success',
                    title: 'Material saved',
                    description: `${material.name} has been added to your library.`,
                });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to save material to library',
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Package className="h-4 w-4" /> Materials
            </div>

            <AddMaterialForm settings={settings} onAdd={(data) => append(data)} />

            <div className="space-y-2">
                {fields.map((field, index) => {
                    const m = materials[index];
                    if (!m) return null;

                    return (
                        <Card key={field.id} className="relative">
                            <div className="absolute top-2 right-2 flex gap-1">
                                {!m.user_material_id && (
                                    <button
                                        type="button"
                                        onClick={() => handleSaveToLibrary(m, index)}
                                        className="text-muted-foreground hover:text-primary"
                                        title="Save to library"
                                    >
                                        <Save className="h-3 w-3" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                            <CardContent className="p-3">
                                <div className="font-medium text-sm truncate pr-8">{m.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {m.quantity_type === 'percentage'
                                        ? `${m.quantity_percentage}%`
                                        : `${m.quantity} ${m.unit}`}
                                    {m.units_made > 1 && ` → ${m.units_made} items`}
                                    {m.per_batch && ' / batch'}
                                    {m.user_material_id && ' ✓'}
                                </div>
                                <div className="text-sm font-semibold text-primary mt-1">
                                    {formatCurrency(calculateMaterialCost(m, batchSize), settings.currency)}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
