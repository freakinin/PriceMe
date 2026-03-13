
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings2, BarChart2 } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import api from '@/lib/api';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { ToastAction } from '@/components/ui/toast';
import { openSettingsAt } from '@/lib/openSettings';
import { useSettings } from '@/hooks/useSettings';
import { useSubscription } from '@/hooks/useSubscription';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency';
import { useToast } from '@/components/ui/use-toast';

import { ProductVariationsModal, type Variant } from '@/components/products/ProductVariationsModal';
import { useProducts } from '@/hooks/useProducts';
import { CategorySelect } from '@/components/CategorySelect';
import { track } from '@/lib/analytics';
import { useTour, PRODUCT_TOUR_STORAGE_KEY } from '@/components/onboarding/TourContext';

// Imported Schemas & Types
import {
  productSchema,
  type ProductFormValues,
} from '@/types/product-form';
// Imported Components
import { MaterialsSection } from '@/components/products/forms/MaterialsSection';
import { LaborSection } from '@/components/products/forms/LaborSection';
import { OtherCostsSection } from '@/components/products/forms/OtherCostsSection';
import { PriceCalculatorPanel } from '@/components/products/PriceCalculatorPanel';
// Imported Utils
import {
  calculateMaterialCost,
  calculateLaborCost,
  calculateOtherCost
} from '@/utils/product-calculations';

// --- Types & Schemas ---
// Imported from '@/types/product-form'

// --- Helper Functions ---



// --- Sub-components for Adding Items ---




// --- Main Component ---

