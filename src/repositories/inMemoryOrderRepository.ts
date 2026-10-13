import { Order } from "@/types";
import { OrderRepository } from "./types";

declare global {
  var __inMemoryOrdersStore: Map<string, Order> | undefined;
}

export class InMemoryOrderRepository implements OrderRepository {
  private store: Map<string, Order>;

  constructor() {
    if (!globalThis.__inMemoryOrdersStore) {
      globalThis.__inMemoryOrdersStore = new Map<string, Order>();
    }
    this.store = globalThis.__inMemoryOrdersStore;
  }

  async create(order: Order): Promise<Order> {
    this.store.set(order.id, JSON.parse(JSON.stringify(order)));
    return JSON.parse(JSON.stringify(order));
  }

  async findById(id: string): Promise<Order | null> {
    const item = this.store.get(id);
    if (!item) return null;
    return JSON.parse(JSON.stringify(item));
  }

  async findAll(): Promise<Order[]> {
    return Array.from(this.store.values()).map((o) => JSON.parse(JSON.stringify(o)));
  }

  async update(order: Order): Promise<Order> {
    this.store.set(order.id, JSON.parse(JSON.stringify(order)));
    return JSON.parse(JSON.stringify(order));
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
