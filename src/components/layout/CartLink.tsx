"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";

export function CartLink({ count }: { count: number }) {
  return (
    <Link href="/cart" className="btn btn-ghost relative px-2 sm:px-3" aria-label={`Shopping cart, ${count} item${count === 1 ? "" : "s"}`}>
      <ShoppingCart className="h-5 w-5" aria-hidden />
      <span className="hidden sm:inline">Cart</span>
      <AnimatePresence mode="popLayout" initial={false}>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-700 px-1 text-[11px] font-semibold text-white sm:static sm:ml-0.5"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
