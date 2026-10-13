import { Order, OrderStatus } from "@/types";
import { CreateOrderInput } from "@/lib/validation/order";
import { OrderRepository } from "@/repositories/types";
import { menuService } from "./menuService";
import {
  deriveSimulatedStatus,
  isValidForwardTransition,
  canCancelOrder,
} from "@/lib/config/statusTiming";
import {
  MenuItemNotFoundError,
  OrderNotFoundError,
  InvalidStatusTransitionError,
  CannotCancelOrderError,
} from "@/lib/http/errors";

function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `ord-${timestamp}-${random}`;
}

export class OrderService {
  constructor(private readonly repo: OrderRepository) {}

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const orderItems = input.items.map((item) => {
      const menuItem = menuService.getItemById(item.menuItemId);
      if (!menuItem) {
        throw new MenuItemNotFoundError(item.menuItemId);
      }
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        subtotal: menuItem.price * item.quantity,
      };
    });

    const total = orderItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    const nowIso = new Date().toISOString();

    const order: Order = {
      id: generateOrderId(),
      customer: input.customer,
      items: orderItems,
      total,
      status: "received",
      manualStatus: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    return await this.repo.create(order);
  }

  async getOrderById(id: string): Promise<Order> {
    const order = await this.repo.findById(id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }

    const currentStatus = deriveSimulatedStatus(order.createdAt, order.manualStatus);
    return {
      ...order,
      status: currentStatus,
    };
  }

  async listOrders(): Promise<Order[]> {
    const orders = await this.repo.findAll();
    return orders
      .map((order) => ({
        ...order,
        status: deriveSimulatedStatus(order.createdAt, order.manualStatus),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateOrderStatus(id: string, targetStatus: OrderStatus): Promise<Order> {
    const order = await this.getOrderById(id);
    const currentStatus = order.status;

    if (!isValidForwardTransition(currentStatus, targetStatus)) {
      throw new InvalidStatusTransitionError(currentStatus, targetStatus);
    }

    const updatedOrder: Order = {
      ...order,
      status: targetStatus,
      manualStatus: targetStatus,
      updatedAt: new Date().toISOString(),
    };

    return await this.repo.update(updatedOrder);
  }

  async cancelOrder(id: string): Promise<Order> {
    const order = await this.getOrderById(id);
    const currentStatus = order.status;

    if (!canCancelOrder(currentStatus)) {
      throw new CannotCancelOrderError(currentStatus);
    }

    const updatedOrder: Order = {
      ...order,
      status: "cancelled",
      manualStatus: "cancelled",
      updatedAt: new Date().toISOString(),
    };

    return await this.repo.update(updatedOrder);
  }
}
