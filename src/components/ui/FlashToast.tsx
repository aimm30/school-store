"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./Toast";

const MESSAGES: Record<string, string> = {
  "signed-in": "Signed in successfully.",
  "signed-out": "You have been signed out.",
  welcome: "Welcome! Your account has been created.",
  "password-reset": "Password updated. You can now sign in.",
  "email-verified": "Your email address is verified.",
  "product-created": "Product created.",
  "product-deleted": "Product deleted.",
};

/** Shows a one-time toast for `?notice=...` and then removes the parameter from the URL. */
export function FlashToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const notice = params.get("notice");

  useEffect(() => {
    if (!notice || !MESSAGES[notice]) return;
    toast(MESSAGES[notice]);
    const next = new URLSearchParams(params.toString());
    next.delete("notice");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice]);

  return null;
}
