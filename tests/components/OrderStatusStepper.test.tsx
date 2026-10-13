import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderStatusStepper } from "@/components/OrderStatusStepper";

describe("OrderStatusStepper", () => {
  it("renders all four sequential order stages", () => {
    render(<OrderStatusStepper status="received" />);

    expect(screen.getByText("Order Received")).toBeInTheDocument();
    expect(screen.getByText("Preparing")).toBeInTheDocument();
    expect(screen.getByText("Out for Delivery")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("marks current step active and subsequent steps pending for 'preparing'", () => {
    const { container } = render(<OrderStatusStepper status="preparing" />);

    // Check step indicator for preparing
    expect(screen.getByTestId("step-preparing")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("step-received")).toHaveAttribute("data-state", "completed");
    expect(screen.getByTestId("step-out_for_delivery")).toHaveAttribute("data-state", "pending");
  });

  it("marks all steps completed when status is 'delivered'", () => {
    render(<OrderStatusStepper status="delivered" />);

    expect(screen.getByTestId("step-received")).toHaveAttribute("data-state", "completed");
    expect(screen.getByTestId("step-preparing")).toHaveAttribute("data-state", "completed");
    expect(screen.getByTestId("step-out_for_delivery")).toHaveAttribute("data-state", "completed");
    expect(screen.getByTestId("step-delivered")).toHaveAttribute("data-state", "active");
  });

  it("renders cancelled badge and alert when status is 'cancelled'", () => {
    render(<OrderStatusStepper status="cancelled" />);

    expect(screen.getByText(/this order has been cancelled/i)).toBeInTheDocument();
  });
});
