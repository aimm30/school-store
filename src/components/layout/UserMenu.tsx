"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LayoutDashboard, LogOut, Package, Settings, User } from "lucide-react";
import { logout } from "@/lib/auth/actions";

export function UserMenu({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50";
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className="btn btn-ghost px-2 sm:px-3">
        <User className="h-5 w-5" aria-hidden />
        <span className="hidden max-w-[8rem] truncate sm:inline">{name.split(" ")[0]}</span>
        <ChevronDown className="hidden h-4 w-4 sm:block" aria-hidden />
        <span className="sr-only sm:hidden">Account menu</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-40 mt-1 w-52 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          >
            {isAdmin && (
              <Link role="menuitem" href="/admin" className={item} onClick={() => setOpen(false)}>
                <LayoutDashboard className="h-4 w-4" aria-hidden /> Admin dashboard
              </Link>
            )}
            <Link role="menuitem" href="/account" className={item} onClick={() => setOpen(false)}>
              <User className="h-4 w-4" aria-hidden /> My profile
            </Link>
            <Link role="menuitem" href="/account/orders" className={item} onClick={() => setOpen(false)}>
              <Package className="h-4 w-4" aria-hidden /> My orders
            </Link>
            <Link role="menuitem" href="/account/settings" className={item} onClick={() => setOpen(false)}>
              <Settings className="h-4 w-4" aria-hidden /> Settings
            </Link>
            <form action={logout} className="border-t border-slate-100">
              <button type="submit" role="menuitem" className={item}>
                <LogOut className="h-4 w-4" aria-hidden /> Sign out
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
