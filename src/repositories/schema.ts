import { pgTable, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerAddress: varchar("customer_address", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  itemsJson: text("items_json").notNull(),
  total: integer("total").notNull(),
  status: varchar("status", { length: 30 }).notNull(),
  manualStatus: varchar("manual_status", { length: 30 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
