export const unitPrice = (productPrice: number, variantPrice?: number | null) => variantPrice ?? productPrice;

export const availableStock = (product: { stock: number }, variant?: { stock: number } | null) =>
  variant ? variant.stock : product.stock;

export type LineProblem = "UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT" | null;

export function lineProblem(isActive: boolean, available: number, qty: number): LineProblem {
  if (!isActive) return "UNAVAILABLE";
  if (available <= 0) return "OUT_OF_STOCK";
  if (qty > available) return "INSUFFICIENT";
  return null;
}

export function computeTotals(lines: { unitPrice: number; quantity: number }[], deliveryFee: number) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}

type PriceSource = { priceNpr: number; variants: { priceNpr: number | null }[] };

/** Price to show on cards: lowest price, with `from` set when variants differ. */
export function displayPrice(p: PriceSource): { price: number; from: boolean } {
  const all = p.variants.length ? p.variants.map((v) => v.priceNpr ?? p.priceNpr) : [p.priceNpr];
  const min = Math.min(...all);
  return { price: min, from: new Set(all).size > 1 };
}

export function isInStock(p: { stock: number; variants: { stock: number }[] }): boolean {
  return p.variants.length ? p.variants.some((v) => v.stock > 0) : p.stock > 0;
}

export function totalStock(p: { stock: number; variants: { stock: number }[] }): number {
  return p.variants.length ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock;
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}
