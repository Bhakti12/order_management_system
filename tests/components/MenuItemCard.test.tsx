import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MenuItemCard } from "@/components/MenuItemCard";
import { MenuItem } from "@/types";

const mockItem: MenuItem = {
  id: "classic-burger",
  name: "Classic Cheeseburger",
  description: "Prime beef with aged cheddar",
  price: 1149,
  category: "burgers",
  image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
};

describe("MenuItemCard", () => {
  it("renders menu item details and formats price in dollars", () => {
    const onAdd = vi.fn();
    render(<MenuItemCard item={mockItem} onAddToCart={onAdd} />);

    expect(screen.getByText("Classic Cheeseburger")).toBeInTheDocument();
    expect(screen.getByText("Prime beef with aged cheddar")).toBeInTheDocument();
    expect(screen.getByText("$11.49")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("calls onAddToCart when button is clicked", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<MenuItemCard item={mockItem} onAddToCart={onAdd} />);

    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(onAdd).toHaveBeenCalledWith(mockItem);
  });
});
