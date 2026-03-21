
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings2, BarChart2, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MarketAnalysisPanel } from '@/components/MarketAnalysisPanel';
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
import { useShippingMethods } from '@/hooks/useShippingMethods';
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
import { ShippingScenariosPanel } from '@/components/products/ShippingScenariosPanel';
// Imported Utils
import {
  calculateMaterialCost,
  calculateLaborCost,
  calculateOtherCost
} from '@/utils/product-calculations';

// --- Types & Schemas ---
// Imported from '@/types/product-form'

// --- Helper Functions ---



// --- Break-Even Chart (SVG, no external deps) ---

function BreakEvenChart({ batchSize, pricePerUnit, costPerUnit }: {
  batchSize: number;
  pricePerUnit: number;
  costPerUnit: number;
}) {
  const vW = 400, vH = 130;
  const ml = 6, mr = 6, mt = 14, mb = 22;
  const cW = vW - ml - mr;
  const cH = vH - mt - mb;

  const totalCost    = costPerUnit * batchSize;
  const totalRevenue = pricePerUnit * batchSize;
  const maxY = Math.max(totalCost, totalRevenue) * 1.12;

  const px = (units: number) => ml + (units / batchSize) * cW;
  const py = (val: number)   => mt + cH - (val / maxY) * cH;

  const breakEvenUnits = pricePerUnit > 0 ? totalCost / pricePerUnit : Infinity;
  const hasBreakEven   = breakEvenUnits < batchSize;
  const bex = hasBreakEven ? px(breakEvenUnits) : null;
  const bey = hasBreakEven ? py(totalCost) : null;

  // Fill polygons
  const lossPolygon = hasBreakEven
    ? `${px(0)},${py(0)} ${bex},${bey} ${px(0)},${py(totalCost)}`
    : `${px(0)},${py(0)} ${px(batchSize)},${py(totalRevenue)} ${px(batchSize)},${py(totalCost)} ${px(0)},${py(totalCost)}`;

  const profitPolygon = hasBreakEven
    ? `${bex},${bey} ${px(batchSize)},${py(totalRevenue)} ${px(batchSize)},${py(totalCost)}`
    : null;

  return (
    <svg viewBox={`0 0 ${vW} ${vH}`} className="w-full">
      {/* Legend */}
      <circle cx={ml} cy={8} r={3} fill="#f97316" />
      <text x={ml + 6} y={11} fontSize="8" fill="#6b7280">Cost</text>
      <circle cx={ml + 38} cy={8} r={3} fill="#22c55e" />
      <text x={ml + 44} y={11} fontSize="8" fill="#6b7280">Revenue</text>
      {hasBreakEven && <>
        <circle cx={ml + 100} cy={8} r={3} fill="#3b82f6" />
        <text x={ml + 106} y={11} fontSize="8" fill="#6b7280">Break-even</text>
      </>}

      {/* Filled areas */}
      <polygon points={lossPolygon} fill="#fee2e2" fillOpacity="0.5" />
      {profitPolygon && <polygon points={profitPolygon} fill="#dcfce7" fillOpacity="0.6" />}

      {/* X axis */}
      <line x1={ml} y1={mt + cH} x2={vW - mr} y2={mt + cH} stroke="#e5e7eb" strokeWidth="1" />

      {/* Break-even vertical guide */}
      {hasBreakEven && bex && (
        <line x1={bex} y1={mt} x2={bex} y2={mt + cH} stroke="#93c5fd" strokeDasharray="3,2" strokeWidth="1" />
      )}

      {/* Cost line — flat, dashed, orange */}
      <line
        x1={px(0)} y1={py(totalCost)}
        x2={px(batchSize)} y2={py(totalCost)}
        stroke="#f97316" strokeWidth="1.5" strokeDasharray="5,3"
      />

      {/* Revenue line — rising, green */}
      <line
        x1={px(0)} y1={py(0)}
        x2={px(batchSize)} y2={py(totalRevenue)}
        stroke="#22c55e" strokeWidth="1.5"
      />

      {/* Break-even dot */}
      {hasBreakEven && bex && bey && (
        <circle cx={bex} cy={bey} r="3.5" fill="#3b82f6" />
      )}

      {/* X axis labels */}
      <text x={px(0)} y={vH - 4} textAnchor="start" fontSize="9" fill="#9ca3af">0</text>
      {hasBreakEven && bex && (
        <text x={bex} y={vH - 4} textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">
          {Math.ceil(breakEvenUnits)}
        </text>
      )}
      <text x={px(batchSize)} y={vH - 4} textAnchor="end" fontSize="9" fill="#9ca3af">{batchSize}</text>
    </svg>
  );
}

// --- Batch Insight Card ---

