import { Order } from "@/types";

export interface OrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findAll(): Promise<Order[]>;
  update(order: Order): Promise<Order>;
  delete(id: string): Promise<boolean>;
  clear?(): Promise<void>;
}
