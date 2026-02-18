import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Settings2, BarChart2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency';
import { MaterialNameInput } from '@/components/MaterialNameInput';
import { useToast } from '@/components/ui/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { CategorySelect } from '@/components/CategorySelect';
import { MarketAnalysisPanel } from '@/components/MarketAnalysisPanel';
import { ProductVariationsModal, type Variant } from '@/components/products/ProductVariationsModal';

// --- Validation Schemas ---
const materialItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.coerce.number().min(0, 'Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  price_per_unit: z.coerce.number().min(0),
  units_made: z.coerce.number().min(1).default(1),
  user_material_id: z.number().nullable().optional(),
});

const laborItemSchema = z.object({
  activity: z.string().min(1, 'Activity is required'),
  time_spent_minutes: z.coerce.number().min(0),
  hourly_rate: z.coerce.number().min(0),
  per_unit: z.boolean().default(true),
});

const otherCostItemSchema = z.object({
  item: z.string().min(1, 'Item is required'),
  quantity: z.coerce.number().min(0),
  cost: z.coerce.number().min(0),
  per_unit: z.boolean().default(true),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  category_id: z.number().nullable().optional(),
  batch_size: z.coerce.number().int().min(1, 'Batch size must be at least 1'),
  target_price: z.coerce.number().optional(),
  pricing_method: z.enum(['markup', 'price', 'profit', 'margin']).optional(),
  pricing_value: z.coerce.number().optional(),
  materials: z.array(materialItemSchema),
  labor_costs: z.array(laborItemSchema),
  other_costs: z.array(otherCostItemSchema),
});

type ProductFormValues = z.infer<typeof productSchema>;

