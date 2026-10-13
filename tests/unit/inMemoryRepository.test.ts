import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryOrderRepository } from "@/repositories/inMemoryOrderRepository";
import { Order } from "@/types";

describe("InMemoryOrderRepository", () => {
  let repo: InMemoryOrderRepository;

  beforeEach(async () => {
    repo = new InMemoryOrderRepository();
    await repo.clear();
  });

  const sampleOrder: Order = {
    id: "ord-test-1",
    customer: {
      name: "Jane Doe",
      address: "123 Food Street",
      phone: "+14155552671",
    },
    items: [
      {
        menuItemId: "item-1",
        name: "Margherita Pizza",
        price: 1499,
        quantity: 2,
        subtotal: 2998,
      },
    ],
    total: 2998,
    status: "received",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("creates and retrieves an order by id", async () => {
    await repo.create(sampleOrder);
    const found = await repo.findById("ord-test-1");
    expect(found).toEqual(sampleOrder);
  });

  it("returns null if order not found", async () => {
    const found = await repo.findById("non-existent");
    expect(found).toBeNull();
  });

  it("lists all orders in repository", async () => {
    await repo.create(sampleOrder);
    await repo.create({
      ...sampleOrder,
      id: "ord-test-2",
    });

    const all = await repo.findAll();
    expect(all).toHaveLength(2);
  });

  it("updates an existing order", async () => {
    await repo.create(sampleOrder);
    const updated = {
      ...sampleOrder,
      manualStatus: "preparing" as const,
      status: "preparing" as const,
    };
    await repo.update(updated);

    const found = await repo.findById("ord-test-1");
    expect(found?.manualStatus).toBe("preparing");
  });

  it("deletes an order", async () => {
    await repo.create(sampleOrder);
    const deleted = await repo.delete("ord-test-1");
    expect(deleted).toBe(true);

    const found = await repo.findById("ord-test-1");
    expect(found).toBeNull();
  });
});
