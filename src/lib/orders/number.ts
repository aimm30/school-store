import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, no 0/O/1/I

export function generateOrderNumber(prefix: string, date = new Date()): string {
  const ymd = date.toISOString().slice(0, 10).replaceAll("-", "");
  const code = Array.from(randomBytes(5), (b) => ALPHABET[b % 32]).join("");
  return `${prefix}-${ymd}-${code}`;
}
