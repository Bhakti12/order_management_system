import { describe, it, expect, beforeEach } from "vitest";
import { GET as streamHandler } from "@/app/api/orders/[id]/stream/route";
import { POST as createOrderHandler } from "@/app/api/orders/route";
import { getOrderRepository, resetOrderInstances } from "@/repositories";

describe("GET /api/orders/:id/stream (SSE)", () => {
  beforeEach(async () => {
    resetOrderInstances();
    const repo = getOrderRepository();
    if (repo.clear) await repo.clear();
  });

  it("returns 404 if order does not exist", async () => {
    const res = await streamHandler(new Request("http://localhost:3000/api/orders/xyz/stream"), {
      params: Promise.resolve({ id: "xyz" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 200 text/event-stream and emits initial event for existing order", async () => {
    const createRes = await createOrderHandler(
      new Request("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: "Jane Doe",
            address: "123 Food Street",
            phone: "+14155552671",
          },
          items: [{ menuItemId: "margherita-pizza", quantity: 1 }],
        }),
      })
    );
    const order = (await createRes.json()).data;

    const streamRes = await streamHandler(
      new Request(`http://localhost:3000/api/orders/${order.id}/stream`),
      {
        params: Promise.resolve({ id: order.id }),
      }
    );

    expect(streamRes.status).toBe(200);
    expect(streamRes.headers.get("content-type")).toContain("text/event-stream");

    const reader = streamRes.body?.getReader();
    expect(reader).toBeDefined();

    const chunk = await reader?.read();
    const text = new TextDecoder().decode(chunk?.value);
    expect(text).toContain("data: ");
    expect(text).toContain(order.id);
  });
});
