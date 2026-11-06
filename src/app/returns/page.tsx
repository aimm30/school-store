import type { Metadata } from "next";
import { LegalPage, Confirm } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Return and Refund Policy" };

export default function ReturnsPage() {
  return (
    <LegalPage title="Return and Refund Policy" intro="What to do if something is wrong with your order.">
      <section><h2>Eligibility</h2><p>Items that are damaged, defective or not what you ordered may be eligible for return or exchange. <Confirm>return window (days) and condition requirements, e.g. unworn uniform items, unused stationery</Confirm></p></section>
      <section><h2>Items that cannot be returned</h2><p><Confirm>e.g. marked notebooks, class notes, opened items, custom orders</Confirm></p></section>
      <section><h2>How to request a return</h2><p>Contact the school store with your order number. <Confirm>where to bring returns and who handles them</Confirm></p></section>
      <section><h2>Refunds</h2><p>Approved refunds are made using <Confirm>refund method and timeline decided by the school</Confirm>. Cancelled orders that have not been paid need no refund.</p></section>
    </LegalPage>
  );
}
