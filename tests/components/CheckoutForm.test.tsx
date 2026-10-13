import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutForm } from "@/components/CheckoutForm";

describe("CheckoutForm", () => {
  it("displays inline validation errors when fields are empty", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<CheckoutForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/address must be at least 5 characters/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/please enter a valid 10-digit or international phone number/i)
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid customer data", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CheckoutForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/delivery address/i), "123 Food Street, Apt 4B");
    await user.type(screen.getByLabelText(/phone number/i), "+14155552671");

    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Jane Doe",
        address: "123 Food Street, Apt 4B",
        phone: "+14155552671",
      });
    });
  });

  it("disables submit button and shows loading text while submitting", () => {
    const onSubmit = vi.fn();
    render(<CheckoutForm onSubmit={onSubmit} isSubmitting={true} />);

    const button = screen.getByRole("button", { name: /placing order/i });
    expect(button).toBeDisabled();
  });

  it("renders external API error banner when provided", () => {
    const onSubmit = vi.fn();
    render(
      <CheckoutForm
        onSubmit={onSubmit}
        isSubmitting={false}
        apiError="Cart is empty or items unavailable."
      />
    );

    expect(screen.getByText("Cart is empty or items unavailable.")).toBeInTheDocument();
  });
});
