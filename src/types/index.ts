export type OrderStatus =
  | "received"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // in cents (integer)
  category: "pizza" | "burgers" | "pasta" | "salads" | "desserts" | "drinks";
  image: string;
}

export interface CustomerInfo {
  name: string;
  address: string;
  phone: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number; // in cents (integer)
  quantity: number;
  subtotal: number; // in cents (integer)
}

export interface Order {
  id: string;
  customer: CustomerInfo;
  items: OrderItem[];
  total: number; // in cents (integer)
  status: OrderStatus;
  manualStatus?: OrderStatus | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiErrorPayload;
}
