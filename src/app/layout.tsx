/** @format */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FailStack",
  description:
    "Learn from real-world software failures through structured incident analysis",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#080d16] text-white antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Navbar />

          <main className="flex-1">{children}</main>

          <Footer />
        </div>

        <Toaster
          position="top-right"
          theme="dark"
          expand={false}
          toastOptions={{
            classNames: {
              toast: "border border-[#c6e47c]/40 bg-[#0c151c] text-[#f1f1e9]",
              title:
                "font-mono text-[12px] font-medium uppercase tracking-[0.06em] text-[#d5e8a5]",
              description: "text-slate-400",
              icon: "border-[#c6e47c]/60 bg-[#c6e47c]/20 text-[#c6e47c]",
            },
          }}
        />
      </body>
    </html>
  );
}
