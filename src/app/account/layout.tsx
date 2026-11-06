import Link from "next/link";
import { requireUser } from "@/lib/auth/session";

const links = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/settings", label: "Settings" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/account");
  return (
    <div className="container-page py-8">
      <nav aria-label="Account" className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900">
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