function BatchInsightCard({ batchSize, pricePerUnit, costPerUnit, currency }: {
  batchSize: number;
  pricePerUnit: number;
  costPerUnit: number;
  currency: string;
}) {
  if (batchSize <= 1 || pricePerUnit <= 0) return null;

  const totalRevenue = pricePerUnit * batchSize;
  const totalCost    = costPerUnit * batchSize;
  const totalProfit  = totalRevenue - totalCost;
  const breakEvenUnits = costPerUnit > 0 ? Math.ceil(totalCost / pricePerUnit) : 0;
  const breakEvenPct   = Math.round((breakEvenUnits / batchSize) * 100);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Batch of {batchSize} units</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Optimistic — all sold</div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Revenue</div>
          <div className="text-sm font-semibold">{formatCurrency(totalRevenue, currency)}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Profit</div>
          <div className={`text-sm font-semibold ${totalProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {formatCurrency(totalProfit, currency)}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Total Cost</div>
          <div className="text-sm font-semibold">{formatCurrency(totalCost, currency)}</div>
        </div>
      </div>

      <div className="pt-2 border-t">
        {breakEvenUnits > 0 && breakEvenUnits <= batchSize && (
          <p className="text-xs text-muted-foreground mb-2">
            Break even after selling <span className="font-semibold text-foreground">{breakEvenUnits} of {batchSize}</span> units ({breakEvenPct}%)
          </p>
        )}
        <BreakEvenChart batchSize={batchSize} pricePerUnit={pricePerUnit} costPerUnit={costPerUnit} />
      </div>
    </div>
  );
}

// --- Sub-components for Adding Items ---




// --- Main Component ---

export default function CreateProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: editProductId } = useParams<{ id: string }>();
  const isEditMode = !!editProductId;
  const { setOpen } = useSidebar();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { subscription, invalidate: invalidateSubscription } = useSubscription();
  const { createProduct, updateProduct } = useProducts();
  const { methods: shippingMethods } = useShippingMethods();


  const [variants, setVariants] = useState<Variant[]>([]);
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);
  const [isMarketAnalysisOpen, setIsMarketAnalysisOpen] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState<{ open: boolean; limit: number }>({ open: false, limit: 0 });

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'materials' | 'labor' | 'other'>('materials');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);


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
      shipping_scenarios: [],
    },
  });

  // Auto-apply default shipping method as an Other Cost on new product creation
  useEffect(() => {
    if (isEditMode) return;
    const defaultMethod = shippingMethods.find((m) => m.is_default);
    if (!defaultMethod) return;
    const current = form.getValues('other_costs');
    if (current.length > 0) return; // Don't overwrite if costs already exist (e.g. template loaded)
    form.setValue('other_costs', [{
      item: defaultMethod.name,
      quantity: 1,
      cost: defaultMethod.is_free_shipping ? 0 : defaultMethod.cost,
      per_batch: false,
      is_shipping: true,
    }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingMethods, isEditMode]);

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
              is_shipping: o.is_shipping || false,
            })),
            shipping_scenarios: Array.isArray(p.shipping_scenarios)
              ? p.shipping_scenarios
              : (typeof p.shipping_scenarios === 'string'
                  ? JSON.parse(p.shipping_scenarios)
                  : []),
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

  // Pre-fill from AI Generator — runs once on mount in create mode
  useEffect(() => {
    if (isEditMode) return;
    const prefill = (location.state as any)?.prefill;
    if (!prefill) return;

    form.reset({
      name: prefill.name || '',
      sku: prefill.sku || '',
      description: prefill.description || '',
      category_id: prefill.category_id ?? null,
      batch_size: prefill.batch_size || 1,
      target_price: prefill.target_price || 0,
      pricing_method: prefill.pricing_method || 'price',
      pricing_value: prefill.pricing_value || prefill.target_price || 0,
      materials: (prefill.materials || []).map((m: any) => ({
        name: m.name,
        quantity: Number(m.quantity) || 0,
        unit: m.unit || 'pcs',
        price_per_unit: Number(m.price_per_unit) || 0,
        quantity_type: 'exact' as const,
        quantity_percentage: undefined,
        per_batch: m.per_batch ?? false,
        units_made: Number(m.units_made) || 1,
        user_material_id: undefined,
        stock_level: undefined,
      })),
      labor_costs: (prefill.labor_costs || []).map((l: any) => ({
        activity: l.activity,
        time_minutes: Number(l.time_minutes) || 0,
        hourly_rate: Number(l.hourly_rate) || 0,
        per_batch: l.per_batch ?? false,
      })),
      other_costs: (prefill.other_costs || []).map((o: any) => ({
        item: o.item,
        quantity: Number(o.quantity) || 0,
        cost: Number(o.cost) || 0,
        per_batch: o.per_batch ?? false,
        is_shipping: false,
      })),
      shipping_scenarios: [],
    });

    // Clear nav state so browser back/refresh doesn't re-apply prefill
    window.history.replaceState({}, '', window.location.pathname);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const shippingScenarios = watch('shipping_scenarios') || [];

  // --- Calculations ---



  const totalMaterialsCost = materials?.reduce((sum, m) => sum + calculateMaterialCost(m, batchSize), 0) || 0;
  const totalLaborCost = laborCosts?.reduce((sum, l) => sum + calculateLaborCost(l, batchSize), 0) || 0;
  const totalOtherCost = otherCosts?.reduce((sum, o) => sum + calculateOtherCost(o, batchSize), 0) || 0;
  const shippingCostInOtherCosts = otherCosts?.filter(o => o.is_shipping).reduce((sum, o) => sum + calculateOtherCost(o, batchSize), 0) || 0;
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
          per_unit: !o.per_batch,
          is_shipping: o.is_shipping || false,
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
        shipping_scenarios: data.shipping_scenarios || [],
      };

      if (isEditMode && editProductId) {
        await updateProduct({ id: Number(editProductId), data: productData });
        track({ event: 'product_updated' });
        toast({ variant: 'success', title: 'Success', description: 'Product updated successfully' });
      } else {
        const createResult = await createProduct(productData);
        const newProductId: number | undefined = createResult?.data?.id;

        // Auto-track competitor URLs that were passed from the AI Generator
        const prefillCompetitorUrls = (location.state as any)?.competitorUrls as string[] | undefined;
        if (newProductId && prefillCompetitorUrls && prefillCompetitorUrls.length > 0) {
          // Run in background — doesn't block the save flow
          Promise.allSettled(
            prefillCompetitorUrls.map(url =>
              api.post('/competitors/track', { url, linkedProductId: newProductId })
            )
          ).then(results => {
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            if (succeeded > 0) {
              toast({
                variant: 'success',
                title: `${succeeded} competitor URL${succeeded > 1 ? 's' : ''} tracked`,
                description: 'Check the Competitors page to view and analyze them.',
              });
            }
          });
        }

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
      if (saveAsTemplate) {
        try {
          await api.post('/templates', {
            name: data.name,
            default_batch_size: data.batch_size,
            default_pricing_method: data.pricing_method || undefined,
            default_markup_percentage: data.pricing_value || undefined,
            materials: data.materials,
            labor_costs: data.labor_costs,
            other_costs: data.other_costs,
            variants,
          });
          toast({ variant: 'success', title: 'Template saved', description: `"${data.name}" saved as a template.` });
        } catch {
          toast({ variant: 'destructive', title: 'Template not saved', description: 'Product was saved but the template could not be created.' });
        }
        setSaveAsTemplate(false);
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


  // Live product snapshot from current (unsaved) form state for market analysis
  const liveProduct = isEditMode && editProductId ? {
    id: Number(editProductId),
    name: watchedName || '',
    target_price: targetPrice,
    product_cost: totalCostPerProduct,
    profit: targetPrice - totalCostPerProduct,
    profit_margin: targetPrice > 0 ? ((targetPrice - totalCostPerProduct) / targetPrice) * 100 : 0,
    materials: materials || [],
    materials_total: totalMaterialsCost,
    labor_total: totalLaborCost,
    other_total: totalOtherCost,
  } : null;

  if (isLoadingProduct) {
    return <div className="flex items-center justify-center h-full">Loading product data...</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">


      <div className="flex-1 overflow-y-auto lg:overflow-hidden lg:flex lg:flex-col">

        {/* Header Title Portal */}
        {headerTitleContainer && createPortal(
          <div className="min-w-0">
            {isEditMode ? (
              <>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-0.5">Editing</div>
                <div className="text-base font-semibold truncate max-w-[220px] leading-tight">{watchedName || 'Product'}</div>
              </>
            ) : (
              <h1 className="text-base font-semibold">Add Product</h1>
            )}
          </div>,
          headerTitleContainer
        )}

        {/* Header Actions Portal */}
        {headerContainer && createPortal(
          <div className="flex items-center gap-2">
            <Select value={selectedTemplateId} onValueChange={handleLoadTemplate}>
              <SelectTrigger className="hidden lg:flex w-[180px] h-9">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Load Template..." />
              </SelectTrigger>
              <SelectContent align="end">
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
                onClick={() => setIsMarketAnalysisOpen(true)}
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
          <form onSubmit={handleSubmit(onSubmit)} className="lg:flex-1 lg:flex lg:flex-col min-h-0">
            <div className="lg:flex-1 flex flex-col lg:flex-row lg:overflow-hidden min-h-0">

              {/* LEFT PANEL: product info + cost sections (scrollable) */}
              <div className="flex-1 lg:overflow-y-auto px-6 pt-6 pb-2 space-y-6">

                {/* Top Section */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 items-end" data-tour="ptour-top-section">
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

                {/* Desktop tab bar */}
                <div className="hidden lg:flex items-center gap-1 border-b -mx-6 px-6 pb-0 pt-1">
                  {([
                    { id: 'materials', label: 'Materials', count: materials?.length ?? 0 },
                    { id: 'labor',     label: 'Labor',     count: laborCosts?.length ?? 0 },
                    { id: 'other',     label: 'Other Costs', count: otherCosts?.length ?? 0 },
                  ] as const).map(({ id, label, count }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      className={`px-3 py-1.5 rounded-t-md text-xs font-medium transition-colors flex items-center gap-1.5 border-b-2 -mb-px ${
                        activeTab === id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                      {count > 0 && (
                        <span className={`text-[10px] rounded-full px-1.5 leading-4 ${
                          activeTab === id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>{count}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* DESKTOP: one tab section at a time */}
                <div className="hidden lg:block" data-tour="ptour-materials">
                  {activeTab === 'materials' && <MaterialsSection control={control} materials={materials || []} settings={settings} batchSize={batchSize} />}
                  {activeTab === 'labor'     && <LaborSection control={control} laborCosts={laborCosts || []} settings={settings} batchSize={batchSize} />}
                  {activeTab === 'other'     && <OtherCostsSection control={control} otherCosts={otherCosts || []} settings={settings} batchSize={batchSize} />}
                </div>

                {/* MOBILE: all sections stacked */}
                <div className="lg:hidden space-y-6">
                  <MaterialsSection control={control} materials={materials || []} settings={settings} batchSize={batchSize} />
                  <LaborSection control={control} laborCosts={laborCosts || []} settings={settings} batchSize={batchSize} />
                  <OtherCostsSection control={control} otherCosts={otherCosts || []} settings={settings} batchSize={batchSize} />
                </div>

                {/* Pricing — mobile only (desktop shows it in the right panel) */}
                <div className="lg:hidden" data-tour="ptour-cost-bar">
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

              </div>

              {/* RIGHT PANEL: pricing calculator (desktop only, always visible) */}
              <div className="hidden lg:flex lg:flex-col w-[40rem] shrink-0 border-l overflow-y-auto p-6" data-tour="ptour-cost-bar">
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
                <BatchInsightCard
                  batchSize={batchSize}
                  pricePerUnit={targetPrice}
                  costPerUnit={totalCostPerProduct}
                  currency={settings.currency}
                />
                <div className="mt-4">
                  <ShippingScenariosPanel
                    scenarios={shippingScenarios}
                    onChange={(s) => setValue('shipping_scenarios', s)}
                    productCost={totalCostPerProduct}
                    shippingCostInOtherCosts={shippingCostInOtherCosts}
                    targetPrice={targetPrice}
                    currency={settings.currency}
                    shippingMethods={shippingMethods}
                  />
                </div>
              </div>

            </div>
          </form>
        </Form>
      </div>

      {/* Footer */}
      <div className="shrink-0 bg-background border-t px-6 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between gap-4">

          {/* Left: cost summary */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground leading-none mb-0.5">Total Cost</div>
              <div className="text-sm font-bold text-primary">{formatCurrency(totalCostPerProduct, settings.currency)}</div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-border">·</span>
              <span>Mat <span className="font-medium text-foreground">{formatCurrency(totalMaterialsCost, settings.currency)}</span></span>
              <span className="text-border">·</span>
              <span>Labor <span className="font-medium text-foreground">{formatCurrency(totalLaborCost, settings.currency)}</span></span>
              <span className="text-border">·</span>
              <span>Other <span className="font-medium text-foreground">{formatCurrency(totalOtherCost, settings.currency)}</span></span>
            </div>
          </div>

          {/* Right: save as template + buttons */}
          <div className="flex items-center gap-4 shrink-0">
            <label className="hidden lg:flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={saveAsTemplate}
                onCheckedChange={(v) => setSaveAsTemplate(!!v)}
                id="save-as-template"
              />
              <span className="text-xs text-muted-foreground">Save as template</span>
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate('/products')}>Cancel</Button>
              <Button type="button" size="sm" onClick={handleSubmit(onSubmit, onError)}>{isEditMode ? 'Update Product' : 'Create Product'}</Button>
            </div>
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

      {/* Market Analysis Popup — shows live (unsaved) form state */}
      <Dialog open={isMarketAnalysisOpen} onOpenChange={setIsMarketAnalysisOpen}>
        <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b flex-none">
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Competitor Analysis — {watchedName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto">
            {liveProduct && (
              <MarketAnalysisPanel
                product={liveProduct}
                currency={settings?.currency || 'USD'}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
