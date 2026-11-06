# Kanjirowa Student Store

A full-stack e-commerce platform for a school store (Kanjirowa National School), built for the Nepalese market (prices in NPR).

**Stack:** Next.js 14 (App Router) · React · TypeScript · Tailwind CSS · PostgreSQL · Prisma · Framer Motion · Lucide icons · Zod · bcrypt

## Status: read this first

This code was written without the ability to install dependencies, start a database, or run a browser. It passed a TypeScript **syntax** check, but it has **not** been compiled, type-checked, linted, run, or tested end to end. Expect to fix a few type or runtime errors on first run. Work through the checklist in "Verifying the build" and report anything that fails.

Other limits:

- **No generated migration.** Run `npm run db:migrate -- --name init` once to generate `prisma/migrations` from `schema.prisma`, then commit it.
- **Rate limiting is in-memory** (one server instance). For several instances or serverless, replace `src/lib/rate-limit.ts` with a Redis-backed version (same function signature).
- **Email** needs SMTP configured. Without it, verification/reset links are printed to the server log in development only, and no email is sent in production.
- **Online payments (eSewa/Khalti) are not implemented.** Only Cash on Delivery and Pay at School exist. `src/lib/payments/index.ts` documents how to add real gateways. Orders become "paid" only when an admin records that money was received.
- **Legal and contact pages are templates.** Anything the school must supply appears as a highlighted "[School to confirm: …]" marker. Nothing about the school's address, phone, policies or legal compliance is invented. Get them legally reviewed.
- **No Content-Security-Policy header** is set; add one for your hosting setup.
- Signup reveals whether an email is already registered (a deliberate usability trade-off). Login and password reset do not.

## Features

Storefront: homepage, searchable/sortable/paginated catalog, product pages with options (e.g. sizes), related products, SEO metadata, sitemap and robots.
Cart: server-side cart for visitors (cookie) and accounts (merged on login), stock checks, server-side prices.
Checkout: guest or signed-in; Cash on Delivery and Pay at School; atomic stock decrement in a transaction; duplicate-submission protection (idempotency key); confirmation page.
Accounts: signup/login (email or student ID), remember-me, password reset, email verification, profile, saved delivery info, order history and tracking, password change (signs out other devices).
Admin (`/admin`, role-protected on the server): dashboard analytics, products (images, options, stock, featured), categories, orders (status workflow, record payment), customers (view, suspend).

## Requirements

- Node.js 18.18+ (20 LTS recommended)
- PostgreSQL 14+

## Setup

```bash
npm install
cp .env.example .env        # then edit .env
```

Set at least `DATABASE_URL` and `APP_URL`. Pick a strong `SEED_ADMIN_PASSWORD` of your own.

```bash
npm run db:migrate -- --name init   # creates tables + the first migration
npm run db:seed                     # categories + admin user (+ sample products if SEED_SAMPLE_PRODUCTS=true)
npm run dev                         # http://localhost:3000
```

Sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, open the account menu → Admin dashboard, and add real products. Sample products use placeholder prices, so never enable them in production.

## Configuration (.env)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `APP_URL` | Public site URL (used in emails, sitemap, metadata) |
| `STORE_NAME`, `SCHOOL_NAME`, `ORDER_PREFIX` | Branding and order-number prefix |
| `CONTACT_EMAIL`, `CONTACT_PHONE`, `SCHOOL_ADDRESS`, `STORE_HOURS`, `PRIVACY_CONTACT_EMAIL` | Shown on contact/legal pages when set |
| `DELIVERY_FEE_NPR` | Flat delivery fee for Cash on Delivery orders (default 0) |
| `LOW_STOCK_THRESHOLD` | Low-stock warning level (default 5) |
| `STORAGE_DRIVER` | `local` (default) or `s3` |
| `UPLOAD_DIR` | Local image folder (default `./uploads`) |
| `S3_*` | Bucket, region, endpoint, keys and public URL for S3-compatible storage |
| `SMTP_*`, `MAIL_FROM` | Email delivery |
| `TEST_DATABASE_URL` | Disposable database for integration tests |

## External services you must configure

1. **PostgreSQL**: any host (Neon, Supabase, Railway, a VPS…). Get the connection string from the provider.
2. **Image storage**: local disk works on a single server with persistent storage. For serverless or multi-server hosting use an S3-compatible bucket (AWS S3, Cloudflare R2, Backblaze B2…) and set the `S3_*` variables from that provider's console. The bucket must allow public reads of objects.
3. **SMTP provider** (Brevo, Mailgun, Amazon SES, Gmail SMTP, …) for verification and reset emails.

## Testing

```bash
npm run typecheck
npm run lint
npm test
```

- Unit tests (no database): pricing, validation, status workflow, order numbers, upload detection, rate limiting.
- Authorization tests (no database): every admin server action refuses anonymous and customer callers.
- Integration tests (need `TEST_DATABASE_URL`, skipped otherwise): order creation, server-side pricing, stock limits, concurrent orders for the last item, idempotency, variants, cancellation restoring stock, and payment recording.

```bash
createdb school_store_test
TEST_DATABASE_URL="postgresql://…/school_store_test" npx prisma migrate deploy   # DATABASE_URL must point at it too for this command
npm test
```

### Verifying the build (manual journeys)

Run these in a browser after setup and record the results.

1. **Visitor purchase:** open home → search "lab coat" → open product → choose a size → add to cart → check out with Pay at School → see confirmation and order number.
2. **New user:** sign up → sign in → edit profile → save delivery info → place an order → see it under My orders.
3. **Admin:** sign in as admin → create a product (with image) → change its price and stock → open an order → Confirm → Processing → Ready → record payment → Completed. Dashboard revenue should update.
4. **Bad login:** wrong password shows "Incorrect email/student ID or password."
5. **Unauthorized admin:** signed out, `/admin` redirects to sign-in; signed in as a customer it shows "Access denied".
6. **Over-ordering:** set a product's stock to 1, try adding 2, and try two browsers racing for the last item. Only one succeeds.
7. Resize to phone width: no horizontal scroll, menus and forms usable; enable "reduce motion" in your OS and confirm animations calm down.

## Production deployment

1. Provision PostgreSQL, storage and SMTP; set all environment variables on the host (never commit `.env`).
2. `npm ci && npm run build`
3. `npm run db:deploy` to apply migrations; run `npm run db:seed` once (without sample products) to create categories and the admin.
4. `npm start` behind HTTPS (cookies are `Secure` in production). Works on any Node host (VPS with a reverse proxy, Railway, Render, Fly.io, or Vercel with S3 storage).
5. Put the app behind a proxy that sets `X-Forwarded-For` so rate limiting sees client IPs.
6. Fill in the contact/legal placeholders and have the policies reviewed.
7. Back up the database regularly.

## Project layout

```
prisma/            schema + seed
src/app/           routes (storefront, auth, account, admin, legal)
src/components/    UI, layout, product, cart, checkout, admin components
src/lib/           config, db, auth/session, cart, catalog, orders, payments, storage, validation
tests/             unit + integration tests
```

Security notes: passwords hashed with bcrypt (cost 12); sessions are random tokens stored hashed in the database in httpOnly, SameSite=Lax cookies; Next.js server actions apply Origin checks for CSRF; every admin action re-checks the role on the server; uploads are validated by magic bytes and size and served with `nosniff`; all inputs validated with Zod; Prisma parameterizes queries; React escapes output.
