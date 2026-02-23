import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Truck, Edit2, Trash2, Star, Save, Loader2 } from 'lucide-react';
import { useShippingMethods, type ShippingMethod } from '@/hooks/useShippingMethods';
import type { ShippingMethodInput } from '@priceme/shared';

const emptyMethod: ShippingMethodInput = {
  name: '',
  cost: 0,
  is_free_shipping: false,
  is_default: false,
};

export function ShippingSettings() {
  const { toast } = useToast();
  const { methods, loading, createMethod, updateMethod, deleteMethod } = useShippingMethods();

  const [editingMethod, setEditingMethod] = useState<number | 'new' | null>(null);
  const [methodForm, setMethodForm] = useState<ShippingMethodInput>(emptyMethod);
  const [methodSaving, setMethodSaving] = useState(false);

  const startEditMethod = (method: ShippingMethod) => {
    setMethodForm({
      name: method.name,
      cost: method.cost,
      is_free_shipping: method.is_free_shipping,
      is_default: method.is_default,
    });
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
      setMethodForm(emptyMethod);
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

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold mb-0.5">Shipping Methods</h2>
          <p className="text-sm text-muted-foreground">
            Define shipping options to factor shipping costs into your profit calculations.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingMethod('new');
            setMethodForm(emptyMethod);
          }}
          disabled={editingMethod !== null}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Method
        </Button>
      </div>

      <Separator />

      <div className="space-y-3">
        {loading ? (
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
                    onCancel={() => {
                      setEditingMethod(null);
                      setMethodForm(emptyMethod);
                    }}
                    saving={methodSaving}
                  />
                ) : (
                  <div className="rounded-lg border p-3 flex items-start justify-between gap-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{method.name}</span>
                        {method.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                        {method.is_free_shipping && (
                          <Badge variant="outline" className="text-xs">Free Shipping</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cost: {method.is_free_shipping ? 'Free' : `$${method.cost.toFixed(2)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!method.is_default && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleSetDefaultMethod(method)}
                        >
                          <Star className="h-3 w-3 mr-1" /> Set Default
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => startEditMethod(method)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteMethod(method.id)}
                      >
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
                onCancel={() => {
                  setEditingMethod(null);
                  setMethodForm(emptyMethod);
                }}
                saving={methodSaving}
              />
            )}

            {methods.length === 0 && editingMethod !== 'new' && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No shipping methods defined. Add one to include shipping in profit calculations.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setEditingMethod('new');
                    setMethodForm(emptyMethod);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Method
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── ShippingMethodForm sub-component ─────────────────────────────────────────

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
      <h4 className="font-medium text-sm">
        {form.name ? `Edit: ${form.name}` : 'New Shipping Method'}
      </h4>

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
          <Label htmlFor="free-shipping" className="text-sm cursor-pointer">
            Free shipping (you absorb the cost)
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="method-default"
            checked={!!form.is_default}
            onCheckedChange={(v) => set('is_default', v)}
          />
          <Label htmlFor="method-default" className="text-sm cursor-pointer">
            Set as default shipping method
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
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
