import { useCallback } from 'react';
import type { PricingMethod } from '@/hooks/useProducts';
import { calculateProfitFromPrice as _calculateProfitFromPrice } from '@/utils/profitCalculations';

export function useProductPricing() {

    const calculatePriceFromMethod = useCallback((method: PricingMethod, value: number, cost: number): number => {
        switch (method) {
            case 'markup':
                return cost * (1 + value / 100);
            case 'price':
                return value;
            case 'profit':
                return cost + value;
            case 'margin':
                if (value >= 100) return 0; // Prevent division by zero
                return cost / (1 - value / 100);
            default:
                return cost;
        }
    }, []);

    // Delegates to the shared utility so edge-case guards (price <= 0, cost < 0) are consistent.
    const calculateProfitFromPrice = useCallback((price: number, cost: number) => {
        const { profit, margin, markup } = _calculateProfitFromPrice(price, cost);
        return { profit, margin, markup };
    }, []);

    const calculateValueFromMethod = useCallback((method: PricingMethod, targetPrice: number, cost: number): number => {
        switch (method) {
            case 'markup':
                return cost > 0 ? ((targetPrice - cost) / cost) * 100 : 0;
            case 'price':
                return targetPrice;
            case 'profit':
                return targetPrice - cost;
            case 'margin':
                return targetPrice > 0 ? ((targetPrice - cost) / targetPrice) * 100 : 0;
            default:
                return targetPrice;
        }
    }, []);

    const getCalculationTypeDescription = useCallback((method: PricingMethod): string => {
        switch (method) {
            case 'markup':
                return 'Enter markup percentage applied to cost. Price = Cost × (1 + Markup%).';
            case 'price':
                return 'Enter your desired selling price. Profit and margin will be calculated automatically.';
            case 'profit':
                return 'Enter desired profit amount per unit. Price = Cost + Profit.';
            case 'margin':
                return 'Enter desired profit margin percentage. Price = Cost ÷ (1 - Margin%).';
            default:
                return 'Select a calculation method for all products.';
        }
    }, []);

    return {
        calculatePriceFromMethod,
        calculateProfitFromPrice,
        calculateValueFromMethod,
        getCalculationTypeDescription
    };
}
