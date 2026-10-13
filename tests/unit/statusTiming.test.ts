import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  STATUS_TIMINGS,
  deriveSimulatedStatus,
  isValidForwardTransition,
  canCancelOrder,
} from "@/lib/config/statusTiming";

describe("Status Timing & Simulation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("has configurable durations", () => {
    expect(STATUS_TIMINGS.RECEIVED_DURATION_SECONDS).toBeGreaterThan(0);
    expect(STATUS_TIMINGS.PREPARING_DURATION_SECONDS).toBeGreaterThan(0);
    expect(STATUS_TIMINGS.OUT_FOR_DELIVERY_DURATION_SECONDS).toBeGreaterThan(0);
  });

  it("derives 'received' right after creation (0 to 15s)", () => {
    const createdAt = new Date("2026-10-14T10:00:00Z");
    vi.setSystemTime(new Date("2026-10-14T10:00:05Z"));

    const status = deriveSimulatedStatus(createdAt);
    expect(status).toBe("received");
  });

  it("derives 'preparing' after received duration expires (15 to 45s)", () => {
    const createdAt = new Date("2026-10-14T10:00:00Z");
    vi.setSystemTime(
      new Date(createdAt.getTime() + (STATUS_TIMINGS.RECEIVED_DURATION_SECONDS + 2) * 1000)
    );

    const status = deriveSimulatedStatus(createdAt);
    expect(status).toBe("preparing");
  });

  it("derives 'out_for_delivery' after preparing duration expires (45 to 90s)", () => {
    const createdAt = new Date("2026-10-14T10:00:00Z");
    const seconds =
      STATUS_TIMINGS.RECEIVED_DURATION_SECONDS +
      STATUS_TIMINGS.PREPARING_DURATION_SECONDS +
      5;
    vi.setSystemTime(new Date(createdAt.getTime() + seconds * 1000));

    const status = deriveSimulatedStatus(createdAt);
    expect(status).toBe("out_for_delivery");
  });

  it("derives 'delivered' after out_for_delivery duration expires (>90s)", () => {
    const createdAt = new Date("2026-10-14T10:00:00Z");
    const seconds =
      STATUS_TIMINGS.RECEIVED_DURATION_SECONDS +
      STATUS_TIMINGS.PREPARING_DURATION_SECONDS +
      STATUS_TIMINGS.OUT_FOR_DELIVERY_DURATION_SECONDS +
      10;
    vi.setSystemTime(new Date(createdAt.getTime() + seconds * 1000));

    const status = deriveSimulatedStatus(createdAt);
    expect(status).toBe("delivered");
  });

  it("respects manual status override even if time is earlier or later", () => {
    const createdAt = new Date("2026-10-14T10:00:00Z");
    vi.setSystemTime(new Date("2026-10-14T10:00:02Z")); // Only 2 seconds elapsed

    // If manually overridden to out_for_delivery, should return out_for_delivery
    expect(deriveSimulatedStatus(createdAt, "out_for_delivery")).toBe("out_for_delivery");
    // If cancelled, should return cancelled
    expect(deriveSimulatedStatus(createdAt, "cancelled")).toBe("cancelled");
  });

  it("validates forward transitions correctly", () => {
    expect(isValidForwardTransition("received", "preparing")).toBe(true);
    expect(isValidForwardTransition("preparing", "out_for_delivery")).toBe(true);
    expect(isValidForwardTransition("out_for_delivery", "delivered")).toBe(true);

    // Backward or same transitions are invalid
    expect(isValidForwardTransition("preparing", "received")).toBe(false);
    expect(isValidForwardTransition("delivered", "preparing")).toBe(false);
    expect(isValidForwardTransition("delivered", "delivered")).toBe(false);

    // Transitions from cancelled are invalid
    expect(isValidForwardTransition("cancelled", "preparing")).toBe(false);
  });

  it("checks if order can be cancelled", () => {
    expect(canCancelOrder("received")).toBe(true);
    expect(canCancelOrder("preparing")).toBe(true);
    expect(canCancelOrder("out_for_delivery")).toBe(false);
    expect(canCancelOrder("delivered")).toBe(false);
    expect(canCancelOrder("cancelled")).toBe(false);
  });
});
