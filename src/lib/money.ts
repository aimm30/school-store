/** Prices are stored as whole NPR rupees. Indian-style grouping matches Nepali convention (1,20,000). */
export function formatNpr(amount: number): string {
  return `NPR ${Math.round(amount).toLocaleString("en-IN")}`;
}
