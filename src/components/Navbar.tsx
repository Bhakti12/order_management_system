"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { UtensilsCrossed, ShoppingBag, Clock } from "lucide-react";

export function Navbar() {
  const { itemCount, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition group-hover:bg-emerald-700">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-gray-900">FlavorCraft</span>
            <span className="block text-[11px] font-medium text-emerald-600 -mt-1">
              Order Management
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="hidden sm:inline">Order History</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open shopping cart with ${itemCount} items`}
            className="relative flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600 active:scale-95"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Cart</span>
            {itemCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
