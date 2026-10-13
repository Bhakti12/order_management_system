import { OrderRepository } from "./types";
import { InMemoryOrderRepository } from "./inMemoryOrderRepository";
import { PostgresOrderRepository } from "./postgresOrderRepository";
import { OrderService } from "@/services/orderService";

let repositoryInstance: OrderRepository | null = null;
let orderServiceInstance: OrderService | null = null;

export function getOrderRepository(): OrderRepository {
  if (repositoryInstance) {
    return repositoryInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.trim() !== "") {
    repositoryInstance = new PostgresOrderRepository(databaseUrl);
  } else {
    repositoryInstance = new InMemoryOrderRepository();
  }

  return repositoryInstance;
}

export function getOrderService(): OrderService {
  if (!orderServiceInstance) {
    orderServiceInstance = new OrderService(getOrderRepository());
  }
  return orderServiceInstance;
}

export function resetOrderInstances(): void {
  repositoryInstance = null;
  orderServiceInstance = null;
}
