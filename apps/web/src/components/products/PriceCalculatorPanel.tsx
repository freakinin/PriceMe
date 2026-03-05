import { useState, useEffect } from 'react';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency';
import {
  calculatePriceFromMargin,
  calculatePriceFromMarkup,
  calculatePriceFromProfit,
  calculateProfitFromPrice,
} from '@/utils/profitCalculations';

type PricingMode = 'price' | 'profit' | 'margin' | 'markup';

interface PriceCalculatorPanelProps {
  totalCost: number;
  currency: string;
  initialMethod?: PricingMode;
  initialValue?: number;
  onChange: (method: PricingMode, value: number, calculatedPrice: number) => void;
}

function getHealthStatus(margin: number, belowBreakEven: boolean) {
  if (belowBreakEven) return { label: 'Below cost', color: 'text-red-600', dotColor: 'bg-red-500', Icon: TrendingDown };
  if (margin >= 30) return { label: 'Healthy', color: 'text-green-700', dotColor: 'bg-green-500', Icon: TrendingUp };
  if (margin >= 10) return { label: 'Thin margin', color: 'text-amber-600', dotColor: 'bg-amber-500', Icon: Minus };
  return { label: 'At risk', color: 'text-red-600', dotColor: 'bg-red-500', Icon: TrendingDown };
}

function computeMetrics(mode: PricingMode, numValue: number, cost: number) {
  if (mode === 'price') return calculateProfitFromPrice(numValue, cost);
  if (mode === 'profit') return calculatePriceFromProfit(numValue, cost);
  if (mode === 'margin') return calculatePriceFromMargin(numValue, cost);
  return calculatePriceFromMarkup(numValue, cost);
}

type Preset = { label: string; sub: string; value: number };

function getPresets(mode: PricingMode, cost: number, currency: string): Preset[] {
  if (cost <= 0) return [];

  if (mode === 'price') {
    return [2, 3, 4].map(mult => ({
      label: `${mult}× cost`,
      sub: formatCurrency(cost * mult, currency),
      value: parseFloat((cost * mult).toFixed(2)),
    }));
  }

  if (mode === 'profit') {
    // Common margin targets expressed as profit amounts
    return [
      { margin: 30, label: '30% margin' },
      { margin: 50, label: '50% margin' },
      { margin: 66.7, label: '66% margin' },
    ].map(({ margin, label }) => {
      const price = cost / (1 - margin / 100);
      const profit = parseFloat((price - cost).toFixed(2));
      return { label, sub: formatCurrency(profit, currency), value: profit };
    });
  }

  if (mode === 'margin') {
    return [
      { value: 30, label: '30%', sub: 'standard' },
      { value: 50, label: '50%', sub: 'good' },
      { value: 66, label: '66%', sub: 'strong' },
    ];
  }

  // markup
  return [
    { value: 50, label: '50%', sub: '1.5× cost' },
    { value: 100, label: '100%', sub: '2× cost' },
    { value: 200, label: '200%', sub: '3× cost' },
  ];
}

const MODES: { id: PricingMode; label: string }[] = [
  { id: 'price',  label: 'Set my price' },
  { id: 'profit', label: '$X profit per unit' },
  { id: 'margin', label: 'X% of every sale' },
  { id: 'markup', label: 'Markup %' },
];

