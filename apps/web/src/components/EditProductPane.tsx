import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency';
import { MaterialNameInput } from '@/components/MaterialNameInput';
import { useToast } from '@/components/ui/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// --- Validation Schemas ---

const materialItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  price_per_unit: z.number().min(0),
  units_made: z.number().min(1).default(1),
  user_material_id: z.number().optional(),
});

const laborItemSchema = z.object({
  activity: z.string().min(1, 'Activity is required'),
  time_spent_minutes: z.number().min(0),
  hourly_rate: z.number().min(0),
  per_unit: z.boolean().default(true),
});

const otherCostItemSchema = z.object({
  item: z.string().min(1, 'Item is required'),
  quantity: z.number().min(0),
  cost: z.number().min(0),
  per_unit: z.boolean().default(true),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  batch_size: z.number().int().min(1, 'Batch size must be at least 1'),
  target_price: z.number().optional(),
  pricing_method: z.enum(['markup', 'price', 'profit', 'margin']).optional(),
  pricing_value: z.number().optional(),
  materials: z.array(materialItemSchema),
  labor_costs: z.array(laborItemSchema),
  other_costs: z.array(otherCostItemSchema),
});

type ProductFormValues = z.infer<typeof productSchema>;

// --- Helper Functions ---

const formatNumberDisplay = (val: number | undefined | null): string => {
  if (val === null || val === undefined) return '-';
  // Remove trailing zeros
  return val.toString().replace(/(\.[0-9]*?)0+$/, '$1').replace(/\.$/, '');
};

// --- Sub-components for Adding Items ---

