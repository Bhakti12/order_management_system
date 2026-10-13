import { describe, it, expect } from "vitest";
import { formatPrice, formatDate } from "@/lib/format";

describe("Formatting helpers", () => {
  it("formats cents into USD currency strings", () => {
    expect(formatPrice(1299)).toBe("$12.99");
    expect(formatPrice(500)).toBe("$5.00");
    expect(formatPrice(0)).toBe("$0.00");
    expect(formatPrice(49)).toBe("$0.49");
  });

  it("formats ISO date strings", () => {
    const formatted = formatDate("2026-10-14T10:30:00Z");
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("gracefully falls back if date is invalid", () => {
    expect(formatDate("not-a-date")).toBe("Invalid Date");
  });
});
