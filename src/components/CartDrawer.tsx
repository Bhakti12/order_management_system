"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { CheckoutForm } from "./CheckoutForm";
import { CustomerInput } from "@/lib/validation/order";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    total,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handlePlaceOrder = async (customer: CustomerInput) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        customer,
        items: items.map((i) => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setApiError(json.error?.message || "Failed to create order. Please check inputs.");
        setIsSubmitting(false);
        return;
      }

      const createdOrder = json.data;
      clearCart();
      setIsCartOpen(false);
      setIsCheckingOut(false);
      router.push(`/orders/${createdOrder.id}`);
    } catch {
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="flex w-screen max-w-md flex-col bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              {isCheckingOut ? (
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="flex items-center gap-1 rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-xs font-semibold">Back to cart</span>
                </button>
              ) : (
                <>
                  <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    {items.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-800">Your cart is empty</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add some delicious items from the menu to start your order.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Browse Menu
                </button>
              </div>
            ) : isCheckingOut ? (
              <div>
                <h3 className="mb-4 text-base font-bold text-gray-900">Delivery Details</h3>
                <CheckoutForm
                  onSubmit={handlePlaceOrder}
                  isSubmitting={isSubmitting}
                  apiError={apiError}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.menuItem.id}
                    className="flex items-center gap-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 p-3"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-200">
                      <Image
                        src={item.menuItem.image}
                        alt={item.menuItem.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="truncate text-sm font-bold text-gray-900">
                        {item.menuItem.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatPrice(item.menuItem.price)} each
                      </p>

                      {/* Quantity Controls */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-gray-200 bg-white shadow-xs">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.menuItem.id, item.quantity - 1)
                            }
                            aria-label={`Decrease quantity of ${item.menuItem.name}`}
                            className="p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.menuItem.id, item.quantity + 1)
                            }
                            disabled={item.quantity >= 20}
                            aria-label={`Increase quantity of ${item.menuItem.name}`}
                            className="p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-emerald-600">
                          {formatPrice(item.menuItem.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.menuItem.id)}
                      aria-label={`Remove ${item.menuItem.name}`}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer (when not empty) */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/50 p-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-extrabold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {!isCheckingOut && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(true)}
                    className="flex-1 rounded-xl bg-emerald-600 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