export function PriceCalculatorPanel({
  totalCost,
  currency,
  initialMethod = 'price',
  initialValue,
  onChange,
}: PriceCalculatorPanelProps) {
  const [activeMode, setActiveMode] = useState<PricingMode>(initialMethod);
  const [inputValue, setInputValue] = useState<string>(() => {
    if (initialValue !== undefined && initialValue > 0) return String(initialValue);
    return '';
  });

  // Sync when parent loads an existing product
  useEffect(() => {
    setActiveMode(initialMethod);
    if (initialValue !== undefined && initialValue > 0) {
      setInputValue(String(initialValue));
    }
  }, [initialMethod, initialValue]);

  const numValue = parseFloat(inputValue) || 0;
  const metrics = computeMetrics(activeMode, numValue, totalCost);
  const { price: calculatedPrice, profit, margin, markup } = metrics;

  const belowBreakEven = calculatedPrice > 0 && totalCost > 0 && calculatedPrice < totalCost;
  const health = getHealthStatus(margin, belowBreakEven);
  const hasResult = calculatedPrice > 0 || numValue > 0;

  const handleModeChange = (mode: PricingMode) => {
    if (mode === activeMode) return;
    // Convert current result to the new mode's input unit
    const current = computeMetrics(activeMode, numValue, totalCost);
    setActiveMode(mode);
    if (current.price > 0 || numValue > 0) {
      if (mode === 'price')  setInputValue(current.price.toFixed(2));
      else if (mode === 'profit') setInputValue(current.profit.toFixed(2));
      else if (mode === 'margin') setInputValue(current.margin.toFixed(2));
      else if (mode === 'markup') setInputValue(current.markup.toFixed(2));
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    const num = parseFloat(val) || 0;
    const m = computeMetrics(activeMode, num, totalCost);
    onChange(activeMode, num, m.price);
  };

  const applyPreset = (preset: Preset) => {
    setInputValue(String(preset.value));
    const m = computeMetrics(activeMode, preset.value, totalCost);
    onChange(activeMode, preset.value, m.price);
  };

  const currSymbol = getCurrencySymbol(currency);
  const presets = getPresets(activeMode, totalCost, currency);

  const inputLabel =
    activeMode === 'price'  ? `Price (${currSymbol})` :
    activeMode === 'profit' ? `Target profit (${currSymbol})` :
    activeMode === 'margin' ? 'Target margin (%)' :
    'Markup (%)';

  const markupTooltip = 'Markup % = profit added on top of cost. At $10 cost with 100% markup, price = $20 (that\'s 50% margin — not the same thing).';

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">

      {/* Cost header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
            Your cost per unit
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(totalCost, currency)}
          </div>
        </div>
        {totalCost === 0 && (
          <p className="text-xs text-muted-foreground italic max-w-[200px] text-right">
            Add materials, labor, or other costs above to see your cost
          </p>
        )}
      </div>

      {/* Mode tabs — all 4 shown inline */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">How do you want to set your price?</p>
        <div className="flex gap-1.5 flex-wrap">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleModeChange(id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border flex items-center gap-1
                ${activeMode === id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                }`}
            >
              {label}
              {id === 'markup' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 opacity-70" onClick={e => e.stopPropagation()} />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[240px] text-xs">{markupTooltip}</TooltipContent>
                </Tooltip>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Input + presets side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">{inputLabel}</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={inputValue}
            onChange={e => handleInputChange(e.target.value)}
            placeholder={activeMode === 'price' || activeMode === 'profit' ? '0.00' : '0'}
            className={belowBreakEven ? 'border-red-400 focus-visible:ring-red-400' : ''}
          />
          {belowBreakEven && (
            <p className="text-xs text-red-500 mt-1">Below cost — you'd lose money on each sale</p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <label className="text-xs text-muted-foreground">Quick presets</label>
            {activeMode === 'profit' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[200px]">
                  Profit amounts that correspond to common margin targets
                </TooltipContent>
              </Tooltip>
            )}
            {activeMode === 'price' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[200px]">
                  2× = wholesale rule, 3× = craft standard, 4× = premium/artisan
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {totalCost > 0 ? presets.map((preset, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-2.5 py-1.5 rounded border text-xs font-medium text-muted-foreground hover:border-primary hover:text-foreground transition-colors bg-background leading-tight text-left"
              >
                <div>{preset.label}</div>
                <div className="opacity-60 font-normal text-[10px]">{preset.sub}</div>
              </button>
            )) : (
              <span className="text-xs text-muted-foreground/60 italic">Add costs first</span>
            )}
          </div>
        </div>
      </div>

      {/* Live results card */}
      {hasResult && (
        <div className={`rounded-lg p-3 border ${
          belowBreakEven          ? 'bg-red-50 border-red-200' :
          margin < 10             ? 'bg-red-50 border-red-100' :
          margin < 30             ? 'bg-amber-50 border-amber-200' :
          'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-4 text-sm flex-wrap">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Price</div>
                <div className="font-semibold">{formatCurrency(calculatedPrice, currency)}</div>
              </div>
              <div className="w-px bg-border self-stretch" />
              <div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Profit</div>
                <div className={`font-semibold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(profit, currency)}
                </div>
              </div>
              <div className="w-px bg-border self-stretch" />
              <div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Margin</div>
                <div className={`font-semibold ${margin >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  {margin.toFixed(1)}%
                </div>
              </div>
              <div className="w-px bg-border self-stretch" />
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Markup</div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] text-xs">
                      Markup % = how much you added on top of cost.
                      Margin % = how much of your price is profit.
                      Example: $10 cost, $20 price → 100% markup, 50% margin.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="font-semibold text-purple-700">{markup.toFixed(1)}%</div>
              </div>
            </div>

            {/* Health indicator */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={`h-2 w-2 rounded-full ${health.dotColor}`} />
              <span className={`text-xs font-medium ${health.color}`}>{health.label}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
