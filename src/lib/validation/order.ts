import { z } from "zod";

export const phoneRegex =
  /^(?:\+?[1-9]\d{0,2}[ -]?)?(?:\(?\d{3}\)?[ -.]?)?\d{3}[ -.]?\d{4}$|^\+?[1-9]\d{6,14}$|^(?:\+\d{1,3}[ -]?)?\(?\d{2,4}\)?[ -]?\d{3,4}[ -]?\d{3,4}$/;

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(250, "Address cannot exceed 250 characters"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(25, "Phone number is too long")
    .refine((val) => phoneRegex.test(val), {
      message: "Please enter a valid 10-digit or international phone number",
    }),
});

export const orderItemInputSchema = z.object({
  menuItemId: z.string().trim().min(1, "Menu item ID is required"),
  quantity: z
    .number({ invalid_type_error: "Quantity must be a number" })
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(20, "Quantity cannot exceed 20"),
});

export const createOrderSchema = z.object({
  customer: customerSchema,
  items: z
    .array(orderItemInputSchema)
    .min(1, "Cart cannot be empty")
    .transform((items) => {
      // Merge duplicate item lines
      const mergedMap = new Map<string, number>();
      for (const item of items) {
        mergedMap.set(item.menuItemId, (mergedMap.get(item.menuItemId) || 0) + item.quantity);
      }
      return Array.from(mergedMap.entries()).map(([menuItemId, quantity]) => ({
        menuItemId,
        quantity,
      }));
    })
    .refine((items) => items.every((i) => i.quantity <= 20), {
      message: "Combined quantity for any item cannot exceed 20",
    }),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["preparing", "out_for_delivery", "delivered"], {
    errorMap: () => ({ message: "Status must be one of: preparing, out_for_delivery, delivered" }),
  }),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
