import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Confirm } from "@/components/legal/LegalPage";
import { siteConfig as c } from "@/lib/config";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <LegalPage title={`About ${c.storeName}`} template={false}>
      <section><p>{c.storeName} is the online school store of {c.schoolName}. It lets students and parents order lab coats, notebooks, textbooks, stationery and study materials, and choose to pay on delivery or collect and pay at school.</p></section>
      <section><h2>What we sell</h2><ul><li>Laboratory coats and uniform items</li><li>Notebooks, copies, homework and class notes</li><li>Textbooks and reference books</li><li>Pens, pencils, geometry boxes, pencil cases and other supplies</li></ul></section>
      <section><h2>About the school</h2><p><Confirm>a short description of {c.schoolName} and the school store, written by the school</Confirm></p></section>
      <p><Link href="/products" className="link">Browse the store</Link> or <Link href="/contact" className="link">contact us</Link>.</p>
    </LegalPage>
  );
}
