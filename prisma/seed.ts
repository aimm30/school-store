import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const CATEGORIES = [
  ["Uniforms & Lab Coats", "uniforms-lab-coats"],
  ["Notebooks & Copies", "notebooks-copies"],
  ["Class Notes", "class-notes"],
  ["Textbooks & Reference", "textbooks-reference"],
  ["Stationery", "stationery"],
  ["Bags & Pencil Cases", "bags-pencil-cases"],
  ["Geometry & Instruments", "geometry-instruments"],
] as const;

async function main() {
  for (const [i, [name, slug]] of CATEGORIES.entries()) {
    await db.category.upsert({ where: { slug }, update: {}, create: { name, slug, sortOrder: i } });
  }

  const email = (process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "";
  if (!email || password.length < 8) {
    console.warn("Skipping admin user: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (min 8 chars) in .env to create one.");
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.upsert({
      where: { email },
      update: { role: "ADMIN", status: "ACTIVE" },
      create: { email, name: process.env.SEED_ADMIN_NAME || "Store Administrator", passwordHash, role: "ADMIN", emailVerifiedAt: new Date() },
    });
    console.log(`Admin user ready: ${email} (existing accounts keep their current password)`);
  }

  if (process.env.SEED_SAMPLE_PRODUCTS === "true") {
    if (process.env.NODE_ENV === "production") throw new Error("Refusing to insert sample products in production.");
    const cat = async (slug: string) => (await db.category.findUniqueOrThrow({ where: { slug } })).id;
    // SAMPLE DATA ONLY: names are generic and PRICES ARE PLACEHOLDERS, not real school prices.
    const samples = [
      { sku: "DEMO-LABCOAT", slug: "laboratory-coat", name: "Laboratory Coat", category: "uniforms-lab-coats", price: 900, description: "Sample listing. Replace with the real product details.", variants: ["S", "M", "L", "XL"] },
      { sku: "DEMO-NB-200", slug: "notebook-200-pages", name: "Notebook (200 pages)", category: "notebooks-copies", price: 120, description: "Sample listing.", stock: 100 },
      { sku: "DEMO-NB-100", slug: "notebook-100-pages", name: "Notebook (100 pages)", category: "notebooks-copies", price: 70, description: "Sample listing.", stock: 100 },
      { sku: "DEMO-PEN-BLUE", slug: "ball-pen-blue", name: "Ball Pen (Blue)", category: "stationery", price: 15, description: "Sample listing.", stock: 300 },
      { sku: "DEMO-PENCIL", slug: "pencil-hb", name: "Pencil HB", category: "stationery", price: 10, description: "Sample listing.", stock: 300 },
      { sku: "DEMO-GEO", slug: "geometry-box", name: "Geometry Box", category: "geometry-instruments", price: 250, description: "Sample listing.", stock: 40 },
      { sku: "DEMO-CASE", slug: "pencil-case", name: "Pencil Case", category: "bags-pencil-cases", price: 180, description: "Sample listing.", stock: 3 },
    ];
    for (const s of samples) {
      await db.product.upsert({
        where: { sku: s.sku },
        update: {},
        create: {
          sku: s.sku, slug: s.slug, name: s.name, description: s.description, priceNpr: s.price, stock: s.stock ?? 0, isFeatured: ["DEMO-LABCOAT", "DEMO-GEO"].includes(s.sku),
          categoryId: await cat(s.category),
          variants: s.variants ? { create: s.variants.map((v) => ({ name: v, sku: `${s.sku}-${v}`, stock: 15 })) } : undefined,
        },
      });
    }
    console.log("Inserted SAMPLE products with placeholder prices.");
  }
}

main().finally(() => db.$disconnect());
