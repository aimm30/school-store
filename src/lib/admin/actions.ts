"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma, type OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { fail, fromZod, succeed, type FormState } from "@/lib/form";
import { getAdminSession } from "@/lib/auth/session";
import { categorySchema, productSchema } from "@/lib/validation";
import { slugify } from "@/lib/pricing";
import { deleteImage, MAX_IMAGES_PER_PRODUCT, saveImage, UploadError } from "@/lib/storage";
import { changeOrderStatus, recordPaymentReceived } from "@/lib/orders/admin";
import { OrderError } from "@/lib/orders/create";
import { destroyUserSessions } from "@/lib/auth/session";
import { z } from "zod";

const DENIED = () => fail("You are not authorized to do that.");

function refreshCatalog() {
  revalidateTag("products");
  revalidateTag("categories");
  revalidatePath("/", "layout");
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const clash = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (!clash || clash.id === ignoreId) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

function parseProductForm(formData: FormData) {
  let variantsRaw: unknown = [];
  try {
    variantsRaw = JSON.parse(String(formData.get("variants") || "[]"));
  } catch {
    variantsRaw = null;
  }
  return productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId"),
    priceNpr: formData.get("priceNpr"),
    stock: formData.get("stock"),
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
    variants: variantsRaw,
  });
}

function duplicateMessage(err: unknown): FormState | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return fail("A product or variant with this SKU already exists.", { sku: ["This SKU is already in use."] });
  }
  return null;
}

async function uploadImages(files: File[], existingCount: number): Promise<string[]> {
  const real = files.filter((f) => f.size > 0);
  if (existingCount + real.length > MAX_IMAGES_PER_PRODUCT) throw new UploadError(`A product can have at most ${MAX_IMAGES_PER_PRODUCT} images.`);
  const urls: string[] = [];
  try {
    for (const f of real) urls.push(await saveImage(f));
  } catch (err) {
    await Promise.all(urls.map(deleteImage));
    throw err;
  }
  return urls;
}

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getAdminSession())) return DENIED();
  const parsed = parseProductForm(formData);
  if (!parsed.success) return fromZod(parsed.error);
  const { variants, ...data } = parsed.data;
  let urls: string[] = [];
  try {
    urls = await uploadImages(formData.getAll("images") as File[], 0);
    const slug = await uniqueSlug(slugify(data.name));
    await db.product.create({
      data: {
        ...data,
        slug,
        variants: { create: variants.map(({ id: _id, ...v }) => ({ ...v, priceNpr: v.priceNpr ?? null })) },
        images: { create: urls.map((url, i) => ({ url, alt: data.name, sortOrder: i })) },
      },
    });
  } catch (err) {
    await Promise.all(urls.map(deleteImage));
    if (err instanceof UploadError) return fail(err.message);
    const dup = duplicateMessage(err);
    if (dup) return dup;
    console.error("[admin] create product failed", err);
    return fail("We couldn't create the product. Please try again.");
  }
  refreshCatalog();
  redirect("/admin/products?notice=product-created");
}

export async function updateProduct(productId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getAdminSession())) return DENIED();
  const parsed = parseProductForm(formData);
  if (!parsed.success) return fromZod(parsed.error);
  const { variants, ...data } = parsed.data;
  const removeIds = new Set(formData.getAll("removeImageIds").map(String));
  let newUrls: string[] = [];
  let removedUrls: string[] = [];
  try {
    const current = await db.product.findUnique({ where: { id: productId }, include: { images: true, variants: true } });
    if (!current) return fail("This product no longer exists.");
    const keep = current.images.filter((i) => !removeIds.has(i.id));
    newUrls = await uploadImages(formData.getAll("images") as File[], keep.length);
    removedUrls = current.images.filter((i) => removeIds.has(i.id)).map((i) => i.url);

    await db.$transaction(async (tx) => {
      await tx.product.update({ where: { id: productId }, data });
      if (removeIds.size) await tx.productImage.deleteMany({ where: { productId, id: { in: [...removeIds] } } });
      if (newUrls.length) {
        await tx.productImage.createMany({ data: newUrls.map((url, i) => ({ productId, url, alt: data.name, sortOrder: keep.length + i })) });
      }
      const submittedIds = new Set(variants.map((v) => v.id).filter(Boolean) as string[]);
      const stale = current.variants.filter((v) => !submittedIds.has(v.id)).map((v) => v.id);
      if (stale.length) await tx.productVariant.deleteMany({ where: { id: { in: stale } } });
      for (const v of variants) {
        const vd = { name: v.name, sku: v.sku, stock: v.stock, priceNpr: v.priceNpr ?? null };
        if (v.id && current.variants.some((c) => c.id === v.id)) await tx.productVariant.update({ where: { id: v.id }, data: vd });
        else await tx.productVariant.create({ data: { ...vd, productId } });
      }
    });
  } catch (err) {
    await Promise.all(newUrls.map(deleteImage));
    if (err instanceof UploadError) return fail(err.message);
    const dup = duplicateMessage(err);
    if (dup) return dup;
    console.error("[admin] update product failed", err);
    return fail("We couldn't save the product. Please try again.");
  }
  await Promise.all(removedUrls.map(deleteImage));
  refreshCatalog();
  return succeed("Product saved.");
}

