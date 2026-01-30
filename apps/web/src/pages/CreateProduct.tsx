
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Package, Clock, Receipt, Save } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import api from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency';
import { MaterialNameInput } from '@/components/MaterialNameInput';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { VariantBuilder, type Variant } from '@/components/products/VariantBuilder';
import { useProducts } from '@/hooks/useProducts';
import { useProductPricing } from '@/hooks/useProductPricing';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Types & Schemas ---

const materialItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  price_per_unit: z.number().min(0),
  quantity_type: z.enum(['exact', 'percentage']).default('exact'),
  quantity_percentage: z.number().min(0).max(100).optional(),
  per_batch: z.boolean().default(false),
  units_made: z.number().min(1).default(1),
  user_material_id: z.number().optional(),
  stock_level: z.number().optional(), // Used for display/validation
});

const laborItemSchema = z.object({
  activity: z.string().min(1, 'Activity is required'),
  time_minutes: z.number().min(0),
  hourly_rate: z.number().min(0),
  per_batch: z.boolean().default(false),
});

const otherCostItemSchema = z.object({
  item: z.string().min(1, 'Item is required'),
  quantity: z.number().min(0),
  cost: z.number().min(0),
  per_batch: z.boolean().default(false),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  batch_size: z.number().int().positive().min(1).default(1),
  target_price: z.number().nonnegative().optional(),
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

function AddMaterialForm({ onAdd, settings }: { onAdd: (data: z.infer<typeof materialItemSchema>) => void, settings: any }) {
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
      user_material_id: selectedMaterial?.id,
      stock_level: selectedMaterial?.stock_level,
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

      <div className="flex items-center gap-1.5">
        <Checkbox checked={perBatch} onCheckedChange={(c) => setPerBatch(!!c)} id="mat-batch" />
        <label htmlFor="mat-batch" className="text-xs">Per batch</label>
      </div>
      <Button type="button" size="sm" className="w-full" onClick={handleAdd}><Plus className="h-3 w-3 mr-1" /> Add</Button>
    </div>
  );
}

function AddLaborForm({ onAdd, settings }: { onAdd: (data: z.infer<typeof laborItemSchema>) => void, settings: any }) {
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
      <div className="flex items-center gap-1.5">
        <Checkbox checked={perBatch} onCheckedChange={(c) => setPerBatch(!!c)} id="labor-batch" />
        <label htmlFor="labor-batch" className="text-xs">Per batch</label>
      </div>
      <Button type="button" size="sm" className="w-full" onClick={handleAdd}><Plus className="h-3 w-3 mr-1" /> Add</Button>
    </div>
  );
}

function AddOtherCostForm({ onAdd, settings }: { onAdd: (data: z.infer<typeof otherCostItemSchema>) => void, settings: any }) {
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
      per_batch: perBatch
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
      <div className="flex items-center gap-1.5">
        <Checkbox checked={perBatch} onCheckedChange={(c) => setPerBatch(!!c)} id="other-batch" />
        <label htmlFor="other-batch" className="text-xs">Per batch</label>
      </div>
      <Button type="button" size="sm" className="w-full" onClick={handleAdd}><Plus className="h-3 w-3 mr-1" /> Add</Button>
    </div>
  );
}


// --- Main Component ---

