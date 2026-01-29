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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

import { Save, Plus, X } from 'lucide-react';
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
    } catch (err: any) {
      console.error('Error saving settings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save settings';
      const validationErrors = err.response?.data?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
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
      <div className="p-6">
        <Skeleton className="h-5 w-64 mb-6" />
        <div className="space-y-6 max-w-4xl">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <p className="text-sm text-muted-foreground mb-6">Manage your application settings and defaults</p>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}
      {settingsError && (
        <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">Failed to load settings: {settingsError}</p>
        </div>
      )}

      <div className="max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Currency */}
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
                            {currency.symbol} {currency.name} ({currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Default currency for displaying prices throughout the application
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tax Percentage */}
              <FormField
                control={form.control}
                name="tax_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Percentage (%)</FormLabel>
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
                      Default tax percentage to apply to calculations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Revenue Goal */}
              <FormField
                control={form.control}
                name="revenue_goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revenue Goal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        value={field.value === null || field.value === undefined ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormDescription>
                      Your target revenue goal (before taxes). This will be used for tracking and reporting.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Labor Hourly Cost */}
              <FormField
                control={form.control}
                name="labor_hourly_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Labor Hourly Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        value={field.value === null || field.value === undefined ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormDescription>
                      Default hourly rate for labor costs. This will be pre-filled when creating new products.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Unit Management Section */}
            <div className="space-y-4 border rounded-lg p-6">
              <FormField
                control={form.control}
                name="unit_system"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Units</FormLabel>
                    <FormControl>
                      <Tabs value={field.value || 'metric'} onValueChange={(value) => handleUnitSystemChange(value as 'imperial' | 'metric')}>
                        <TabsList>
                          <TabsTrigger value="metric">Metric</TabsTrigger>
                          <TabsTrigger value="imperial">Imperial</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormControl>
                    <FormDescription>
                      Select which units are available when adding materials. Choose between Imperial and Metric systems.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Available Units */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Available Units</label>
                  <div className="space-y-3">
                    {Object.entries(getAvailableUnits()).map(([category, units]) => (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                        <div className="flex flex-wrap gap-3">
                          {units.map((unit) => (
                            <div key={unit} className="flex items-center space-x-2">
                              <Checkbox
                                id={`unit-${unit}`}
                                checked={selectedUnits.includes(unit)}
                                onCheckedChange={() => toggleUnit(unit)}
                              />
                              <label
                                htmlFor={`unit-${unit}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {unit}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Units */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Custom Units</label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Add custom unit"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomUnit();
                        }
                      }}
                    />
                    <Button type="button" onClick={addCustomUnit} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {getCustomUnits().length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getCustomUnits().map((unit) => (
                        <div
                          key={unit}
                          className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md"
                        >
                          <span className="text-sm">{unit}</span>
                          <button
                            type="button"
                            onClick={() => removeCustomUnit(unit)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
