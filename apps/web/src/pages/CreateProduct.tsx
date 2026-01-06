import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, ChevronLeft, Plus, Trash2, Package, Users, DollarSign, Calculator, Info } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import api from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency';
import { MaterialSelector } from '@/components/MaterialSelector';
import { MaterialNameInput } from '@/components/MaterialNameInput';
import { useToast } from '@/components/ui/use-toast';

const step1Schema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  batch_size: z.number().int().positive().min(1, 'Batch size must be at least 1').default(1),
  target_price: z.number().positive('Target price must be greater than 0').optional(),
  markup_percentage: z.number().nonnegative('Markup percentage must be 0 or greater').optional(),
});

const materialSchema = z.object({
  name: z.string().min(1, 'Material name is required'),
  quantity: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 0 : Number(val)),
    z.number().positive('Quantity must be greater than 0')
  ),
  unit: z.string().min(1, 'Unit is required'),
  price_per_unit: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 0 : Number(val)),
    z.number().nonnegative('Price must be 0 or greater')
  ),
  units_made: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 1 : Number(val)),
    z.number().positive('Units made must be greater than 0')
  ),
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
type MaterialFormValues = z.infer<typeof materialSchema> & { total_cost?: number; user_material_id?: number };
type LaborFormValues = z.infer<typeof laborSchema> & { total_cost?: number };
type OtherCostFormValues = z.infer<typeof otherCostSchema> & { total_cost?: number };

