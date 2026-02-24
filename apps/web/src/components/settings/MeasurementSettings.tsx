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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Save, Plus, X, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';

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
      <div className="p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h2 className="text-base font-semibold mb-0.5">Measurement Units</h2>
            <p className="text-sm text-muted-foreground">
              Configure the units of measurement for your materials and products.
            </p>
          </div>

          {/* Compact system toggle */}
          <FormField
            control={form.control}
            name="unit_system"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">System of Measurement</FormLabel>
                <FormControl>
                  <div className="flex rounded-md border overflow-hidden w-fit">
                    {(['metric', 'imperial'] as const).map((system) => (
                      <button
                        key={system}
                        type="button"
                        onClick={() => handleUnitSystemChange(system)}
                        className={cn(
                          'px-3 py-1 text-xs font-medium transition-colors capitalize',
                          field.value === system
                            ? 'bg-foreground text-background'
                            : 'bg-background text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {system === 'metric' ? 'Metric' : 'Imperial'}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid md:grid-cols-2 gap-5">
            {/* Active Units */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold">Active Units</h4>
                <span className="text-xs text-muted-foreground">tap to toggle</span>
              </div>
              <div className="space-y-2">
                {Object.entries(getAvailableUnits()).map(([category, units]) => (
                  <div key={category} className="rounded-md border p-2.5 bg-muted/20">
                    <h5 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                      {category}
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {units.map((unit) => {
                        const isSelected = selectedUnits.includes(unit);
                        return (
                          <div
                            key={unit}
                            onClick={() => toggleUnit(unit)}
                            className={cn(
                              'cursor-pointer select-none inline-flex items-center justify-center rounded text-xs font-medium transition-colors border h-6 px-2',
                              isSelected
                                ? 'bg-foreground text-background border-foreground'
                                : 'bg-background text-muted-foreground hover:bg-muted border-input'
                            )}
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
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold">Custom Units</h4>
                <span className="text-xs text-muted-foreground">Add specialized units</span>
              </div>
              <div className="bg-muted/30 p-3 rounded-md border space-y-3">
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
                    className="bg-background h-7 text-xs"
                  />
                  <Button
                    type="button"
                    onClick={addCustomUnit}
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="min-h-[80px]">
                  {getCustomUnits().length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {getCustomUnits().map((unit) => (
                        <div
                          key={unit}
                          className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-background border rounded-full text-xs"
                        >
                          <span>{unit}</span>
                          <button
                            type="button"
                            onClick={() => removeCustomUnit(unit)}
                            className="h-4 w-4 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs opacity-50 pt-4">
                      <p>No custom units added</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t p-3 flex justify-end bg-background">
          <Button type="submit" variant="secondary" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
