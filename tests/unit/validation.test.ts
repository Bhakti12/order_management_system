import { describe, it, expect } from "vitest";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  customerSchema,
  phoneRegex,
} from "@/lib/validation/order";

describe("Validation Schemas", () => {
  describe("Phone validation regex", () => {
    it("accepts valid 10-digit formats", () => {
      expect(phoneRegex.test("1234567890")).toBe(true);
      expect(phoneRegex.test("(123) 456-7890")).toBe(true);
      expect(phoneRegex.test("123-456-7890")).toBe(true);
      expect(phoneRegex.test("123.456.7890")).toBe(true);
    });

    it("accepts international E.164 formats", () => {
      expect(phoneRegex.test("+14155552671")).toBe(true);
      expect(phoneRegex.test("+919876543210")).toBe(true);
      expect(phoneRegex.test("+44 20 7946 0991")).toBe(true);
    });

    it("rejects invalid phone numbers", () => {
      expect(phoneRegex.test("123")).toBe(false);
      expect(phoneRegex.test("abc-def-ghij")).toBe(false);
      expect(phoneRegex.test("12345678901234567890")).toBe(false);
    });
  });

  describe("Customer Schema", () => {
    it("validates and trims valid customer details", () => {
      const valid = {
        name: "  Jane Doe  ",
        address: "  123 Foodie Street, Apt 4B  ",
        phone: "  (555) 123-4567  ",
      };
      const parsed = customerSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.name).toBe("Jane Doe");
        expect(parsed.data.address).toBe("123 Foodie Street, Apt 4B");
        expect(parsed.data.phone).toBe("(555) 123-4567");
      }
    });

    it("rejects names that are too short or empty", () => {
      const result = customerSchema.safeParse({
        name: " A ",
        address: "123 Main St",
        phone: "1234567890",
      });
      expect(result.success).toBe(false);
    });

    it("rejects address that is too short", () => {
      const result = customerSchema.safeParse({
        name: "Jane Doe",
        address: "12",
        phone: "1234567890",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Create Order Schema", () => {
    it("accepts valid order payload and merges duplicate item lines", () => {
      const payload = {
        customer: {
          name: "Jane Doe",
          address: "123 Food Street",
          phone: "+14155552671",
        },
        items: [
          { menuItemId: "item-1", quantity: 2 },
          { menuItemId: "item-2", quantity: 1 },
          { menuItemId: "item-1", quantity: 3 },
        ],
      };

      const result = createOrderSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
        const item1 = result.data.items.find((i) => i.menuItemId === "item-1");
        expect(item1?.quantity).toBe(5);
      }
    });

    it("rejects empty items array", () => {
      const payload = {
        customer: {
          name: "Jane Doe",
          address: "123 Food Street",
          phone: "+14155552671",
        },
        items: [],
      };
      const result = createOrderSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects quantity of 0, negative numbers, non-integers, and over 20", () => {
      const base = {
        customer: {
          name: "Jane Doe",
          address: "123 Food Street",
          phone: "+14155552671",
        },
      };

      expect(
        createOrderSchema.safeParse({
          ...base,
          items: [{ menuItemId: "item-1", quantity: 0 }],
        }).success
      ).toBe(false);

      expect(
        createOrderSchema.safeParse({
          ...base,
          items: [{ menuItemId: "item-1", quantity: -2 }],
        }).success
      ).toBe(false);

      expect(
        createOrderSchema.safeParse({
          ...base,
          items: [{ menuItemId: "item-1", quantity: 2.5 }],
        }).success
      ).toBe(false);

      expect(
        createOrderSchema.safeParse({
          ...base,
          items: [{ menuItemId: "item-1", quantity: 21 }],
        }).success
      ).toBe(false);
    });
  });

  describe("Update Status Schema", () => {
    it("accepts valid status values", () => {
      expect(updateOrderStatusSchema.safeParse({ status: "preparing" }).success).toBe(true);
      expect(updateOrderStatusSchema.safeParse({ status: "out_for_delivery" }).success).toBe(true);
      expect(updateOrderStatusSchema.safeParse({ status: "delivered" }).success).toBe(true);
    });

    it("rejects invalid status values", () => {
      expect(updateOrderStatusSchema.safeParse({ status: "invalid_status" }).success).toBe(false);
      expect(updateOrderStatusSchema.safeParse({ status: "" }).success).toBe(false);
    });
  });
});
