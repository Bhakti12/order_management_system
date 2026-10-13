import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlavorCraft - Real-Time Food Delivery & Order Tracking",
  description:
    "Production-grade order management platform with real-time SSE order tracking, strict price validation, and responsive mobile-first UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-gray-50/50 font-sans text-gray-900 antialiased`}
      >
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex-1">{children}</div>
            <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
              <div className="mx-auto max-w-7xl px-4">
                <p>© {new Date().getFullYear()} FlavorCraft. Order Management System. Built with Next.js & TypeScript.</p>
              </div>
            </footer>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
