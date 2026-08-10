export type PaymentMethod = "payphone" | "transfer";

export type OrderStatus = "awaiting_transfer" | "pending_payphone" | "paid" | "cancelled";

export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface BuyerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface DeliveryInput {
  country: "Ecuador";
  province: string;
  city: string;
  address: string;
  reference: string;
}

export interface InvoiceInput {
  identification: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
}

export interface Product {
  id: string;
  name: string;
  priceCents: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}
