/**
 * Utility function to format currency amounts
 * @param amount Amount in cents (e.g., 3400 for $34.00)
 * @param currency Currency code (e.g., "usd", "eur")
 * @returns Formatted currency string (e.g., "$34")
 */
export const formatCurrency = (
  amount: number,
  currency: string
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
};
