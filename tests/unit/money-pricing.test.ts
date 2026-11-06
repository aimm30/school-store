import { describe, expect, it } from "vitest";
import { formatNpr } from "@/lib/money";
import { availableStock, computeTotals, displayPrice, isInStock, lineProblem, slugify, unitPrice } from "@/lib/pricing";

describe("formatNpr", () => {
  it("uses Nepali-style grouping", () => {
    expect(formatNpr(120000)).toBe("NPR 1,20,000");
    expect(formatNpr(95)).toBe("NPR 95");
  });
});

describe("pricing", () => {
  it("variant price overrides product price", () => {
    expect(unitPrice(100, 150)).toBe(150);
    expect(unitPrice(100, null)).toBe(100);
  });
  it("computes totals from server-side prices", () => {
    expect(computeTotals([{ unitPrice: 100, quantity: 3 }, { unitPrice: 50, quantity: 2 }], 40)).toEqual({ subtotal: 400, deliveryFee: 40, total: 440 });
  });
  it("detects line problems", () => {
    expect(lineProblem(false, 10, 1)).toBe("UNAVAILABLE");
    expect(lineProblem(true, 0, 1)).toBe("OUT_OF_STOCK");
    expect(lineProblem(true, 2, 3)).toBe("INSUFFICIENT");
    expect(lineProblem(true, 5, 3)).toBeNull();
  });
  it("uses variant stock when a variant is chosen", () => {
    expect(availableStock({ stock: 9 }, { stock: 2 })).toBe(2);
    expect(availableStock({ stock: 9 }, null)).toBe(9);
  });
  it("shows 'from' prices only when variants differ", () => {
    expect(displayPrice({ priceNpr: 100, variants: [{ priceNpr: null }, { priceNpr: null }] })).toEqual({ price: 100, from: false });
    expect(displayPrice({ priceNpr: 100, variants: [{ priceNpr: 90 }, { priceNpr: null }] })).toEqual({ price: 90, from: true });
  });
  it("stock availability", () => {
    expect(isInStock({ stock: 0, variants: [{ stock: 0 }, { stock: 3 }] })).toBe(true);
    expect(isInStock({ stock: 0, variants: [] })).toBe(false);
  });
  it("slugifies", () => {
    expect(slugify("Laboratory Coat (Size M)!")).toBe("laboratory-coat-size-m");
    expect(slugify("!!!")).toBe("item");
  });
});
