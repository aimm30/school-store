import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("NEXT_REDIRECT"); }), notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));
vi.mock("next/headers", () => ({ cookies: () => ({ get: () => undefined, set: vi.fn(), delete: vi.fn() }), headers: () => new Headers() }));

const session = vi.hoisted(() => ({ current: null as null | { sessionId: string; user: { id: string; role: "ADMIN" | "CUSTOMER" } } }));
vi.mock("@/lib/auth/session", async () => ({
  getSession: async () => session.current,
  getAdminSession: async () => (session.current?.user.role === "ADMIN" ? session.current : null),
  destroyUserSessions: vi.fn(),
  requireAdminPage: async () => { if (session.current?.user.role !== "ADMIN") throw new Error("NEXT_NOT_FOUND"); },
}));

function form(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

// These run without a database: every admin action must refuse before touching data.
describe("admin server actions enforce authorization on the backend (Journey 5)", () => {
  beforeEach(() => { session.current = null; });

  it("rejects anonymous and customer callers", async () => {
    const a = await import("@/lib/admin/actions");
    for (const who of [null, { sessionId: "s", user: { id: "u", role: "CUSTOMER" as const } }]) {
      session.current = who;
      const calls = [
        a.createProduct(null, form({ name: "x" })),
        a.updateProduct("p", null, form({ name: "x" })),
        a.deleteProduct(null, form({ id: "p" })),
        a.createCategory(null, form({ name: "Cat" })),
        a.deleteCategory(null, form({ id: "c" })),
        a.updateOrderStatus(null, form({ orderId: "o", status: "CONFIRMED" })),
        a.markPaymentReceived(null, form({ orderId: "o" })),
        a.setCustomerStatus(null, form({ id: "u", status: "SUSPENDED" })),
      ];
      for (const r of await Promise.all(calls)) {
        expect(r?.ok).toBe(false);
        expect(r?.message).toMatch(/not authorized/i);
      }
    }
  });
});
