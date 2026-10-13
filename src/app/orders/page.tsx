"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Order } from "@/types";
import { formatPrice, formatDate } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/config/statusTiming";
import { Clock, ShoppingBag, ArrowRight, Loader2, Utensils } from "lucide-react";

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const json = await res.json();
          setOrders(json.data || []);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const getStatusBadgeClass = (status: Order["status"]) => {
    switch (status) {
      case "received":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "preparing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "out_for_delivery":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">Order History</h1>
          <p className="mt-1 text-sm text-gray-500">Track and view all placed orders</p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"
        >
          <Utensils className="h-4 w-4" />
          <span>Order Food</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-base font-bold text-gray-800">No orders placed yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Explore our menu and place your first food delivery order!
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <span>Explore Menu</span>
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="group flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-emerald-300 hover:shadow-md sm:flex-row sm:items-center"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">{order.id}</span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${getStatusBadgeClass(
                      order.status
                    )}`}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500">
                  <span>Customer: {order.customer.name}</span>
                  <span>·</span>
                  <span>
                    {order.items.reduce((sum, i) => sum + i.quantity, 0)} items (
                    {order.items.map((i) => i.name).join(", ")})
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-3 sm:border-t-0 sm:pt-0">
                <span className="text-base font-black text-emerald-600">
                  {formatPrice(order.total)}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
