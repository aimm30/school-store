import { z } from "zod";

const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+977[- ]?)?9[78]\d{8}$/, "Enter a valid Nepali mobile number, e.g. 98XXXXXXXX.");
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use at most 72 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/\d/, "Include a number.");
const nameSchema = z.string().trim().min(2, "Enter your full name.").max(80);
const studentIdSchema = optional(z.string().trim().regex(/^[A-Za-z0-9-]{3,20}$/, "Use 3–20 letters, numbers or hyphens."));

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    studentId: studentIdSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal("on", { errorMap: () => ({ message: "You must accept the Terms of Use and Privacy Policy." }) }),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or student ID.").max(254),
  password: z.string().min(1, "Enter your password.").max(200),
});

export const resetPasswordSchema = z
  .object({ token: z.string().min(10), password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, "Enter your current password."), password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export const profileSchema = z.object({ name: nameSchema, phone: optional(phoneSchema), studentId: studentIdSchema });

export const addressSchema = z.object({
  recipient: nameSchema,
  phone: phoneSchema,
  line1: z.string().trim().min(3, "Enter the street / tole.").max(200),
  city: z.string().trim().min(2, "Enter the city.").max(80),
  landmark: optional(z.string().trim().max(120)),
});

export const checkoutSchema = z
  .object({
    name: nameSchema,
    phone: phoneSchema,
    email: emailSchema,
    method: z.enum(["COD", "PAY_AT_SCHOOL"], { errorMap: () => ({ message: "Choose a payment option." }) }),
    address: optional(z.string().trim().max(200)),
    city: optional(z.string().trim().max(80)),
    landmark: optional(z.string().trim().max(120)),
    notes: optional(z.string().trim().max(500)),
    idempotencyKey: z.string().min(16).max(64),
  })
  .superRefine((d, ctx) => {
    if (d.method === "COD") {
      if (!d.address) ctx.addIssue({ code: "custom", path: ["address"], message: "Enter a delivery address." });
      if (!d.city) ctx.addIssue({ code: "custom", path: ["city"], message: "Enter the city." });
    }
  });
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Variant name is required.").max(60),
  sku: z.string().trim().regex(/^[A-Za-z0-9._-]{2,40}$/, "Variant SKU: 2–40 letters, numbers, . _ -"),
  stock: z.coerce.number().int().min(0).max(100000),
  priceNpr: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().int().min(1).max(1000000).optional()),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name.").max(120),
  sku: z.string().trim().regex(/^[A-Za-z0-9._-]{2,40}$/, "SKU: 2–40 letters, numbers, . _ -"),
  description: z.string().trim().max(4000),
  categoryId: z.string().min(1, "Choose a category."),
  priceNpr: z.coerce.number({ invalid_type_error: "Enter a price." }).int("Whole rupees only.").min(1, "Price must be at least 1.").max(1000000),
  stock: z.coerce.number({ invalid_type_error: "Enter stock." }).int().min(0, "Stock cannot be negative.").max(100000),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  variants: z.array(variantSchema).max(30),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter a category name.").max(60),
  description: optional(z.string().trim().max(200)),
});
