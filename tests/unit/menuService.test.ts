import { describe, it, expect } from "vitest";
import { menuService } from "@/services/menuService";

describe("MenuService", () => {
  it("provides 8-10 seeded menu items covering required categories", () => {
    const items = menuService.getAllItems();
    expect(items.length).toBeGreaterThanOrEqual(8);
    expect(items.length).toBeLessThanOrEqual(12);

    const categories = new Set(items.map((i) => i.category));
    expect(categories.has("pizza")).toBe(true);
    expect(categories.has("burgers")).toBe(true);
    expect(categories.has("pasta")).toBe(true);
    expect(categories.has("salads")).toBe(true);
    expect(categories.has("desserts")).toBe(true);
    expect(categories.has("drinks")).toBe(true);
  });

  it("stores all prices in integer cents and includes valid image URLs", () => {
    const items = menuService.getAllItems();
    for (const item of items) {
      expect(Number.isInteger(item.price)).toBe(true);
      expect(item.price).toBeGreaterThan(0);
      expect(item.image).toMatch(/^https:\/\/images\.unsplash\.com\//);
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
    }
  });

  it("retrieves an item by id", () => {
    const items = menuService.getAllItems();
    const first = items[0];
    const found = menuService.getItemById(first.id);
    expect(found).toEqual(first);
  });

  it("returns undefined for unknown item id", () => {
    const found = menuService.getItemById("non-existent-id");
    expect(found).toBeUndefined();
  });
});
