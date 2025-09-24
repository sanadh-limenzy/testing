/**
 * Formats currency values with appropriate abbreviations for large numbers
 * to prevent UI breaking with very large values
 */

export function formatCurrencyCompact(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  } else {
    return `$${value.toLocaleString()}`;
  }
}

/**
 * Formats currency with full precision but limits display length
 */
export function formatCurrencySafe(value: number, maxLength: number = 15): string {
  const formatted = `$${value.toLocaleString()}`;
  if (formatted.length > maxLength) {
    return formatCurrencyCompact(value);
  }
  return formatted;
}

/**
 * Formats currency with tooltip showing full value for large numbers
 */
export function formatCurrencyWithTooltip(value: number): {
  display: string;
  fullValue: string;
} {
  const fullValue = `$${value.toLocaleString()}`;
  const display = value >= 1000000 ? formatCurrencyCompact(value) : fullValue;
  
  return {
    display,
    fullValue
  };
}
