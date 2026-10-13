import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { OrderService } from "@/services/orderService";
import { InMemoryOrderRepository } from "@/repositories/inMemoryOrderRepository";
import {
  OrderNotFoundError,
  MenuItemNotFoundError,
  InvalidStatusTransitionError,
  CannotCancelOrderError,
} from "@/lib/http/errors";

describe("OrderService", () => {
  let repo: InMemoryOrderRepository;
  let service: OrderService;

  beforeEach(async () => {
    vi.useFakeTimers();
    repo = new InMemoryOrderRepository();
    await repo.clear();
    service = new OrderService(repo);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseCustomer = {
    name: "Jane Doe",
    address: "123 Food Street",
    phone: "+14155552671",
  };

  it("creates an order and recalculates prices from the menu", async () => {
    const order = await service.createOrder({
      customer: baseCustomer,
      items: [
        { menuItemId: "margherita-pizza", quantity: 2 },
        { menuItemId: "classic-cheeseburger", quantity: 1 },
      ],
    });

    expect(order.id).toBeDefined();
    expect(order.items).toHaveLength(2);
    expect(order.items[0].name).toBe("Classic Margherita Pizza");
    expect(order.items[0].price).toBe(1299);
    expect(order.items[0].subtotal).toBe(2598);
    expect(order.items[1].name).toBe("Double Cheeseburger");
    expect(order.items[1].price).toBe(1149);
    expect(order.items[1].subtotal).toBe(1149);
    expect(order.total).toBe(3747);
    expect(order.status).toBe("received");
  });

  it("throws MenuItemNotFoundError for unknown menu items", async () => {
    await expect(
      service.createOrder({
        customer: baseCustomer,
        items: [{ menuItemId: "fake-non-existent-item", quantity: 1 }],
      })
    ).rejects.toThrow(MenuItemNotFoundError);
  });

  it("retrieves order by id and reflects elapsed-time status progression", async () => {
    const initialTime = new Date("2026-10-14T10:00:00Z");
    vi.setSystemTime(initialTime);

    const created = await service.createOrder({
      customer: baseCustomer,
      items: [{ menuItemId: "margherita-pizza", quantity: 1 }],
    });

    // 0s elapsed: received
    let fetched = await service.getOrderById(created.id);
    expect(fetched.status).toBe("received");

    // 20s elapsed: preparing (threshold is 15s)
    vi.setSystemTime(new Date(initialTime.getTime() + 20 * 1000));
    fetched = await service.getOrderById(created.id);
    expect(fetched.status).toBe("preparing");

    // 50s elapsed: out_for_delivery (threshold is 45s)
    vi.setSystemTime(new Date(initialTime.getTime() + 50 * 1000));
    fetched = await service.getOrderById(created.id);
    expect(fetched.status).toBe("out_for_delivery");

    // 100s elapsed: delivered (threshold is 90s)
    vi.setSystemTime(new Date(initialTime.getTime() + 100 * 1000));
    fetched = await service.getOrderById(created.id);
    expect(fetched.status).toBe("delivered");
  });

  it("throws OrderNotFoundError when fetching unknown order id", async () => {
    await expect(service.getOrderById("missing-id")).rejects.toThrow(OrderNotFoundError);
  });

  it("updates status via valid forward transition", async () => {
    const created = await service.createOrder({
      customer: baseCustomer,
      items: [{ menuItemId: "margherita-pizza", quantity: 1 }],
    });

    const updated = await service.updateOrderStatus(created.id, "preparing");
    expect(updated.status).toBe("preparing");
    expect(updated.manualStatus).toBe("preparing");

    const fetched = await service.getOrderById(created.id);
    expect(fetched.status).toBe("preparing");
  });

  it("rejects invalid status transitions with InvalidStatusTransitionError (409)", async () => {
    const created = await service.createOrder({
      customer: baseCustomer,
      items: [{ menuItemId: "margherita-pizza", quantity: 1 }],
    });

    // Skip preparing -> out_for_delivery is invalid directly from received
    await expect(
      service.updateOrderStatus(created.id, "out_for_delivery")
    ).rejects.toThrow(InvalidStatusTransitionError);
  });

  it("allows cancelling order when in received or preparing status", async () => {
    const created = await service.createOrder({
      customer: baseCustomer,
      items: [{ menuItemId: "margherita-pizza", quantity: 1 }],
    });

    const cancelled = await service.cancelOrder(created.id);
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.manualStatus).toBe("cancelled");

    const fetched = await service.getOrderById(created.id);
    expect(fetched.status).toBe("cancelled");
  });

  it("rejects cancelling order if already out_for_delivery or delivered", async () => {
    const initialTime = new Date("2026-10-14T10:00:00Z");
    vi.setSystemTime(initialTime);

    const created = await service.createOrder({
      customer: baseCustomer,
      items: [{ menuItemId: "margherita-pizza", quantity: 1 }],
    });

    // Fast forward to 60s (status is out_for_delivery)
    vi.setSystemTime(new Date(initialTime.getTime() + 60 * 1000));

    await expect(service.cancelOrder(created.id)).rejects.toThrow(CannotCancelOrderError);
  });

  it("lists all orders with derived statuses sorted newest first", async () => {
    const t1 = new Date("2026-10-14T10:00:00Z");
    vi.setSystemTime(t1);
    const order1 = await service.createOrder({
      customer: baseCustomer,
      items: [{ menuItemId: "margherita-pizza", quantity: 1 }],
    });

    const t2 = new Date("2026-10-14T10:05:00Z");
    vi.setSystemTime(t2);
    const order2 = await service.createOrder({
      customer: baseCustomer,
      items: [{ menuItemId: "classic-cheeseburger", quantity: 1 }],
    });

    const orders = await service.listOrders();
    expect(orders).toHaveLength(2);
    expect(orders[0].id).toBe(order2.id); // newest first
    expect(orders[1].id).toBe(order1.id);
  });
});
