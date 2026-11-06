import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/config";
import { Providers } from "@/components/ui/Providers";
import { FlashToast } from "@/components/ui/FlashToast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: { default: `${siteConfig.storeName} — school supplies for ${siteConfig.schoolName}`, template: `%s | ${siteConfig.storeName}` },
  description: `Order lab coats, notebooks, textbooks, stationery and study materials online from ${siteConfig.schoolName}. Pay on delivery or at school.`,
  openGraph: { type: "website", siteName: siteConfig.storeName, title: siteConfig.storeName, description: `The official online school store of ${siteConfig.schoolName}.`, locale: "en_NP" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1d4a7c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2">
            Skip to content
          </a>
          <Header />
          <main id="main" className="min-h-[60vh]">
            {children}
          </main>
          <Footer />
          <Suspense fallback={null}>
            <FlashToast />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
