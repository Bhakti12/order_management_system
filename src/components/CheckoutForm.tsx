"use client";

import React, { useState } from "react";
import { CustomerInput, customerSchema } from "@/lib/validation/order";
import { AlertCircle, Loader2 } from "lucide-react";

interface CheckoutFormProps {
  onSubmit: (data: CustomerInput) => void | Promise<void>;
  isSubmitting?: boolean;
  apiError?: string | null;
}

export function CheckoutForm({ onSubmit, isSubmitting = false, apiError }: CheckoutFormProps) {
  const [formData, setFormData] = useState<CustomerInput>({
    name: "",
    address: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInput, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CustomerInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = customerSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CustomerInput, string>> = {};
      const issues = result.error.issues || [];
      for (const issue of issues) {
        const fieldName = issue.path[0] as keyof CustomerInput;
        if (fieldName && !fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    await onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {apiError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <div>
        <label htmlFor="customer-name" className="block text-sm font-semibold text-gray-700">
          Full Name
        </label>
        <input
          id="customer-name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="e.g. Jane Doe"
          className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition outline-none focus:ring-2 ${
            errors.name
              ? "border-red-400 focus:ring-red-200"
              : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-100"
          }`}
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="customer-address" className="block text-sm font-semibold text-gray-700">
          Delivery Address
        </label>
        <textarea
          id="customer-address"
          name="address"
          rows={2}
          value={formData.address}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="e.g. 123 Food Street, Apt 4B"
          className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition outline-none focus:ring-2 ${
            errors.address
              ? "border-red-400 focus:ring-red-200"
              : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-100"
          }`}
        />
        {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
      </div>

      <div>
        <label htmlFor="customer-phone" className="block text-sm font-semibold text-gray-700">
          Phone Number
        </label>
        <input
          id="customer-phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="e.g. (555) 123-4567 or +14155552671"
          className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition outline-none focus:ring-2 ${
            errors.phone
              ? "border-red-400 focus:ring-red-200"
              : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-100"
          }`}
        />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Placing Order...</span>
          </>
        ) : (
          <span>Place Order</span>
        )}
      </button>
    </form>
  );
}
