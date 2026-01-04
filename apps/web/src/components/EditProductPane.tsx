import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, ChevronLeft, Plus, Trash2, Info, Edit, Check, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import api from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency';

const step1Schema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  batch_size: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 1 : Number(val)),
    z.number().int().positive().min(1, 'Batch size must be at least 1')
  ),
  target_price: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Target price must be greater than 0').optional()
  ),
  markup_percentage: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().nonnegative('Markup percentage must be 0 or greater').optional()
  ),
});

const materialSchema = z.object({
  name: z.string().min(1, 'Material name is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  price_per_unit: z.number().nonnegative('Price must be 0 or greater'),
});

const laborSchema = z.object({
  activity: z.string().min(1, 'Activity name is required'),
  time_spent_minutes: z.number().int().positive('Time must be greater than 0'),
  hourly_rate: z.number().nonnegative('Hourly rate must be 0 or greater'),
  per_unit: z.boolean().default(true),
});

const otherCostSchema = z.object({
  item: z.string().min(1, 'Item name is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  cost: z.number().nonnegative('Cost must be 0 or greater'),
  per_unit: z.boolean().default(true),
});

type Step1FormValues = z.infer<typeof step1Schema>;
type MaterialFormValues = z.infer<typeof materialSchema> & { total_cost?: number; id?: number };
type LaborFormValues = z.infer<typeof laborSchema> & { total_cost?: number; id?: number };
type OtherCostFormValues = z.infer<typeof otherCostSchema> & { total_cost?: number; id?: number };

// Inline editable row components
function EditableMaterialRow({ 
  material, 
  onSave, 
  onCancel 
}: { 
  material: MaterialFormValues; 
  onSave: (data: MaterialFormValues) => void; 
  onCancel: () => void;
}) {
  const [name, setName] = useState(material.name);
  const [quantity, setQuantity] = useState(material.quantity);
  const [unit, setUnit] = useState(material.unit);
  const [pricePerUnit, setPricePerUnit] = useState(material.price_per_unit);

  const handleSave = () => {
    if (name && quantity > 0 && unit && pricePerUnit >= 0) {
      onSave({ name, quantity, unit, price_per_unit: pricePerUnit });
    }
  };

  return (
    <tr className="border-t bg-muted/50">
      <td className="p-2">
        <Input
          className="h-8 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Material name"
        />
      </td>
      <td className="p-2">
        <Input
          className="h-8 text-sm"
          type="number"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
        />
      </td>
      <td className="p-2">
        <Input
          className="h-8 text-sm"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unit"
        />
      </td>
      <td className="p-2">
        <Input
          className="h-8 text-sm"
          type="number"
          step="0.01"
          value={pricePerUnit}
          onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
        />
      </td>
      <td className="p-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleSave}
          >
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onCancel}
          >
            <X className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function EditableLaborRow({ 
  labor, 
  onSave, 
  onCancel 
}: { 
  labor: LaborFormValues; 
  onSave: (data: LaborFormValues) => void; 
  onCancel: () => void;
}) {
  const { settings } = useSettings();
  const [activity, setActivity] = useState(labor.activity);
  const [timeSpent, setTimeSpent] = useState(labor.time_spent_minutes);
  const [hourlyRate, setHourlyRate] = useState(labor.hourly_rate);
  const [perUnit, setPerUnit] = useState(labor.per_unit);

  const handleSave = () => {
    if (activity && timeSpent > 0 && hourlyRate >= 0) {
      onSave({ activity, time_spent_minutes: timeSpent, hourly_rate: hourlyRate, per_unit: perUnit });
    }
  };

  return (
    <tr className="border-t bg-muted/50">
      <td className="p-2">
        <Input
          className="h-8 text-sm"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="Activity"
        />
      </td>
      <td className="p-2">
        <Input
          className="h-8 text-sm"
          type="number"
          min="1"
          value={timeSpent}
          onChange={(e) => setTimeSpent(parseInt(e.target.value) || 0)}
        />
      </td>
      <td className="p-2">
        <Input
          className="h-8 text-sm"
          type="number"
          step="0.01"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
        />
      </td>
      <td className="p-2">
        {formatCurrency((timeSpent / 60) * hourlyRate, settings.currency)}
      </td>
      <td className="p-2">
        <Checkbox
          checked={perUnit}
          onCheckedChange={(checked) => setPerUnit(checked === true)}
        />
      </td>
      <td className="p-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleSave}
          >
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onCancel}
          >
            <X className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function EditableOtherCostRow({ 
  cost, 
  onSave, 
  onCancel 
}: { 
  cost: OtherCostFormValues; 
  onSave: (data: OtherCostFormValues) => void; 
  onCancel: () => void;
}) {
  const { settings } = useSettings();
  const [item, setItem] = useState(cost.item);
  const [quantity, setQuantity] = useState(cost.quantity);
  const [costValue, setCostValue] = useState(cost.cost);
  const [perUnit, setPerUnit] = useState(cost.per_unit);

  const handleSave = () => {
    if (item && quantity > 0 && costValue >= 0) {
      onSave({ item, quantity, cost: costValue, per_unit: perUnit });
    }
  };

  return (
    <tr className="border-t bg-muted/50">
      <td className="p-2">
        <Input
          className="h-8 text-sm"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="Item"
        />
      </td>
      <td className="p-2">
        <Input
          className="h-8 text-sm"
          type="number"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
        />
      </td>
      <td className="p-2">
        <Input
          className="h-8 text-sm"
          type="number"
          step="0.01"
          value={costValue}
          onChange={(e) => setCostValue(parseFloat(e.target.value) || 0)}
        />
      </td>
      <td className="p-2">
        {formatCurrency(quantity * costValue, settings.currency)}
      </td>
      <td className="p-2">
        <Checkbox
          checked={perUnit}
          onCheckedChange={(checked) => setPerUnit(checked === true)}
        />
      </td>
      <td className="p-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleSave}
          >
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onCancel}
          >
            <X className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

interface EditProductPaneProps {
  productId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditProductPane({ productId, open, onOpenChange, onSuccess }: EditProductPaneProps) {
  const { settings } = useSettings();
  const [currentStep, setCurrentStep] = useState(1);
  const [materials, setMaterials] = useState<MaterialFormValues[]>([]);
  const [laborCosts, setLaborCosts] = useState<LaborFormValues[]>([]);
  const [otherCosts, setOtherCosts] = useState<OtherCostFormValues[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingMaterialIndex, setEditingMaterialIndex] = useState<number | null>(null);
  const [editingLaborIndex, setEditingLaborIndex] = useState<number | null>(null);
  const [editingOtherCostIndex, setEditingOtherCostIndex] = useState<number | null>(null);

  const step1Form = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: '',
      sku: '',
      batch_size: 1,
      target_price: undefined,
      markup_percentage: undefined,
    },
  });

  const materialForm = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      quantity: 0,
      unit: '',
      price_per_unit: 0,
    },
  });

  const laborForm = useForm<LaborFormValues>({
    resolver: zodResolver(laborSchema),
    defaultValues: {
      activity: '',
      time_spent_minutes: 0,
      hourly_rate: 0,
      per_unit: true,
    },
  });

  const otherCostForm = useForm<OtherCostFormValues>({
    resolver: zodResolver(otherCostSchema),
    defaultValues: {
      item: '',
      quantity: 1,
      cost: 0,
      per_unit: true,
    },
  });

  // Fetch product data when pane opens
  useEffect(() => {
    if (open && productId) {
      fetchProductData();
    } else if (!open) {
      // Reset form when pane closes
      setCurrentStep(1);
      step1Form.reset();
      setMaterials([]);
      setLaborCosts([]);
      setOtherCosts([]);
      setEditingMaterialIndex(null);
      setEditingLaborIndex(null);
      setEditingOtherCostIndex(null);
      materialForm.reset();
      laborForm.reset();
      otherCostForm.reset();
    }
  }, [open, productId]);

  const fetchProductData = async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/products/${productId}`);
      
      if (response.data.status === 'success') {
        const product = response.data.data;
        
        // Populate step 1 form - ensure numbers are converted properly
        step1Form.reset({
          name: product.name || '',
          sku: product.sku || '',
          description: product.description || '',
          category: product.category || '',
          batch_size: product.batch_size ? Number(product.batch_size) : 1,
          target_price: product.target_price != null ? Number(product.target_price) : undefined,
          markup_percentage: product.markup_percentage != null ? Number(product.markup_percentage) : undefined,
        });

        // Populate materials - ensure numbers are converted
        const materialsData = (product.materials || []).map((m: any) => ({
          ...m,
          quantity: Number(m.quantity),
          price_per_unit: Number(m.price_per_unit),
          total_cost: m.total_cost ? Number(m.total_cost) : undefined,
        }));
        setMaterials(materialsData);
        
        // Populate labor costs - ensure numbers are converted
        const laborData = (product.labor_costs || []).map((l: any) => ({
          ...l,
          time_spent_minutes: Number(l.time_spent_minutes),
          hourly_rate: Number(l.hourly_rate),
          total_cost: l.total_cost ? Number(l.total_cost) : undefined,
          per_unit: Boolean(l.per_unit),
        }));
        setLaborCosts(laborData);
        
        // Populate other costs - ensure numbers are converted
        const otherCostsData = (product.other_costs || []).map((o: any) => ({
          ...o,
          quantity: Number(o.quantity),
          cost: Number(o.cost),
          total_cost: o.total_cost ? Number(o.total_cost) : undefined,
          per_unit: Boolean(o.per_unit),
        }));
        setOtherCosts(otherCostsData);
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      alert(error.response?.data?.message || 'Failed to load product data');
    } finally {
      setLoading(false);
    }
  };

  const onStep1Submit = (_data: Step1FormValues) => {
    setCurrentStep(2);
  };

  const onStep2Submit = () => {
    setCurrentStep(3);
  };

  const onStep3Submit = () => {
    setCurrentStep(4);
  };

  const onAddMaterial = (data: MaterialFormValues) => {
    const totalCost = data.quantity * data.price_per_unit;
    setMaterials([...materials, { ...data, total_cost: totalCost }]);
    materialForm.reset();
  };

  const onSaveMaterialEdit = (index: number, updatedMaterial: MaterialFormValues) => {
    const totalCost = updatedMaterial.quantity * updatedMaterial.price_per_unit;
    const updatedMaterials = [...materials];
    updatedMaterials[index] = { ...updatedMaterial, total_cost: totalCost };
    setMaterials(updatedMaterials);
    setEditingMaterialIndex(null);
  };

  const onEditMaterial = (index: number) => {
    setEditingMaterialIndex(index);
  };

  const onCancelEditMaterial = () => {
    setEditingMaterialIndex(null);
  };

  const onRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
    if (editingMaterialIndex === index) {
      setEditingMaterialIndex(null);
      materialForm.reset();
    } else if (editingMaterialIndex !== null && editingMaterialIndex > index) {
      setEditingMaterialIndex(editingMaterialIndex - 1);
    }
  };

  const onAddLabor = (data: LaborFormValues) => {
    const totalCost = (data.time_spent_minutes / 60) * data.hourly_rate;
    setLaborCosts([...laborCosts, { ...data, total_cost: totalCost }]);
    laborForm.reset();
  };

  const onSaveLaborEdit = (index: number, updatedLabor: LaborFormValues) => {
    const totalCost = (updatedLabor.time_spent_minutes / 60) * updatedLabor.hourly_rate;
    const updatedLaborList = [...laborCosts];
    updatedLaborList[index] = { ...updatedLabor, total_cost: totalCost };
    setLaborCosts(updatedLaborList);
    setEditingLaborIndex(null);
  };

  const onEditLabor = (index: number) => {
    setEditingLaborIndex(index);
  };

  const onCancelEditLabor = () => {
    setEditingLaborIndex(null);
  };

  const onRemoveLabor = (index: number) => {
    setLaborCosts(laborCosts.filter((_, i) => i !== index));
    if (editingLaborIndex === index) {
      setEditingLaborIndex(null);
      laborForm.reset();
    } else if (editingLaborIndex !== null && editingLaborIndex > index) {
      setEditingLaborIndex(editingLaborIndex - 1);
    }
  };

  const onAddOtherCost = (data: OtherCostFormValues) => {
    const totalCost = data.quantity * data.cost;
    setOtherCosts([...otherCosts, { ...data, total_cost: totalCost }]);
    otherCostForm.reset();
  };

  const onSaveOtherCostEdit = (index: number, updatedCost: OtherCostFormValues) => {
    const totalCost = updatedCost.quantity * updatedCost.cost;
    const updatedCosts = [...otherCosts];
    updatedCosts[index] = { ...updatedCost, total_cost: totalCost };
    setOtherCosts(updatedCosts);
    setEditingOtherCostIndex(null);
  };

  const onEditOtherCost = (index: number) => {
    setEditingOtherCostIndex(index);
  };

  const onCancelEditOtherCost = () => {
    setEditingOtherCostIndex(null);
  };

  const onRemoveOtherCost = (index: number) => {
    setOtherCosts(otherCosts.filter((_, i) => i !== index));
    if (editingOtherCostIndex === index) {
      setEditingOtherCostIndex(null);
      otherCostForm.reset();
    } else if (editingOtherCostIndex !== null && editingOtherCostIndex > index) {
      setEditingOtherCostIndex(editingOtherCostIndex - 1);
    }
  };

  const onFinalSubmit = async () => {
    if (!productId) return;
    
    setIsSubmitting(true);
    const step1Data = step1Form.getValues();
    
    try {
      const materialsData = materials.map(m => ({
        name: m.name,
        quantity: m.quantity,
        unit: m.unit,
        price_per_unit: m.price_per_unit,
      }));

      const laborCostsData = laborCosts.map(l => ({
        activity: l.activity,
        time_spent_minutes: l.time_spent_minutes,
        hourly_rate: l.hourly_rate,
        per_unit: l.per_unit,
      }));

      const otherCostsData = otherCosts.map(o => ({
        item: o.item,
        quantity: o.quantity,
        cost: o.cost,
        per_unit: o.per_unit,
      }));

      // Call API to update product
      await api.put(`/products/${productId}`, {
        name: step1Data.name,
        sku: step1Data.sku,
        description: step1Data.description,
        category: step1Data.category,
        batch_size: step1Data.batch_size,
        target_price: step1Data.target_price,
        markup_percentage: step1Data.markup_percentage,
        materials: materialsData,
        labor_costs: laborCostsData,
        other_costs: otherCostsData,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(error.response?.data?.message || 'Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const batchSize = step1Form.watch('batch_size');
  const totalMaterialsCost = materials.reduce((sum, m) => sum + (m.quantity * m.price_per_unit), 0);
  const laborPerProduct = laborCosts
    .filter(l => l.per_unit)
    .reduce((sum, l) => sum + (l.total_cost || 0), 0);
  const laborPerBatch = laborCosts
    .filter(l => !l.per_unit)
    .reduce((sum, l) => sum + (l.total_cost || 0), 0);
  const totalLaborCostPerProduct = laborPerProduct + (batchSize > 0 ? laborPerBatch / batchSize : 0);
  const otherCostsPerProduct = otherCosts
    .filter(o => o.per_unit)
    .reduce((sum, o) => sum + (o.total_cost || 0), 0);
  const otherCostsPerBatch = otherCosts
    .filter(o => !o.per_unit)
    .reduce((sum, o) => sum + (o.total_cost || 0), 0);
  const totalOtherCostsPerProduct = otherCostsPerProduct + (batchSize > 0 ? otherCostsPerBatch / batchSize : 0);
  // const totalCostPerProduct = totalMaterialsCost + totalLaborCostPerProduct + totalOtherCostsPerProduct; // Unused for now

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Product</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Compact Step Indicator - Clickable */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  1
                </div>
                <span className={currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}>Basic</span>
              </button>
              <div className="flex-1 h-px bg-muted max-w-4" />
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
                <span className={currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}>Materials</span>
              </button>
              <div className="flex-1 h-px bg-muted max-w-4" />
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  3
                </div>
                <span className={currentStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}>Labor</span>
              </button>
              <div className="flex-1 h-px bg-muted max-w-4" />
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium ${currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  4
                </div>
                <span className={currentStep >= 4 ? 'text-foreground' : 'text-muted-foreground'}>Other</span>
              </button>
            </div>

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-base font-semibold mb-3">Product Information</h2>
                <Form {...step1Form}>
                  <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={step1Form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Product Name *</FormLabel>
                            <FormControl>
                              <Input className="h-9" placeholder="e.g., Lavender Candle" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={step1Form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-1">
                              SKU
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Stock Keeping Unit</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input className="h-9" placeholder="Optional" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={step1Form.control}
                        name="batch_size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-1">
                              Batch Size *
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Products per batch</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                className="h-9"
                                type="number" 
                                min="1"
                                value={field.value === undefined || field.value === null ? '' : String(field.value)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === '' ? 1 : parseInt(value) || 1);
                                }}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={step1Form.control}
                        name="target_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Target Price ({getCurrencySymbol(settings.currency)})</FormLabel>
                            <FormControl>
                              <Input 
                                className="h-9"
                                type="number" 
                                step="0.01"
                                placeholder="0.00"
                                value={field.value === undefined || field.value === null ? '' : String(field.value)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === '' ? undefined : parseFloat(value));
                                }}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={step1Form.control}
                        name="markup_percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Markup %</FormLabel>
                            <FormControl>
                              <Input 
                                className="h-9"
                                type="number" 
                                step="0.01"
                                placeholder="0.00"
                                value={field.value === undefined || field.value === null ? '' : String(field.value)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === '' ? undefined : parseFloat(value));
                                }}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-between pt-2">
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="default"
                        onClick={onFinalSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </Button>
                      <Button type="submit" size="sm">
                        Next: Materials
                        <ChevronRight className="ml-2 h-3 w-3" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {/* Step 2: Materials */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold">Materials</h2>
                <Form {...materialForm}>
                  <form onSubmit={materialForm.handleSubmit(onAddMaterial)} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={materialForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Name *</FormLabel>
                            <FormControl>
                              <Input className="h-9" placeholder="Material name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={materialForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Quantity *</FormLabel>
                            <FormControl>
                              <Input 
                                className="h-9"
                                type="number" 
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={materialForm.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Unit *</FormLabel>
                            <FormControl>
                              <Input className="h-9" placeholder="g, ml, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={materialForm.control}
                        name="price_per_unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Price/Unit *</FormLabel>
                            <FormControl>
                              <Input 
                                className="h-9"
                                type="number" 
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" variant="outline" size="sm">
                      <Plus className="mr-2 h-3 w-3" />
                      Add Material
                    </Button>
                  </form>
                </Form>

                {materials.length > 0 && (
                  <div className="mt-4 border rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800">
                          <tr>
                            <th className="text-left p-2 text-xs font-medium">Material</th>
                            <th className="text-left p-2 text-xs font-medium">Qty</th>
                            <th className="text-left p-2 text-xs font-medium">Unit</th>
                            <th className="text-left p-2 text-xs font-medium">Price</th>
                            <th className="text-right p-2 text-xs font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materials.map((material, index) => (
                            editingMaterialIndex === index ? (
                              <EditableMaterialRow
                                key={index}
                                material={material}
                                onSave={(updated) => onSaveMaterialEdit(index, updated)}
                                onCancel={onCancelEditMaterial}
                              />
                            ) : (
                              <tr key={index} className="border-t">
                                <td className="p-2">{material.name}</td>
                                <td className="p-2">{material.quantity}</td>
                                <td className="p-2">{material.unit}</td>
                                <td className="p-2">{formatCurrency(material.price_per_unit, settings.currency)}</td>
                                <td className="p-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => onEditMaterial(index)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => onRemoveMaterial(index)}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100 dark:bg-slate-800">
                          <tr>
                            <td colSpan={3} className="p-2 text-right text-xs font-medium">Total:</td>
                            <td className="p-2 font-medium">{formatCurrency(totalMaterialsCost, settings.currency)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                      <ChevronLeft className="mr-2 h-3 w-3" />
                      Back
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="default"
                      onClick={onFinalSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                  <Button size="sm" onClick={onStep2Submit}>
                    Next: Labor
                    <ChevronRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Labor Costs */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold">Labor Costs</h2>
                <Form {...laborForm}>
                  <form onSubmit={laborForm.handleSubmit(onAddLabor)} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={laborForm.control}
                        name="activity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Activity *</FormLabel>
                            <FormControl>
                              <Input className="h-9" placeholder="Activity name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={laborForm.control}
                        name="time_spent_minutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Time (min) *</FormLabel>
                            <FormControl>
                              <Input 
                                className="h-9"
                                type="number" 
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={laborForm.control}
                        name="hourly_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Hourly Rate ({getCurrencySymbol(settings.currency)}) *</FormLabel>
                            <FormControl>
                              <Input 
                                className="h-9"
                                type="number" 
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={laborForm.control}
                        name="per_unit"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm">Per Unit</FormLabel>
                          </FormItem>
                        )}
                      />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="outline" size="sm">
                      {editingLaborIndex !== null ? (
                        <>
                          <Edit className="mr-2 h-3 w-3" />
                          Update Labor
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-3 w-3" />
                          Add Labor
                        </>
                      )}
                    </Button>
                    {editingLaborIndex !== null && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={onCancelEditLabor}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Form>

                {laborCosts.length > 0 && (
                  <div className="mt-4 border rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800">
                          <tr>
                            <th className="text-left p-2 text-xs font-medium">Activity</th>
                            <th className="text-left p-2 text-xs font-medium">Time</th>
                            <th className="text-left p-2 text-xs font-medium">Rate</th>
                            <th className="text-left p-2 text-xs font-medium">Cost</th>
                            <th className="text-left p-2 text-xs font-medium">Per Unit</th>
                            <th className="text-right p-2 text-xs font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {laborCosts.map((labor, index) => (
                            editingLaborIndex === index ? (
                              <EditableLaborRow
                                key={index}
                                labor={labor}
                                onSave={(updated) => onSaveLaborEdit(index, updated)}
                                onCancel={onCancelEditLabor}
                              />
                            ) : (
                              <tr key={index} className="border-t">
                                <td className="p-2">{labor.activity}</td>
                                <td className="p-2">{labor.time_spent_minutes} min</td>
                                <td className="p-2">{formatCurrency(labor.hourly_rate, settings.currency)}</td>
                                <td className="p-2">{formatCurrency(labor.total_cost || 0, settings.currency)}</td>
                                <td className="p-2">{labor.per_unit ? 'Yes' : 'Batch'}</td>
                                <td className="p-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => onEditLabor(index)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => onRemoveLabor(index)}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100 dark:bg-slate-800">
                          <tr>
                            <td colSpan={4} className="p-2 text-right text-xs font-medium">Total:</td>
                            <td className="p-2 font-medium">{formatCurrency(totalLaborCostPerProduct, settings.currency)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)}>
                      <ChevronLeft className="mr-2 h-3 w-3" />
                      Back
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="default"
                      onClick={onFinalSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                  <Button size="sm" onClick={onStep3Submit}>
                    Next: Other Costs
                    <ChevronRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Other Costs */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold">Other Costs</h2>
                <Form {...otherCostForm}>
                  <form onSubmit={otherCostForm.handleSubmit(onAddOtherCost)} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={otherCostForm.control}
                        name="item"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Item *</FormLabel>
                            <FormControl>
                              <Input className="h-9" placeholder="Item name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={otherCostForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Quantity *</FormLabel>
                            <FormControl>
                              <Input 
                                className="h-9"
                                type="number" 
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={otherCostForm.control}
                        name="cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Cost ({getCurrencySymbol(settings.currency)}) *</FormLabel>
                            <FormControl>
                              <Input 
                                className="h-9"
                                type="number" 
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={otherCostForm.control}
                        name="per_unit"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm">Per Unit</FormLabel>
                          </FormItem>
                        )}
                      />
                  </div>
                  <Button type="submit" variant="outline" size="sm">
                    <Plus className="mr-2 h-3 w-3" />
                    Add Cost
                  </Button>
                </form>
              </Form>

                {otherCosts.length > 0 && (
                  <div className="mt-4 border rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800">
                          <tr>
                            <th className="text-left p-2 text-xs font-medium">Item</th>
                            <th className="text-left p-2 text-xs font-medium">Qty</th>
                            <th className="text-left p-2 text-xs font-medium">Cost</th>
                            <th className="text-left p-2 text-xs font-medium">Total</th>
                            <th className="text-left p-2 text-xs font-medium">Per Unit</th>
                            <th className="text-right p-2 text-xs font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {otherCosts.map((cost, index) => (
                            editingOtherCostIndex === index ? (
                              <EditableOtherCostRow
                                key={index}
                                cost={cost}
                                onSave={(updated) => onSaveOtherCostEdit(index, updated)}
                                onCancel={onCancelEditOtherCost}
                              />
                            ) : (
                              <tr key={index} className="border-t">
                                <td className="p-2">{cost.item}</td>
                                <td className="p-2">{cost.quantity}</td>
                                <td className="p-2">{formatCurrency(cost.cost, settings.currency)}</td>
                                <td className="p-2">{formatCurrency(cost.total_cost || 0, settings.currency)}</td>
                                <td className="p-2">{cost.per_unit ? 'Yes' : 'Batch'}</td>
                                <td className="p-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => onEditOtherCost(index)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => onRemoveOtherCost(index)}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100 dark:bg-slate-800">
                          <tr>
                            <td colSpan={3} className="p-2 text-right text-xs font-medium">Total:</td>
                            <td className="p-2 font-medium">{formatCurrency(totalOtherCostsPerProduct, settings.currency)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)}>
                      <ChevronLeft className="mr-2 h-3 w-3" />
                      Back
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="default"
                      onClick={onFinalSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