// --- Helper Functions ---
const formatNumberDisplay = (val: number | undefined | null): string => {
  if (val === null || val === undefined) return '-';
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
  const [activeTab, setActiveTab] = useState('basic');

  // New State for Split View
  const [isMarketAnalysisOpen, setIsMarketAnalysisOpen] = useState(false);

  // Variations State
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);

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
      category: '',
      category_id: null,
      batch_size: 1,
      target_price: 0,
      materials: [],
      labor_costs: [],
      other_costs: []
    }
  });

  const { reset, control, handleSubmit, watch } = form;
  const currentPrice = watch('target_price') || 0;
  const watchedName = watch('name');

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
        category_id: product.category_id || null,
        batch_size: Number(product.batch_size) || 1,
        target_price: Number(product.target_price) || 0,
        pricing_method: product.pricing_method || 'price',
        pricing_value: Number(product.pricing_value) || 0,
        materials: product.materials?.map((m: any) => ({
          name: m.name || '',
          quantity: Number(m.quantity) || 0,
          unit: m.unit || '',
          price_per_unit: Number(m.price_per_unit) || 0,
          units_made: Number(m.units_made) || 1,
          user_material_id: m.user_material_id
        })) || [],
        labor_costs: product.labor_costs?.map((l: any) => ({
          activity: l.activity || '',
          time_spent_minutes: Number(l.time_spent_minutes) || 0,
          hourly_rate: Number(l.hourly_rate) || 0,
          per_unit: Boolean(l.per_unit ?? true)
        })) || [],
        other_costs: product.other_costs?.map((o: any) => ({
          item: o.item || '',
          quantity: Number(o.quantity) || 0,
          cost: Number(o.cost) || 0,
          per_unit: Boolean(o.per_unit ?? true)
        })) || []
      });

      // Load variants
      if (product.variants) {
        setVariants(product.variants.map((v: any) => ({
          name: v.name,
          sku: v.sku || '',
          price_override: v.price_override ? Number(v.price_override) : undefined,
          cost_override: v.cost_override ? Number(v.cost_override) : undefined,
          stock_level: v.stock_level || 0,
          is_active: v.is_active ?? true,
          attributes: v.attributes || [],
        })));
      } else {
        setVariants([]);
      }

      setActiveTab('basic');
    }
  }, [open, product, reset]);

  const onFinalSubmit = async (data: ProductFormValues) => {
    if (!productId) return;
    try {
      const updateData = {
        ...data,
        sku: data.sku || undefined,
        variants: variants.map(v => ({
          name: v.name,
          sku: v.sku,
          price_override: v.price_override,
          cost_override: v.cost_override,
          stock_level: v.stock_level,
          is_active: v.is_active,
          attributes: v.attributes
        })),
      };
      await updateProduct({ id: productId, data: updateData });
      toast({ variant: 'success', title: 'Success', description: 'Product updated successfully' });
      onSuccess();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update field' });
    }
  };

  const getErrorMessage = (error: any): string => {
    if (typeof error.message === 'string') return error.message;
    if (Array.isArray(error)) return error.map(getErrorMessage).join(', ');
    if (typeof error === 'object') return Object.values(error).map(getErrorMessage).join(', ');
    return 'Invalid field';
  };

  const onInvalid = (errors: any) => {
    console.error('Form validation errors:', errors);
    const messages: string[] = [];
    Object.keys(errors).forEach(key => {
      const message = getErrorMessage(errors[key]);
      messages.push(`${key}: ${message}`);
    });
    toast({
      variant: 'destructive',
      title: 'Validation Error',
      description: messages.slice(0, 3).join('\n') + (messages.length > 3 ? '\n...' : ''),
    });
  };

  if (!productId) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={`transition-all duration-300 ease-in-out ${isMarketAnalysisOpen ? 'w-screen sm:max-w-none sm:w-[95vw]' : 'w-full sm:max-w-2xl'} overflow-y-auto p-0 flex flex-col`}
        >
          {/* Header */}
          <div className="flex-none p-6 pb-2">
            <SheetHeader className="flex flex-row items-center justify-between space-y-0">
              <SheetTitle>Edit {watchedName || product?.name || 'Product'}</SheetTitle>
              <div className="flex items-center gap-2">
                {/* Variations Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setIsVariationsModalOpen(true)}
                  title={variants.length > 0 ? `Manage Variations (${variants.length})` : 'Add Variations'}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>

                {/* Toggle Market Analysis Button */}
                <Button
                  variant={isMarketAnalysisOpen ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setIsMarketAnalysisOpen(!isMarketAnalysisOpen)}
                  className="h-9 w-9"
                  title={isMarketAnalysisOpen ? 'Close Market Analysis' : 'Competitor Analysis'}
                >
                  <BarChart2 className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>
          </div>

          {/* Main Content Area - Split View */}
          <div className={`flex-1 flex overflow-hidden`}>
            {/* Left/Main Panel: Product Form */}
            <div className={`flex-1 overflow-y-auto p-6 pt-2 h-full ${isMarketAnalysisOpen ? 'border-r' : ''}`}>
              {isLoadingProduct || !product ? (
                <div className="py-8 text-center text-muted-foreground">Loading product data...</div>
              ) : (
                <div className="space-y-6 h-full flex flex-col">
                  <Form {...form}>
                    <form onSubmit={handleSubmit(onFinalSubmit, onInvalid)} className="flex flex-col h-full">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                          <TabsTrigger value="basic">Basic</TabsTrigger>
                          <TabsTrigger value="materials">Materials</TabsTrigger>
                          <TabsTrigger value="labor">Labor</TabsTrigger>
                          <TabsTrigger value="other">Other</TabsTrigger>
                        </TabsList>

                        {/* Tab 1: Basic Info */}
                        <TabsContent value="basic" className="space-y-4 mt-0">
                          <FormField control={control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={control} name="category_id" render={({ field }) => (
                            <FormItem><FormLabel>Category</FormLabel><FormControl>
                              <CategorySelect
                                value={field.value}
                                onChange={(val) => {
                                  field.onChange(val);
                                  form.setValue('category', undefined);
                                }}
                              />
                            </FormControl><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={control} name="sku" render={({ field }) => (
                              <FormItem><FormLabel>SKU</FormLabel><FormControl><Input placeholder="SKU-001" autoComplete="off" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={control} name="batch_size" render={({ field }) => (
                              <FormItem><FormLabel>Batch Size</FormLabel><FormControl><Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value) || 1)} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                          <FormField control={control} name="target_price" render={({ field }) => (
                            <FormItem><FormLabel>Target Price ({getCurrencySymbol(settings?.currency || 'USD')})</FormLabel><FormControl><Input {...field} value={field.value || ''} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </TabsContent>

                        {/* Tab 2: Materials */}
                        <TabsContent value="materials" className="space-y-4 mt-0">
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
                        </TabsContent>

                        {/* Tab 3: Labor */}
                        <TabsContent value="labor" className="space-y-4 mt-0">
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
                        </TabsContent>

                        {/* Tab 4: Other Costs */}
                        <TabsContent value="other" className="space-y-4 mt-0">
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
                        </TabsContent>

                        <div className="flex justify-between gap-2 pt-6 mt-6 border-t flex-none">
                          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                          <Button type="submit">Save Changes</Button>
                        </div>
                      </Tabs>
                    </form>
                  </Form>
                </div>
              )}
            </div>

            {/* Right Panel: Market Analysis */}
            {isMarketAnalysisOpen && product && (
              <div className="flex-1 w-1/2 overflow-hidden h-full">
                {/* w-1/2 ensures it takes half space when in flex container */}
                <MarketAnalysisPanel
                  product={{
                    ...product,
                    target_price: currentPrice
                  }}
                  currency={settings?.currency || 'USD'}
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ProductVariationsModal
        open={isVariationsModalOpen}
        onOpenChange={setIsVariationsModalOpen}
        variants={variants}
        onSave={setVariants}
        currency={getCurrencySymbol(settings.currency)}
      />
    </>
  );
}
