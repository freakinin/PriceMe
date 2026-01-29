import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Trash2, Edit2, Settings2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/currency';

interface VariantAttribute {
    attribute_name: string;
    attribute_value: string;
    display_order?: number;
}

export interface Variant {
    id?: number; // Optional on creation (handled by backend or temp ID)
    tempId?: string; // For frontend tracking
    name: string;
    sku?: string;
    price_override?: number;
    cost_override?: number;
    stock_level: number;
    is_active: boolean;
    attributes: VariantAttribute[];
}

interface VariantBuilderProps {
    variants: Variant[];
    onChange: (variants: Variant[]) => void;
    currency: string;
}

export function VariantBuilder({ variants, onChange, currency }: VariantBuilderProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentVariant, setCurrentVariant] = useState<Partial<Variant>>({
        name: '',
        stock_level: 0,
        attributes: [],
    });
    const [attributeName, setAttributeName] = useState('');
    const [attributeValue, setAttributeValue] = useState('');
    const [editingId, setEditingId] = useState<string | number | null>(null);

    const resetForm = () => {
        setCurrentVariant({
            name: '',
            sku: '',
            stock_level: 0,
            attributes: [],
            price_override: undefined,
            cost_override: undefined,
        });
        setAttributeName('');
        setAttributeValue('');
        setEditingId(null);
    };

    const handleAddAttribute = () => {
        if (!attributeName || !attributeValue) return;

        const newAttribute: VariantAttribute = {
            attribute_name: attributeName,
            attribute_value: attributeValue,
            display_order: (currentVariant.attributes?.length || 0) + 1,
        };

        const updatedAttributes = [...(currentVariant.attributes || []), newAttribute];

        // Auto-generate name if it's empty or seems auto-generated
        const autoName = updatedAttributes.map(a => a.attribute_value).join(' / ');
        const newName = !currentVariant.name || currentVariant.name === (currentVariant.attributes || []).map(a => a.attribute_value).join(' / ')
            ? autoName
            : currentVariant.name;

        setCurrentVariant({
            ...currentVariant,
            attributes: updatedAttributes,
            name: newName,
        });

        setAttributeName('');
        setAttributeValue('');
    };

    const removeAttribute = (index: number) => {
        const updatedAttributes = [...(currentVariant.attributes || [])];
        updatedAttributes.splice(index, 1);
        setCurrentVariant({ ...currentVariant, attributes: updatedAttributes });
    };

    const handleSaveVariant = () => {
        if (!currentVariant.name) return;

        const variantToSave: Variant = {
            ...currentVariant as Variant,
            tempId: currentVariant.tempId || crypto.randomUUID(),
            stock_level: currentVariant.stock_level || 0,
            is_active: true,
            attributes: currentVariant.attributes || [],
        };

        if (editingId) {
            onChange(variants.map(v => (v.tempId === editingId || v.id === editingId) ? variantToSave : v));
        } else {
            onChange([...variants, variantToSave]);
        }

        setIsDialogOpen(false);
        resetForm();
    };

    const handleEditVariant = (variant: Variant) => {
        setCurrentVariant({ ...variant });
        setEditingId(variant.id || variant.tempId || null);
        setIsDialogOpen(true);
    };

    const handleRemoveVariant = (id: string | number) => {
        onChange(variants.filter(v => (v.id !== id && v.tempId !== id)));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Settings2 className="h-4 w-4" />
                    Product Variants
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={resetForm}>
                            <Plus className="h-3 w-3 mr-1" /> Add Variant
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Variant' : 'Add New Variant'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name *</Label>
                                    <Input
                                        value={currentVariant.name}
                                        onChange={(e) => setCurrentVariant({ ...currentVariant, name: e.target.value })}
                                        placeholder="e.g. Small Red"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>SKU</Label>
                                    <Input
                                        value={currentVariant.sku || ''}
                                        onChange={(e) => setCurrentVariant({ ...currentVariant, sku: e.target.value })}
                                        placeholder="SKU-VAR-01"
                                    />
                                </div>
                            </div>

                            {/* Attributes Section */}
                            <div className="space-y-3 border rounded-md p-3 bg-muted/20">
                                <Label className="text-xs">Attributes (e.g. Size: Large)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={attributeName}
                                        onChange={(e) => setAttributeName(e.target.value)}
                                        placeholder="Name (e.g. Size)"
                                        className="h-8 text-xs"
                                    />
                                    <Input
                                        value={attributeValue}
                                        onChange={(e) => setAttributeValue(e.target.value)}
                                        placeholder="Value (e.g. Large)"
                                        className="h-8 text-xs"
                                    />
                                    <Button type="button" size="sm" variant="secondary" onClick={handleAddAttribute} className="h-8 px-2">
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                                {/* Attribute chips */}
                                <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                                    {currentVariant.attributes?.map((attr, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5 h-6 cursor-default">
                                            {attr.attribute_name}: {attr.attribute_value}
                                            <button
                                                onClick={() => removeAttribute(idx)}
                                                className="ml-1.5 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    {(!currentVariant.attributes || currentVariant.attributes.length === 0) && (
                                        <span className="text-xs text-muted-foreground italic">No attributes added</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <Label>Price ({currency})</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={currentVariant.price_override || ''}
                                        onChange={(e) => setCurrentVariant({
                                            ...currentVariant,
                                            price_override: e.target.value ? parseFloat(e.target.value) : undefined
                                        })}
                                        placeholder="Default"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cost ({currency})</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={currentVariant.cost_override || ''}
                                        onChange={(e) => setCurrentVariant({
                                            ...currentVariant,
                                            cost_override: e.target.value ? parseFloat(e.target.value) : undefined
                                        })}
                                        placeholder="Default"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Stock</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={currentVariant.stock_level}
                                        onChange={(e) => setCurrentVariant({
                                            ...currentVariant,
                                            stock_level: parseInt(e.target.value) || 0
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="button" onClick={handleSaveVariant}>Save Variant</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Variants List */}
            <div className="space-y-2">
                {variants.map((variant, index) => (
                    <Card key={variant.id || variant.tempId || index} className="relative overflow-hidden">
                        <div className="p-3 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <div className="font-medium text-sm flex items-center gap-2">
                                    {variant.name}
                                    {variant.sku && <span className="text-xs text-muted-foreground font-normal">({variant.sku})</span>}
                                </div>
                                <div className="flex gap-2">
                                    {variant.attributes?.map((attr, i) => (
                                        <Badge key={i} variant="outline" className="text-[10px] px-1 py-0 h-4 border-muted-foreground/30 text-muted-foreground">
                                            {attr.attribute_name}: {attr.attribute_value}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex flex-col items-end text-xs">
                                    <div className={variant.price_override ? "font-semibold text-primary" : "text-muted-foreground"}>
                                        {variant.price_override ? formatCurrency(variant.price_override, currency) : "Default Price"}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Stock: {variant.stock_level}
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditVariant(variant)}>
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/90" onClick={() => handleRemoveVariant(variant.id || variant.tempId!)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        {variant.cost_override && (
                            <div className="px-3 pb-2 text-[10px] text-muted-foreground">
                                Override Cost: {formatCurrency(variant.cost_override, currency)}
                            </div>
                        )}
                    </Card>
                ))}
                {variants.length === 0 && (
                    <div className="text-center p-4 border border-dashed rounded-lg text-sm text-muted-foreground bg-muted/10">
                        No variants added yet.
                    </div>
                )}
            </div>
        </div>
    );
}
