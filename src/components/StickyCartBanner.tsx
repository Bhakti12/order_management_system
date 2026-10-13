"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { ArrowRight } from "lucide-react";

export function StickyCartBanner() {
  const { itemCount, total, setIsCartOpen } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 left-4 z-30 sm:hidden">
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl bg-gray-900 px-5 py-3.5 font-bold text-white shadow-xl transition active:scale-98"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-xs font-black text-white">
            {itemCount}
          </div>
          <span className="text-sm">View Cart</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-emerald-400">{formatPrice(total)}</span>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>
      </button>
    </div>
  );
}
