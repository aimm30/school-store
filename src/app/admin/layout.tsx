import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser("/admin");
  // Enforced on the server for every admin page render; server actions re-check independently.
  if (session.user.role !== "ADMIN") {
    return (
      <div className="container-page py-24 text-center" role="alert">
        <ShieldAlert className="mx-auto h-10 w-10 text-red-500" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold">Access denied</h1>
        <p className="mt-2 text-slate-600">You don't have permission to view the administrator area.</p>
        <Link href="/" className="btn btn-primary mt-6">Back to the store</Link>
      </div>
    );
  }
  return (
    <div className="container-page py-6">
      <nav aria-label="Admin" className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">{l.label}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
