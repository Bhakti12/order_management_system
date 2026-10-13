"use client";

import React, { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import { Order } from "@/types";
import { OrderStatusStepper } from "@/components/OrderStatusStepper";
import { formatPrice, formatDate } from "@/lib/format";
import { FORWARD_STATUS_FLOW, canCancelOrder } from "@/lib/config/statusTiming";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  AlertTriangle,
  Radio,
  FastForward,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface OrderTrackingPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const { id } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<"sse" | "polling">("sse");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load initial order & establish real-time SSE with polling fallback
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let isSubscribed = true;

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error?.message || "Order not found");
          setLoading(false);
          return;
        }
        if (isSubscribed) {
          setOrder(json.data);
          setLoading(false);
        }
      } catch {
        if (isSubscribed) {
          setError("Failed to fetch order details. Please retry.");
          setLoading(false);
        }
      }
    }

    fetchOrder();

    // Setup SSE
    if (typeof window !== "undefined" && "EventSource" in window) {
      try {
        eventSource = new EventSource(`/api/orders/${id}/stream`);

        eventSource.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const updated = JSON.parse(event.data);
            setOrder(updated);
            setConnectionMode("sse");

            if (updated.status === "delivered" || updated.status === "cancelled") {
              eventSource?.close();
            }
          } catch {
            // Ignore parse error
          }
        };

        eventSource.onerror = () => {
          // SSE failed or closed, fall back to polling
          eventSource?.close();
          if (isSubscribed) {
            setConnectionMode("polling");
            startPolling();
          }
        };
      } catch {
        setConnectionMode("polling");
        startPolling();
      }
    } else {
      setConnectionMode("polling");
      startPolling();
    }

    function startPolling() {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(async () => {
        if (!isSubscribed) return;
        try {
          const res = await fetch(`/api/orders/${id}`);
          if (res.ok) {
            const json = await res.json();
            setOrder(json.data);
            if (json.data.status === "delivered" || json.data.status === "cancelled") {
              if (pollInterval) clearInterval(pollInterval);
            }
          }
        } catch {
          // Ignore network glitch during poll
        }
      }, 3000);
    }

    return () => {
      isSubscribed = false;
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id]);

  // Cancel order action
  const handleCancelOrder = async () => {
    if (!order) return;
    setActionError(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (!res.ok) {
          setActionError(json.error?.message || "Failed to cancel order.");
          return;
        }
        setOrder(json.data);
      } catch {
        setActionError("Network error while trying to cancel order.");
      }
    });
  };

  // Demo / Admin manual advance action
  const handleAdvanceStatus = async () => {
    if (!order) return;
    setActionError(null);

    const currentIndex = FORWARD_STATUS_FLOW.indexOf(order.status);
    if (currentIndex === -1 || currentIndex >= FORWARD_STATUS_FLOW.length - 1) {
      return;
    }

    const nextStatus = FORWARD_STATUS_FLOW[currentIndex + 1];

    startTransition(async () => {
      try {
        const res = await fetch(`/api/orders/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        const json = await res.json();
        if (!res.ok) {
          setActionError(json.error?.message || "Failed to advance status.");
          return;
        }
        setOrder(json.data);
      } catch {
        setActionError("Network error while advancing order status.");
      }
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="mt-4 text-sm font-semibold text-gray-500">Loading order status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">Order Not Found</h2>
        <p className="mt-2 text-sm text-gray-500">{error || "We could not locate this order."}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Menu</span>
        </Link>
      </div>
    );
  }

  const cancellable = canCancelOrder(order.status);
  const nextTargetIndex = FORWARD_STATUS_FLOW.indexOf(order.status) + 1;
  const canAdvance =
    order.status !== "cancelled" && nextTargetIndex < FORWARD_STATUS_FLOW.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Live indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Menu</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
            <span className="capitalize">Live Status ({connectionMode.toUpperCase()})</span>
          </span>
        </div>
      </div>

      {actionError && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Order Card */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-6 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                Order Tracking
              </span>
              <h1 className="mt-0.5 text-2xl font-black text-gray-900 sm:text-3xl">
                {order.id}
              </h1>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>Placed: {formatDate(order.createdAt)}</span>
            </div>
          </div>

          {/* Real-time Stepper */}
          <div className="mt-8">
            <OrderStatusStepper status={order.status} />
          </div>
        </div>

        {/* Content Details */}
        <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {/* Order Items List (2 cols) */}
          <div className="p-6 sm:p-8 lg:col-span-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-gray-500" />
              <h3 className="text-base font-bold text-gray-900">Ordered Items</h3>
            </div>

            <div className="mt-4 divide-y divide-gray-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3.5">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">{item.name}</h4>
                    <p className="text-xs text-gray-400">
                      Qty: {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-gray-900">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-base font-black text-gray-900">
                <span>Total Amount</span>
                <span className="text-xl text-emerald-600">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Cancel Button */}
            {cancellable && (
              <div className="mt-8 rounded-2xl border border-red-100 bg-red-50/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-red-900">Need to cancel?</h4>
                    <p className="text-xs text-red-700">
                      Cancellation is permitted before your order is dispatched for delivery.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={isPending}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Cancel Order</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Customer & Delivery Details (1 col) */}
          <div className="bg-gray-50/50 p-6 sm:p-8">
            <h3 className="text-base font-bold text-gray-900">Delivery Information</h3>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex gap-3">
                <User className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-xs text-gray-400">Customer</span>
                  <p className="font-semibold text-gray-800">{order.customer.name}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-xs text-gray-400">Address</span>
                  <p className="font-semibold text-gray-800">{order.customer.address}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-xs text-gray-400">Phone</span>
                  <p className="font-semibold text-gray-800">{order.customer.phone}</p>
                </div>
              </div>
            </div>

            {/* Interactive Demo / Testing Card */}
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-800">
                <RefreshCw className="h-4 w-4" />
                <span className="text-xs font-bold tracking-wider uppercase">
                  Reviewer Demo Tools
                </span>
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                Status automatically progresses via server simulation based on elapsed time (0-15s Received, 15-45s Preparing, 45-90s Delivery, 90s+ Delivered). You can also fast-forward manually below.
              </p>

              {canAdvance && (
                <button
                  type="button"
                  onClick={handleAdvanceStatus}
                  disabled={isPending}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gray-900 py-2 text-xs font-bold text-white transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
                >
                  <FastForward className="h-3.5 w-3.5" />
                  <span>Advance Status (PATCH)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
