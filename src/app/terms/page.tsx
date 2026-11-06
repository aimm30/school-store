import type { Metadata } from "next";
import { LegalPage, Confirm } from "@/components/legal/LegalPage";
import { siteConfig as c } from "@/lib/config";

export const metadata: Metadata = { title: "Terms of Use", description: `Terms for using ${c.storeName}.` };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" intro={`The rules for using ${c.storeName}, the online store of ${c.schoolName}.`}>
      <section><h2>1. Accounts</h2><p>You are responsible for the accuracy of your account information and for keeping your password confidential. Tell us promptly if you suspect unauthorised use. We may suspend accounts that breach these terms.</p></section>
      <section><h2>2. Acceptable use</h2><p>Do not misuse the site: no attempts to gain unauthorised access, interfere with its operation, submit false orders, or use automated tools to scrape or overload it.</p></section>
      <section><h2>3. Product information and pricing</h2><p>We aim to keep descriptions, photos, stock and prices accurate. Prices are in Nepalese Rupees (NPR). Prices and availability are confirmed by the store when an order is placed and may change without notice. We may correct errors and cancel affected orders.</p></section>
      <section><h2>4. Orders</h2><p>Placing an order is an offer to buy. An order is accepted when the store confirms it. We may decline or cancel an order, for example if an item is unavailable. Stock is reserved when you place an order.</p></section>
      <section><h2>5. Payments</h2><p>Currently available: Cash on Delivery and Pay at School / collection. An order is recorded as paid only when the store has actually received your payment. <Confirm>payment deadlines for school collection orders</Confirm></p></section>
      <section><h2>6. Cancellations</h2><p>You can ask to cancel an order before it is processed by contacting the store. <Confirm>cancellation window and procedure</Confirm></p></section>
      <section><h2>7. Returns and refunds</h2><p>See the Return and Refund Policy.</p></section>
      <section><h2>8. Intellectual property</h2><p>Site content, branding and design belong to {c.storeName} / {c.schoolName} or their licensors and may not be copied without permission. <Confirm>ownership of the school name and logo</Confirm></p></section>
      <section><h2>9. Limitation of liability</h2><p><Confirm>liability wording to be drafted by a legal adviser</Confirm></p></section>
      <section><h2>10. Changes to these terms</h2><p>We may update these terms. Continued use of the store after changes means you accept them. <Confirm>effective date and governing law</Confirm></p></section>
    </LegalPage>
  );
}
