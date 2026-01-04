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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Save } from 'lucide-react';

const settingsSchema = z.object({
  currency: z.string().length(3),
  tax_percentage: z.number().min(0).max(100),
  revenue_goal: z.number().min(0).optional().or(z.null()),
  labor_hourly_cost: z.number().min(0).optional().or(z.null()),
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

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      currency: 'USD',
      tax_percentage: 0,
      revenue_goal: null,
      labor_hourly_cost: null,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/settings');
      
      console.log('Settings API response:', response.data);
      
      if (response.data && response.data.status === 'success') {
        const settings = response.data.data;
        form.reset({
          currency: settings.currency || 'USD',
          tax_percentage: settings.tax_percentage || 0,
          revenue_goal: settings.revenue_goal || null,
          labor_hourly_cost: settings.labor_hourly_cost || null,
        });
        // Clear any previous errors on success
        setError(null);
      } else if (response.data && response.data.status === 'error') {
        // Only set error if status is explicitly 'error'
        setError(response.data.message || 'Failed to load settings');
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      console.error('Error response:', err.response);
      // Only show error if there's an actual error response (4xx or 5xx)
      if (err.response && err.response.status >= 400) {
        setError(err.response?.data?.message || 'Failed to load settings');
      } else if (!err.response) {
        // Network error - show error
        setError('Network error. Please check your connection.');
      }
      // If it's a 200 response with error status, we'll handle it above
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      setSaving(true);
      setError(null);
      
      const payload: any = {
        currency: data.currency,
        tax_percentage: data.tax_percentage,
      };

      // Only include optional fields if they have values
      if (data.revenue_goal !== null && data.revenue_goal !== undefined) {
        payload.revenue_goal = data.revenue_goal;
      }
      if (data.labor_hourly_cost !== null && data.labor_hourly_cost !== undefined) {
        payload.labor_hourly_cost = data.labor_hourly_cost;
      }

      console.log('Sending settings payload:', payload);
      
      const response = await api.put('/settings', payload);

      if (response.data.status === 'success') {
        // Show success toast
        toast({
          variant: 'success',
          title: 'Settings saved',
          description: 'Your settings have been saved successfully.',
        });
        // Refresh settings to get updated values
        fetchSettings();
      }
    } catch (err: any) {
      console.error('Error saving settings:', err);
      console.error('Error response:', err.response?.data);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings</p>
        </div>
        <div className="space-y-6 max-w-2xl">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings and defaults</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">{error}</p>
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