export async function deleteProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getAdminSession())) return DENIED();
  const id = String(formData.get("id") ?? "");
  try {
    const product = await db.product.findUnique({ where: { id }, include: { images: true } });
    if (!product) return fail("This product no longer exists.");
    await db.product.delete({ where: { id } }); // past orders keep their snapshot of the item
    await Promise.all(product.images.map((i) => deleteImage(i.url)));
  } catch (err) {
    console.error("[admin] delete product failed", err);
    return fail("We couldn't delete the product. Please try again.");
  }
  refreshCatalog();
  redirect("/admin/products?notice=product-deleted");
}

export async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getAdminSession())) return DENIED();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await db.category.create({ data: { name: parsed.data.name, slug: slugify(parsed.data.name), description: parsed.data.description ?? null } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return fail("A category with this name already exists.", { name: ["Already exists."] });
    console.error("[admin] create category failed", err);
    return fail("We couldn't create the category.");
  }
  refreshCatalog();
  revalidatePath("/admin/categories");
  return succeed("Category created.");
}

export async function renameCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getAdminSession())) return DENIED();
  const id = String(formData.get("id") ?? "");
  const parsed = categorySchema.safeParse({ name: formData.get("name"), description: formData.get("description") });
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await db.category.update({ where: { id }, data: { name: parsed.data.name, description: parsed.data.description ?? null } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return fail("A category with this name already exists.");
    console.error("[admin] rename category failed", err);
    return fail("We couldn't save the category.");
  }
  refreshCatalog();
  revalidatePath("/admin/categories");
  return succeed("Category saved.");
}

export async function deleteCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getAdminSession())) return DENIED();
  const id = String(formData.get("id") ?? "");
  try {
    const count = await db.product.count({ where: { categoryId: id } });
    if (count > 0) return fail(`This category still has ${count} product(s). Move or delete them first.`);
    await db.category.delete({ where: { id } });
  } catch (err) {
    console.error("[admin] delete category failed", err);
    return fail("We couldn't delete the category.");
  }
  refreshCatalog();
  revalidatePath("/admin/categories");
  return succeed("Category deleted.");
}

const statusSchema = z.object({ orderId: z.string().min(1), status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_COLLECTION", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"]) });

export async function updateOrderStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getAdminSession())) return DENIED();
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid request.");
  try {
    await changeOrderStatus(parsed.data.orderId, parsed.data.status as OrderStatus);
  } catch (err) {
    if (err instanceof OrderError) return fail(err.message);
    console.error("[admin] order status failed", err);
    return fail("We couldn't update the order. Please try again.");
  }
  revalidatePath("/admin", "layout");
  revalidateTag("products");
  return succeed("Order updated.");
}

export async function markPaymentReceived(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getAdminSession())) return DENIED();
  const orderId = String(formData.get("orderId") ?? "");
  try {
    await recordPaymentReceived(orderId);
  } catch (err) {
    if (err instanceof OrderError) return fail(err.message);
    console.error("[admin] payment failed", err);
    return fail("We couldn't record the payment. Please try again.");
  }
  revalidatePath("/admin", "layout");
  return succeed("Payment recorded.");
}

export async function setCustomerStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await getAdminSession();
  if (!admin) return DENIED();
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status") === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
  try {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) return fail("Customer not found.");
    if (user.role === "ADMIN") return fail("Administrator accounts can't be changed here.");
    await db.user.update({ where: { id }, data: { status } });
    if (status === "SUSPENDED") await destroyUserSessions(id);
  } catch (err) {
    console.error("[admin] customer status failed", err);
    return fail("We couldn't update the account.");
  }
  revalidatePath("/admin/customers", "layout");
  return succeed(status === "SUSPENDED" ? "Account suspended." : "Account reactivated.");
}

