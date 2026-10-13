"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MenuItem } from "@/types";
import { formatPrice } from "@/lib/format";
import { Plus, Check } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart?: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const [addedRecently, setAddedRecently] = useState(false);

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(item);
    }
    setAddedRecently(true);
    setTimeout(() => setAddedRecently(false), 1200);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-48 w-full bg-gray-100">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition duration-300 hover:scale-105"
        />
        <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold capitalize text-gray-800 shadow-sm backdrop-blur-sm">
          {item.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.description}</p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <span className="text-xs text-gray-400">Price</span>
            <p className="text-lg font-extrabold text-emerald-600">{formatPrice(item.price)}</p>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              addedRecently
                ? "bg-emerald-600 text-white"
                : "bg-gray-900 text-white hover:bg-emerald-600 active:scale-95"
            }`}
          >
            {addedRecently ? (
              <>
                <Check className="h-4 w-4" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
