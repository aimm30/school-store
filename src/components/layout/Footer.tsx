import Link from "next/link";
import { siteConfig } from "@/lib/config";

const col = "space-y-2 text-sm text-slate-600";
export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-semibold text-brand-800">{siteConfig.storeName}</p>
          <p className="mt-2 text-sm text-slate-600">The official online store for {siteConfig.schoolName} students: uniforms, stationery, notebooks and study materials.</p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Shop</h2>
          <ul className={col}>
            <li><Link href="/products" className="hover:text-slate-900">All products</Link></li>
            <li><Link href="/products?sort=newest" className="hover:text-slate-900">New arrivals</Link></li>
            <li><Link href="/cart" className="hover:text-slate-900">Cart</Link></li>
            <li><Link href="/account/orders" className="hover:text-slate-900">My orders</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Help</h2>
          <ul className={col}>
            <li><Link href="/faq" className="hover:text-slate-900">FAQ</Link></li>
            <li><Link href="/shipping" className="hover:text-slate-900">Shipping &amp; delivery</Link></li>
            <li><Link href="/returns" className="hover:text-slate-900">Returns &amp; refunds</Link></li>
            <li><Link href="/contact" className="hover:text-slate-900">Contact us</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Company</h2>
          <ul className={col}>
            <li><Link href="/about" className="hover:text-slate-900">About us</Link></li>
            <li><Link href="/terms" className="hover:text-slate-900">Terms of use</Link></li>
            <li><Link href="/privacy" className="hover:text-slate-900">Privacy policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {siteConfig.storeName}, {siteConfig.schoolName}. All prices are in Nepalese Rupees (NPR).
      </div>
    </footer>
  );
}
