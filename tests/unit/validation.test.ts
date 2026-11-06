import { describe, expect, it } from "vitest";
import { checkoutSchema, loginSchema, passwordSchema, phoneSchema, productSchema, signupSchema } from "@/lib/validation";
import { passwordStrength } from "@/lib/password-strength";
import { safeNext } from "@/lib/form";

const base = { name: "Sita Sharma", email: "Sita@Example.com", password: "Str0ngPass", confirmPassword: "Str0ngPass", acceptTerms: "on" };

describe("signupSchema", () => {
  it("accepts valid input and lowercases the email", () => {
    const r = signupSchema.parse(base);
    expect(r.email).toBe("sita@example.com");
    expect(r.studentId).toBeUndefined();
  });
  it("rejects mismatched passwords, weak passwords and missing consent", () => {
    expect(signupSchema.safeParse({ ...base, confirmPassword: "x" }).success).toBe(false);
    expect(passwordSchema.safeParse("alllowercase1").success).toBe(false);
    expect(passwordSchema.safeParse("Short1").success).toBe(false);
    const { acceptTerms: _a, ...noTerms } = base;
    expect(signupSchema.safeParse(noTerms).success).toBe(false);
  });
});

describe("phone", () => {
  it("accepts Nepali mobile numbers only", () => {
    expect(phoneSchema.safeParse("9841234567").success).toBe(true);
    expect(phoneSchema.safeParse("+977-9801234567").success).toBe(true);
    expect(phoneSchema.safeParse("1234567890").success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  const ok = { name: "Ram Thapa", phone: "9841234567", email: "ram@example.com", idempotencyKey: "a".repeat(32) };
  it("requires an address for cash on delivery", () => {
    expect(checkoutSchema.safeParse({ ...ok, method: "COD" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...ok, method: "COD", address: "Tole 4", city: "Kathmandu" }).success).toBe(true);
  });
  it("does not require an address for school collection", () => {
    expect(checkoutSchema.safeParse({ ...ok, method: "PAY_AT_SCHOOL" }).success).toBe(true);
  });
  it("rejects unknown payment methods (e.g. client-chosen online gateways)", () => {
    expect(checkoutSchema.safeParse({ ...ok, method: "ESEWA" }).success).toBe(false);
  });
});

describe("productSchema", () => {
  const p = { name: "Notebook", sku: "NB-1", description: "", categoryId: "c1", priceNpr: 100, stock: 5, isFeatured: false, isActive: true, variants: [] };
  it("rejects negative prices and stock, and fractional prices", () => {
    expect(productSchema.safeParse({ ...p, priceNpr: -5 }).success).toBe(false);
    expect(productSchema.safeParse({ ...p, priceNpr: 0 }).success).toBe(false);
    expect(productSchema.safeParse({ ...p, stock: -1 }).success).toBe(false);
    expect(productSchema.safeParse({ ...p, priceNpr: 10.5 }).success).toBe(false);
    expect(productSchema.safeParse(p).success).toBe(true);
  });
});

describe("misc", () => {
  it("login requires both fields", () => {
    expect(loginSchema.safeParse({ identifier: "", password: "" }).success).toBe(false);
  });
  it("password strength increases", () => {
    expect(passwordStrength("abc").score).toBeLessThan(passwordStrength("Str0ng!Passw0rd").score);
  });
  it("safeNext blocks open redirects", () => {
    expect(safeNext("/cart")).toBe("/cart");
    expect(safeNext("//evil.com")).toBe("/account");
    expect(safeNext("https://evil.com")).toBe("/account");
    expect(safeNext("/\\evil.com")).toBe("/account");
    expect(safeNext(undefined, "/x")).toBe("/x");
  });
});
