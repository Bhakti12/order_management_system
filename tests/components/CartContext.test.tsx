import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "@/context/CartContext";
import { MenuItem } from "@/types";

const mockItem: MenuItem = {
  id: "test-pizza",
  name: "Test Pizza",
  description: "Delicious test pizza",
  price: 1299,
  category: "pizza",
  image: "https://images.unsplash.com/photo-1",
};

function TestCartConsumer() {
  const { items, addItem, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();

  return (
    <div>
      <div data-testid="item-count">{itemCount}</div>
      <div data-testid="total">{total}</div>
      <button onClick={() => addItem(mockItem, 1)}>Add Mock Item</button>
      <button onClick={() => updateQuantity(mockItem.id, 5)}>Set Quantity 5</button>
      <button onClick={() => updateQuantity(mockItem.id, 25)}>Set Quantity 25</button>
      <button onClick={() => removeItem(mockItem.id)}>Remove Mock Item</button>
      <button onClick={clearCart}>Clear Cart</button>
      <ul>
        {items.map((i) => (
          <li key={i.menuItem.id} data-testid={`cart-item-${i.menuItem.id}`}>
            {i.menuItem.name} - Qty: {i.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}

describe("CartContext", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with empty cart", () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    expect(screen.getByTestId("item-count").textContent).toBe("0");
    expect(screen.getByTestId("total").textContent).toBe("0");
  });

  it("adds items and increments quantities and totals", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText("Add Mock Item"));
    expect(screen.getByTestId("item-count").textContent).toBe("1");
    expect(screen.getByTestId("total").textContent).toBe("1299");

    // Adding again increments quantity
    await user.click(screen.getByText("Add Mock Item"));
    expect(screen.getByTestId("item-count").textContent).toBe("2");
    expect(screen.getByTestId("total").textContent).toBe("2598");
  });

  it("clamps quantity to maximum 20", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText("Add Mock Item"));
    await user.click(screen.getByText("Set Quantity 25"));

    // Should clamp to 20
    expect(screen.getByTestId("item-count").textContent).toBe("20");
    expect(screen.getByTestId("total").textContent).toBe(String(1299 * 20));
  });

  it("removes items and clears cart", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText("Add Mock Item"));
    expect(screen.getByTestId("item-count").textContent).toBe("1");

    await user.click(screen.getByText("Remove Mock Item"));
    expect(screen.getByTestId("item-count").textContent).toBe("0");
  });

  it("persists and restores cart from localStorage", () => {
    window.localStorage.setItem(
      "food_delivery_cart",
      JSON.stringify([{ menuItem: mockItem, quantity: 3 }])
    );

    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    expect(screen.getByTestId("item-count").textContent).toBe("3");
    expect(screen.getByTestId("total").textContent).toBe(String(1299 * 3));
  });
});
