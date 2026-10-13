import React from "react";
import { OrderStatus } from "@/types";
import { CheckCircle2, Clock, Truck, PackageCheck, XCircle } from "lucide-react";

interface OrderStatusStepperProps {
  status: OrderStatus;
}

const STEPS = [
  { id: "received", label: "Order Received", icon: Clock },
  { id: "preparing", label: "Preparing", icon: CheckCircle2 },
  { id: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { id: "delivered", label: "Delivered", icon: PackageCheck },
] as const;

export function OrderStatusStepper({ status }: OrderStatusStepperProps) {
  const isCancelled = status === "cancelled";
  const currentStepIndex = STEPS.findIndex((s) => s.id === status);

  return (
    <div className="w-full">
      {isCancelled && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <XCircle className="h-6 w-6 shrink-0" />
          <div>
            <h4 className="font-bold">Order Cancelled</h4>
            <p className="text-sm">This order has been cancelled and is no longer being processed.</p>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            let state: "completed" | "active" | "pending" = "pending";

            if (!isCancelled && currentStepIndex !== -1) {
              if (idx < currentStepIndex) {
                state = "completed";
              } else if (idx === currentStepIndex) {
                state = "active";
              } else {
                state = "pending";
              }
            }

            return (
              <div
                key={step.id}
                data-testid={`step-${step.id}`}
                data-state={state}
                className="flex flex-col items-center text-center"
              >
                {/* Stepper Node */}
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                    state === "completed"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : state === "active"
                      ? "border-emerald-600 bg-white text-emerald-600 ring-4 ring-emerald-100"
                      : "border-gray-200 bg-gray-50 text-gray-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Step Label */}
                <span
                  className={`mt-2 text-xs font-semibold sm:text-sm ${
                    state === "active"
                      ? "text-emerald-700 font-bold"
                      : state === "completed"
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>

                {/* Badge for active step */}
                {state === "active" && !isCancelled && (
                  <span className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    In Progress
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
