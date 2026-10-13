import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/menu/route";

describe("GET /api/menu", () => {
  it("returns seeded food items with HTTP 200", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.data).toBeDefined();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(8);

    const first = json.data[0];
    expect(first.id).toBeDefined();
    expect(first.name).toBeDefined();
    expect(first.price).toBeGreaterThan(0);
    expect(first.category).toBeDefined();
    expect(first.image).toBeDefined();
  });
});
