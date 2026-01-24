import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency';
import { MaterialNameInput } from '@/components/MaterialNameInput';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';

// Schemas
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  batch_size: z.number().int().positive().min(1).default(1),
  target_price: z.number().positive().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  quantity_type: 'exact' | 'percentage';
  quantity_percentage?: number;
  per_batch: boolean;
  units_made: number;
  user_material_id?: number;
  stock_level?: number;
}

interface Labor {
  id: string;
  activity: string;
  time_minutes: number;
  hourly_rate: number;
  per_batch: boolean;
}

interface OtherCost {
  id: string;
  item: string;
  quantity: number;
  cost: number;
  per_batch: boolean;
}

export default function CreateProduct2() {
  const navigate = useNavigate();
  const { setOpen } = useSidebar();
  const { settings } = useSettings();
  const { toast } = useToast();
  
  // Collapse sidebar on mount
  useEffect(() => {
    setOpen(false);
  }, [setOpen]);
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [laborCosts, setLaborCosts] = useState<Labor[]>([]);
  const [otherCosts, setOtherCosts] = useState<OtherCost[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Material form state
  const [materialName, setMaterialName] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState('');
  const [materialUnit, setMaterialUnit] = useState('pcs');
  const [materialPrice, setMaterialPrice] = useState('');
  const [materialQtyType, setMaterialQtyType] = useState<'exact' | 'percentage'>('exact');
  const [materialPercentage, setMaterialPercentage] = useState('10');
  const [materialPerBatch, setMaterialPerBatch] = useState(false);
  const [materialUnitsMade, setMaterialUnitsMade] = useState('1');
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  // Labor form state
  const [laborActivity, setLaborActivity] = useState('');
  const [laborMinutes, setLaborMinutes] = useState('');
  const [laborRate, setLaborRate] = useState(settings.labor_hourly_cost?.toString() || '50');
  const [laborPerBatch, setLaborPerBatch] = useState(false);

  // Other cost form state
  const [otherItem, setOtherItem] = useState('');
  const [otherQuantity, setOtherQuantity] = useState('1');
  const [otherCost, setOtherCost] = useState('');
  const [otherPerBatch, setOtherPerBatch] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      batch_size: 1,
      target_price: undefined,
    },
  });

  const batchSize = form.watch('batch_size') || 1;

  // Calculate totals
  const totalMaterialsCost = materials.reduce((sum, m) => {
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
    return sum + costPerProduct;
  }, 0);

  const totalLaborCost = laborCosts.reduce((sum, l) => {
    const cost = (l.time_minutes / 60) * l.hourly_rate;
    return sum + (l.per_batch ? cost / batchSize : cost);
  }, 0);

  const totalOtherCost = otherCosts.reduce((sum, o) => {
    const cost = o.quantity * o.cost;
    return sum + (o.per_batch ? cost / batchSize : cost);
  }, 0);

  const totalCostPerProduct = totalMaterialsCost + totalLaborCost + totalOtherCost;

  // Add material
  const addMaterial = () => {
    if (!materialName) return;
    
    const quantity = materialQtyType === 'exact' ? parseFloat(materialQuantity) || 0 : 0;
    const percentage = materialQtyType === 'percentage' ? parseFloat(materialPercentage) : undefined;
    // For percentage per batch, units_made is always 1 (doesn't apply)
    const unitsMade = (materialQtyType === 'percentage' && materialPerBatch) 
      ? 1 
      : parseInt(materialUnitsMade) || 1;
    
    const newMaterial: Material = {
      id: crypto.randomUUID(),
      name: materialName,
      quantity,
      unit: materialUnit,
      price_per_unit: parseFloat(materialPrice) || 0,
      quantity_type: materialQtyType,
      quantity_percentage: percentage,
      per_batch: materialPerBatch,
      units_made: unitsMade,
      user_material_id: selectedMaterial?.id,
      stock_level: selectedMaterial?.stock_level,
    };
    
    setMaterials([...materials, newMaterial]);
    resetMaterialForm();
  };

  const resetMaterialForm = () => {
    setMaterialName('');
    setMaterialQuantity('');
    setMaterialUnit('pcs');
    setMaterialPrice('');
    setMaterialQtyType('exact');
    setMaterialPercentage('10');
    setMaterialPerBatch(false);
    setMaterialUnitsMade('1');
    setSelectedMaterial(null);
  };

  // Add labor
  const addLabor = () => {
    if (!laborActivity || !laborMinutes) return;
    
    const newLabor: Labor = {
      id: crypto.randomUUID(),
      activity: laborActivity,
      time_minutes: parseInt(laborMinutes) || 0,
      hourly_rate: parseFloat(laborRate) || 0,
      per_batch: laborPerBatch,
    };
    
    setLaborCosts([...laborCosts, newLabor]);
    setLaborActivity('');
    setLaborMinutes('');
    setLaborPerBatch(false);
  };

  // Add other cost
  const addOtherCost = () => {
    if (!otherItem || !otherCost) return;
    
    const newCost: OtherCost = {
      id: crypto.randomUUID(),
      item: otherItem,
      quantity: parseFloat(otherQuantity) || 1,
      cost: parseFloat(otherCost) || 0,
      per_batch: otherPerBatch,
    };
    
    setOtherCosts([...otherCosts, newCost]);
    setOtherItem('');
    setOtherQuantity('1');
    setOtherCost('');
    setOtherPerBatch(false);
  };

  // Remove functions
  const removeMaterial = (id: string) => setMaterials(materials.filter(m => m.id !== id));
  const removeLabor = (id: string) => setLaborCosts(laborCosts.filter(l => l.id !== id));
  const removeOther = (id: string) => setOtherCosts(otherCosts.filter(o => o.id !== id));

  // Save material to library
  const saveMaterialToLibrary = async (material: Material) => {
    if (material.user_material_id) return; // Already in library

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
        
        // Update the material in local state to link it to library
        setMaterials(materials.map(m => 
          m.id === material.id 
            ? { ...m, user_material_id: savedMaterial.id, stock_level: savedMaterial.stock_level || 0 }
            : m
        ));

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

  // Handle material selection from library
  const handleMaterialSelect = (material: any) => {
    setSelectedMaterial(material);
    setMaterialName(material.name);
    setMaterialUnit(material.unit || 'pcs');
    setMaterialPrice(material.price_per_unit?.toString() || '');
    if (material.is_percentage_type) {
      setMaterialQtyType('percentage');
    }
  };

  // Calculate cost for display
  const getMaterialCost = (m: Material) => {
    const unitsMade = m.units_made || 1;
    if (m.quantity_type === 'percentage' && m.quantity_percentage) {
      const cost = m.price_per_unit * (m.quantity_percentage / 100);
      return m.per_batch ? cost / batchSize : cost;
    }
    const cost = m.quantity * m.price_per_unit;
    return cost / unitsMade;
  };

  const getLaborCost = (l: Labor) => {
    const cost = (l.time_minutes / 60) * l.hourly_rate;
    return l.per_batch ? cost / batchSize : cost;
  };

  const getOtherCost = (o: OtherCost) => {
    const cost = o.quantity * o.cost;
    return o.per_batch ? cost / batchSize : cost;
  };

  // Submit
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
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
        materials: materials.map(m => ({
          name: m.name,
          quantity: m.quantity || 0,
          unit: m.unit,
          price_per_unit: m.price_per_unit,
          quantity_type: m.quantity_type,
          quantity_percentage: m.quantity_percentage,
          quantity_per_item_or_batch: m.per_batch ? 'batch' : 'item',
          user_material_id: m.user_material_id,
          units_made: m.units_made || 1,
        })),
        labor_costs: laborCosts.map(l => ({
          activity: l.activity,
          time_spent_minutes: l.time_minutes,
          hourly_rate: l.hourly_rate,
          per_unit: !l.per_batch,
        })),
        other_costs: otherCosts.map(o => ({
          item: o.item,
          quantity: o.quantity,
          cost: o.cost,
          per_unit: !o.per_batch,
        })),
      };

      await api.post('/products', productData);
      toast({ variant: 'success', title: 'Product created successfully' });
      navigate('/products');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Product Info Row */}
            <div className="grid grid-cols-4 gap-4 items-end">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="My Product" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="batch_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Size</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="target_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Price ({getCurrencySymbol(settings.currency)})</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 3-Column Grid: Materials, Labor, Other */}
            <div className="grid grid-cols-3 gap-6">
              
              {/* Materials Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Package className="h-4 w-4" />
                  Materials
                </div>
                
                {/* Add Material Form */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                  <div>
                    <label className="text-xs text-muted-foreground">Material Name</label>
                    <MaterialNameInput
                      value={materialName}
                      onChange={setMaterialName}
                      onMaterialSelect={handleMaterialSelect}
                      placeholder="Search or add new material"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground flex items-center gap-1">
                        Qty
                        <Tabs value={materialQtyType} onValueChange={(v) => setMaterialQtyType(v as 'exact' | 'percentage')}>
                          <TabsList className="h-5">
                            <TabsTrigger value="exact" className="text-[10px] px-1.5 h-4">Qt</TabsTrigger>
                            <TabsTrigger value="percentage" className="text-[10px] px-1.5 h-4">%</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </label>
                      {materialQtyType === 'exact' ? (
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={materialQuantity}
                          onChange={(e) => setMaterialQuantity(e.target.value)}
                          className="h-9"
                        />
                      ) : (
                        <Select value={materialPercentage} onValueChange={setMaterialPercentage}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => (
                              <SelectItem key={p} value={p.toString()}>{p}%</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Unit</label>
                      <Select value={materialUnit} onValueChange={setMaterialUnit}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['pcs', 'mm', 'cm', 'm', 'ml', 'L', 'g', 'kg'].map(u => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Price/Unit ({getCurrencySymbol(settings.currency)})</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={materialPrice}
                        onChange={(e) => setMaterialPrice(e.target.value)}
                        disabled={!!selectedMaterial}
                        className="h-9"
                      />
                    </div>
                    {/* Hide units_made when percentage + per batch */}
                    {!(materialQtyType === 'percentage' && materialPerBatch) && (
                      <div>
                        <label className="text-xs text-muted-foreground">Items Made</label>
                        <Input
                          type="number"
                          min={1}
                          value={materialUnitsMade}
                          onChange={(e) => setMaterialUnitsMade(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Checkbox 
                      checked={materialPerBatch} 
                      onCheckedChange={(c) => setMaterialPerBatch(!!c)}
                      id="mat-batch"
                    />
                    <label htmlFor="mat-batch" className="text-xs">Per batch</label>
                  </div>
                  
                  <Button type="button" size="sm" className="w-full" onClick={addMaterial}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>

                {/* Material Cards */}
                <div className="space-y-2">
                  {materials.map((m) => (
                    <Card key={m.id} className="relative">
                      <div className="absolute top-2 right-2 flex gap-1">
                        {!m.user_material_id && (
                          <button
                            type="button"
                            onClick={() => saveMaterialToLibrary(m)}
                            className="text-muted-foreground hover:text-primary"
                            title="Save to library"
                          >
                            <Save className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMaterial(m.id)}
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
                          {formatCurrency(getMaterialCost(m), settings.currency)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Labor Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Labor
                </div>
                
                {/* Add Labor Form */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                  <div>
                    <label className="text-xs text-muted-foreground">Activity</label>
                    <Input
                      placeholder="Assembly, Painting..."
                      value={laborActivity}
                      onChange={(e) => setLaborActivity(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Minutes</label>
                      <Input
                        type="number"
                        placeholder="30"
                        value={laborMinutes}
                        onChange={(e) => setLaborMinutes(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Rate/hr ({getCurrencySymbol(settings.currency)})</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={laborRate}
                        onChange={(e) => setLaborRate(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Checkbox 
                      checked={laborPerBatch} 
                      onCheckedChange={(c) => setLaborPerBatch(!!c)}
                      id="labor-batch"
                    />
                    <label htmlFor="labor-batch" className="text-xs">Per batch</label>
                  </div>
                  
                  <Button type="button" size="sm" className="w-full" onClick={addLabor}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>

                {/* Labor Cards */}
                <div className="space-y-2">
                  {laborCosts.map((l) => (
                    <Card key={l.id} className="relative">
                      <button
                        type="button"
                        onClick={() => removeLabor(l.id)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <CardContent className="p-3">
                        <div className="font-medium text-sm truncate pr-4">{l.activity}</div>
                        <div className="text-xs text-muted-foreground">
                          {l.time_minutes} min @ {formatCurrency(l.hourly_rate, settings.currency)}/hr
                          {l.per_batch && ' / batch'}
                        </div>
                        <div className="text-sm font-semibold text-primary mt-1">
                          {formatCurrency(getLaborCost(l), settings.currency)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Other Costs Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                  Other Costs
                </div>
                
                {/* Add Other Cost Form */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                  <div>
                    <label className="text-xs text-muted-foreground">Item</label>
                    <Input
                      placeholder="Packaging, Shipping..."
                      value={otherItem}
                      onChange={(e) => setOtherItem(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Qty</label>
                      <Input
                        type="number"
                        value={otherQuantity}
                        onChange={(e) => setOtherQuantity(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Cost ({getCurrencySymbol(settings.currency)})</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={otherCost}
                        onChange={(e) => setOtherCost(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Checkbox 
                      checked={otherPerBatch} 
                      onCheckedChange={(c) => setOtherPerBatch(!!c)}
                      id="other-batch"
                    />
                    <label htmlFor="other-batch" className="text-xs">Per batch</label>
                  </div>
                  
                  <Button type="button" size="sm" className="w-full" onClick={addOtherCost}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>

                {/* Other Cost Cards */}
                <div className="space-y-2">
                  {otherCosts.map((o) => (
                    <Card key={o.id} className="relative">
                      <button
                        type="button"
                        onClick={() => removeOther(o.id)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <CardContent className="p-3">
                        <div className="font-medium text-sm truncate pr-4">{o.item}</div>
                        <div className="text-xs text-muted-foreground">
                          {o.quantity} × {formatCurrency(o.cost, settings.currency)}
                          {o.per_batch && ' / batch'}
                        </div>
                        <div className="text-sm font-semibold text-primary mt-1">
                          {formatCurrency(getOtherCost(o), settings.currency)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Fixed Total Section at Bottom */}
      <div className="shrink-0 bg-background border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <div className="flex gap-8">
            <div>
              <div className="text-xs text-muted-foreground">Materials</div>
              <div className="font-semibold">{formatCurrency(totalMaterialsCost, settings.currency)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Labor</div>
              <div className="font-semibold">{formatCurrency(totalLaborCost, settings.currency)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Other</div>
              <div className="font-semibold">{formatCurrency(totalOtherCost, settings.currency)}</div>
            </div>
            <div className="border-l pl-8">
              <div className="text-xs text-muted-foreground">Total Cost / Product</div>
              <div className="text-xl font-bold text-primary">{formatCurrency(totalCostPerProduct, settings.currency)}</div>
            </div>
          </div>
          
          <div className="flex gap-3 ml-auto">
            <Button type="button" variant="outline" onClick={() => navigate('/products')}>
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={isSubmitting || !form.watch('name')}
            >
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
