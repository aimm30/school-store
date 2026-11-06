import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { LegalPage, Confirm } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Frequently Asked Questions" };

const faqs: [string, React.ReactNode][] = [
  ["Do I need an account to order?", "No. You can check out as a guest. An account lets you track orders, save delivery details and see your order history."],
  ["How do I pay?", "Choose Cash on Delivery or Pay at School at checkout. Online payment is not available yet."],
  ["When is my order marked as paid?", "Only after the store has actually received your payment."],
  ["How do I collect an order at school?", <>Choose “Pay at School” at checkout. We'll update your order status when it's ready. <Confirm>collection location and hours</Confirm></>],
  ["Can I change or cancel my order?", <>Contact the school store as soon as possible. Orders that haven't been processed can usually be cancelled. <Confirm>cancellation rules</Confirm></>],
  ["What if an item is out of stock?", "Out-of-stock items can't be added to the cart. If stock runs out while you shop, the cart will tell you before you check out."],
  ["I forgot my password.", "Use “Forgot password?” on the sign-in page to receive a reset link by email."],
  ["How do I return an item?", "See the Return and Refund Policy, then contact the school store with your order number."],
];

export default function FaqPage() {
  return (
    <LegalPage title="Frequently Asked Questions" template={false}>
      <div className="space-y-3">
        {faqs.map(([q, a]) => (
          <details key={q} className="card group p-4">
            <summary className="flex min-h-[32px] cursor-pointer list-none items-center justify-between gap-3 font-medium text-slate-900">
              {q}
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="mt-2">{a}</p>
          </details>
        ))}
      </div>
    </LegalPage>
  );
}
