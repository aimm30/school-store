import Link from "next/link";
import { ArrowRight, Banknote, PackageCheck, School } from "lucide-react";
import { getCategories, getHomeData } from "@/lib/catalog";
import { siteConfig } from "@/lib/config";
import { ProductGrid } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/PageHeader";

function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        {href && (
          <Link href={href} className="link inline-flex items-center gap-1 text-sm">
            View all <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function HomePage() {
  const [home, categories] = await Promise.all([getHomeData(), getCategories()]);
  const empty = !home.newest.length;
  return (
    <div className="container-page pb-4">
      <section className="mt-6 grid gap-6 overflow-hidden rounded-xl bg-brand-900 px-6 py-10 text-white sm:px-10 sm:py-14 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="text-sm font-medium text-brand-200">{siteConfig.schoolName}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">Everything for the school year, in one place.</h1>
          <p className="mt-3 max-w-xl text-brand-100">Lab coats, notebooks, textbooks, stationery and study materials. Order online and pay on delivery or when you collect at school.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products" className="btn bg-white text-brand-900 hover:bg-brand-50">
              Shop all products
            </Link>
            <Link href="/about" className="btn border border-white/30 text-white hover:bg-white/10">
              About the store
            </Link>
          </div>
        </div>
        <ul className="space-y-3 text-sm lg:col-span-2 lg:self-center">
          {[
            [PackageCheck, "Live stock", "Availability is checked at every step."],
            [Banknote, "Pay when it arrives", "Cash on delivery, or pay at school."],
            [School, "Collect at school", "Pick up your order from the school store."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof PackageCheck;
            return (
              <li key={t as string} className="flex gap-3 rounded-lg bg-white/10 p-3">
                <I className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" aria-hidden />
                <span>
                  <span className="block font-medium">{t as string}</span>
                  <span className="text-brand-100">{d as string}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {categories.length > 0 && (
        <Section title="Popular categories">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/products?category=${c.slug}`} className="card flex h-full flex-col justify-between p-4 transition hover:border-brand-300 hover:shadow-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-brand-700">
                    Browse <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {empty ? (
        <div className="mt-12">
          <EmptyState icon={<PackageCheck className="h-10 w-10" aria-hidden />} title="Products are coming soon" description="The store is being stocked. Please check back shortly." />
        </div>
      ) : (
        <>
          {home.featured.length > 0 && (
            <Section title="Featured products" href="/products">
              <ProductGrid items={home.featured} />
            </Section>
          )}
          <Section title="New arrivals" href="/products?sort=newest">
            <ProductGrid items={home.newest} />
          </Section>
          {home.best.length > 0 && (
            <Section title="Best sellers" href="/products?sort=popular">
              <ProductGrid items={home.best} />
            </Section>
          )}
        </>
      )}

      <section className="mt-12 flex flex-col items-start justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Order online, collect at school</h2>
          <p className="mt-1 text-sm text-brand-800">Choose “Pay at School” at checkout and we'll have your order ready for collection.</p>
        </div>
        <Link href="/shipping" className="btn btn-primary shrink-0">
          How delivery works
        </Link>
      </section>

      <section className="mt-12 grid gap-6 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">About the store</h2>
          <p className="mt-2 text-sm text-slate-600">{siteConfig.storeName} is the online school store of {siteConfig.schoolName}, making it easier for students and parents to get the things school requires.</p>
          <Link href="/about" className="link mt-3 inline-block text-sm">Learn more</Link>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Need help?</h2>
          <p className="mt-2 text-sm text-slate-600">Read our FAQ for ordering, delivery and returns, or get in touch with the school store.</p>
          <div className="mt-3 flex gap-4 text-sm">
            <Link href="/faq" className="link">FAQ</Link>
            <Link href="/contact" className="link">Contact us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
