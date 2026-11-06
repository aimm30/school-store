import { describe, expect, it } from "vitest";
import { canTransition, nextStatuses, timelineSteps } from "@/lib/orders/status";
import { generateOrderNumber } from "@/lib/orders/number";
import { detectImageType } from "@/lib/image-type";

describe("order status machine", () => {
  it("follows the collection flow", () => {
    expect(nextStatuses("PENDING", "SCHOOL_COLLECTION")).toEqual(["CONFIRMED", "CANCELLED"]);
    expect(nextStatuses("PROCESSING", "SCHOOL_COLLECTION")).toEqual(["READY_FOR_COLLECTION", "CANCELLED"]);
    expect(nextStatuses("PROCESSING", "DELIVERY")).toEqual(["OUT_FOR_DELIVERY", "CANCELLED"]);
  });
  it("does not allow skipping or leaving terminal states", () => {
    expect(canTransition("PENDING", "COMPLETED", "DELIVERY")).toBe(false);
    expect(nextStatuses("COMPLETED", "DELIVERY")).toEqual([]);
    expect(nextStatuses("CANCELLED", "DELIVERY")).toEqual([]);
  });
  it("timeline differs by fulfilment", () => {
    expect(timelineSteps("DELIVERY")).toContain("OUT_FOR_DELIVERY");
    expect(timelineSteps("SCHOOL_COLLECTION")).toContain("READY_FOR_COLLECTION");
  });
});

describe("order numbers", () => {
  it("are formatted and effectively unique", () => {
    const a = generateOrderNumber("KNS", new Date("2026-11-06T00:00:00Z"));
    expect(a).toMatch(/^KNS-20261106-[A-Z2-9]{5}$/);
    expect(new Set(Array.from({ length: 500 }, () => generateOrderNumber("KNS"))).size).toBeGreaterThan(495);
  });
});

describe("image type detection (upload safety)", () => {
  it("detects real images by content, not name", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe("jpg");
    expect(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.ext).toBe("png");
    expect(detectImageType(new TextEncoder().encode("RIFFxxxxWEBPVP8 "))?.ext).toBe("webp");
  });
  it("rejects scripts and other files", () => {
    expect(detectImageType(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });
});
