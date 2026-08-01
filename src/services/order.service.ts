import { randomUUID } from "crypto";
import axios from "axios";
import { CustomError } from "../errors/customError.error";
import { Order, OrderDocument } from "../models/Order";
import { BuyerInput, CartItemInput, DeliveryInput, OrderItem, PaymentMethod, Product } from "../types/order";

const PRODUCTS: Record<string, Product> = {
  "serum-10ml": { id: "serum-10ml", name: "Serum 10ml", priceCents: 3500 },
  "serum-5ml": { id: "serum-5ml", name: "Serum 5ml", priceCents: 2000 },
  "eyeliner-2in1": { id: "eyeliner-2in1", name: "Eyeliner 2 in 1", priceCents: 2000 },
  "collagen-mask-1": { id: "collagen-mask-1", name: "Collagen Mask (1)", priceCents: 250 },
  "collagen-mask-5": { id: "collagen-mask-5", name: "Collagen Mask (5)", priceCents: 1000 },
  "collagen-mask-10": { id: "collagen-mask-10", name: "Collagen Mask (10)", priceCents: 1500 },
  "combo-doble": { id: "combo-doble", name: "Combo Doble", priceCents: 4900 },
  "combo-trio": { id: "combo-trio", name: "Combo Trio", priceCents: 5900 },
};

const FREE_SHIPPING_THRESHOLD_CENTS = 4900;
// The business has not supplied a lower-order shipping fee yet.
const SHIPPING_FEE_CENTS = 0;
const PAYPHONE_CONFIRM_URL = "https://paymentbox.payphonetodoesposible.com/api/confirm";

function readBuyer(value: unknown): BuyerInput {
  if (!value || typeof value !== "object") throw new CustomError("Buyer is required", 400);
  const buyer = value as Record<string, unknown>;
  const firstName = typeof buyer.firstName === "string" ? buyer.firstName.trim() : "";
  const lastName = typeof buyer.lastName === "string" ? buyer.lastName.trim() : "";
  const email = typeof buyer.email === "string" ? buyer.email.trim().toLowerCase() : "";
  const phone = typeof buyer.phone === "string" ? buyer.phone.trim() : "";
  const validName = /^[\p{L}][\p{L}\p{M}'-]*(?: [\p{L}][\p{L}\p{M}'-]*)*$/u;
  const validEmail = /^(?!.*\.\.)[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

  if (!firstName || firstName.length > 60 || !validName.test(firstName) || !lastName || lastName.length > 60 || !validName.test(lastName) || !validEmail.test(email) || email.length > 254 || !/^\+?[1-9]\d{6,14}$/.test(phone)) {
    throw new CustomError("buyer.firstName, buyer.lastName, a valid buyer.email, and buyer.phone are required", 400);
  }
  return { firstName, lastName, email, phone };
}

function readDelivery(value: unknown): DeliveryInput {
  if (!value || typeof value !== "object") throw new CustomError("Delivery is required", 400);
  const delivery = value as Record<string, unknown>;
  const country = typeof delivery.country === "string" ? delivery.country : "";
  const province = typeof delivery.province === "string" ? delivery.province.trim() : "";
  const city = typeof delivery.city === "string" ? delivery.city.trim() : "";
  const address = typeof delivery.address === "string" ? delivery.address.trim() : "";
  const reference = typeof delivery.reference === "string" ? delivery.reference.trim() : "";
  const googleMapsUrl = typeof delivery.googleMapsUrl === "string" ? delivery.googleMapsUrl.trim() : "";

  let validGoogleMapsUrl = false;
  try {
    const url = new URL(googleMapsUrl);
    const hostname = url.hostname.toLowerCase();
    validGoogleMapsUrl = url.protocol === "https:" && (
      hostname === "maps.google.com" ||
      hostname === "goo.gl" ||
      hostname === "maps.app.goo.gl" ||
      (hostname === "www.google.com" && (url.pathname === "/maps" || url.pathname.startsWith("/maps/")))
    );
  } catch {
    validGoogleMapsUrl = false;
  }

  if (country !== "Ecuador" || !province || province.length > 100 || !city || city.length > 100 || !address || address.length > 250 || !reference || reference.length > 250 || !googleMapsUrl || googleMapsUrl.length > 2048 || !validGoogleMapsUrl) {
    throw new CustomError("delivery.country must be Ecuador; delivery.province, delivery.city, delivery.address, delivery.reference, and a valid Google Maps URL are required", 400);
  }
  return { country: "Ecuador", province, city, address, reference, googleMapsUrl };
}

function readCart(value: unknown): OrderItem[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) {
    throw new CustomError("Cart must contain between 1 and 20 items", 400);
  }

  const productIds = new Set<string>();
  return value.map((value) => {
    const item = value as Partial<CartItemInput>;
    const quantity = item.quantity;
    if (typeof item.productId !== "string" || typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new CustomError("Each cart item requires a valid productId and quantity", 400);
    }
    if (productIds.has(item.productId)) throw new CustomError("Cart cannot contain duplicate products", 400);
    productIds.add(item.productId);

    const product = PRODUCTS[item.productId];
    if (!product) throw new CustomError("Cart contains an unavailable product", 400);
    return {
      productId: product.id,
      name: product.name,
      unitPriceCents: product.priceCents,
      quantity,
      lineTotalCents: product.priceCents * quantity,
    };
  });
}

