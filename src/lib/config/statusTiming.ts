import { OrderStatus } from "@/types";

export const STATUS_TIMINGS = {
  RECEIVED_DURATION_SECONDS: 15,
  PREPARING_DURATION_SECONDS: 30,
  OUT_FOR_DELIVERY_DURATION_SECONDS: 45,
} as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Order Received",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const FORWARD_STATUS_FLOW: OrderStatus[] = [
  "received",
  "preparing",
  "out_for_delivery",
  "delivered",
];

/**
 * Derives the real-time simulated order status based on elapsed time from creation.
 * If a manual status override or cancellation is provided, it takes precedence.
 */
export function deriveSimulatedStatus(
  createdAt: Date | string,
  manualStatus?: OrderStatus | null,
  now?: Date
): OrderStatus {
  if (manualStatus) {
    return manualStatus;
  }

  const createdTime = typeof createdAt === "string" ? new Date(createdAt).getTime() : createdAt.getTime();
  const currentTime = now ? now.getTime() : Date.now();
  const elapsedSeconds = Math.max(0, (currentTime - createdTime) / 1000);

  const preparingThreshold = STATUS_TIMINGS.RECEIVED_DURATION_SECONDS;
  const outForDeliveryThreshold =
    STATUS_TIMINGS.RECEIVED_DURATION_SECONDS + STATUS_TIMINGS.PREPARING_DURATION_SECONDS;
  const deliveredThreshold =
    outForDeliveryThreshold + STATUS_TIMINGS.OUT_FOR_DELIVERY_DURATION_SECONDS;

  if (elapsedSeconds < preparingThreshold) {
    return "received";
  }
  if (elapsedSeconds < outForDeliveryThreshold) {
    return "preparing";
  }
  if (elapsedSeconds < deliveredThreshold) {
    return "out_for_delivery";
  }
  return "delivered";
}

/**
 * Validates whether transitioning from currentStatus to targetStatus is a valid forward step.
 */
export function isValidForwardTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus
): boolean {
  const currentIndex = FORWARD_STATUS_FLOW.indexOf(currentStatus);
  const targetIndex = FORWARD_STATUS_FLOW.indexOf(targetStatus);

  if (currentIndex === -1 || targetIndex === -1) {
    return false;
  }

  return targetIndex === currentIndex + 1;
}

/**
 * An order can only be cancelled before it has been dispatched for delivery.
 */
export function canCancelOrder(currentStatus: OrderStatus): boolean {
  return currentStatus === "received" || currentStatus === "preparing";
}