export default function CreateProduct() {
  const navigate = useNavigate();
  const { id: editProductId } = useParams<{ id: string }>();
  const isEditMode = !!editProductId;
  const { setOpen } = useSidebar();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { subscription, invalidate: invalidateSubscription } = useSubscription();
  const { createProduct, updateProduct } = useProducts();


  const [variants, setVariants] = useState<Variant[]>([]);
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState<{ open: boolean; limit: number }>({ open: false, limit: 0 });

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Auto-start product form tour on first visit to Add Product (not edit)
  const { startProductTour } = useTour();
  useEffect(() => {
    if (!isEditMode && !localStorage.getItem(PRODUCT_TOUR_STORAGE_KEY)) {
      const t = setTimeout(startProductTour, 600);
      return () => clearTimeout(t);
    }
  }, [isEditMode, startProductTour]);



  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  useEffect(() => {
    setOpen(false);
    if (!isEditMode) {
      track({ event: 'product_creation_started' });
    }
  }, []);

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get('/templates');
        if (res.data.status === 'success') {
          setTemplates(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch templates', err);
      }
    };
    fetchTemplates();
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      category_id: null,
      batch_size: 1,
      target_price: 0,
      materials: [],
      labor_costs: [],
      other_costs: [],
    },
  });

  // Fetch product data when in edit mode
  useEffect(() => {
    if (!isEditMode || !editProductId) return;
    const fetchProduct = async () => {
      setIsLoadingProduct(true);
      try {
        const res = await api.get(`/products/${editProductId}`);
        if (res.data.status === 'success') {
          const p = res.data.data;
          form.reset({
            name: p.name || '',
            sku: p.sku || '',
            category_id: p.category_id || null,
            batch_size: p.batch_size || 1,
            target_price: p.target_price ? Number(p.target_price) : 0,
            pricing_method: p.pricing_method || 'price',
            pricing_value: Number(p.pricing_value) || 0,
            materials: (p.materials || []).map((m: any) => ({
              name: m.name,
              quantity: Number(m.quantity) || 0,
              unit: m.unit || 'pcs',
              price_per_unit: Number(m.price_per_unit) || 0,
              quantity_type: 'exact' as const,
              quantity_percentage: undefined,
              per_batch: false,
              units_made: Number(m.units_made) || 1,
              user_material_id: m.user_material_id || undefined,
              stock_level: undefined,
            })),
            labor_costs: (p.labor_costs || []).map((l: any) => ({
              activity: l.activity,
              time_minutes: Number(l.time_spent_minutes) || 0,
              hourly_rate: Number(l.hourly_rate) || 0,
              per_batch: !l.per_unit,
            })),
            other_costs: (p.other_costs || []).map((o: any) => ({
              item: o.item,
              quantity: Number(o.quantity) || 0,
              cost: Number(o.cost) || 0,
              per_batch: !o.per_unit,
            })),
          });
          // Load variants
          if (p.variants && p.variants.length > 0) {
            setVariants(p.variants.map((v: any) => ({
              name: v.name,
              sku: v.sku || '',
              price_override: v.price_override ? Number(v.price_override) : undefined,
              cost_override: v.cost_override ? Number(v.cost_override) : undefined,
              stock_level: v.stock_level || 0,
              is_active: v.is_active ?? true,
              attributes: v.attributes || [],
            })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch product for editing', err);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load product data' });
        navigate('/products');
      } finally {
        setIsLoadingProduct(false);
      }
    };
    fetchProduct();
  }, [editProductId, isEditMode]);

  const { reset, control, handleSubmit, watch, setValue } = form;

  const handleLoadTemplate = async (templateId: string) => {
    if (!templateId || templateId === 'none') {
      setSelectedTemplateId('');
      // Optionally reset form to default values if 'none' is selected
      reset();
      setVariants([]); // Clear variants if template is removed
      setVariants([]); // Clear variants if template is removed
      return;
    }

    try {
      const res = await api.get(`/templates/${templateId}`);
      if (res.data.status === 'success') {
        const tmpl = res.data.data;

        // Parse JSON fields
        const materials = Array.isArray(tmpl.materials_json)
          ? tmpl.materials_json
          : (typeof tmpl.materials_json === 'string' ? JSON.parse(tmpl.materials_json) : []);

        const laborCosts = Array.isArray(tmpl.labor_costs_json)
          ? tmpl.labor_costs_json
          : (typeof tmpl.labor_costs_json === 'string' ? JSON.parse(tmpl.labor_costs_json) : []);

        const otherCosts = Array.isArray(tmpl.other_costs_json)
          ? tmpl.other_costs_json
          : (typeof tmpl.other_costs_json === 'string' ? JSON.parse(tmpl.other_costs_json) : []);

        const variants = Array.isArray(tmpl.variants_json)
          ? tmpl.variants_json
          : (typeof tmpl.variants_json === 'string' ? JSON.parse(tmpl.variants_json) : []);

        // Populate form
        setValue('name', tmpl.name || ''); // Or keep blank to force new name? Let's use template name as base.
        setValue('batch_size', tmpl.default_batch_size || 1);

        // Clear existing arrays and add template items
        setValue('materials', materials);
        setValue('labor_costs', laborCosts);
        setValue('other_costs', otherCosts);

        // Handle Pricing Method specific logic if needed (e.g. set method state)
        if (tmpl.default_pricing_method) {
          // These would set the removed state variables, remove if not needed or re-implement
          // setPricingMethod(tmpl.default_pricing_method as any); 
          // if (tmpl.default_markup_percentage) {
          //    setMarkupPercentage(tmpl.default_markup_percentage);
          // }
        }

        if (variants.length > 0) {
          setVariants(variants); // Changed from setLocalVariants
        }

        track({ event: 'template_loaded', template_id: templateId });
        toast({
          variant: 'success',
          title: "Template Loaded",
          description: `Loaded configuration from ${tmpl.name}`,
        });

        setSelectedTemplateId(templateId);
      }
    } catch (err) {
      console.error('Failed to load template', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load template data",
      });
    }
  };



  // Watch values for live calculations
  const batchSize = watch('batch_size') || 1;
  const materials = watch('materials');
  const laborCosts = watch('labor_costs');
  const otherCosts = watch('other_costs');
  const targetPrice = watch('target_price') || 0;

  // --- Calculations ---



  const totalMaterialsCost = materials?.reduce((sum, m) => sum + calculateMaterialCost(m, batchSize), 0) || 0;
  const totalLaborCost = laborCosts?.reduce((sum, l) => sum + calculateLaborCost(l, batchSize), 0) || 0;
  const totalOtherCost = otherCosts?.reduce((sum, o) => sum + calculateOtherCost(o, batchSize), 0) || 0;
  const totalCostPerProduct = totalMaterialsCost + totalLaborCost + totalOtherCost;


  // --- Actions ---




  const onSubmit = async (data: ProductFormValues) => {
    try {
      console.log('Submitting data:', data);
      const productData = {
        name: data.name,
        sku: data.sku || undefined,
        category_id: data.category_id || undefined,
        batch_size: data.batch_size,
        target_price: data.target_price,
        pricing_method: data.pricing_method || (data.target_price ? 'price' : undefined),
        pricing_value: data.pricing_value || data.target_price || undefined,
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

      if (isEditMode && editProductId) {
        await updateProduct({ id: Number(editProductId), data: productData });
        track({ event: 'product_updated' });
        toast({ variant: 'success', title: 'Success', description: 'Product updated successfully' });
      } else {
        await createProduct(productData);
        track({
          event: 'product_created',
          has_materials: data.materials.length > 0,
          has_labor: data.labor_costs.length > 0,
          has_other_costs: data.other_costs.length > 0,
          variant_count: variants.length,
          has_category: !!data.category_id,
        });
        invalidateSubscription();

        const limit = subscription?.limits.products ?? -1;
        const newCount = (subscription?.usage.products ?? 0) + 1;
        if (limit !== -1 && newCount >= limit) {
          toast({
            variant: 'destructive',
            title: 'Product limit reached',
            description: `You've used all ${limit} product slots on your plan.`,
            action: <ToastAction altText="Upgrade" onClick={() => openSettingsAt('subscription')}>Upgrade</ToastAction>,
          });
        } else if (limit !== -1 && newCount / limit >= 0.8) {
          toast({
            title: 'Almost at your product limit',
            description: `${newCount} of ${limit} product slots used.`,
            action: <ToastAction altText="View Plans" onClick={() => openSettingsAt('subscription')}>View Plans</ToastAction>,
          });
        } else {
          toast({ variant: 'success', title: 'Success', description: 'Product created successfully' });
        }
      }
      navigate('/products');

    } catch (error: any) {
      console.error('Submit error:', error);
      if (error.response?.data?.code === 'PLAN_LIMIT_REACHED') {
        track({ event: 'plan_limit_reached', limit_type: 'products', plan: subscription?.plan ?? 'free' });
        setUpgradePrompt({ open: true, limit: error.response.data.data?.limit ?? 0 });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: error.message || `Failed to ${isEditMode ? 'update' : 'create'} product` });
      }
    }
  };

  const onError = (errors: any) => {
    console.error('Form Validation Errors:', JSON.stringify(errors, null, 2));
    toast({
      variant: 'destructive',
      title: 'Validation Failed',
      description: `Please check the console for details. Helper: ${Object.keys(errors).join(', ')}`
    });
  };

  // Header Portal Targets
  const [headerContainer, setHeaderContainer] = useState<HTMLElement | null>(null);
  const [headerTitleContainer, setHeaderTitleContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderContainer(document.getElementById('header-actions'));
    setHeaderTitleContainer(document.getElementById('header-title'));
  }, []);

  const watchedName = watch('name');

  if (isLoadingProduct) {
    return <div className="flex items-center justify-center h-[calc(100vh-4rem)]">Loading product data...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">

        {/* Header Title Portal */}
        {headerTitleContainer && createPortal(
          <h1 className="text-xl font-semibold">
            {isEditMode ? `Edit ${watchedName || 'Product'}` : 'Add Product'}
          </h1>,
          headerTitleContainer
        )}

        {/* Header Actions Portal */}
        {headerContainer && createPortal(
          <div className="flex items-center gap-2">
            <Select value={selectedTemplateId} onValueChange={handleLoadTemplate}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Load Template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Clear)</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVariationsModalOpen(true)}
              className="h-9 w-9"
              title={variants.length > 0 ? `Manage Variations (${variants.length})` : 'Add Variations'}
            >
              <Settings2 className="h-4 w-4" />
            </Button>

            {isEditMode && editProductId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => navigate(`/market-analysis?productId=${editProductId}`)}
                title="Competitor Analysis"
              >
                <BarChart2 className="h-4 w-4" />
              </Button>
            )}
          </div>,
          headerContainer
        )}

        <ProductVariationsModal
          open={isVariationsModalOpen}
          onOpenChange={setIsVariationsModalOpen}
          variants={variants}
          onSave={setVariants}
          currency={getCurrencySymbol(settings.currency)}
          baseCost={totalCostPerProduct}
          basePrice={targetPrice}
          baseSku={watch('sku') || ''}
        />

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Top Section */}
            <div className="grid grid-cols-5 gap-4 items-end" data-tour="ptour-top-section">
              <FormField control={control} name="name" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl><Input placeholder="My Product" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="category_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <CategorySelect
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="sku" render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl><Input placeholder="SKU-001" autoComplete="off" {...field} value={field.value || ''} /></FormControl>
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
            </div>

            {/* 3-Column Grid: Materials, Labor, Other */}
            <div className="grid grid-cols-3 gap-6">

              {/* Materials */}
              <div data-tour="ptour-materials">
                <MaterialsSection
                  control={control}
                  materials={materials || []}
                  settings={settings}
                  batchSize={batchSize}
                />
              </div>

              {/* Labor */}
              <div data-tour="ptour-labor">
                <LaborSection
                  control={control}
                  laborCosts={laborCosts || []}
                  settings={settings}
                  batchSize={batchSize}
                />
              </div>

              {/* Other Costs */}
              <div data-tour="ptour-other-costs">
                <OtherCostsSection
                  control={control}
                  otherCosts={otherCosts || []}
                  settings={settings}
                  batchSize={batchSize}
                />
              </div>
            </div>

            {/* Pricing Panel */}
            <div data-tour="ptour-cost-bar">
              <PriceCalculatorPanel
                totalCost={totalCostPerProduct}
                currency={settings.currency}
                initialMethod={(watch('pricing_method') as any) || 'price'}
                initialValue={watch('pricing_value') || watch('target_price') || undefined}
                onChange={(method, value, calculatedPrice) => {
                  setValue('pricing_method', method);
                  setValue('pricing_value', value);
                  setValue('target_price', calculatedPrice);
                }}
              />
            </div>
          </form>
        </Form>
      </div>

      {/* Bottom Bar */}
      <div className="shrink-0 bg-background border-t px-6 py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">

          {/* Left: Cost Breakdown */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Materials: <span className="font-medium text-foreground">{formatCurrency(totalMaterialsCost, settings.currency)}</span></span>
            <span>Labor: <span className="font-medium text-foreground">{formatCurrency(totalLaborCost, settings.currency)}</span></span>
            <span>Other: <span className="font-medium text-foreground">{formatCurrency(totalOtherCost, settings.currency)}</span></span>
            <div className="h-4 w-px bg-border" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Total Cost: <span className="text-base font-bold text-primary normal-case tracking-normal">{formatCurrency(totalCostPerProduct, settings.currency)}</span>
            </span>
          </div>

          {/* Right: Buttons */}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => navigate('/products')}>Cancel</Button>
            <Button type="button" size="sm" onClick={handleSubmit(onSubmit, onError)}>{isEditMode ? 'Update Product' : 'Create Product'}</Button>
          </div>
        </div>
      </div>

      <UpgradePrompt
        open={upgradePrompt.open}
        onOpenChange={(open) => setUpgradePrompt((p) => ({ ...p, open }))}
        resource="products"
        currentLimit={upgradePrompt.limit}
        onViewPlans={() => openSettingsAt('subscription')}
      />
    </div>
  );
}
