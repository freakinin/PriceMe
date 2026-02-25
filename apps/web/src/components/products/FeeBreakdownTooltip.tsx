import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { FeeBreakdown } from '@/hooks/useProductsPageState';
import { Info } from 'lucide-react';

interface FeeBreakdownTooltipProps {
  breakdown: FeeBreakdown;
  currency?: string;
  children?: React.ReactNode;
}

function fmt(n: number, currency = '$') {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  return `${sign}${currency}${abs.toFixed(2)}`;
}

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

export function FeeBreakdownTooltip({ breakdown, currency = '$', children }: FeeBreakdownTooltipProps) {
  const {
    grossPrice,
    shippingCost,
    listingFee,
    transactionFee,
    transactionFeePct,
    paymentProcessingFee,
    offsiteAdsFee,
    currencyConversionFee,
    vatOnFees,
    netRevenue,
    productCost,
    netProfitPreTax,
    incomeTaxPct,
    taxAmount,
    takeHomeProfit,
    netMarginPreTax,
    takeHomeMargin,
  } = breakdown;

  const row = (label: string, value: string, highlight?: 'positive' | 'negative' | 'neutral') => {
    const colorClass =
      highlight === 'positive' ? 'text-green-600 font-semibold' :
      highlight === 'negative' ? 'text-red-500 font-semibold' :
      'text-foreground font-semibold';
    return (
      <div className="flex justify-between items-center gap-4">
        <span className="text-muted-foreground">{label}</span>
        <span className={highlight ? colorClass : ''}>{value}</span>
      </div>
    );
  };

  const additionRow = (label: string, value: number) => (
    <div className="flex justify-between items-center gap-4 text-muted-foreground">
      <span>+ {label}</span>
      <span>+{currency}{value.toFixed(2)}</span>
    </div>
  );

  const deductionRow = (label: string, value: number) => (
    <div className="flex justify-between items-center gap-4 text-muted-foreground">
      <span>─ {label}</span>
      <span>{value > 0 ? `-${currency}${value.toFixed(2)}` : fmt(0, currency)}</span>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children ?? <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />}
        </TooltipTrigger>
        <TooltipContent side="left" className="w-64 p-3 space-y-1 text-xs font-mono">
          {row('Sale Price', fmt(grossPrice, currency))}
          {shippingCost > 0 && additionRow('Shipping Collected', shippingCost)}
          <div className="border-t my-1" />
          {deductionRow('Listing Fee', listingFee)}
          {deductionRow(`Transaction (${pct(transactionFeePct)})`, transactionFee)}
          {deductionRow('Payment Processing', paymentProcessingFee)}
          {offsiteAdsFee > 0 && deductionRow('Offsite Ads', offsiteAdsFee)}
          {currencyConversionFee > 0 && deductionRow('Currency Conversion', currencyConversionFee)}
          {vatOnFees > 0 && deductionRow('VAT on Fees', vatOnFees)}
          <div className="border-t my-1" />
          {row('Net Revenue', fmt(netRevenue, currency))}
          {deductionRow('Product Cost', productCost)}
          {shippingCost > 0 && deductionRow('Shipping Paid', shippingCost)}
          <div className="border-t my-1" />
          {row(
            `Net Profit (pre-tax, ${pct(netMarginPreTax)})`,
            fmt(netProfitPreTax, currency),
            netProfitPreTax >= 0 ? 'positive' : 'negative',
          )}
          {incomeTaxPct > 0 && (
            <>
              {deductionRow(`Income Tax (${pct(incomeTaxPct)})`, taxAmount)}
              <div className="border-t my-1" />
              {row(
                `Take-Home (${pct(takeHomeMargin)})`,
                fmt(takeHomeProfit, currency),
                takeHomeProfit >= 0 ? 'positive' : 'negative',
              )}
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
