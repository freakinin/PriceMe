import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Settings2, BarChart2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/hooks/useSettings';
import { getCurrencySymbol } from '@/utils/currency';
import { useToast } from '@/components/ui/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { CategorySelect } from '@/components/CategorySelect';
import { ProductVariationsModal, type Variant } from '@/components/products/ProductVariationsModal';
import { PriceCalculatorPanel } from '@/components/products/PriceCalculatorPanel';

import {
  productSchema,
  type ProductFormValues,
} from '@/types/product-form';
import { MaterialsSection } from '@/components/products/forms/MaterialsSection';
import { LaborSection } from '@/components/products/forms/LaborSection';
import { OtherCostsSection } from '@/components/products/forms/OtherCostsSection';
import {
  calculateMaterialCost,
  calculateLaborCost,
  calculateOtherCost,
} from '@/utils/product-calculations';

// --- Helper Functions ---
// Removed unused formatNumberDisplay


// --- Sub-components for Adding Items ---


// --- Main Component ---

// Persists across mount/unmount cycles (Sheet unmounts content on close)
const productTabMemory: Record<number, string> = {};

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() =>
    productId ? (productTabMemory[productId] || 'basic') : 'basic'
  );

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
  const watchedSku = watch('sku') || '';

  // Watch values
  const materials = watch('materials');
  const laborCosts = watch('labor_costs');
  const otherCosts = watch('other_costs');
  const batchSize = watch('batch_size') || 1;

  // Live cost calculation for variant modal
  const totalCostPerProduct =
    (materials?.reduce((sum, m) => sum + calculateMaterialCost(m, batchSize), 0) || 0) +
    (laborCosts?.reduce((sum, l) => sum + calculateLaborCost(l, batchSize), 0) || 0) +
    (otherCosts?.reduce((sum, o) => sum + calculateOtherCost(o, batchSize), 0) || 0);

  // Restore tab when productId changes while pane is already mounted
  useEffect(() => {
    if (productId) {
      setActiveTab(productTabMemory[productId] || 'basic');
    }
  }, [productId]);

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
          unit: m.unit || 'pcs',
          price_per_unit: Number(m.price_per_unit) || 0,
          quantity_type: 'exact' as const,
          quantity_percentage: undefined,
          per_batch: m.quantity_per_item_or_batch === 'batch',
          units_made: Number(m.units_made) || 1,
          user_material_id: m.user_material_id != null ? Number(m.user_material_id) : undefined,
          stock_level: undefined
        })) || [],
        labor_costs: product.labor_costs?.map((l: any) => ({
          activity: l.activity || '',
          time_minutes: Number(l.time_spent_minutes) || 0,
          hourly_rate: Number(l.hourly_rate) || 0,
          per_batch: !Boolean(l.per_unit ?? true)
        })) || [],
        other_costs: product.other_costs?.map((o: any) => ({
          item: o.item || '',
          quantity: Number(o.quantity) || 0,
          cost: Number(o.cost) || 0,
          per_batch: !Boolean(o.per_unit ?? true)
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

    }
  }, [open, product, reset, productId]);

  const onFinalSubmit = async (data: ProductFormValues) => {
    if (!productId) return;
    try {
      const updateData = {
        ...data,
        sku: data.sku || undefined,
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
          className="w-full sm:max-w-2xl overflow-y-auto p-0 flex flex-col"
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

                {/* Market Analysis Button — navigates to full page */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { onOpenChange(false); navigate(`/market-analysis?productId=${productId}`); }}
                  className="h-9 w-9"
                  title="Competitor Analysis"
                >
                  <BarChart2 className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 pt-2">
              {isLoadingProduct || !product ? (
                <div className="py-8 text-center text-muted-foreground">Loading product data...</div>
              ) : (
                <div className="space-y-6 h-full flex flex-col">
                  <Form {...form}>
                    <form onSubmit={handleSubmit(onFinalSubmit, onInvalid)} className="flex flex-col h-full">
                      <Tabs value={activeTab} onValueChange={tab => { setActiveTab(tab); if (productId) productTabMemory[productId] = tab; }} className="w-full flex-1">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                          <TabsTrigger value="basic">Basic</TabsTrigger>
                          <TabsTrigger value="materials">Materials</TabsTrigger>
                          <TabsTrigger value="labor">Labor</TabsTrigger>
                          <TabsTrigger value="other">Other</TabsTrigger>
                        </TabsList>

                        {/* Tab 1: Basic Info */}
                        <TabsContent value="basic" className="space-y-4 mt-0">
                          <PriceCalculatorPanel
                            totalCost={totalCostPerProduct}
                            currency={settings?.currency || 'USD'}
                            initialMethod={(watch('pricing_method') as any) || 'price'}
                            initialValue={watch('pricing_value') || watch('target_price') || undefined}
                            onChange={(method, value, calculatedPrice) => {
                              form.setValue('pricing_method', method);
                              form.setValue('pricing_value', value);
                              form.setValue('target_price', calculatedPrice);
                            }}
                          />
                          <hr className="border-border" />
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
                        </TabsContent>

                        {/* Tab 2: Materials */}
                        <TabsContent value="materials" className="space-y-4 mt-0">
                          <MaterialsSection
                            control={control}
                            materials={materials || []}
                            settings={settings}
                            batchSize={batchSize}
                          />
                        </TabsContent>

                        {/* Tab 3: Labor */}
                        <TabsContent value="labor" className="space-y-4 mt-0">
                          <LaborSection
                            control={control}
                            laborCosts={laborCosts || []}
                            settings={settings}
                            batchSize={batchSize}
                          />
                        </TabsContent>

                        {/* Tab 4: Other Costs */}
                        <TabsContent value="other" className="space-y-4 mt-0">
                          <OtherCostsSection
                            control={control}
                            otherCosts={otherCosts || []}
                            settings={settings}
                            batchSize={batchSize}
                          />
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
        </SheetContent>
      </Sheet>

      <ProductVariationsModal
        open={isVariationsModalOpen}
        onOpenChange={setIsVariationsModalOpen}
        variants={variants}
        onSave={setVariants}
        currency={getCurrencySymbol(settings.currency)}
        baseCost={totalCostPerProduct}
        basePrice={currentPrice}
        baseSku={watchedSku}
      />
    </>
  );
}
