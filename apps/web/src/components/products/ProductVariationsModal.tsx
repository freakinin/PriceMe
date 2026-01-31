import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';

import { X, ArrowRight, ArrowLeft, Check, Plus } from 'lucide-react';

interface VariantAttribute {
    attribute_name: string;
    attribute_value: string;
    display_order?: number;
}

export interface Variant {
    id?: number;
    tempId?: string;
    name: string;
    sku?: string;
    price_override?: number;
    cost_override?: number;
    stock_level: number;
    is_active: boolean;
    attributes: VariantAttribute[];
}

interface ProductVariationsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    variants: Variant[];
    onSave: (variants: Variant[]) => void;
    currency: string;
}

const COMMON_VARIANT_TYPES = ['Size', 'Color', 'Material', 'Style', 'Weight', 'Dimensions'];

export function ProductVariationsModal({
    open,
    onOpenChange,
    variants: initialVariants,
    onSave,
    currency
}: ProductVariationsModalProps) {
    const [definedAttributes, setDefinedAttributes] = useState<{ name: string; options: string[] }[]>([]);
    const [view, setView] = useState<'list' | 'add_type' | 'add_options'>('list');

    // Setup state
    const [selectedType, setSelectedType] = useState<string>('');
    const [customType, setCustomType] = useState('');
    const [options, setOptions] = useState<string[]>([]);
    const [currentOption, setCurrentOption] = useState('');
    const [localVariants, setLocalVariants] = useState<Variant[]>(initialVariants || []);

    // Reset state when opening
    useEffect(() => {
        if (open) {
            setLocalVariants(initialVariants || []);
            // Extract existing attribute types to pre-populate
            if (initialVariants && initialVariants.length > 0) {
                const attrsMap = new Map<string, Set<string>>();

                initialVariants.forEach(v => {
                    // Method 1: Try structured attributes
                    if (v.attributes && v.attributes.length > 0) {
                        v.attributes.forEach((attr: any) => {
                            if (!attrsMap.has(attr.attribute_name)) {
                                attrsMap.set(attr.attribute_name, new Set());
                            }
                            attrsMap.get(attr.attribute_name)?.add(attr.attribute_value);
                        });
                    }
                    // Method 2: Fallback to parsing name string "Size: 10 / Material: Wood"
                    else if (v.name && v.name.includes(':')) {
                        const parts = v.name.split(' / ');
                        parts.forEach(part => {
                            const [key, val] = part.split(':').map(s => s.trim());
                            if (key && val) {
                                if (!attrsMap.has(key)) {
                                    attrsMap.set(key, new Set());
                                }
                                attrsMap.get(key)?.add(val);

                                // Also backfill the attribute into the variant struct for display
                                if (!v.attributes) v.attributes = [];
                                // Check if already exists to avoid dupes if mixed
                                if (!v.attributes.find(a => a.attribute_name === key)) {
                                    v.attributes.push({ attribute_name: key, attribute_value: val });
                                }
                            }
                        });
                    }
                });

                const reconstructedAttributes = Array.from(attrsMap.entries()).map(([name, optionsSet]) => ({
                    name,
                    options: Array.from(optionsSet)
                }));

                setDefinedAttributes(reconstructedAttributes);
            } else {
                setDefinedAttributes([]);
            }
        }
    }, [open, initialVariants]);

    // VIEW: ADD TYPE
    const handleTypeSelect = (type: string) => {
        if (type === 'create_new') {
            setSelectedType('create_new');
        } else {
            setSelectedType(type);
            setCustomType('');
        }
    };

    const handleNextToOptions = () => {
        const finalType = selectedType === 'create_new' ? customType : selectedType;
        if (!finalType) return;
        setView('add_options');
    };

    // VIEW: ADD OPTIONS
    const handleAddOption = () => {
        if (!currentOption.trim()) return;
        if (!options.includes(currentOption.trim())) {
            setOptions([...options, currentOption.trim()]);
        }
        setCurrentOption('');
    };

    const removeOption = (opt: string) => {
        setOptions(options.filter(o => o !== opt));
    };

    const handleSaveAttribute = () => {
        const finalType = selectedType === 'create_new' ? customType : selectedType;
        if (!options.length || !finalType) return;

        setDefinedAttributes([...definedAttributes, { name: finalType, options: [...options] }]);

        // Reset for next
        setSelectedType('');
        setCustomType('');
        setOptions([]);
        setCurrentOption('');
        setView('add_type'); // Go back to type selection to allow adding more
    };

    const handleGenerateMatrix = () => {
        if (definedAttributes.length === 0) return;

        // Generate Cartesian Product
        const generateCombinations = (
            attributes: { name: string; options: string[] }[],
            index: number = 0,
            current: { name: string; value: string }[] = []
        ): { name: string; value: string }[][] => {
            if (index === attributes.length) return [current];

            const combinations: { name: string; value: string }[][] = [];
            for (const option of attributes[index].options) {
                combinations.push(...generateCombinations(attributes, index + 1, [...current, { name: attributes[index].name, value: option }]));
            }
            return combinations;
        };

        const combos = generateCombinations(definedAttributes);

        const newVariants: Variant[] = combos.map(combo => ({
            tempId: crypto.randomUUID(),
            name: combo.map(c => `${c.name}: ${c.value}`).join(' / '),
            is_active: true,
            stock_level: 0,
            attributes: combo.map((c, i) => ({
                attribute_name: c.name,
                attribute_value: c.value,
                display_order: i + 1
            }))
        }));

        setLocalVariants(newVariants);
        setView('list');
    };

    // Helper to get attribute value for a variant
    const getAttributeValue = (variant: Variant, attrName: string) => {
        return variant.attributes.find(a => a.attribute_name === attrName)?.attribute_value || '-';
    };

    // VIEW: LIST (MANAGE)
    const toggleVariantStatus = (index: number) => {
        const updated = [...localVariants];
        updated[index].is_active = !updated[index].is_active;
        setLocalVariants(updated);
    };

    const updateVariantCost = (index: number, val: string) => {
        const updated = [...localVariants];
        updated[index].cost_override = val ? parseFloat(val) : undefined;
        setLocalVariants(updated);
    };

    const updateVariantSku = (index: number, val: string) => {
        const updated = [...localVariants];
        updated[index].sku = val;
        setLocalVariants(updated);
    };

    const updateVariantStock = (index: number, val: string) => {
        const updated = [...localVariants];
        updated[index].stock_level = parseInt(val) || 0;
        setLocalVariants(updated);
    };

    const handleSaveAndClose = () => {
        // Sanitize variants to ensure compatibility with Zod schema (no nulls for optional fields)
        const sanitizedVariants = localVariants.map(v => ({
            ...v,
            sku: v.sku === null || v.sku === '' ? undefined : v.sku,
            price_override: v.price_override === null ? undefined : v.price_override,
            cost_override: v.cost_override === null ? undefined : v.cost_override,
            stock_level: v.stock_level ?? 0,
        }));

        onSave(sanitizedVariants);
        onOpenChange(false);
    };

    const inSetupMode = view === 'add_type' || view === 'add_options';
    const hasAttributes = definedAttributes.length > 0;
    const canAddMoreAttributes = definedAttributes.length < 2;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl min-h-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {view === 'list' && 'Manage Variations'}
                        {view === 'add_type' && 'Choose Variation Type'}
                        {view === 'add_options' && 'Add Options'}
                    </DialogTitle>
                    <DialogDescription>
                        {view === 'list' && 'Adjust cost and visibility for each variant combination.'}
                        {view === 'add_type' && 'Select a variation type (e.g. Size, Color).'}
                        {view === 'add_options' && `Add options for ${selectedType === 'create_new' ? customType : selectedType}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 py-4 flex gap-6">

                    {/* Sidebar for Attributes (Only in Setup Mode) */}
                    {inSetupMode && (
                        <div className="w-1/3 border-r pr-4 space-y-4">
                            <h4 className="font-semibold text-sm">Defined Attributes</h4>
                            {hasAttributes ? (
                                <div className="space-y-3">
                                    {definedAttributes.map((attr, idx) => (
                                        <div key={idx} className="bg-muted/40 p-2 rounded-md text-sm">
                                            <div className="font-medium">{attr.name}</div>
                                            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-1">
                                                {attr.options.map(o => <Badge key={o} variant="outline" className="text-[10px] px-1 py-0">{o}</Badge>)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground italic">
                                    No attributes defined yet. Start by selecting a type.
                                </div>
                            )}

                            {hasAttributes && (
                                <Button className="w-full mt-4" onClick={handleGenerateMatrix}>
                                    Generate Variations
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className={inSetupMode ? "w-2/3" : "w-full"}>
                        {/* VIEW: ADD TYPE */}
                        {view === 'add_type' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {COMMON_VARIANT_TYPES.map(type => (
                                        <Button
                                            key={type}
                                            variant={selectedType === type ? 'default' : 'outline'}
                                            className="justify-start h-10 text-sm"
                                            onClick={() => handleTypeSelect(type)}
                                        >
                                            {type}
                                            {selectedType === type && <Check className="ml-auto h-3 w-3" />}
                                        </Button>
                                    ))}
                                    <Button
                                        variant={selectedType === 'create_new' ? 'default' : 'outline'}
                                        className="justify-start h-10 text-sm"
                                        onClick={() => handleTypeSelect('create_new')}
                                    >
                                        Create New...
                                        {selectedType === 'create_new' && <Check className="ml-auto h-3 w-3" />}
                                    </Button>
                                </div>

                                {selectedType === 'create_new' && (
                                    <div className="pt-2">
                                        <Label>Name of Variation</Label>
                                        <Input
                                            value={customType}
                                            onChange={e => setCustomType(e.target.value)}
                                            placeholder="e.g. Fabric Type"
                                            className="mt-1.5"
                                            autoFocus
                                        />
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end">
                                    <Button
                                        onClick={handleNextToOptions}
                                        disabled={!selectedType || (selectedType === 'create_new' && !customType)}
                                    >
                                        Next: Add Options <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* VIEW: ADD OPTIONS */}
                        {view === 'add_options' && (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={currentOption}
                                        onChange={e => setCurrentOption(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddOption()}
                                        placeholder="Type option and press Enter (e.g. Small)"
                                        autoFocus
                                    />
                                    <Button onClick={handleAddOption} type="button">Add</Button>
                                </div>

                                <div className="flex flex-wrap gap-2 min-h-[80px] p-3 border rounded-md bg-muted/10 items-start align-content-start">
                                    {options.map(opt => (
                                        <Badge key={opt} variant="secondary" className="pl-2 pr-1 py-1 text-sm">
                                            {opt}
                                            <button onClick={() => removeOption(opt)} className="ml-2 hover:text-destructive">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    {options.length === 0 && (
                                        <span className="text-muted-foreground text-sm italic w-full text-center mt-6">
                                            No options added yet.
                                        </span>
                                    )}
                                </div>

                                <div className="pt-4 flex justify-between">
                                    <Button variant="ghost" onClick={() => setView('add_type')}>
                                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                                    </Button>
                                    <Button onClick={handleSaveAttribute} disabled={options.length === 0}>
                                        Save Attribute & Add More
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* VIEW: LIST (MATRIX) */}
                        {view === 'list' && (
                            <div className="space-y-4">
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        // Reset attributes to start fresh or add to existing?
                                        // Simple mode: Start fresh builder, but this clears current unless we merge.
                                        // For now, let's just go to add_type
                                        setView('add_type');
                                    }} disabled={!canAddMoreAttributes && localVariants.length > 0}>
                                        <Plus className="h-4 w-4 mr-2" /> {canAddMoreAttributes ? 'Add Attributes' : 'Max Attributes Reached'}
                                    </Button>
                                </div>
                                <div className="border rounded-md overflow-hidden">
                                    <div className="w-full overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-muted-foreground bg-muted/50 font-medium">
                                                <tr>
                                                    {/* Dynamic Headers for Attributes */}
                                                    {definedAttributes.length > 0 ? (
                                                        definedAttributes.map(attr => (
                                                            <th key={attr.name} className="p-3 font-medium whitespace-nowrap w-[1%]">{attr.name}</th>
                                                        ))
                                                    ) : (
                                                        <th className="p-3 font-medium">Variant Name</th>
                                                    )}
                                                    <th className="p-3 font-medium w-[100px]">SKU</th>
                                                    <th className="p-3 font-medium w-[110px]">Cost ({currency})</th>
                                                    <th className="p-3 font-medium w-[90px]">Stock</th>
                                                    <th className="p-3 font-medium text-center w-[60px]">Active</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {localVariants.length === 0 && (
                                                    <tr>
                                                        <td colSpan={definedAttributes.length + 4} className="p-8 text-center text-muted-foreground italic">
                                                            No variants generated. Click "Add Attributes" to start.
                                                        </td>
                                                    </tr>
                                                )}
                                                {localVariants.map((variant, idx) => (
                                                    <tr key={idx} className={`group hover:bg-muted/5 ${!variant.is_active ? 'opacity-50 bg-muted/30' : ''}`}>
                                                        {/* Dynamic Cells for Attributes */}
                                                        {definedAttributes.length > 0 ? (
                                                            definedAttributes.map(attr => (
                                                                <td key={attr.name} className="p-3 align-middle text-sm whitespace-nowrap">
                                                                    {getAttributeValue(variant, attr.name)}
                                                                </td>
                                                            ))
                                                        ) : (
                                                            <td className="p-3 align-middle font-medium truncate max-w-[200px]" title={variant.name}>
                                                                {variant.name}
                                                            </td>
                                                        )}
                                                        <td className="p-3 align-middle">
                                                            <Input
                                                                type="text"
                                                                className="h-8 bg-background"
                                                                placeholder="SKU"
                                                                value={variant.sku || ''}
                                                                onChange={e => updateVariantSku(idx, e.target.value)}
                                                                disabled={!variant.is_active}
                                                            />
                                                        </td>
                                                        <td className="p-3 align-middle">
                                                            <Input
                                                                type="number"
                                                                className="h-8 bg-background"
                                                                placeholder="0.00"
                                                                value={variant.cost_override || ''}
                                                                onChange={e => updateVariantCost(idx, e.target.value)}
                                                                disabled={!variant.is_active}
                                                            />
                                                        </td>
                                                        <td className="p-3 align-middle">
                                                            <Input
                                                                type="number"
                                                                className="h-8 bg-background"
                                                                value={variant.stock_level}
                                                                onChange={e => updateVariantStock(idx, e.target.value)}
                                                                disabled={!variant.is_active}
                                                            />
                                                        </td>
                                                        <td className="p-3 align-middle text-center">
                                                            <Switch
                                                                checked={variant.is_active}
                                                                onCheckedChange={() => toggleVariantStatus(idx)}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {!inSetupMode && (
                    <DialogFooter>
                        <Button onClick={handleSaveAndClose}>
                            Save Changes & Close
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
