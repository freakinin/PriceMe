
import { useState } from 'react';
import { Globe, Plus, X, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/utils/currency';
import type { ShippingScenario } from '@/types/product-form';
import type { ShippingMethod } from '@/hooks/useShippingMethods';

interface ShippingScenariosPanelProps {
  scenarios: ShippingScenario[];
  onChange: (scenarios: ShippingScenario[]) => void;
  productCost: number;
  /** The shipping cost already included in productCost (from Other Costs). Scenarios replace this. */
  shippingCostInOtherCosts: number;
  targetPrice: number;
  currency: string;
  shippingMethods: ShippingMethod[];
}

function getMarginColor(margin: number, belowBreakEven: boolean) {
  if (belowBreakEven) return 'text-red-600';
  if (margin >= 30) return 'text-green-700';
  if (margin >= 10) return 'text-amber-600';
  return 'text-red-600';
}

export function ShippingScenariosPanel({
  scenarios,
  onChange,
  productCost,
  shippingCostInOtherCosts,
  targetPrice,
  currency,
  shippingMethods,
}: ShippingScenariosPanelProps) {
  // Base cost without any shipping — scenarios replace the current shipping
  const baseCost = productCost - shippingCostInOtherCosts;
  const [isOpen, setIsOpen] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('custom');

  const handleMethodChange = (value: string) => {
    setSelectedMethodId(value);
    if (value !== 'custom') {
      const method = shippingMethods.find((m) => String(m.id) === value);
      if (method) {
        setNewName(method.name);
        setNewCost(method.is_free_shipping ? '0' : String(method.cost));
      }
    } else {
      setNewName('');
      setNewCost('');
    }
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const cost = parseFloat(newCost) || 0;
    if (scenarios.length >= 4) return;
    onChange([...scenarios, { name: newName.trim(), cost }]);
    setNewName('');
    setNewCost('');
    setSelectedMethodId('custom');
    setAddingNew(false);
  };

  const handleRemove = (index: number) => {
    onChange(scenarios.filter((_, i) => i !== index));
  };

  const hasPrice = targetPrice > 0;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span>Shipping Scenarios</span>
          {scenarios.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {scenarios.length}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t">
          <p className="text-xs text-muted-foreground pt-3">
            Compare your profit across different shipping destinations. Each scenario <em>replaces</em> your current shipping cost.
            {shippingCostInOtherCosts > 0 && (
              <span className="font-medium text-foreground"> (Current: {formatCurrency(shippingCostInOtherCosts, currency)})</span>
            )}
          </p>

          {scenarios.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left py-1.5 font-medium">Destination</th>
                    <th className="text-right py-1.5 font-medium">Shipping</th>
                    {hasPrice && (
                      <>
                        <th className="text-right py-1.5 font-medium">Profit</th>
                        <th className="text-right py-1.5 font-medium">Margin</th>
                      </>
                    )}
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((scenario, i) => {
                    // Replace current shipping with scenario shipping
                    const effectiveCost = baseCost + scenario.cost;
                    const profit = hasPrice ? targetPrice - effectiveCost : null;
                    const margin = hasPrice && targetPrice > 0 ? (profit! / targetPrice) * 100 : null;
                    const belowBreakEven = profit !== null && profit < 0;

                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-2">
                          <div className="flex items-center gap-1.5">
                            <Truck className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate max-w-[100px]">{scenario.name}</span>
                          </div>
                        </td>
                        <td className="py-2 text-right text-muted-foreground">
                          {scenario.cost === 0 ? 'Free' : formatCurrency(scenario.cost, currency)}
                        </td>
                        {hasPrice && (
                          <>
                            <td className={`py-2 text-right font-semibold ${getMarginColor(margin!, belowBreakEven)}`}>
                              {profit !== null ? formatCurrency(profit, currency) : '—'}
                            </td>
                            <td className={`py-2 text-right font-semibold ${getMarginColor(margin!, belowBreakEven)}`}>
                              {margin !== null ? `${margin.toFixed(1)}%` : '—'}
                            </td>
                          </>
                        )}
                        <td className="py-2 pl-2">
                          <button
                            type="button"
                            onClick={() => handleRemove(i)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!hasPrice && (
                <p className="text-xs text-muted-foreground mt-2 italic">Set a target price above to see profit estimates.</p>
              )}
            </div>
          )}

          {addingNew ? (
            <div className="space-y-2 rounded-md border p-3 bg-muted/10">
              <div className="space-y-1">
                <Label className="text-xs">Pick from saved methods</Label>
                <Select value={selectedMethodId} onValueChange={handleMethodChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select a method or enter custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom / Enter manually</SelectItem>
                    {shippingMethods.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name} — {m.is_free_shipping ? 'Free' : formatCurrency(m.cost, currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Label</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="e.g. Europe"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Shipping cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-8 text-xs"
                    placeholder="0.00"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={!newName.trim()}>
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => {
                    setAddingNew(false);
                    setNewName('');
                    setNewCost('');
                    setSelectedMethodId('custom');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            scenarios.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setAddingNew(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Scenario
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
