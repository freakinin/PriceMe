import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { Save, Plus, X, DollarSign, Ruler, Settings2, ShoppingBag, Truck, Edit2, Trash2, Info, Star, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { usePlatformFees, type PlatformFeeProfile } from '@/hooks/usePlatformFees';
import { useShippingMethods, type ShippingMethod } from '@/hooks/useShippingMethods';
import type { PlatformFeeProfileInput, ShippingMethodInput } from '@priceme/shared';

const settingsSchema = z.object({
  currency: z.string().length(3),
  tax_percentage: z.number().min(0).max(100),
  revenue_goal: z.number().min(0).optional().or(z.null()),
  labor_hourly_cost: z.number().min(0).optional().or(z.null()),
  unit_system: z.enum(['imperial', 'metric']),
  units: z.array(z.string()).min(1),
  seller_country: z.string().length(2),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const SELLER_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IL', name: 'Israel' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
];

const emptyPlatformProfile: PlatformFeeProfileInput = {
  name: '',
  is_default: false,
  listing_fee_usd: 0,
  transaction_fee_pct: 0,
  payment_processing_pct: 0,
  payment_processing_flat: 0,
  offsite_ads_enabled: false,
  offsite_ads_pct: 0,
  currency_conversion_pct: 0,
  vat_on_fees_pct: 0,
  fees_apply_to_shipping: true,
};

const emptyShippingMethod: ShippingMethodInput = {
  name: '',
  cost: 0,
  is_free_shipping: false,
  is_default: false,
};

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
];

// Curated units list
const METRIC_UNITS = {
  Volume: ['ml', 'L'],
  Weight: ['g', 'kg'],
  Length: ['mm', 'cm', 'm'],
  Area: ['m²'],
  Count: ['pcs'],
};

const IMPERIAL_UNITS = {
  Volume: ['fl oz', 'pt', 'qt', 'gal'],
  Weight: ['oz', 'lb'],
  Length: ['in', 'ft', 'yd'],
  Area: ['ft²'],
  Count: ['pcs'],
};

// Default selected units
const DEFAULT_METRIC_UNITS = ['ml', 'g', 'kg', 'pcs', 'm', 'cm', 'in'];
const DEFAULT_IMPERIAL_UNITS = ['fl oz', 'oz', 'lb', 'pcs', 'in', 'ft', 'yd'];

export default function Settings() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customUnit, setCustomUnit] = useState('');
  const { toast } = useToast();
  const { settings, loading: settingsLoading, error: settingsError, updateSettings } = useSettings();

  // Platform fee profiles state
  const { profiles, loading: profilesLoading, createProfile, updateProfile, deleteProfile, getEtsyDefaults, isCreating: isCreatingProfile, isUpdating: isUpdatingProfile } = usePlatformFees();
  const [editingProfile, setEditingProfile] = useState<number | 'new' | null>(null);
  const [profileForm, setProfileForm] = useState<PlatformFeeProfileInput>(emptyPlatformProfile);
  const [profileSaving, setProfileSaving] = useState(false);

  // Shipping methods state
  const { methods, loading: methodsLoading, createMethod, updateMethod, deleteMethod } = useShippingMethods();
  const [editingMethod, setEditingMethod] = useState<number | 'new' | null>(null);
  const [methodForm, setMethodForm] = useState<ShippingMethodInput>(emptyShippingMethod);
  const [methodSaving, setMethodSaving] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      currency: 'USD',
      tax_percentage: 0,
      revenue_goal: null,
      labor_hourly_cost: null,
      unit_system: 'metric',
      units: DEFAULT_METRIC_UNITS,
      seller_country: 'US',
    },
  });

  const unitSystem = form.watch('unit_system') || 'metric';
  const selectedUnits = form.watch('units') || [];

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      const units = settings.units && Array.isArray(settings.units) && settings.units.length > 0
        ? settings.units
        : (settings.unit_system === 'imperial' ? DEFAULT_IMPERIAL_UNITS : DEFAULT_METRIC_UNITS);

      const unitSystem = settings.unit_system === 'imperial' || settings.unit_system === 'metric'
        ? settings.unit_system
        : 'metric';

      form.reset({
        currency: settings.currency || 'USD',
        tax_percentage: settings.tax_percentage || 0,
        revenue_goal: settings.revenue_goal !== undefined ? settings.revenue_goal : null,
        labor_hourly_cost: settings.labor_hourly_cost !== undefined ? settings.labor_hourly_cost : null,
        unit_system: unitSystem,
        units: Array.isArray(units) ? units : DEFAULT_METRIC_UNITS,
        seller_country: settings.seller_country || 'US',
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      setSaving(true);
      setError(null);

      await updateSettings({
        currency: data.currency,
        tax_percentage: data.tax_percentage,
        unit_system: data.unit_system,
        units: data.units,
        revenue_goal: data.revenue_goal,
        labor_hourly_cost: data.labor_hourly_cost,
        seller_country: data.seller_country,
      });

      toast({
        variant: 'success',
        title: 'Settings saved',
        description: 'Your settings have been saved successfully.',
      });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error saving settings:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (err as any).response?.data?.message || 'Failed to save settings';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validationErrors = (err as any).response?.data?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorDetails = validationErrors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        setError(`${errorMessage}: ${errorDetails}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleUnit = (unit: string) => {
    const currentUnits = form.getValues('units') || [];
    if (currentUnits.includes(unit)) {
      form.setValue('units', currentUnits.filter(u => u !== unit));
    } else {
      form.setValue('units', [...currentUnits, unit]);
    }
  };

  const addCustomUnit = () => {
    if (!customUnit.trim()) return;
    const trimmed = customUnit.trim();
    const currentUnits = form.getValues('units') || [];
    if (!currentUnits.includes(trimmed)) {
      form.setValue('units', [...currentUnits, trimmed]);
      setCustomUnit('');
    }
  };

  const removeCustomUnit = (unit: string) => {
    const currentUnits = form.getValues('units') || [];
    form.setValue('units', currentUnits.filter(u => u !== unit));
  };

  const handleUnitSystemChange = (system: 'imperial' | 'metric') => {
    form.setValue('unit_system', system);
    // Reset to default units for the selected system
    const defaultUnits = system === 'imperial' ? DEFAULT_IMPERIAL_UNITS : DEFAULT_METRIC_UNITS;
    form.setValue('units', defaultUnits);
  };

  const getAvailableUnits = () => {
    const system = unitSystem || 'metric';
    return system === 'imperial' ? IMPERIAL_UNITS : METRIC_UNITS;
  };

  const getCuratedUnits = () => {
    const available = getAvailableUnits();
    return Object.values(available).flat();
  };

  const getCustomUnits = () => {
    if (!selectedUnits || !Array.isArray(selectedUnits)) return [];
    const curated = getCuratedUnits();
    return selectedUnits.filter(u => u && !curated.includes(u));
  };

  // Platform fee profile helpers
  const startEditProfile = (profile: PlatformFeeProfile) => {
    setProfileForm({
      name: profile.name,
      is_default: profile.is_default,
      listing_fee_usd: profile.listing_fee_usd,
      transaction_fee_pct: profile.transaction_fee_pct,
      payment_processing_pct: profile.payment_processing_pct,
      payment_processing_flat: profile.payment_processing_flat,
      offsite_ads_enabled: profile.offsite_ads_enabled,
      offsite_ads_pct: profile.offsite_ads_pct,
      currency_conversion_pct: profile.currency_conversion_pct,
      vat_on_fees_pct: profile.vat_on_fees_pct,
      fees_apply_to_shipping: profile.fees_apply_to_shipping,
    });
    setEditingProfile(profile.id);
  };

  const handleLoadEtsyDefaults = async () => {
    const country = form.getValues('seller_country') || 'US';
    try {
      const defaults = await getEtsyDefaults(country);
      setProfileForm(prev => ({ ...prev, ...defaults, name: prev.name || 'Etsy' }));
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load Etsy defaults' });
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast({ variant: 'destructive', title: 'Profile name is required' });
      return;
    }
    try {
      setProfileSaving(true);
      if (editingProfile === 'new') {
        await createProfile(profileForm);
        toast({ variant: 'success', title: 'Platform profile created' });
      } else if (typeof editingProfile === 'number') {
        await updateProfile({ id: editingProfile, data: profileForm });
        toast({ variant: 'success', title: 'Platform profile updated' });
      }
      setEditingProfile(null);
      setProfileForm(emptyPlatformProfile);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to save profile' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteProfile = async (id: number) => {
    try {
      await deleteProfile(id);
      toast({ variant: 'success', title: 'Profile deleted' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to delete profile' });
    }
  };

  const handleSetDefaultProfile = async (profile: PlatformFeeProfile) => {
    try {
      await updateProfile({ id: profile.id, data: { ...profile, is_default: true } });
      toast({ variant: 'success', title: `${profile.name} set as default` });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update default' });
    }
  };

  // Shipping method helpers
  const startEditMethod = (method: ShippingMethod) => {
    setMethodForm({ name: method.name, cost: method.cost, is_free_shipping: method.is_free_shipping, is_default: method.is_default });
    setEditingMethod(method.id);
  };

  const handleSaveMethod = async () => {
    if (!methodForm.name.trim()) {
      toast({ variant: 'destructive', title: 'Shipping method name is required' });
      return;
    }
    try {
      setMethodSaving(true);
      if (editingMethod === 'new') {
        await createMethod(methodForm);
        toast({ variant: 'success', title: 'Shipping method created' });
      } else if (typeof editingMethod === 'number') {
        await updateMethod({ id: editingMethod, data: methodForm });
        toast({ variant: 'success', title: 'Shipping method updated' });
      }
      setEditingMethod(null);
      setMethodForm(emptyShippingMethod);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to save shipping method' });
    } finally {
      setMethodSaving(false);
    }
  };

  const handleDeleteMethod = async (id: number) => {
    try {
      await deleteMethod(id);
      toast({ variant: 'success', title: 'Shipping method deleted' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to delete shipping method' });
    }
  };

  const handleSetDefaultMethod = async (method: ShippingMethod) => {
    try {
      await updateMethod({ id: method.id, data: { ...method, is_default: true } });
      toast({ variant: 'success', title: `${method.name} set as default` });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update default' });
    }
  };

  const feeFieldProps = (
    label: string,
    key: keyof PlatformFeeProfileInput,
    tooltip?: string,
    suffix?: string,
  ) => ({ label, key, tooltip, suffix });

  if (settingsLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="p-6 max-w-5xl mx-auto pb-20 w-full flex-1">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        {settingsError && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <p>Failed to load settings: {settingsError}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Financial Settings Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <div>
                    <CardTitle className="text-base">Financial Settings</CardTitle>
                    <CardDescription className="text-xs">Configure currency, tax rates, and financial goals.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          key={field.value}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                <span className="font-medium mr-2">{currency.symbol}</span>
                                {currency.name} ({currency.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Used for all price calculations and displays.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tax_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Applied to applicable transactions automatically.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="revenue_goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Revenue Goal</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">
                              {CURRENCIES.find(c => c.code === form.watch('currency'))?.symbol || '$'}
                            </span>
                            <Input
                              className="pl-8"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                              value={field.value === null || field.value === undefined ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Your target revenue for performance tracking.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="labor_hourly_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Hourly Labor Cost</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">
                              {CURRENCIES.find(c => c.code === form.watch('currency'))?.symbol || '$'}
                            </span>
                            <Input
                              className="pl-8"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                              value={field.value === null || field.value === undefined ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Default cost per hour for labor calculations.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seller_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Country</FormLabel>
                        <Select
                          key={field.value}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SELLER_COUNTRIES.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.name} ({c.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Used to determine platform fee rates (e.g. Etsy payment processing varies by country).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Unit Management Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-primary" />
                  <div>
                    <CardTitle className="text-base">Measurement Units</CardTitle>
                    <CardDescription className="text-xs">Configure the units of measurement for your materials and products.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-6">
                <FormField
                  control={form.control}
                  name="unit_system"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System of Measurement</FormLabel>
                      <FormControl>
                        <Tabs
                          value={field.value || 'metric'}
                          onValueChange={(value) => handleUnitSystemChange(value as 'imperial' | 'metric')}
                          className="w-full max-w-md"
                        >
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="metric">Metric System</TabsTrigger>
                            <TabsTrigger value="imperial">Imperial System</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Available Units */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Active Units</h4>
                      <span className="text-xs text-muted-foreground">Select units to use in the app</span>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(getAvailableUnits()).map(([category, units]) => (
                        <div key={category} className="rounded-lg border p-3 bg-muted/20">
                          <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">{category}</h5>
                          <div className="flex flex-wrap gap-2">
                            {units.map((unit) => {
                              const isSelected = selectedUnits.includes(unit);
                              return (
                                <div
                                  key={unit}
                                  onClick={() => toggleUnit(unit)}
                                  className={`
                                    cursor-pointer select-none inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50
                                    border h-8 px-3 shadow-sm
                                    ${isSelected
                                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary'
                                      : 'bg-background text-secondary-foreground hover:bg-accent/50 border-input'}
                                  `}
                                >
                                  {unit}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Units */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Custom Units</h4>
                      <span className="text-xs text-muted-foreground">Add specialized units</span>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. carton, bundle"
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomUnit();
                            }
                          }}
                          className="bg-background"
                        />
                        <Button type="button" onClick={addCustomUnit} size="icon" variant="secondary">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="min-h-[100px]">
                        {getCustomUnits().length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {getCustomUnits().map((unit) => (
                              <div
                                key={unit}
                                className="group flex items-center gap-1.5 pl-3 pr-2 py-1 bg-background border rounded-full text-sm shadow-sm"
                              >
                                <span>{unit}</span>
                                <button
                                  type="button"
                                  onClick={() => removeCustomUnit(unit)}
                                  className="h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm opacity-60">
                            <p>No custom units added</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end sticky bottom-0 p-4 bg-background border-t z-50 mt-auto">
              <div className="max-w-5xl w-full mx-auto flex justify-end">
                <Button type="submit" size="lg" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save All Changes'}
                </Button>
              </div>
            </div>
          </form>
        </Form>

        {/* ── Platform Fee Profiles ─────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <div>
                  <CardTitle className="text-base">Platform Fee Profiles</CardTitle>
                  <CardDescription className="text-xs">
                    Configure marketplace fees (Etsy, etc.) to calculate your true net profit.
                  </CardDescription>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditingProfile('new'); setProfileForm(emptyPlatformProfile); }}
                disabled={editingProfile !== null}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Platform
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-3">
            {profilesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <>
                {profiles.map((profile) => (
                  <div key={profile.id}>
                    {editingProfile === profile.id ? (
                      <PlatformFeeForm
                        form={profileForm}
                        onChange={setProfileForm}
                        onSave={handleSaveProfile}
                        onCancel={() => { setEditingProfile(null); setProfileForm(emptyPlatformProfile); }}
                        onLoadEtsy={handleLoadEtsyDefaults}
                        saving={profileSaving || isUpdatingProfile}
                      />
                    ) : (
                      <div className="rounded-lg border p-3 flex items-start justify-between gap-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{profile.name}</span>
                            {profile.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Listing: ${profile.listing_fee_usd.toFixed(2)} · Transaction: {profile.transaction_fee_pct}% · Payment: {profile.payment_processing_pct}% + {profile.payment_processing_flat.toFixed(2)}
                            {profile.offsite_ads_enabled && ` · Offsite Ads: ${profile.offsite_ads_pct}%`}
                            {profile.vat_on_fees_pct > 0 && ` · VAT on fees: ${profile.vat_on_fees_pct}%`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!profile.is_default && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleSetDefaultProfile(profile)}>
                              <Star className="h-3 w-3 mr-1" /> Set Default
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditProfile(profile)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteProfile(profile.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {editingProfile === 'new' && (
                  <PlatformFeeForm
                    form={profileForm}
                    onChange={setProfileForm}
                    onSave={handleSaveProfile}
                    onCancel={() => { setEditingProfile(null); setProfileForm(emptyPlatformProfile); }}
                    onLoadEtsy={handleLoadEtsyDefaults}
                    saving={profileSaving || isCreatingProfile}
                  />
                )}

                {profiles.length === 0 && editingProfile !== 'new' && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No platform profiles yet. An Etsy profile will be auto-created on first use.</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => { setEditingProfile('new'); setProfileForm(emptyPlatformProfile); }}>
                      <Plus className="h-4 w-4 mr-1" /> Add Platform
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Shipping Methods ──────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <div>
                  <CardTitle className="text-base">Shipping Methods</CardTitle>
                  <CardDescription className="text-xs">
                    Define shipping options to factor shipping costs into your profit calculations.
                  </CardDescription>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditingMethod('new'); setMethodForm(emptyShippingMethod); }}
                disabled={editingMethod !== null}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Method
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-3">
            {methodsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                {methods.map((method) => (
                  <div key={method.id}>
                    {editingMethod === method.id ? (
                      <ShippingMethodForm
                        form={methodForm}
                        onChange={setMethodForm}
                        onSave={handleSaveMethod}
                        onCancel={() => { setEditingMethod(null); setMethodForm(emptyShippingMethod); }}
                        saving={methodSaving}
                      />
                    ) : (
                      <div className="rounded-lg border p-3 flex items-start justify-between gap-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{method.name}</span>
                            {method.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                            {method.is_free_shipping && <Badge variant="outline" className="text-xs">Free Shipping</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Cost: {method.is_free_shipping ? 'Free' : `$${method.cost.toFixed(2)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!method.is_default && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleSetDefaultMethod(method)}>
                              <Star className="h-3 w-3 mr-1" /> Set Default
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditMethod(method)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteMethod(method.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {editingMethod === 'new' && (
                  <ShippingMethodForm
                    form={methodForm}
                    onChange={setMethodForm}
                    onSave={handleSaveMethod}
                    onCancel={() => { setEditingMethod(null); setMethodForm(emptyShippingMethod); }}
                    saving={methodSaving}
                  />
                )}

                {methods.length === 0 && editingMethod !== 'new' && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No shipping methods defined. Add one to include shipping in profit calculations.</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => { setEditingMethod('new'); setMethodForm(emptyShippingMethod); }}>
                      <Plus className="h-4 w-4 mr-1" /> Add Method
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

interface PlatformFeeFormProps {
  form: PlatformFeeProfileInput;
  onChange: (v: PlatformFeeProfileInput) => void;
  onSave: () => void;
  onCancel: () => void;
  onLoadEtsy: () => void;
  saving: boolean;
}

function PlatformFeeForm({ form, onChange, onSave, onCancel, onLoadEtsy, saving }: PlatformFeeFormProps) {
  const set = (key: keyof PlatformFeeProfileInput, value: unknown) =>
    onChange({ ...form, [key]: value });

  const numInput = (key: keyof PlatformFeeProfileInput, label: string, tooltip?: string, suffix?: string) => (
    <div className="space-y-1">
      <Label className="text-xs flex items-center gap-1">
        {label}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {suffix && <span className="text-muted-foreground ml-1">{suffix}</span>}
      </Label>
      <Input
        type="number"
        step="0.001"
        min="0"
        className="h-8 text-sm"
        value={form[key] as number ?? ''}
        onChange={(e) => set(key, e.target.value ? parseFloat(e.target.value) : 0)}
      />
    </div>
  );

  return (
    <div className="rounded-lg border p-4 space-y-4 bg-muted/5">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">
          {form.name ? `Edit: ${form.name}` : 'New Platform Profile'}
        </h4>
        <Button size="sm" variant="outline" onClick={onLoadEtsy} className="h-7 text-xs">
          Load Etsy Defaults
        </Button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Platform Name</Label>
        <Input
          placeholder="e.g. Etsy, Shopify, Direct"
          className="h-8 text-sm"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {numInput('listing_fee_usd', 'Listing Fee', 'Flat fee per listing (e.g. Etsy: $0.20)', '$')}
        {numInput('transaction_fee_pct', 'Transaction Fee', 'Applied to sale price + shipping (e.g. Etsy: 6.5%)', '%')}
        {numInput('payment_processing_pct', 'Payment Processing', 'Percentage of total order (varies by country)', '%')}
        {numInput('payment_processing_flat', 'Payment Flat Fee', 'Per-transaction flat fee (e.g. $0.25)', '$')}
        {numInput('currency_conversion_pct', 'Currency Conversion', 'Fee if listing currency ≠ payment account currency (e.g. 2.5%)', '%')}
        {numInput('vat_on_fees_pct', 'VAT on Platform Fees', 'VAT applied to Etsy\'s fees (UK=20%, AU=10%, others=0)', '%')}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch
            id="offsite-ads"
            checked={form.offsite_ads_enabled}
            onCheckedChange={(v) => set('offsite_ads_enabled', v)}
          />
          <Label htmlFor="offsite-ads" className="text-sm cursor-pointer">Offsite Ads enabled</Label>
        </div>
        {form.offsite_ads_enabled && (
          <div className="ml-8 max-w-[140px]">
            {numInput('offsite_ads_pct', 'Offsite Ads Fee', 'Fee when a sale is attributed to an offsite ad (12% or 15%)', '%')}
          </div>
        )}
        <div className="flex items-center gap-3">
          <Switch
            id="fees-shipping"
            checked={form.fees_apply_to_shipping}
            onCheckedChange={(v) => set('fees_apply_to_shipping', v)}
          />
          <Label htmlFor="fees-shipping" className="text-sm cursor-pointer flex items-center gap-1">
            Transaction fees apply to shipping cost
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  On Etsy, the 6.5% transaction fee is charged on the shipping price charged to the buyer too. Enable this to include shipping in the fee base.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="is-default"
            checked={!!form.is_default}
            onCheckedChange={(v) => set('is_default', v)}
          />
          <Label htmlFor="is-default" className="text-sm cursor-pointer">Set as default platform</Label>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save Profile
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}

interface ShippingMethodFormProps {
  form: ShippingMethodInput;
  onChange: (v: ShippingMethodInput) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function ShippingMethodForm({ form, onChange, onSave, onCancel, saving }: ShippingMethodFormProps) {
  const set = (key: keyof ShippingMethodInput, value: unknown) =>
    onChange({ ...form, [key]: value });

  return (
    <div className="rounded-lg border p-4 space-y-4 bg-muted/5">
      <h4 className="font-medium text-sm">{form.name ? `Edit: ${form.name}` : 'New Shipping Method'}</h4>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2 md:col-span-1">
          <Label className="text-xs">Method Name</Label>
          <Input
            placeholder="e.g. USPS First Class"
            className="h-8 text-sm"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cost ($)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            className="h-8 text-sm"
            value={form.is_free_shipping ? '0' : (form.cost ?? '')}
            disabled={form.is_free_shipping}
            onChange={(e) => set('cost', e.target.value ? parseFloat(e.target.value) : 0)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch
            id="free-shipping"
            checked={form.is_free_shipping}
            onCheckedChange={(v) => onChange({ ...form, is_free_shipping: v, cost: v ? 0 : form.cost })}
          />
          <Label htmlFor="free-shipping" className="text-sm cursor-pointer">Free shipping (you absorb the cost)</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="method-default"
            checked={!!form.is_default}
            onCheckedChange={(v) => set('is_default', v)}
          />
          <Label htmlFor="method-default" className="text-sm cursor-pointer">Set as default shipping method</Label>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}
