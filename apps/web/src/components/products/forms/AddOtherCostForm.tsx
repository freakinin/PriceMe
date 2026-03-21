
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { otherCostItemSchema } from '@/types/product-form';
import { getCurrencySymbol } from '@/utils/currency';

interface AddOtherCostFormProps {
    onAdd: (data: z.infer<typeof otherCostItemSchema>) => void;
    settings: any;
}

export function AddOtherCostForm({ onAdd, settings }: AddOtherCostFormProps) {
    const [item, setItem] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [cost, setCost] = useState('');
    const [perBatch, setPerBatch] = useState(false);

    const handleAdd = () => {
        if (!item || !cost) return;
        onAdd({
            item,
            quantity: parseFloat(quantity) || 1,
            cost: parseFloat(cost) || 0,
            per_batch: perBatch,
            is_shipping: false,
        });
        setItem('');
        setQuantity('1');
        setCost('');
        setPerBatch(false);
    };

    return (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
            <div>
                <label className="text-xs text-muted-foreground">Item</label>
                <Input placeholder="Packaging, Shipping..." value={item} onChange={e => setItem(e.target.value)} className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs text-muted-foreground">Qty</label>
                    <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="h-9" />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground">Cost ({getCurrencySymbol(settings.currency)})</label>
                    <Input type="number" step="0.01" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} className="h-9" />
                </div>
            </div>
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5">
                    <Checkbox checked={perBatch} onCheckedChange={(c) => setPerBatch(!!c)} id="other-batch" />
                    <label htmlFor="other-batch" className="text-xs">Per batch</label>
                </div>
                <Button type="button" variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/5 px-4" onClick={handleAdd}>
                    <Plus className="h-3 w-3 mr-0.5" /> Add
                </Button>
            </div>
        </div>
    );
}
