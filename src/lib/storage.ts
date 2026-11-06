import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { detectImageType } from "./image-type";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_IMAGES_PER_PRODUCT = 5;
export class UploadError extends Error {}

const driver = () => (process.env.STORAGE_DRIVER === "s3" ? "s3" : "local");
export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR || "./uploads");

let s3: S3Client | null = null;
function s3Client() {
  s3 ??= new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" },
  });
  return s3;
}

export async function saveImage(file: File): Promise<string> {
  if (file.size === 0) throw new UploadError("Empty file.");
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError(`"${file.name}" is larger than 2 MB.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) throw new UploadError(`"${file.name}" is not a JPEG, PNG or WebP image.`);
  const name = `${randomBytes(16).toString("hex")}.${type.ext}`;

  if (driver() === "s3") {
    if (!process.env.S3_BUCKET || !process.env.S3_PUBLIC_URL) throw new UploadError("Image storage (S3) is not configured.");
    await s3Client().send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: name, Body: bytes, ContentType: type.mime, CacheControl: "public, max-age=31536000, immutable" }));
    return `${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/${name}`;
  }
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(path.join(uploadDir(), name), bytes);
  return `/media/${name}`;
}

export async function deleteImage(url: string): Promise<void> {
  try {
    const name = url.split("/").pop() ?? "";
    if (!/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(name)) return;
    if (driver() === "s3") {
      await s3Client().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: name }));
    } else {
      await unlink(path.join(uploadDir(), name));
    }
  } catch (err) {
    console.error("[storage] delete failed", err);
  }
}