export default function CreateProduct() {
  const navigate = useNavigate();
  const { setOpen } = useSidebar();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { createProduct } = useProducts();
  // Helper used for display calculations, similar to Products page, but here we calculate on the fly
  const { calculateProfitFromPrice } = useProductPricing();

  const [variants, setVariants] = useState<Variant[]>([]);

  useEffect(() => {
    setOpen(false);
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      batch_size: 1,
      target_price: undefined,
      materials: [],
      labor_costs: [],
      other_costs: []
    }
  });

  const { control, handleSubmit, watch } = form;

  // Arrays
  const materialsArray = useFieldArray({ control, name: 'materials' });
  const laborArray = useFieldArray({ control, name: 'labor_costs' });
  const otherCostsArray = useFieldArray({ control, name: 'other_costs' });

  // Watch values for live calculations
  const batchSize = watch('batch_size') || 1;
  const materials = watch('materials');
  const laborCosts = watch('labor_costs');
  const otherCosts = watch('other_costs');
  const targetPrice = watch('target_price') || 0;

  // --- Calculations ---

  const calculateMaterialCost = (m: z.infer<typeof materialItemSchema>) => {
    const unitsMade = m.units_made || 1;
    let costPerProduct = 0;
    if (m.quantity_type === 'percentage' && m.quantity_percentage) {
      const percentage = m.quantity_percentage / 100;
      if (m.per_batch) {
        costPerProduct = (m.price_per_unit * percentage) / batchSize;
      } else {
        costPerProduct = m.price_per_unit * percentage;
      }
    } else {
      costPerProduct = (m.quantity * m.price_per_unit) / unitsMade;
    }
    return costPerProduct;
  };

  const calculateLaborCost = (l: z.infer<typeof laborItemSchema>) => {
    const cost = (l.time_minutes / 60) * l.hourly_rate;
    return l.per_batch ? cost / batchSize : cost;
  };

  const calculateOtherCost = (o: z.infer<typeof otherCostItemSchema>) => {
    const cost = o.quantity * o.cost;
    return o.per_batch ? cost / batchSize : cost;
  };

  const totalMaterialsCost = materials?.reduce((sum, m) => sum + calculateMaterialCost(m), 0) || 0;
  const totalLaborCost = laborCosts?.reduce((sum, l) => sum + calculateLaborCost(l), 0) || 0;
  const totalOtherCost = otherCosts?.reduce((sum, o) => sum + calculateOtherCost(o), 0) || 0;
  const totalCostPerProduct = totalMaterialsCost + totalLaborCost + totalOtherCost;

  const { profit, margin, markup } = calculateProfitFromPrice(targetPrice, totalCostPerProduct);

  // --- Actions ---

  const saveMaterialToLibrary = async (material: z.infer<typeof materialItemSchema>, index: number) => {
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
        materialsArray.update(index, updated);

        toast({
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


  const onSubmit = async (data: ProductFormValues) => {
    try {
      // Determine pricing method and value from target_price if provided
      let pricing_method: 'price' | undefined = undefined;
      let pricing_value: number | undefined = undefined;

      if (data.target_price) {
        pricing_method = 'price';
        pricing_value = data.target_price;
      }

      const productData = {
        name: data.name,
        sku: data.sku,
        batch_size: data.batch_size,
        target_price: data.target_price,
        pricing_method,
        pricing_value,
        materials: data.materials.map(m => ({
          ...m,
          quantity_per_item_or_batch: m.per_batch ? 'batch' : 'item',
        })),
        labor_costs: data.labor_costs.map(l => ({
          activity: l.activity,
          time_spent_minutes: l.time_minutes,
          hourly_rate: l.hourly_rate,
          per_unit: !l.per_batch
        })),
        other_costs: data.other_costs.map(o => ({
          item: o.item,
          quantity: o.quantity,
          cost: o.cost,
          per_unit: !o.per_batch
        })),
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

      await createProduct(productData);
      toast({ title: 'Success', description: 'Product created successfully' });
      navigate('/products');

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create product' });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Top Section */}
            <div className="grid grid-cols-4 gap-4 items-end">
              <FormField control={control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl><Input placeholder="My Product" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="sku" render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl><Input placeholder="SKU-001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="batch_size" render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Size</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="target_price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Price ({getCurrencySymbol(settings.currency)})</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Variants Section */}
            <div className="border rounded-lg p-4 bg-muted/10">
              <VariantBuilder
                variants={variants}
                onChange={setVariants}
                currency={getCurrencySymbol(settings.currency)}
              />
            </div>

            {/* 3 Columns */}
            <div className="grid grid-cols-3 gap-6">

              {/* Materials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Package className="h-4 w-4" /> Materials</div>
                <AddMaterialForm settings={settings} onAdd={(data) => materialsArray.append(data)} />

                <div className="space-y-2">
                  {materialsArray.fields.map((field, index) => {
                    // We need to get the actual value from the form data, not just the field (which is a snapshot)
                    // Actually useFieldArray field has an id, but other props might be stale if we don't watch
                    // But for simple display usually ok. Let's use the watched array for calculations
                    const m = materials[index];
                    if (!m) return null;

                    return (
                      <Card key={field.id} className="relative">
                        <div className="absolute top-2 right-2 flex gap-1">
                          {!m.user_material_id && (
                            <button type="button" onClick={() => saveMaterialToLibrary(m, index)} className="text-muted-foreground hover:text-primary" title="Save to library"><Save className="h-3 w-3" /></button>
                          )}
                          <button type="button" onClick={() => materialsArray.remove(index)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                        </div>
                        <CardContent className="p-3">
                          <div className="font-medium text-sm truncate pr-8">{m.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {m.quantity_type === 'percentage' ? `${m.quantity_percentage}%` : `${m.quantity} ${m.unit}`}
                            {m.units_made > 1 && ` → ${m.units_made} items`}
                            {m.per_batch && ' / batch'}
                            {m.user_material_id && ' ✓'}
                          </div>
                          <div className="text-sm font-semibold text-primary mt-1">
                            {formatCurrency(calculateMaterialCost(m), settings.currency)}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Labor */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Clock className="h-4 w-4" /> Labor</div>
                <AddLaborForm settings={settings} onAdd={(data) => laborArray.append(data)} />

                <div className="space-y-2">
                  {laborArray.fields.map((field, index) => {
                    const l = laborCosts[index];
                    if (!l) return null;
                    return (
                      <Card key={field.id} className="relative">
                        <button type="button" onClick={() => laborArray.remove(index)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                        <CardContent className="p-3">
                          <div className="font-medium text-sm truncate pr-4">{l.activity}</div>
                          <div className="text-xs text-muted-foreground">
                            {l.time_minutes} min @ {formatCurrency(l.hourly_rate, settings.currency)}/hr
                            {l.per_batch && ' / batch'}
                          </div>
                          <div className="text-sm font-semibold text-primary mt-1">
                            {formatCurrency(calculateLaborCost(l), settings.currency)}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Other Costs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Receipt className="h-4 w-4" /> Other Costs</div>
                <AddOtherCostForm settings={settings} onAdd={(data) => otherCostsArray.append(data)} />

                <div className="space-y-2">
                  {otherCostsArray.fields.map((field, index) => {
                    const o = otherCosts[index];
                    if (!o) return null;
                    return (
                      <Card key={field.id} className="relative">
                        <button type="button" onClick={() => otherCostsArray.remove(index)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                        <CardContent className="p-3">
                          <div className="font-medium text-sm truncate pr-4">{o.item}</div>
                          <div className="text-xs text-muted-foreground">
                            {o.quantity} × {formatCurrency(o.cost, settings.currency)}
                            {o.per_batch && ' / batch'}
                          </div>
                          <div className="text-sm font-semibold text-primary mt-1">
                            {formatCurrency(calculateOtherCost(o), settings.currency)}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

            </div>
          </form>
        </Form>
      </div>

      {/* Bottom Bar */}
      <div className="shrink-0 bg-background border-t px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <div className="flex gap-8">
            <div>
              <div className="text-xs text-muted-foreground">Total Cost</div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalCostPerProduct, settings.currency)}</div>
            </div>
            <div className="h-10 w-px bg-border my-auto" />
            <div className="grid grid-cols-3 gap-x-8 gap-y-1 text-sm">
              <div className="text-muted-foreground">Profit:</div>
              <div className={`col-span-2 font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit, settings.currency)}</div>

              <div className="text-muted-foreground">Margin:</div>
              <div className={`col-span-2 font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatNumberDisplay(margin)}%</div>

              <div className="text-muted-foreground">Markup:</div>
              <div className="col-span-2 font-medium">{formatNumberDisplay(markup)}%</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/products')}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)}>Create Product</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