function readPaymentMethod(value: unknown): PaymentMethod {
  if (value !== "payphone" && value !== "transfer") {
    throw new CustomError("paymentMethod must be payphone or transfer", 400);
  }
  return value;
}

function payphoneConfig() {
  const token = process.env.PAYPHONE_TOKEN?.trim();
  const storeId = process.env.PAYPHONE_STORE_ID?.trim();
  if (!token || !storeId) throw new CustomError("PayPhone payments are temporarily unavailable", 503);
  return { token, storeId };
}

export function toPublicOrder(order: OrderDocument) {
  return {
    reference: order.publicReference,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
    })),
    paymentMethod: order.paymentMethod,
    status: order.status,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    createdAt: order.createdAt,
  };
}

export async function createOrder(payload: unknown) {
  if (!payload || typeof payload !== "object") throw new CustomError("Request body is required", 400);
  const body = payload as Record<string, unknown>;
  const paymentMethod = readPaymentMethod(body.paymentMethod);
  const buyer = readBuyer(body.buyer);
  const delivery = readDelivery(body.delivery);
  const items = readCart(body.cart);
  const subtotalCents = items.reduce((total, item) => total + item.lineTotalCents, 0);
  const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FEE_CENTS;
  const totalCents = subtotalCents + shippingCents;
  const clientTransactionId = paymentMethod === "payphone" ? `OMG-${randomUUID().replace(/-/g, "")}` : undefined;
  const config = paymentMethod === "payphone" ? payphoneConfig() : undefined;
  const order = await Order.create({
    publicReference: `OMG-${randomUUID().replace(/-/g, "")}`,
    buyer,
    delivery,
    items,
    paymentMethod,
    status: paymentMethod === "transfer" ? "awaiting_transfer" : "pending_payphone",
    subtotalCents,
    shippingCents,
    totalCents,
    clientTransactionId,
  });

  if (paymentMethod === "transfer") {
    return {
      order: toPublicOrder(order),
      transfer: {
        status: "awaiting-transfer",
        instructions: process.env.BANK_TRANSFER_INSTRUCTIONS?.trim() || "Bank transfer instructions will be provided separately.",
      },
    };
  }

  return {
    order: toPublicOrder(order),
    payphone: {
      token: config!.token,
      storeId: config!.storeId,
      clientTransactionId,
      amount: totalCents,
      amountWithoutTax: totalCents,
      currency: "USD",
      reference: order.publicReference,
    },
  };
}

function readConfirmation(payload: unknown) {
  if (!payload || typeof payload !== "object") throw new CustomError("Request body is required", 400);
  const body = payload as Record<string, unknown>;
  const id = body.id;
  const validId = (typeof id === "string" && id.trim().length > 0 && id.length <= 100) || (typeof id === "number" && Number.isSafeInteger(id) && id > 0);
  const clientTransactionId = typeof body.clientTransactionId === "string" ? body.clientTransactionId.trim() : "";
  if (!validId || !clientTransactionId || clientTransactionId.length > 50) {
    throw new CustomError("A valid id and clientTransactionId are required", 400);
  }
  return { id, clientTransactionId };
}

export async function confirmPayphoneOrder(payload: unknown) {
  const { id, clientTransactionId } = readConfirmation(payload);
  const order = await Order.findOne({ clientTransactionId, paymentMethod: "payphone" });
  if (!order) throw new CustomError("Order not found", 404);

  const { token } = payphoneConfig();
  let confirmation: Record<string, unknown>;
  try {
    const response = await axios.post<Record<string, unknown>>(
      PAYPHONE_CONFIRM_URL,
      { id, clientTransactionId },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 },
    );
    confirmation = response.data;
  } catch {
    throw new CustomError("Unable to confirm PayPhone payment", 502);
  }

  const statusCode = confirmation.statusCode;
  const confirmedClientTransactionId = confirmation.clientTransactionId;
  const amount = confirmation.amount;
  const isApproved = statusCode === 3 && confirmedClientTransactionId === order.clientTransactionId && amount === order.totalCents;
  if (isApproved) {
    order.status = "paid";
    order.payphoneTransactionId = String(confirmation.transactionId ?? id);
    await order.save();
  }

  return {
    order: toPublicOrder(order),
    transaction: {
      statusCode: typeof statusCode === "number" ? statusCode : null,
      status: typeof confirmation.transactionStatus === "string" ? confirmation.transactionStatus : "unconfirmed",
      clientTransactionId: order.clientTransactionId,
      amount: typeof amount === "number" ? amount : null,
      currency: typeof confirmation.currency === "string" ? confirmation.currency : "USD",
    },
  };
}

export async function getPublicOrder(reference: string) {
  const order = await Order.findOne({ publicReference: reference });
  if (!order) throw new CustomError("Order not found", 404);
  return toPublicOrder(order);
}
