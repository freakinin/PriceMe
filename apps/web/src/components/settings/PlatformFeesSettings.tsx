import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus,
  ShoppingBag,
  Edit2,
  Trash2,
  Star,
  Save,
  Loader2,
  Info,
  TriangleAlert,
} from 'lucide-react';
import { usePlatformFees, type PlatformFeeProfile } from '@/hooks/usePlatformFees';
import { useSettings } from '@/hooks/useSettings';
import type { PlatformFeeProfileInput } from '@priceme/shared';

// Countries with Etsy-specific fee data in the API
const SUPPORTED_ETSY_COUNTRIES = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL'];

const emptyProfile: PlatformFeeProfileInput = {
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

export function PlatformFeesSettings() {
  const { toast } = useToast();
  const { settings } = useSettings();
  const {
    profiles,
    loading,
    createProfile,
    updateProfile,
    deleteProfile,
    getEtsyDefaults,
    isCreating,
    isUpdating,
  } = usePlatformFees();

  const [editingProfile, setEditingProfile] = useState<number | 'new' | null>(null);
  const [profileForm, setProfileForm] = useState<PlatformFeeProfileInput>(emptyProfile);
  const [profileSaving, setProfileSaving] = useState(false);

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
    const country = settings?.seller_country || 'US';
    try {
      const defaults = await getEtsyDefaults(country);
      setProfileForm((prev) => ({ ...prev, ...defaults, name: prev.name || 'Etsy' }));
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
      setProfileForm(emptyProfile);
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

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold mb-0.5">Platform Fee Profiles</h2>
          <p className="text-sm text-muted-foreground">
            Configure marketplace fees (Etsy, etc.) to calculate your true net profit.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingProfile('new');
            setProfileForm(emptyProfile);
          }}
          disabled={editingProfile !== null}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Platform
        </Button>
      </div>

      <Separator />

      {/* Warning: country not supported for Etsy defaults */}
      {settings?.seller_country && !SUPPORTED_ETSY_COUNTRIES.includes(settings.seller_country) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2.5 text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/10 dark:text-amber-400">
          <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="text-xs font-medium">Etsy fee rates may be inaccurate</p>
            <p className="text-xs">
              Your seller country (<strong>{settings.seller_country}</strong>) doesn't have
              country-specific Etsy rates configured. Payment processing fees and VAT on fees
              may not reflect your actual charges. Please verify and update these values manually.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
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
                    onCancel={() => {
                      setEditingProfile(null);
                      setProfileForm(emptyProfile);
                    }}
                    onLoadEtsy={handleLoadEtsyDefaults}
                    saving={profileSaving || isUpdating}
                  />
                ) : (
                  <div className="rounded-lg border p-3 flex items-start justify-between gap-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{profile.name}</span>
                        {profile.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Listing: ${profile.listing_fee_usd.toFixed(2)} · Transaction:{' '}
                        {profile.transaction_fee_pct}% · Payment: {profile.payment_processing_pct}%
                        + {profile.payment_processing_flat.toFixed(2)}
                        {profile.offsite_ads_enabled && ` · Offsite Ads: ${profile.offsite_ads_pct}%`}
                        {profile.vat_on_fees_pct > 0 && ` · VAT on fees: ${profile.vat_on_fees_pct}%`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!profile.is_default && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleSetDefaultProfile(profile)}
                        >
                          <Star className="h-3 w-3 mr-1" /> Set Default
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => startEditProfile(profile)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteProfile(profile.id)}
                      >
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
                onCancel={() => {
                  setEditingProfile(null);
                  setProfileForm(emptyProfile);
                }}
                onLoadEtsy={handleLoadEtsyDefaults}
                saving={profileSaving || isCreating}
              />
            )}

            {profiles.length === 0 && editingProfile !== 'new' && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No platform profiles yet. An Etsy profile will be auto-created on first use.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setEditingProfile('new');
                    setProfileForm(emptyProfile);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Platform
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── PlatformFeeForm sub-component ────────────────────────────────────────────

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

  const numInput = (
    key: keyof PlatformFeeProfileInput,
    label: string,
    tooltip?: string,
    suffix?: string
  ) => (
    <div className="space-y-1">
      <Label className="text-xs flex items-center gap-1">
        {label}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
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
        value={(form[key] as number) ?? ''}
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
        {numInput(
          'transaction_fee_pct',
          'Transaction Fee',
          'Applied to sale price + shipping (e.g. Etsy: 6.5%)',
          '%'
        )}
        {numInput(
          'payment_processing_pct',
          'Payment Processing',
          'Percentage of total order (varies by country)',
          '%'
        )}
        {numInput('payment_processing_flat', 'Payment Flat Fee', 'Per-transaction flat fee (e.g. $0.25)', '$')}
        {numInput(
          'currency_conversion_pct',
          'Currency Conversion',
          'Fee if listing currency ≠ payment account currency (e.g. 2.5%)',
          '%'
        )}
        {numInput(
          'vat_on_fees_pct',
          'VAT on Platform Fees',
          "VAT applied to Etsy's fees (UK=20%, AU=10%, others=0)",
          '%'
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch
            id="offsite-ads"
            checked={form.offsite_ads_enabled}
            onCheckedChange={(v) => set('offsite_ads_enabled', v)}
          />
          <Label htmlFor="offsite-ads" className="text-sm cursor-pointer">
            Offsite Ads enabled
          </Label>
        </div>
        {form.offsite_ads_enabled && (
          <div className="ml-8 max-w-[140px]">
            {numInput(
              'offsite_ads_pct',
              'Offsite Ads Fee',
              'Fee when a sale is attributed to an offsite ad (12% or 15%)',
              '%'
            )}
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
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  On Etsy, the 6.5% transaction fee is charged on the shipping price charged to the
                  buyer too. Enable this to include shipping in the fee base.
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
          <Label htmlFor="is-default" className="text-sm cursor-pointer">
            Set as default platform
          </Label>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save Profile
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
