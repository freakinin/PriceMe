import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Save, Plus, X, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const measurementSchema = z.object({
  unit_system: z.enum(['imperial', 'metric']),
  units: z.array(z.string()).min(1),
});

type MeasurementFormValues = z.infer<typeof measurementSchema>;

const METRIC_UNITS: Record<string, string[]> = {
  Volume: ['ml', 'L'],
  Weight: ['g', 'kg'],
  Length: ['mm', 'cm', 'm'],
  Area: ['m²'],
  Count: ['pcs'],
};

const IMPERIAL_UNITS: Record<string, string[]> = {
  Volume: ['fl oz', 'pt', 'qt', 'gal'],
  Weight: ['oz', 'lb'],
  Length: ['in', 'ft', 'yd'],
  Area: ['ft²'],
  Count: ['pcs'],
};

const DEFAULT_METRIC_UNITS = ['ml', 'g', 'kg', 'pcs', 'm', 'cm', 'in'];
const DEFAULT_IMPERIAL_UNITS = ['fl oz', 'oz', 'lb', 'pcs', 'in', 'ft', 'yd'];

export function MeasurementSettings() {
  const [saving, setSaving] = useState(false);
  const [customUnit, setCustomUnit] = useState('');
  const { toast } = useToast();
  const { settings, loading, updateSettings } = useSettings();

  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      unit_system: 'metric',
      units: DEFAULT_METRIC_UNITS,
    },
  });

  const unitSystem = form.watch('unit_system') || 'metric';
  const selectedUnits = form.watch('units') || [];

  useEffect(() => {
    if (settings) {
      const units =
        settings.units && Array.isArray(settings.units) && settings.units.length > 0
          ? settings.units
          : settings.unit_system === 'imperial'
          ? DEFAULT_IMPERIAL_UNITS
          : DEFAULT_METRIC_UNITS;

      const resolvedSystem =
        settings.unit_system === 'imperial' || settings.unit_system === 'metric'
          ? settings.unit_system
          : 'metric';

      form.reset({
        unit_system: resolvedSystem,
        units: Array.isArray(units) ? units : DEFAULT_METRIC_UNITS,
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: MeasurementFormValues) => {
    try {
      setSaving(true);
      await updateSettings(data);
      toast({ variant: 'success', title: 'Measurement settings saved' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const getAvailableUnits = () => (unitSystem === 'imperial' ? IMPERIAL_UNITS : METRIC_UNITS);

  const getCuratedUnits = () => Object.values(getAvailableUnits()).flat();

  const getCustomUnits = () => {
    if (!selectedUnits || !Array.isArray(selectedUnits)) return [];
    const curated = getCuratedUnits();
    return selectedUnits.filter((u) => u && !curated.includes(u));
  };

  const toggleUnit = (unit: string) => {
    const current = form.getValues('units') || [];
    form.setValue(
      'units',
      current.includes(unit) ? current.filter((u) => u !== unit) : [...current, unit]
    );
  };

  const addCustomUnit = () => {
    if (!customUnit.trim()) return;
    const trimmed = customUnit.trim();
    const current = form.getValues('units') || [];
    if (!current.includes(trimmed)) {
      form.setValue('units', [...current, trimmed]);
      setCustomUnit('');
    }
  };

  const removeCustomUnit = (unit: string) => {
    form.setValue('units', (form.getValues('units') || []).filter((u) => u !== unit));
  };

  const handleUnitSystemChange = (system: 'imperial' | 'metric') => {
    form.setValue('unit_system', system);
    form.setValue('units', system === 'imperial' ? DEFAULT_IMPERIAL_UNITS : DEFAULT_METRIC_UNITS);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold mb-0.5">Measurement Units</h2>
            <p className="text-sm text-muted-foreground">
              Configure the units of measurement for your materials and products.
            </p>
          </div>

          <FormField
            control={form.control}
            name="unit_system"
            render={({ field }) => (
              <FormItem>
                <FormLabel>System of Measurement</FormLabel>
                <FormControl>
                  <Tabs
                    value={field.value || 'metric'}
                    onValueChange={(v) => handleUnitSystemChange(v as 'imperial' | 'metric')}
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
            {/* Active Units */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Active Units</h4>
                <span className="text-xs text-muted-foreground">Select units to use in the app</span>
              </div>
              <div className="space-y-4">
                {Object.entries(getAvailableUnits()).map(([category, units]) => (
                  <div key={category} className="rounded-lg border p-3 bg-muted/20">
                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">
                      {category}
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {units.map((unit) => {
                        const isSelected = selectedUnits.includes(unit);
                        return (
                          <div
                            key={unit}
                            onClick={() => toggleUnit(unit)}
                            className={`
                              cursor-pointer select-none inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors
                              border h-8 px-3 shadow-sm
                              ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary'
                                  : 'bg-background text-secondary-foreground hover:bg-accent/50 border-input'
                              }
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
        </div>

        <div className="flex-shrink-0 border-t p-4 flex justify-end bg-background">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
