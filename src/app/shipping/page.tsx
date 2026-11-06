import type { Metadata } from "next";
import { LegalPage, Confirm } from "@/components/legal/LegalPage";
import { siteConfig as c } from "@/lib/config";
import { formatNpr } from "@/lib/money";

export const metadata: Metadata = { title: "Shipping and Delivery Policy" };

export default function ShippingPage() {
  return (
    <LegalPage title="Shipping and Delivery Policy" intro="How your order gets to you.">
      <section><h2>Options</h2>
        <ul>
          <li><strong>Cash on Delivery:</strong> we deliver to your address and you pay in cash on receipt. <Confirm>delivery areas covered</Confirm></li>
          <li><strong>Pay at School / collection:</strong> collect your order from the school store and pay there. <Confirm>collection location and hours</Confirm></li>
        </ul></section>
      <section><h2>Delivery fee</h2><p>{c.deliveryFee ? `Delivery orders are charged ${formatNpr(c.deliveryFee)}.` : "Delivery is currently free."} School collection has no delivery fee.</p></section>
      <section><h2>Timing</h2><p><Confirm>expected processing and delivery times</Confirm> You can follow your order status in your account, and guests can use the link on the order confirmation page.</p></section>
      <section><h2>Failed deliveries</h2><p><Confirm>what happens if nobody is available to receive the order</Confirm></p></section>
    </LegalPage>
  );
}
