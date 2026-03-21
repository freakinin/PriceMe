
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Truck, Search, Settings } from 'lucide-react';
import { useShippingMethods } from '@/hooks/useShippingMethods';
import { openSettingsAt } from '@/lib/openSettings';
import { formatCurrency } from '@/utils/currency';
import type { OtherCostItem } from '@/types/product-form';

interface ChooseShippingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: OtherCostItem) => void;
  currency?: string;
}

export function ChooseShippingModal({ open, onOpenChange, onSelect, currency = 'USD' }: ChooseShippingModalProps) {
  const { methods, loading } = useShippingMethods();
  const [search, setSearch] = useState('');

  const filtered = methods.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (method: typeof methods[0]) => {
    onSelect({
      item: method.name,
      quantity: 1,
      cost: method.is_free_shipping ? 0 : method.cost,
      per_batch: false,
      is_shipping: true,
    });
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSearch(''); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Add Shipping Cost
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search methods..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {methods.length === 0 ? 'No shipping methods saved yet.' : 'No methods match your search.'}
              </p>
            ) : (
              filtered.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => handleSelect(method)}
                  className="w-full text-left rounded-md border px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Truck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">{method.name}</span>
                    {method.is_default && (
                      <Badge variant="secondary" className="text-xs shrink-0">Default</Badge>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-primary shrink-0">
                    {method.is_free_shipping ? 'Free' : formatCurrency(method.cost, currency)}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="pt-1 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => {
                onOpenChange(false);
                openSettingsAt('shipping');
              }}
            >
              <Settings className="h-3 w-3 mr-1.5" />
              Manage shipping methods
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