function AddMaterialForm({ onAdd }: { onAdd: (data: z.infer<typeof materialItemSchema>) => void }) {
  const form = useForm<z.infer<typeof materialItemSchema>>({
    resolver: zodResolver(materialItemSchema),
    defaultValues: { name: '', quantity: 0, unit: '', price_per_unit: 0, units_made: 1 }
  });

  const handleSubmit = (data: z.infer<typeof materialItemSchema>) => {
    onAdd(data);
    form.reset({ name: '', quantity: 0, unit: '', price_per_unit: 0, units_made: 1, user_material_id: undefined });
  };

  return (
    <Form {...form}>
      <div className="space-y-3 border rounded-md p-3 bg-muted/20">
        <div className="text-sm font-medium">Add Material</div>
        <div className="grid grid-cols-2 gap-2">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormControl>
              <MaterialNameInput
                {...field}
                value={field.value}
                className="h-8"
                placeholder="Name"
                onMaterialSelect={(m) => {
                  form.setValue('name', m.name);
                  form.setValue('unit', m.unit);
                  form.setValue('price_per_unit', m.price_per_unit);
                  form.setValue('user_material_id', m.id);
                }}
              />
            </FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem><FormControl><Input {...field} type="number" step="any" className="h-8" placeholder="Qty" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="unit" render={({ field }) => (
            <FormItem><FormControl><Input {...field} className="h-8" placeholder="Unit" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="price_per_unit" render={({ field }) => (
            <FormItem><FormControl><Input {...field} type="number" step="0.01" className="h-8" placeholder="Price/Unit" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="units_made" render={({ field }) => (
            <FormItem><FormControl><Input {...field} type="number" step="1" className="h-8" placeholder="Units Made" onChange={e => field.onChange(parseFloat(e.target.value) || 1)} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <Button type="button" size="sm" variant="outline" onClick={form.handleSubmit(handleSubmit)}><Plus className="mr-2 h-3 w-3" /> Add</Button>
      </div>
    </Form>
  );
}

function AddLaborForm({ onAdd, currency }: { onAdd: (data: z.infer<typeof laborItemSchema>) => void, currency: string }) {
  const form = useForm<z.infer<typeof laborItemSchema>>({
    resolver: zodResolver(laborItemSchema),
    defaultValues: { activity: '', time_spent_minutes: 0, hourly_rate: 0, per_unit: true }
  });

  const handleSubmit = (data: z.infer<typeof laborItemSchema>) => {
    onAdd(data);
    form.reset({ activity: '', time_spent_minutes: 0, hourly_rate: 0, per_unit: true });
  };

  return (
    <Form {...form}>
      <div className="space-y-3 border rounded-md p-3 bg-muted/20">
        <div className="text-sm font-medium">Add Labor</div>
        <div className="grid grid-cols-2 gap-2">
          <FormField control={form.control} name="activity" render={({ field }) => (
            <FormItem><FormControl><Input {...field} className="h-8" placeholder="Activity" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="time_spent_minutes" render={({ field }) => (
            <FormItem><FormControl><Input {...field} type="number" className="h-8" placeholder="Minutes" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="hourly_rate" render={({ field }) => (
            <FormItem><FormControl><Input {...field} type="number" step="0.01" className="h-8" placeholder={`Rate (${getCurrencySymbol(currency)})`} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="per_unit" render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0 border rounded p-1 bg-background"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-xs font-normal">Per Unit</FormLabel></FormItem>
          )} />
        </div>
        <Button type="button" size="sm" variant="outline" onClick={form.handleSubmit(handleSubmit)}><Plus className="mr-2 h-3 w-3" /> Add</Button>
      </div>
    </Form>
  );
}

function AddOtherCostForm({ onAdd, currency }: { onAdd: (data: z.infer<typeof otherCostItemSchema>) => void, currency: string }) {
  const form = useForm<z.infer<typeof otherCostItemSchema>>({
    resolver: zodResolver(otherCostItemSchema),
    defaultValues: { item: '', quantity: 1, cost: 0, per_unit: true }
  });

  const handleSubmit = (data: z.infer<typeof otherCostItemSchema>) => {
    onAdd(data);
    form.reset({ item: '', quantity: 1, cost: 0, per_unit: true });
  };

  return (
    <Form {...form}>
      <div className="space-y-3 border rounded-md p-3 bg-muted/20">
        <div className="text-sm font-medium">Add Other Cost</div>
        <div className="grid grid-cols-2 gap-2">
          <FormField control={form.control} name="item" render={({ field }) => (
            <FormItem><FormControl><Input {...field} className="h-8" placeholder="Item" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem><FormControl><Input {...field} type="number" className="h-8" placeholder="Qty" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="cost" render={({ field }) => (
            <FormItem><FormControl><Input {...field} type="number" step="0.01" className="h-8" placeholder={`Cost (${getCurrencySymbol(currency)})`} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="per_unit" render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0 border rounded p-1 bg-background"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-xs font-normal">Per Unit</FormLabel></FormItem>
          )} />
        </div>
        <Button type="button" size="sm" variant="outline" onClick={form.handleSubmit(handleSubmit)}><Plus className="mr-2 h-3 w-3" /> Add</Button>
      </div>
    </Form>
  );
}


// --- Main Component ---

interface EditProductPaneProps {
  productId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditProductPane({ productId, open, onOpenChange, onSuccess }: EditProductPaneProps) {
  const { settings } = useSettings();
  const { toast } = useToast();
  const { updateProduct } = useProducts();
  const [currentStep, setCurrentStep] = useState(1);

  // Fetch full product details
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null;
      const res = await api.get(`/products/${productId}`);
      return res.data.data;
    },
    enabled: !!productId && open,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      batch_size: 1,
      target_price: 0,
      materials: [],
      labor_costs: [],
      other_costs: []
    }
  });

  const { reset, control, handleSubmit } = form;

  const materialsArray = useFieldArray({ control, name: 'materials' });
  const laborArray = useFieldArray({ control, name: 'labor_costs' });
  const otherCostsArray = useFieldArray({ control, name: 'other_costs' });

  // Reset form when product loads or changes
  useEffect(() => {
    if (open && product) {
      reset({
        name: product.name,
        sku: product.sku || '',
        description: product.description || '',
        category: product.category || '',
        batch_size: product.batch_size || 1,
        target_price: product.target_price || 0,
        pricing_method: product.pricing_method || 'price',
        pricing_value: product.pricing_value || 0,
        materials: product.materials?.map((m: any) => ({
          name: m.name,
          quantity: Number(m.quantity),
          unit: m.unit,
          price_per_unit: Number(m.price_per_unit),
          units_made: Number(m.units_made || 1),
          user_material_id: m.user_material_id
        })) || [],
        labor_costs: product.labor_costs?.map((l: any) => ({
          activity: l.activity,
          time_spent_minutes: Number(l.time_spent_minutes),
          hourly_rate: Number(l.hourly_rate),
          per_unit: Boolean(l.per_unit ?? true)
        })) || [],
        other_costs: product.other_costs?.map((o: any) => ({
          item: o.item,
          quantity: Number(o.quantity),
          cost: Number(o.cost),
          per_unit: Boolean(o.per_unit ?? true)
        })) || []
      });
      setCurrentStep(1);
    }
  }, [open, product, reset]);

  const onFinalSubmit = async (data: ProductFormValues) => {
    if (!productId) return;
    try {
      await updateProduct({ id: productId, data });
      toast({ title: 'Success', description: 'Product updated successfully' });
      onSuccess();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update field' });
    }
  };

  if (!productId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Product</SheetTitle>
        </SheetHeader>

        {isLoadingProduct || !product ? (
          <div className="py-8 text-center text-muted-foreground">Loading product data...</div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Stepper */}
            <div className="flex items-center gap-1.5 text-xs mb-6">
              {[1, 2, 3, 4].map(step => (
                <div key={step} className="flex items-center gap-1.5">
                  {step > 1 && <div className="w-4 h-px bg-muted" />}
                  <button type="button" onClick={() => setCurrentStep(step)} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    <div className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium ${currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{step}</div>
                    <span className={currentStep >= step ? 'text-foreground' : 'text-muted-foreground'}>
                      {step === 1 ? 'Basic' : step === 2 ? 'Materials' : step === 3 ? 'Labor' : 'Other'}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            <Form {...form}>
              <form onSubmit={handleSubmit(onFinalSubmit)} className="space-y-6">

                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField control={control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={control} name="sku" render={({ field }) => (
                        <FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={control} name="batch_size" render={({ field }) => (
                        <FormItem><FormLabel>Batch Size</FormLabel><FormControl><Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value) || 1)} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={control} name="target_price" render={({ field }) => (
                      <FormItem><FormLabel>Target Price ({getCurrencySymbol(settings?.currency || 'USD')})</FormLabel><FormControl><Input {...field} value={field.value || ''} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                )}

                {/* Step 2: Materials */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <AddMaterialForm onAdd={(data) => materialsArray.append(data)} />

                    {materialsArray.fields.length > 0 && (
                      <div className="border rounded-md">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-2 font-medium">Material</th>
                              <th className="p-2 font-medium text-right">Qty</th>
                              <th className="p-2 font-medium text-right">Cost</th>
                              <th className="p-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {materialsArray.fields.map((field, index) => {
                              const cost = (field.quantity * field.price_per_unit) / field.units_made;
                              return (
                                <tr key={field.id} className="border-t">
                                  <td className="p-2">
                                    <div className="font-medium">{field.name}</div>
                                    <div className="text-xs text-muted-foreground">{formatNumberDisplay(field.quantity)} {field.unit} @ {formatCurrency(field.price_per_unit, settings?.currency || 'USD')}</div>
                                  </td>
                                  <td className="p-2 text-right">{formatNumberDisplay(field.quantity)}</td>
                                  <td className="p-2 text-right">{formatCurrency(cost, settings?.currency || 'USD')}</td>
                                  <td className="p-2 text-right"><Button type="button" variant="ghost" size="sm" onClick={() => materialsArray.remove(index)}><Trash2 className="h-3 w-3 text-destructive" /></Button></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Labor */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <AddLaborForm currency={settings?.currency || 'USD'} onAdd={(data) => laborArray.append(data)} />

                    {laborArray.fields.length > 0 && (
                      <div className="border rounded-md">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-2 font-medium">Activity</th>
                              <th className="p-2 font-medium text-right">Time</th>
                              <th className="p-2 font-medium text-right">Cost</th>
                              <th className="p-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {laborArray.fields.map((field, index) => {
                              const cost = (field.time_spent_minutes / 60) * field.hourly_rate;
                              return (
                                <tr key={field.id} className="border-t">
                                  <td className="p-2">
                                    <div className="font-medium">{field.activity}</div>
                                    <div className="text-xs text-muted-foreground">{field.per_unit ? 'Per Unit' : 'Batch'} @ {formatCurrency(field.hourly_rate, settings?.currency || 'USD')}/hr</div>
                                  </td>
                                  <td className="p-2 text-right">{field.time_spent_minutes}m</td>
                                  <td className="p-2 text-right">{formatCurrency(cost, settings?.currency || 'USD')}</td>
                                  <td className="p-2 text-right"><Button type="button" variant="ghost" size="sm" onClick={() => laborArray.remove(index)}><Trash2 className="h-3 w-3 text-destructive" /></Button></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Other Costs */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <AddOtherCostForm currency={settings?.currency || 'USD'} onAdd={(data) => otherCostsArray.append(data)} />

                    {otherCostsArray.fields.length > 0 && (
                      <div className="border rounded-md">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-2 font-medium">Item</th>
                              <th className="p-2 font-medium text-right">Qty</th>
                              <th className="p-2 font-medium text-right">Cost</th>
                              <th className="p-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {otherCostsArray.fields.map((field, index) => {
                              const cost = field.quantity * field.cost;
                              return (
                                <tr key={field.id} className="border-t">
                                  <td className="p-2">
                                    <div className="font-medium">{field.item}</div>
                                    <div className="text-xs text-muted-foreground">{field.per_unit ? 'Per Unit' : 'Batch'}</div>
                                  </td>
                                  <td className="p-2 text-right">{formatNumberDisplay(field.quantity)}</td>
                                  <td className="p-2 text-right">{formatCurrency(cost, settings?.currency || 'USD')}</td>
                                  <td className="p-2 text-right"><Button type="button" variant="ghost" size="sm" onClick={() => otherCostsArray.remove(index)}><Trash2 className="h-3 w-3 text-destructive" /></Button></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t mt-4">
                  <div>
                    {currentStep > 1 && <Button type="button" variant="outline" onClick={() => setCurrentStep(s => s - 1)}><ChevronLeft className="mr-2 h-3 w-3" /> Back</Button>}
                  </div>
                  <div className="flex gap-2">
                    {currentStep < 4 ? (
                      <Button type="button" onClick={() => setCurrentStep(s => s + 1)}>Next <ChevronRight className="ml-2 h-3 w-3" /></Button>
                    ) : (
                      <Button type="submit">Save Changes</Button>
                    )}
                    {/* Always allow saving */}
                    {currentStep < 4 && <Button type="submit" variant="secondary">Save</Button>}
                  </div>
                </div>
              </form>
            </Form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
