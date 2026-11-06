function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return value !== undefined && value !== "" && Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export const siteConfig = {
  storeName: process.env.STORE_NAME || "Kanjirowa Student Store",
  schoolName: process.env.SCHOOL_NAME || "Kanjirowa National School",
  orderPrefix: process.env.ORDER_PREFIX || "KNS",
  siteUrl: process.env.APP_URL || "http://localhost:3000",
  contactEmail: process.env.CONTACT_EMAIL || "",
  contactPhone: process.env.CONTACT_PHONE || "",
  schoolAddress: process.env.SCHOOL_ADDRESS || "",
  storeHours: process.env.STORE_HOURS || "",
  privacyEmail: process.env.PRIVACY_CONTACT_EMAIL || process.env.CONTACT_EMAIL || "",
  deliveryFee: num(process.env.DELIVERY_FEE_NPR, 0),
  lowStockThreshold: num(process.env.LOW_STOCK_THRESHOLD, 5),
  pageSize: 12,
  maxQtyPerLine: 20,
};
