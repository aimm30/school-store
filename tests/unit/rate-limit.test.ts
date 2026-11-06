import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: () => new Headers() }));

describe("rateLimit", () => {
  it("blocks after the limit and reports retry time", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = `t:${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(rateLimit(`other:${key}`, 3, 60_000).ok).toBe(true);
  });
});
