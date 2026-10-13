import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc } from "drizzle-orm";
import { Order, OrderStatus } from "@/types";
import { OrderRepository } from "./types";
import { ordersTable } from "./schema";

export class PostgresOrderRepository implements OrderRepository {
  private db;

  constructor(databaseUrl: string) {
    const sql = neon(databaseUrl);
    this.db = drizzle(sql, { schema: { ordersTable } });
  }

  private toDomain(row: typeof ordersTable.$inferSelect): Order {
    return {
      id: row.id,
      customer: {
        name: row.customerName,
        address: row.customerAddress,
        phone: row.customerPhone,
      },
      items: JSON.parse(row.itemsJson),
      total: row.total,
      status: row.status as OrderStatus,
      manualStatus: (row.manualStatus as OrderStatus) || null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(order: Order): Promise<Order> {
    await this.db.insert(ordersTable).values({
      id: order.id,
      customerName: order.customer.name,
      customerAddress: order.customer.address,
      customerPhone: order.customer.phone,
      itemsJson: JSON.stringify(order.items),
      total: order.total,
      status: order.status,
      manualStatus: order.manualStatus || null,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
    });
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    const rows = await this.db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!rows || rows.length === 0) return null;
    return this.toDomain(rows[0]);
  }

  async findAll(): Promise<Order[]> {
    const rows = await this.db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    return rows.map((row) => this.toDomain(row));
  }

  async update(order: Order): Promise<Order> {
    await this.db
      .update(ordersTable)
      .set({
        customerName: order.customer.name,
        customerAddress: order.customer.address,
        customerPhone: order.customer.phone,
        itemsJson: JSON.stringify(order.items),
        total: order.total,
        status: order.status,
        manualStatus: order.manualStatus || null,
        updatedAt: new Date(order.updatedAt),
      })
      .where(eq(ordersTable.id, order.id));
    return order;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(ordersTable).where(eq(ordersTable.id, id));
    return Boolean(result);
  }

  async clear(): Promise<void> {
    await this.db.delete(ordersTable);
  }
}
