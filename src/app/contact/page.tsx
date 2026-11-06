import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { LegalPage, Confirm } from "@/components/legal/LegalPage";
import { siteConfig as c } from "@/lib/config";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  const rows = [
    { Icon: Mail, label: "Email", value: c.contactEmail, href: c.contactEmail ? `mailto:${c.contactEmail}` : "" },
    { Icon: Phone, label: "Phone", value: c.contactPhone, href: c.contactPhone ? `tel:${c.contactPhone.replace(/\s/g, "")}` : "" },
    { Icon: MapPin, label: "Address", value: c.schoolAddress, href: "" },
    { Icon: Clock, label: "Store hours", value: c.storeHours, href: "" },
  ];
  return (
    <LegalPage title="Contact Us" intro={`Questions about an order or the store? Reach the ${c.schoolName} school store.`} template={false}>
      <ul className="!list-none !pl-0 space-y-4">
        {rows.map(({ Icon, label, value, href }) => (
          <li key={label} className="card flex items-start gap-3 p-4">
            <Icon className="mt-0.5 h-5 w-5 text-brand-700" aria-hidden />
            <div>
              <p className="font-medium text-slate-900">{label}</p>
              <p>{value ? (href ? <a className="link" href={href}>{value}</a> : value) : <Confirm>{label.toLowerCase()}</Confirm>}</p>
            </div>
          </li>
        ))}
      </ul>
      <p>Please include your order number when you contact us about an order.</p>
    </LegalPage>
  );
}
