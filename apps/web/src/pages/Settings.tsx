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

import { Save, Plus, X, DollarSign, Ruler, Settings2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const settingsSchema = z.object({
  currency: z.string().length(3),
  tax_percentage: z.number().min(0).max(100),
  revenue_goal: z.number().min(0).optional().or(z.null()),
  labor_hourly_cost: z.number().min(0).optional().or(z.null()),
  unit_system: z.enum(['imperial', 'metric']),
  units: z.array(z.string()).min(1),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

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

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      currency: 'USD',
      tax_percentage: 0,
      revenue_goal: null,
      labor_hourly_cost: null,
      unit_system: 'metric',
      units: DEFAULT_METRIC_UNITS,
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
    <div className="p-6 max-w-5xl mx-auto pb-20">


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
                      <Select onValueChange={field.onChange} value={field.value}>
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

          <div className="flex items-center justify-end fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50">
            <div className="max-w-5xl w-full mx-auto flex justify-end">
              <Button type="submit" size="lg" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
