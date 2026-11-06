import type { Metadata } from "next";
import { LegalPage, Confirm, Detail } from "@/components/legal/LegalPage";
import { siteConfig as c } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy Policy", description: `How ${c.storeName} collects and uses personal information.` };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" intro={`How ${c.storeName} (${c.schoolName}) handles your personal information.`}>
      <section><h2>1. What we collect</h2>
        <ul>
          <li>Account details: full name, email address, optional mobile number and student ID, and a password (stored only as a salted hash).</li>
          <li>Order details: items ordered, delivery address or collection preference, contact number, order notes and payment method chosen.</li>
          <li>Technical data needed to run the site: a session cookie while you are signed in, a cart cookie, and server logs.</li>
        </ul></section>
      <section><h2>2. Why we collect it</h2><p>To create and secure your account, process and deliver orders, contact you about your order, prevent fraud and abuse, and keep the store running. We do not use your data for advertising.</p></section>
      <section><h2>3. How it is used and shared</h2>
        <p>Information is used only by school store staff who handle orders. It may be processed by service providers that host the website, database, image storage and email delivery for the store: <Confirm>list the actual hosting, database, storage and email providers used</Confirm>. We do not sell personal information. Payment gateways (such as eSewa or Khalti) are not currently integrated; if added, this policy must be updated.</p></section>
      <section><h2>4. Storage and protection</h2><p>Passwords are hashed, sessions use secure cookies, administrator access is restricted by role, and access to customer data is limited to authorised staff. No system is perfectly secure, so we cannot guarantee absolute security.</p></section>
      <section><h2>5. Cookies</h2><p>We use only essential cookies: one keeps you signed in and one remembers your cart. We do not use advertising or analytics cookies. <Confirm>update if analytics are added later</Confirm></p></section>
      <section><h2>6. Retention</h2><p>Account and order records are kept for <Confirm>retention period decided by the school</Confirm>. Records may be kept longer where needed for accounting or legal reasons.</p></section>
      <section><h2>7. Your rights</h2><p>You can view and edit your profile and saved delivery information in your account at any time. To request a copy, correction or deletion of your information, contact us using the details below. <Confirm>legal review of the rights available under applicable Nepali law</Confirm></p></section>
      <section><h2>8. Students under 18</h2><p><Confirm>school policy on accounts for students under 18 and parent/guardian consent</Confirm></p></section>
      <section><h2>9. Contact for privacy questions</h2><p>Email: <Detail value={c.privacyEmail} label="privacy contact email" /></p></section>
      <section><h2>10. Changes</h2><p>We may update this policy; the latest version is always on this page. <Confirm>effective date</Confirm></p></section>
    </LegalPage>
  );
}
