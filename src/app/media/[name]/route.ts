import { readFile } from "node:fs/promises";
import path from "node:path";
import { uploadDir } from "@/lib/storage";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Serves locally stored product images. The strict filename pattern prevents path traversal. */
export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const match = /^[a-f0-9]{32}\.(jpg|png|webp)$/.exec(params.name);
  if (!match) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(uploadDir(), params.name));
    return new Response(data, { headers: { "Content-Type": TYPES[match[1]], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
