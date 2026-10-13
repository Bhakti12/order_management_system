import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as createOrderHandler, GET as listOrdersHandler } from "@/app/api/orders/route";
import {
  GET as getOrderHandler,
  DELETE as cancelOrderHandler,
} from "@/app/api/orders/[id]/route";
import { PATCH as updateStatusHandler } from "@/app/api/orders/[id]/status/route";
import { getOrderRepository, resetOrderInstances } from "@/repositories";
import { resetRateLimiter } from "@/lib/http/rateLimiter";

describe("Orders API Route Handlers", () => {
  beforeEach(async () => {
    delete process.env.ADMIN_TOKEN;
    resetRateLimiter();
    resetOrderInstances();
    const repo = getOrderRepository();
    if (repo.clear) {
      await repo.clear();
    }
  });

  const validOrderPayload = {
    customer: {
      name: "Jane Doe",
      address: "123 Food Street, Apt 4B",
      phone: "+14155552671",
    },
    items: [
      { menuItemId: "margherita-pizza", quantity: 2 },
      { menuItemId: "margherita-pizza", quantity: 1 }, // duplicate line should be merged
    ],
  };

  describe("POST /api/orders", () => {
    it("creates an order with 201 Created and server-calculated prices", async () => {
      const req = new Request("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validOrderPayload),
      });

      const res = await createOrderHandler(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data).toBeDefined();
      expect(json.data.id).toMatch(/^ord-/);
      expect(json.data.status).toBe("received");
      // Duplicate item merged: quantity should be 3
      expect(json.data.items).toHaveLength(1);
      expect(json.data.items[0].quantity).toBe(3);
      expect(json.data.items[0].price).toBe(1299);
      expect(json.data.total).toBe(1299 * 3);
    });

    it("returns 400 for malformed JSON body", async () => {
      const req = new Request("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ malformed json",
      });

      const res = await createOrderHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error.code).toBe("MALFORMED_JSON");
    });

    it("returns 400 for empty cart items", async () => {
      const req = new Request("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validOrderPayload, items: [] }),
      });

      const res = await createOrderHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when an unknown menuItemId is submitted", async () => {
      const req = new Request("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validOrderPayload,
          items: [{ menuItemId: "invalid-item-xyz", quantity: 1 }],
        }),
      });

      const res = await createOrderHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error.code).toBe("MENU_ITEM_NOT_FOUND");
    });

    it("returns 400 for invalid phone numbers", async () => {
      const req = new Request("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validOrderPayload,
          customer: { ...validOrderPayload.customer, phone: "invalid-phone" },
        }),
      });

      const res = await createOrderHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 429 when client rate limit is exceeded", async () => {
      const makeRequest = () =>
        createOrderHandler(
          new Request("http://localhost:3000/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.1" },
            body: JSON.stringify(validOrderPayload),
          })
        );

      // Fire 30 requests
      for (let i = 0; i < 30; i++) {
        await makeRequest();
      }

      // The 31st request triggers rate limit
      const rateLimitedRes = await makeRequest();
      expect(rateLimitedRes.status).toBe(429);
      const json = await rateLimitedRes.json();
      expect(json.error.code).toBe("RATE_LIMIT_EXCEEDED");
    });
  });

  describe("GET /api/orders and GET /api/orders/:id", () => {
    it("lists orders with 200 OK", async () => {
      // Create one order first
      await createOrderHandler(
        new Request("http://localhost:3000/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validOrderPayload),
        })
      );

      const res = await listOrdersHandler();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.length).toBe(1);
    });

    it("returns 200 OK for existing order id", async () => {
      const createRes = await createOrderHandler(
        new Request("http://localhost:3000/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validOrderPayload),
        })
      );
      const created = (await createRes.json()).data;

      const res = await getOrderHandler(
        new Request(`http://localhost:3000/api/orders/${created.id}`),
        { params: Promise.resolve({ id: created.id }) }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(created.id);
    });

    it("returns 404 for non-existent order id", async () => {
      const res = await getOrderHandler(
        new Request("http://localhost:3000/api/orders/non-existent-id"),
        { params: Promise.resolve({ id: "non-existent-id" }) }
      );

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("ORDER_NOT_FOUND");
    });
  });

  describe("PATCH /api/orders/:id/status", () => {
    it("updates status with valid forward transition", async () => {
      const createRes = await createOrderHandler(
        new Request("http://localhost:3000/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validOrderPayload),
        })
      );
      const order = (await createRes.json()).data;

      const patchReq = new Request(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "preparing" }),
      });

      const patchRes = await updateStatusHandler(patchReq, {
        params: Promise.resolve({ id: order.id }),
      });
      expect(patchRes.status).toBe(200);

      const json = await patchRes.json();
      expect(json.data.status).toBe("preparing");
    });

    it("returns 409 Conflict for invalid transition (skipping step)", async () => {
      const createRes = await createOrderHandler(
        new Request("http://localhost:3000/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validOrderPayload),
        })
      );
      const order = (await createRes.json()).data;

      const patchReq = new Request(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "out_for_delivery" }),
      });

      const patchRes = await updateStatusHandler(patchReq, {
        params: Promise.resolve({ id: order.id }),
      });
      expect(patchRes.status).toBe(409);

      const json = await patchRes.json();
      expect(json.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("returns 401 Unauthorized if ADMIN_TOKEN is set and header is missing", async () => {
      process.env.ADMIN_TOKEN = "super_secret_token";

      const createRes = await createOrderHandler(
        new Request("http://localhost:3000/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validOrderPayload),
        })
      );
      const order = (await createRes.json()).data;

      const patchReq = new Request(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "preparing" }),
      });

      const patchRes = await updateStatusHandler(patchReq, {
        params: Promise.resolve({ id: order.id }),
      });
      expect(patchRes.status).toBe(401);

      // Now with valid header:
      const authPatchReq = new Request(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": "super_secret_token",
        },
        body: JSON.stringify({ status: "preparing" }),
      });
      const authPatchRes = await updateStatusHandler(authPatchReq, {
        params: Promise.resolve({ id: order.id }),
      });
      expect(authPatchRes.status).toBe(200);
    });
  });

  describe("DELETE /api/orders/:id (Cancel Order)", () => {
    it("cancels an order with 200 OK when in received status", async () => {
      const createRes = await createOrderHandler(
        new Request("http://localhost:3000/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validOrderPayload),
        })
      );
      const order = (await createRes.json()).data;

      const delRes = await cancelOrderHandler(
        new Request(`http://localhost:3000/api/orders/${order.id}`, { method: "DELETE" }),
        { params: Promise.resolve({ id: order.id }) }
      );

      expect(delRes.status).toBe(200);
      const json = await delRes.json();
      expect(json.data.status).toBe("cancelled");
    });
  });
});
