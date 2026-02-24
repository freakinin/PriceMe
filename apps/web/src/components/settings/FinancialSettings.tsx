import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Save, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { usePlatformFees } from '@/hooks/usePlatformFees';

const financialSchema = z.object({
  currency: z.string().length(3),
  tax_percentage: z.number().min(0).max(100),
  revenue_goal: z.number().min(0).optional().or(z.null()),
  labor_hourly_cost: z.number().min(0).optional().or(z.null()),
  seller_country: z.string().length(2),
});

type FinancialFormValues = z.infer<typeof financialSchema>;

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

// Countries with known Etsy-specific fee rates
const SUPPORTED_ETSY_COUNTRIES = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL'];

export function FinancialSettings() {
  const [saving, setSaving] = useState(false);
  const [pendingCountry, setPendingCountry] = useState<string | null>(null);
  const [updatingEtsy, setUpdatingEtsy] = useState(false);
  const { toast } = useToast();
  const { settings, loading, updateSettings } = useSettings();
  const { profiles, updateProfile, getEtsyDefaults } = usePlatformFees();

  const form = useForm<FinancialFormValues>({
    resolver: zodResolver(financialSchema),
    defaultValues: {
      currency: 'USD',
      tax_percentage: 0,
      revenue_goal: null,
      labor_hourly_cost: null,
      seller_country: 'US',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        currency: settings.currency || 'USD',
        tax_percentage: settings.tax_percentage || 0,
        revenue_goal: settings.revenue_goal !== undefined ? settings.revenue_goal : null,
        labor_hourly_cost: settings.labor_hourly_cost !== undefined ? settings.labor_hourly_cost : null,
        seller_country: settings.seller_country || 'US',
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: FinancialFormValues) => {
    // Capture previous country before saving
    const prevCountry = settings?.seller_country || 'US';
    try {
      setSaving(true);
      await updateSettings(data);
      toast({ variant: 'success', title: 'Financial settings saved' });

      // If country changed and user has Etsy profiles, offer to update them
      if (data.seller_country !== prevCountry) {
        const etsyProfiles = profiles.filter((p) =>
          p.name.toLowerCase().includes('etsy')
        );
        if (etsyProfiles.length > 0) {
          setPendingCountry(data.seller_country);
        }
      }
    } catch {
      toast({ variant: 'destructive', title: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEtsyDefaults = async () => {
    if (!pendingCountry) return;
    try {
      setUpdatingEtsy(true);
      const defaults = await getEtsyDefaults(pendingCountry);
      const etsyProfiles = profiles.filter((p) =>
        p.name.toLowerCase().includes('etsy')
      );
      await Promise.all(
        etsyProfiles.map((p) =>
          updateProfile({ id: p.id, data: { ...p, ...defaults, name: p.name } })
        )
      );
      const countryName =
        SELLER_COUNTRIES.find((c) => c.code === pendingCountry)?.name ?? pendingCountry;
      toast({ variant: 'success', title: `Etsy fees updated for ${countryName}` });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update Etsy fees' });
    } finally {
      setUpdatingEtsy(false);
      setPendingCountry(null);
    }
  };

  const currencySymbol = CURRENCIES.find((c) => c.code === form.watch('currency'))?.symbol || '$';
  const pendingCountryName =
    SELLER_COUNTRIES.find((c) => c.code === pendingCountry)?.name ?? pendingCountry;
  const pendingCountrySupported =
    pendingCountry !== null && SUPPORTED_ETSY_COUNTRIES.includes(pendingCountry);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold mb-0.5">Financial Settings</h2>
              <p className="text-sm text-muted-foreground">
                Configure currency, tax rates, and financial goals.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select key={field.value} onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormDescription>Used for all price calculations and displays.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Income Tax Rate (%)</FormLabel>
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
                      Applied to your net profit to estimate take-home earnings after tax.
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
                        <span className="absolute left-3 top-2.5 text-muted-foreground">{currencySymbol}</span>
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
                    <FormDescription>Your target revenue for performance tracking.</FormDescription>
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
                        <span className="absolute left-3 top-2.5 text-muted-foreground">{currencySymbol}</span>
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
                    <FormDescription>Default cost per hour for labor calculations.</FormDescription>
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
                    <Select key={field.value} onValueChange={field.onChange} defaultValue={field.value}>
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
          </div>

          <div className="flex-shrink-0 border-t p-4 flex justify-end bg-background">
            <Button type="submit" variant="secondary" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Country-change → update Etsy dialog */}
      <Dialog open={!!pendingCountry} onOpenChange={(open) => !open && setPendingCountry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Etsy Fee Profile?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Your seller country changed to <strong className="text-foreground">{pendingCountryName}</strong>.
                </p>
                {pendingCountrySupported ? (
                  <p>
                    Would you like to update your Etsy fee profile with the correct rates for this country?
                  </p>
                ) : (
                  <p>
                    Specific Etsy fee rates for <strong className="text-foreground">{pendingCountryName}</strong> aren't
                    available yet — US rates will be used as a fallback. You may need to adjust
                    the payment processing and VAT values manually.
                  </p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingCountry(null)} disabled={updatingEtsy}>
              Skip for now
            </Button>
            <Button variant="secondary" onClick={handleUpdateEtsyDefaults} disabled={updatingEtsy}>
              {updatingEtsy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Etsy Fees
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
