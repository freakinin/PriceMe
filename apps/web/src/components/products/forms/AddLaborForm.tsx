
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { laborItemSchema } from '@/types/product-form';
import { getCurrencySymbol } from '@/utils/currency';

interface AddLaborFormProps {
    onAdd: (data: z.infer<typeof laborItemSchema>) => void;
    settings: any;
}

export function AddLaborForm({ onAdd, settings }: AddLaborFormProps) {
    const [activity, setActivity] = useState('');
    const [minutes, setMinutes] = useState('');
    const [rate, setRate] = useState(settings.labor_hourly_cost?.toString() || '50');
    const [perBatch, setPerBatch] = useState(false);

    // Update rate if default settings change and user hasn't typed
    useEffect(() => {
        if (settings.labor_hourly_cost && rate === '50') {
            setRate(settings.labor_hourly_cost.toString());
        }
    }, [settings.labor_hourly_cost]);

    const handleAdd = () => {
        if (!activity || !minutes) return;

        onAdd({
            activity,
            time_minutes: parseInt(minutes) || 0,
            hourly_rate: parseFloat(rate) || 0,
            per_batch: perBatch
        });

        setActivity('');
        setMinutes('');
        setPerBatch(false);
        // Keep the rate as is or reset to default? Usually reset to default is better for new entries
        setRate(settings.labor_hourly_cost?.toString() || '50');
    };

    return (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
            <div>
                <label className="text-xs text-muted-foreground">Activity</label>
                <Input placeholder="Assembly, Painting..." value={activity} onChange={e => setActivity(e.target.value)} className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs text-muted-foreground">Minutes</label>
                    <Input type="number" placeholder="30" value={minutes} onChange={e => setMinutes(e.target.value)} className="h-9" />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground">Rate/hr ({getCurrencySymbol(settings.currency)})</label>
                    <Input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} className="h-9" />
                </div>
            </div>
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5">
                    <Checkbox checked={perBatch} onCheckedChange={(c) => setPerBatch(!!c)} id="labor-batch" />
                    <label htmlFor="labor-batch" className="text-xs">Per batch</label>
                </div>
                <Button type="button" variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/5 px-4" onClick={handleAdd}>
                    <Plus className="h-3 w-3 mr-0.5" /> Add
                </Button>
            </div>
        </div>
    );
}
