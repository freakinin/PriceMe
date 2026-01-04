/**
 * Format a number as currency using the specified currency code
 */
export function formatCurrency(
  value: string | number | null | undefined,
  currency: string = 'USD'
): string {
  // Handle string input (from form fields)
  if (typeof value === 'string') {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '-';
    value = numValue;
  }
  
  if (value === null || value === undefined) return '-';
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  } catch (error) {
    // Fallback to USD if currency code is invalid
    console.warn(`Invalid currency code: ${currency}, falling back to USD`);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string = 'USD'): string {
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    });
    // Extract symbol from formatted value
    const parts = formatter.formatToParts(1);
    const symbolPart = parts.find(part => part.type === 'currency');
    return symbolPart?.value || '$';
  } catch (error) {
    return '$';
  }
}

