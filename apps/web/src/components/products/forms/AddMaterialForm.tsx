
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { MaterialNameInput } from '@/components/MaterialNameInput';
import { materialItemSchema } from '@/types/product-form';
import { getCurrencySymbol } from '@/utils/currency';

interface AddMaterialFormProps {
    onAdd: (data: z.infer<typeof materialItemSchema>) => void;
    settings: any;
}

export function AddMaterialForm({ onAdd, settings }: AddMaterialFormProps) {
    // Local state for the add form inputs
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('pcs');
    const [price, setPrice] = useState('');
    const [qtyType, setQtyType] = useState<'exact' | 'percentage'>('exact');
    const [percentage, setPercentage] = useState('10');
    const [perBatch, setPerBatch] = useState(false);
    const [unitsMade, setUnitsMade] = useState('1');
    const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

    const handleAdd = () => {
        if (!name) return;

        const finalQty = qtyType === 'exact' ? parseFloat(quantity) || 0 : 0;
        const finalPercentage = qtyType === 'percentage' ? parseFloat(percentage) : undefined;
        const finalUnitsMade = (qtyType === 'percentage' && perBatch) ? 1 : parseInt(unitsMade) || 1;

        onAdd({
            name,
            quantity: finalQty,
            unit,
            price_per_unit: parseFloat(price) || 0,
            quantity_type: qtyType,
            quantity_percentage: finalPercentage,
            per_batch: perBatch,
            units_made: finalUnitsMade,
            user_material_id: selectedMaterial?.id ? Number(selectedMaterial.id) : undefined,
            stock_level: selectedMaterial?.stock_level ? Number(selectedMaterial.stock_level) : undefined,
        });

        // Reset form
        setName('');
        setQuantity('');
        setUnit('pcs');
        setPrice('');
        setQtyType('exact');
        setPercentage('10');
        setPerBatch(false);
        setUnitsMade('1');
        setSelectedMaterial(null);
    };

    const handleMaterialSelect = (material: any) => {
        setSelectedMaterial(material);
        setName(material.name);
        setUnit(material.unit || 'pcs');
        setPrice(material.price_per_unit?.toString() || '');
        if (material.is_percentage_type) {
            setQtyType('percentage');
        }
    };

    return (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
            <div>
                <label className="text-xs text-muted-foreground">Material Name</label>
                <MaterialNameInput
                    value={name}
                    onChange={setName}
                    onMaterialSelect={handleMaterialSelect}
                    placeholder="Search or add new material"
                    className="h-9"
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                        Qty
                        <Tabs value={qtyType} onValueChange={(v) => setQtyType(v as 'exact' | 'percentage')}>
                            <TabsList className="h-5">
                                <TabsTrigger value="exact" className="text-[10px] px-1.5 h-4">Qt</TabsTrigger>
                                <TabsTrigger value="percentage" className="text-[10px] px-1.5 h-4">%</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </label>
                    {qtyType === 'exact' ? (
                        <Input type="number" step="0.01" placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value)} className="h-9" />
                    ) : (
                        <Select value={percentage} onValueChange={setPercentage}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => <SelectItem key={p} value={p.toString()}>{p}%</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div>
                    <label className="text-xs text-muted-foreground">Unit</label>
                    <Select value={unit} onValueChange={setUnit}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {['pcs', 'mm', 'cm', 'm', 'ml', 'L', 'g', 'kg'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs text-muted-foreground">Price/Unit ({getCurrencySymbol(settings.currency)})</label>
                    <Input type="number" step="0.01" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} disabled={!!selectedMaterial} className="h-9" />
                </div>
                {!(qtyType === 'percentage' && perBatch) && (
                    <div>
                        <label className="text-xs text-muted-foreground">Items Made</label>
                        <Input type="number" min="1" value={unitsMade} onChange={e => setUnitsMade(e.target.value)} className="h-9" />
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5">
                    <Checkbox checked={perBatch} onCheckedChange={(c) => setPerBatch(!!c)} id="mat-batch" />
                    <label htmlFor="mat-batch" className="text-xs">Per batch</label>
                </div>
                <Button type="button" variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/5 px-4" onClick={handleAdd}>
                    <Plus className="h-3 w-3 mr-0.5" /> Add
                </Button>
            </div>
        </div>
    );
}
