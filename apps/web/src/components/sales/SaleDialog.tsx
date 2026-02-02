import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSaleSchema } from '@priceme/shared';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/currency';
import { useSettings } from '@/hooks/useSettings';
import type { CreateSaleInput } from '@/hooks/useSales';
import type { Product } from '@/hooks/useProducts';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface SaleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product;
    onSave: (data: CreateSaleInput) => Promise<void>;
}

export function SaleDialog({ open, onOpenChange, product, onSave }: SaleDialogProps) {
    const { settings } = useSettings();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');

    const form = useForm<CreateSaleInput>({
        resolver: zodResolver(createSaleSchema),
        defaultValues: {
            product_id: product.id,
            quantity: 1,
            unit_price: product.target_price || 0,
            sale_date: new Date().toISOString(),
            discount_amount: 0,
            discount_percentage: 0,
            platform: 'Direct',
        }
    });

    const { control, handleSubmit, watch, setValue, reset, register } = form;
    const quantity = watch('quantity');
    const unitPrice = watch('unit_price');
    const discountAmount = watch('discount_amount');

    // Reset form when product changes or dialog opens
    useEffect(() => {
        if (open) {
            reset({
                product_id: product.id,
                quantity: 1,
                unit_price: product.target_price || 0,
                sale_date: new Date().toISOString(),
                discount_amount: 0,
                discount_percentage: 0,
                platform: 'Direct',
                variant_id: null
            });
            setDiscountType('amount');
        }
    }, [open, product, reset]);

    const handleDiscountAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            setValue('discount_amount', val);
            // Update percentage
            const total = unitPrice * quantity;
            if (total > 0) {
                const pct = (val / total) * 100;
                setValue('discount_percentage', Number(pct.toFixed(2)));
            } else {
                setValue('discount_percentage', 0);
            }
        }
    };

    const handleDiscountPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            setValue('discount_percentage', val);
            // Update amount
            const total = unitPrice * quantity;
            const amt = total * (val / 100);
            setValue('discount_amount', Number(amt.toFixed(2)));
        }
    };

    const onSubmit = async (data: CreateSaleInput) => {
        setIsSubmitting(true);
        try {
            await onSave(data);
            onOpenChange(false);
        } catch (error) {
            // Error handled by parent
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalRevenue = Math.max(0, (unitPrice * quantity) - discountAmount);




    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Record Sale</DialogTitle>
                    <DialogDescription>
                        Record a new sale for <span className="font-semibold text-foreground">{product.name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Product & Variant */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Product</Label>
                            <Input value={product.name} disabled className="bg-muted" />
                        </div>
                        {/* Variant selector placeholder */}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                {...register('quantity', { valueAsNumber: true })}
                                onChange={(e) => {
                                    register('quantity', { valueAsNumber: true }).onChange(e);
                                    // Recalculate discount interactions if needed, strictly simpler to just rely on user adjusting discount if quantity changes
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Unit Price ({settings.currency})</Label>
                            <Input type="number" step="0.01" {...register('unit_price', { valueAsNumber: true })} />
                        </div>
                    </div>

                    {/* Discount Section */}
                    <div className="border p-4 rounded-md space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Discount</Label>
                            <div className="flex items-center space-x-2">
                                <Label className="text-xs text-muted-foreground">Type:</Label>
                                <Tabs value={discountType} onValueChange={(v) => setDiscountType(v as any)} className="w-[120px]">
                                    <TabsList className="grid w-full grid-cols-2 h-7">
                                        <TabsTrigger value="amount" className="text-xs h-6 px-1">$</TabsTrigger>
                                        <TabsTrigger value="percentage" className="text-xs h-6 px-1">%</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {discountType === 'amount' ? (
                                <div className="space-y-2">
                                    <Label>Amount ({settings.currency})</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        onChange={handleDiscountAmountChange}
                                        defaultValue={0}
                                        // We don't bind directly with register because we handle change manually to sync
                                        // Actually we should bind value.
                                        value={form.watch('discount_amount')}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Percentage (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        onChange={handleDiscountPercentageChange}
                                        defaultValue={0}
                                        value={form.watch('discount_percentage')}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Coupon Code (Optional)</Label>
                                <Input {...register('coupon_code')} placeholder="e.g. SUMMER24" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Platform</Label>
                            <Controller
                                control={control}
                                name="platform"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value || 'Direct'}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select platform" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Direct">Direct/In-Person</SelectItem>
                                            <SelectItem value="Etsy">Etsy</SelectItem>
                                            <SelectItem value="Shopify">Shopify</SelectItem>
                                            <SelectItem value="Amazon">Amazon</SelectItem>
                                            <SelectItem value="eBay">eBay</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Date</Label>
                            <Controller
                                control={control}
                                name="sale_date"
                                render={({ field }) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(new Date(field.value), "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value ? new Date(field.value) : undefined}
                                                onSelect={(date) => field.onChange(date?.toISOString())}
                                                initialFocus
                                                disabled={(date) => date > new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input {...register('notes')} placeholder="Optional notes about this sale" />
                    </div>

                    {/* Summary */}
                    <div className="bg-muted/50 border p-4 rounded-lg flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span>{formatCurrency(unitPrice * quantity, settings.currency)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Discount:</span>
                            <span className="text-red-600">-{formatCurrency(discountAmount, settings.currency)}</span>
                        </div>
                        <div className="h-px bg-border my-1" />
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-base">Total Revenue</span>
                            <span className="text-xl font-bold text-primary">{formatCurrency(totalRevenue, settings.currency)}</span>
                        </div>
                        {/* Optional profit preview if we had cost available */}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>Record Sale</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