export default function CreateProduct() {
  const navigate = useNavigate();
  const { state: sidebarState, isMobile } = useSidebar();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [materials, setMaterials] = useState<MaterialFormValues[]>([]);
  const [laborCosts, setLaborCosts] = useState<LaborFormValues[]>([]);
  const [otherCosts, setOtherCosts] = useState<OtherCostFormValues[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate sidebar width for footer positioning (only on desktop)
  const footerLeft = isMobile ? '0' : (sidebarState === 'collapsed' ? '3rem' : '16rem');

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
      units_made: 1,
    },
  });

  const laborForm = useForm<LaborFormValues>({
    resolver: zodResolver(laborSchema),
    defaultValues: {
      activity: '',
      time_spent_minutes: 0,
      hourly_rate: settings.labor_hourly_cost || 0,
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

  // Update hourly_rate default when settings are loaded (only if field is empty/zero)
  useEffect(() => {
    if (settings.labor_hourly_cost !== null && settings.labor_hourly_cost !== undefined) {
      const currentValue = laborForm.getValues('hourly_rate');
      if (currentValue === 0 || currentValue === null || currentValue === undefined) {
        laborForm.setValue('hourly_rate', settings.labor_hourly_cost);
      }
    }
  }, [settings.labor_hourly_cost]);

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

  const onRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const onAddLabor = (data: LaborFormValues) => {
    // Calculate total cost: (time in minutes / 60) * hourly_rate
    const totalCost = (data.time_spent_minutes / 60) * data.hourly_rate;
    setLaborCosts([...laborCosts, { ...data, total_cost: totalCost }]);
    laborForm.reset();
  };

  const onRemoveLabor = (index: number) => {
    setLaborCosts(laborCosts.filter((_, i) => i !== index));
  };

  const onAddOtherCost = (data: OtherCostFormValues) => {
    // Calculate total cost: quantity × cost
    const totalCost = data.quantity * data.cost;
    setOtherCosts([...otherCosts, { ...data, total_cost: totalCost }]);
    otherCostForm.reset();
  };

  const onRemoveOtherCost = (index: number) => {
    setOtherCosts(otherCosts.filter((_, i) => i !== index));
  };

  const onFinalSubmit = async () => {
    setIsSubmitting(true);
    const step1Data = step1Form.getValues();
    
    try {
      // Prepare materials data
      const materialsData = materials.map(m => ({
        name: m.name,
        quantity: m.quantity,
        unit: m.unit,
        price_per_unit: m.price_per_unit,
        units_made: m.units_made || 1,
        user_material_id: m.user_material_id,
      }));

      // Prepare labor costs data
      const laborCostsData = laborCosts.map(l => ({
        activity: l.activity,
        time_spent_minutes: l.time_spent_minutes,
        hourly_rate: l.hourly_rate,
        per_unit: l.per_unit,
      }));

      // Prepare other costs data
      const otherCostsData = otherCosts.map(o => ({
        item: o.item,
        quantity: o.quantity,
        cost: o.cost,
        per_unit: o.per_unit,
      }));

      // Call API to create product
      await api.post('/products', {
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

      // Navigate to products list
      navigate('/products');
    } catch (error: any) {
      console.error('Error creating product:', error);
      // TODO: Show error message to user
      alert(error.response?.data?.message || 'Failed to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const batchSize = step1Form.watch('batch_size');
  
  // Total cost per single product (materials cost is divided by units_made)
  const totalMaterialsCost = materials.reduce((sum, m) => {
    const unitsMade = m.units_made || 1;
    return sum + ((m.quantity * m.price_per_unit) / unitsMade);
  }, 0);
  
  // Labor costs: per_unit costs are per product, others are per batch
  const laborPerProduct = laborCosts
    .filter(l => l.per_unit)
    .reduce((sum, l) => sum + (l.total_cost || 0), 0);
  
  const laborPerBatch = laborCosts
    .filter(l => !l.per_unit)
    .reduce((sum, l) => sum + (l.total_cost || 0), 0);
  
  // Total labor cost per product (per_unit costs + batch costs divided by batch size)
  const totalLaborCostPerProduct = laborPerProduct + (batchSize > 0 ? laborPerBatch / batchSize : 0);
  
  // Other costs: per_unit costs are per product, others are per batch
  const otherCostsPerProduct = otherCosts
    .filter(o => o.per_unit)
    .reduce((sum, o) => sum + (o.total_cost || 0), 0);
  
  const otherCostsPerBatch = otherCosts
    .filter(o => !o.per_unit)
    .reduce((sum, o) => sum + (o.total_cost || 0), 0);
  
  // Total other costs per product (per_unit costs + batch costs divided by batch size)
  const totalOtherCostsPerProduct = otherCostsPerProduct + (batchSize > 0 ? otherCostsPerBatch / batchSize : 0);
  
  // Total cost per product
  const totalCostPerProduct = totalMaterialsCost + totalLaborCostPerProduct + totalOtherCostsPerProduct;
  
  // Total batch cost
  const totalBatchCost = totalCostPerProduct * batchSize;

  return (
    <div className="pb-32">
      {/* Step Indicator in Header Area */}
      <div className="sticky top-0 z-40 bg-background border-b py-2 mb-6 px-6">
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                1
              </div>
              <span className={`text-xs font-medium ${currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Basic Info
              </span>
            </div>
            <div className="flex-1 h-px bg-muted max-w-8" />
            <div className="flex items-center gap-1.5">
              <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
              <span className={`text-xs font-medium ${currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Materials
              </span>
            </div>
            <div className="flex-1 h-px bg-muted max-w-8" />
            <div className="flex items-center gap-1.5">
              <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                3
              </div>
              <span className={`text-xs font-medium ${currentStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Labor
              </span>
            </div>
            <div className="flex-1 h-px bg-muted max-w-8" />
            <div className="flex items-center gap-1.5">
              <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                4
              </div>
              <span className={`text-xs font-medium ${currentStep >= 4 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Other Costs
              </span>
            </div>
          </div>
      </div>

      <div className="px-6 py-6">

      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Product Information</h2>
            <p className="text-sm text-muted-foreground mt-1">Enter the basic details about your product</p>
          </div>
          <div>
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={step1Form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Lavender Candle" {...field} />
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
                        <FormLabel className="flex items-center gap-1.5">
                          SKU (Optional)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Stock Keeping Unit - a unique identifier for your product</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., LVDR_CNDLE_1" {...field} />
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
                        <FormLabel className="flex items-center gap-1.5">
                          Products Per Batch *
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>How many products do you create in one batch?</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                        <FormLabel className="flex items-center gap-1.5">
                          Target Price ({getCurrencySymbol(settings.currency)}) (Optional)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>The price you want to set for this product</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ''}
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
                        <FormLabel className="flex items-center gap-1.5">
                          Desired Markup % (Optional)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Desired markup percentage for pricing calculations</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit">
                    Next: Materials
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Step 2: Materials */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Add Materials</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter material quantities for <strong>one product</strong>. The batch cost will be calculated automatically.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <MaterialSelector
                onSelect={(material, quantity) => {
                  setMaterials([
                    ...materials,
                    {
                      name: material.name,
                      quantity: quantity,
                      unit: material.unit,
                      price_per_unit: material.price_per_unit,
                      units_made: 1, // Default, user can edit in the table
                      user_material_id: material.id,
                      width: material.width,
                      length: material.length,
                    },
                  ]);
                  materialForm.reset();
                }}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or add manually</span>
              </div>
            </div>
            <div>
              <Form {...materialForm}>
                <form onSubmit={materialForm.handleSubmit(onAddMaterial)} className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={materialForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material Name *</FormLabel>
                          <FormControl>
                            <MaterialNameInput
                              value={field.value || ''}
                              onChange={(value) => {
                                field.onChange(value);
                              }}
                              onMaterialSelect={(material) => {
                                // Auto-fill unit and price_per_unit if material is selected
                                materialForm.setValue('unit', material.unit);
                                // Round to 2 decimal places to avoid trailing zeros
                                const roundedPricePerUnit = Math.round(material.price_per_unit * 100) / 100;
                                materialForm.setValue('price_per_unit', roundedPricePerUnit);
                              }}
                              onAddToLibrary={async (name) => {
                                // Optionally add to library - for now just use the name
                                // User can add it properly later from Materials page
                                toast({
                                  variant: 'success',
                                  title: 'Note',
                                  description: `Using "${name}". You can add it to your library later from the Materials page.`,
                                });
                              }}
                              placeholder="Search or type material name..."
                            />
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
                          <FormLabel>Quantity *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || value === null || value === undefined) {
                                  field.onChange(0);
                                } else {
                                  const numValue = parseFloat(value);
                                  field.onChange(isNaN(numValue) ? 0 : numValue);
                                }
                              }}
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
                          <FormLabel className="flex items-center gap-1.5">
                            Measurement Unit *
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Unit of measurement (grams, milliliters, pieces, etc.)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., g, ml, pcs, oz" {...field} />
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
                          <FormLabel className="flex items-center gap-1.5">
                            Price Per {materialForm.watch('unit') || 'Unit'} *
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Price for one {materialForm.watch('unit') || 'unit'} of this material</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || value === null || value === undefined) {
                                  field.onChange(0);
                                } else {
                                  const numValue = parseFloat(value);
                                  if (!isNaN(numValue)) {
                                    // Round to 2 decimal places to avoid trailing zeros
                                    const rounded = Math.round(numValue * 100) / 100;
                                    field.onChange(rounded);
                                  } else {
                                    field.onChange(0);
                                  }
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={materialForm.control}
                      name="units_made"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            Units Made *
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Number of products you can make from this quantity of material</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="1"
                              min="1"
                              placeholder="1"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || value === null || value === undefined) {
                                  field.onChange(1);
                                } else {
                                  const numValue = parseFloat(value);
                                  if (!isNaN(numValue) && numValue > 0) {
                                    field.onChange(numValue);
                                  } else {
                                    field.onChange(1);
                                  }
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Material
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Materials List */}
          {materials.length > 0 && (
            <div className="mt-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold">Materials List</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Materials are entered per single product. Total batch cost is calculated automatically.
                </p>
              </div>
              <div>
                <div className="space-y-4">
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Material</th>
                          <th className="text-left p-3 text-sm font-medium">Quantity</th>
                          <th className="text-left p-3 text-sm font-medium">Unit</th>
                          <th className="text-left p-3 text-sm font-medium">Price per Unit</th>
                          <th className="text-left p-3 text-sm font-medium">Units Made</th>
                          <th className="text-left p-3 text-sm font-medium">Cost Per Product</th>
                          <th className="text-right p-3 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((material, index) => {
                          const unitsMade = material.units_made || 1;
                          const costPerProduct = (material.quantity * material.price_per_unit) / unitsMade;
                          return (
                            <tr key={index} className="border-t">
                              <td className="p-3">
                                <div>
                                  <div className="font-medium">{material.name}</div>
                                  {(material as any).width && (material as any).length && (
                                    <div className="text-xs text-muted-foreground">
                                      {(material as any).width} × {(material as any).length} {material.unit === 'm²' || material.unit === 'ft²' ? material.unit.replace('²', '') : material.unit}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">{material.quantity}</td>
                              <td className="p-3">{material.unit}</td>
                              <td className="p-3">{formatCurrency(material.price_per_unit, settings.currency)}</td>
                              <td className="p-3">{material.units_made || 1}</td>
                              <td className="p-3 font-medium">{formatCurrency(costPerProduct, settings.currency)}</td>
                              <td className="p-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onRemoveMaterial(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 dark:bg-slate-800 font-semibold">
                        <tr>
                          <td colSpan={4} className="p-3 text-right">Total Cost Per Product:</td>
                          <td className="p-3">{formatCurrency(totalMaterialsCost, settings.currency)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={onStep2Submit}>
              Next: Labor
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Labor Costs */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Add Labor Costs</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track time spent on activities. Check "Per Unit" if the cost applies to each product, or leave unchecked if it's a batch activity.
            </p>
          </div>
          <div>
              <Form {...laborForm}>
                <form onSubmit={laborForm.handleSubmit(onAddLabor)} className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={laborForm.control}
                      name="activity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Making Candle" {...field} />
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
                          <FormLabel>Time Spent (Minutes) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              placeholder="0"
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
                          <FormLabel>Hourly Rate ({getCurrencySymbol(settings.currency)}) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
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
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center gap-1.5">
                              Per Unit
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Check if this cost applies to each product. Uncheck if it's a batch activity.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Labor Activity
                  </Button>
                </form>
              </Form>
          </div>

          {/* Labor Costs List */}
          {laborCosts.length > 0 && (
            <div className="mt-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold">Labor Costs List</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Review and manage your labor activities
                </p>
              </div>
              <div>
                <div className="space-y-4">
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Activity</th>
                          <th className="text-left p-3 text-sm font-medium">Time Spent</th>
                          <th className="text-left p-3 text-sm font-medium">Hourly Rate</th>
                          <th className="text-left p-3 text-sm font-medium">Total Cost</th>
                          <th className="text-left p-3 text-sm font-medium">Per Unit</th>
                          <th className="text-right p-3 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {laborCosts.map((labor, index) => {
                          const totalCost = labor.total_cost || 0;
                          return (
                            <tr key={index} className="border-t">
                              <td className="p-3">{labor.activity}</td>
                              <td className="p-3">{labor.time_spent_minutes} min</td>
                              <td className="p-3">{formatCurrency(labor.hourly_rate, settings.currency)}</td>
                              <td className="p-3 font-medium">{formatCurrency(totalCost, settings.currency)}</td>
                              <td className="p-3">
                                {labor.per_unit ? (
                                  <span className="text-sm text-muted-foreground">Yes</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Batch</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onRemoveLabor(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 dark:bg-slate-800 font-semibold">
                        <tr>
                          <td colSpan={3} className="p-3 text-right">Total Labor Cost Per Product:</td>
                          <td className="p-3">{formatCurrency(totalLaborCostPerProduct, settings.currency)}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={onStep3Submit}>
              Next: Other Costs
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Other Costs */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Add Other Costs</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track additional expenses like shipping, marketing, platform fees, etc. Check "Per Unit" if the cost applies to each product, or leave unchecked if it's a batch expense.
            </p>
          </div>
          <div>
              <Form {...otherCostForm}>
                <form onSubmit={otherCostForm.handleSubmit(onAddOtherCost)} className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={otherCostForm.control}
                      name="item"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Shipping" {...field} />
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
                          <FormLabel className="flex items-center gap-1.5">
                            # of Items *
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Quantity or factor for this cost</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0.01"
                              placeholder="1"
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
                          <FormLabel>Cost ({getCurrencySymbol(settings.currency)}) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
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
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center gap-1.5">
                              Per Unit
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Check if this cost applies to each product. Uncheck if it's a batch expense.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Other Cost
                  </Button>
                </form>
              </Form>
          </div>

          {/* Other Costs List */}
          {otherCosts.length > 0 && (
            <div className="mt-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold">Other Costs List</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Review and manage your other expenses
                </p>
              </div>
              <div>
                <div className="space-y-4">
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Item</th>
                          <th className="text-left p-3 text-sm font-medium"># of Items</th>
                          <th className="text-left p-3 text-sm font-medium">Cost</th>
                          <th className="text-left p-3 text-sm font-medium">Total Cost</th>
                          <th className="text-left p-3 text-sm font-medium">Per Unit</th>
                          <th className="text-right p-3 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {otherCosts.map((cost, index) => {
                          const totalCost = cost.total_cost || 0;
                          return (
                            <tr key={index} className="border-t">
                              <td className="p-3">{cost.item}</td>
                              <td className="p-3">{cost.quantity}</td>
                              <td className="p-3">{formatCurrency(cost.cost, settings.currency)}</td>
                              <td className="p-3 font-medium">{formatCurrency(totalCost, settings.currency)}</td>
                              <td className="p-3">
                                {cost.per_unit ? (
                                  <span className="text-sm text-muted-foreground">Yes</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Batch</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onRemoveOtherCost(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 dark:bg-slate-800 font-semibold">
                        <tr>
                          <td colSpan={3} className="p-3 text-right">Total Other Costs Per Product:</td>
                          <td className="p-3">{formatCurrency(totalOtherCostsPerProduct, settings.currency)}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={onFinalSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create Product'}
            </Button>
          </div>
        </div>
      )}
      </div>

      {/* Sticky Summary Bar */}
      <div 
        className="fixed bottom-0 right-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm border-t shadow-lg z-40 transition-[left] duration-200 ease-linear"
        style={{ left: footerLeft }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3">
          {/* Product Info */}
          <div className="flex items-center gap-4 mb-3 pb-3 border-b">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{step1Form.watch('name') || 'New Product'}</span>
            </div>
            {step1Form.watch('sku') && (
              <>
                <div className="h-4 w-px bg-border" />
                <span className="text-xs text-muted-foreground">SKU: {step1Form.watch('sku')}</span>
              </>
            )}
          </div>
          
          {/* Cost Breakdown */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Materials</div>
                  <div className="text-base font-semibold">{formatCurrency(totalMaterialsCost, settings.currency)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Labor</div>
                  <div className="text-base font-semibold">{formatCurrency(totalLaborCostPerProduct, settings.currency)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Other Costs</div>
                  <div className="text-base font-semibold">{formatCurrency(totalOtherCostsPerProduct, settings.currency)}</div>
                </div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Total Cost (Per Product)</div>
                  <div className="text-lg font-bold text-primary">{formatCurrency(totalCostPerProduct, settings.currency)}</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                Total Batch Cost ({batchSize} products)
              </div>
              <div className="text-xl font-bold text-primary">{formatCurrency(totalBatchCost, settings.currency)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
