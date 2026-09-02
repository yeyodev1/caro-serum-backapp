import { InferSchemaType, model, Schema } from "mongoose";
import { OrderStatus, PaymentMethod } from "../types/order";

const orderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    // Optional so historical items keep working; new orders always store it.
    contents: { type: String, required: false, maxlength: 250 },
    unitPriceCents: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotalCents: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    publicReference: { type: String, required: true, unique: true, index: true },
    buyer: {
      firstName: { type: String, required: true, maxlength: 60 },
      lastName: { type: String, required: true, maxlength: 60 },
      email: { type: String, required: true, maxlength: 254 },
      phone: { type: String, required: true, maxlength: 16 },
    },
    delivery: {
      country: { type: String, required: true, enum: ["Ecuador"] },
      province: { type: String, required: true, maxlength: 100 },
      city: { type: String, required: true, maxlength: 100 },
      address: { type: String, required: true, maxlength: 250 },
      reference: { type: String, required: true, maxlength: 250 },
      // Kept optional so historical orders retain the link the checkout used to collect.
      googleMapsUrl: { type: String, required: false, maxlength: 2048 },
    },
    invoice: {
      identification: { type: String, maxlength: 13 },
      firstName: { type: String, maxlength: 60 },
      lastName: { type: String, maxlength: 60 },
      email: { type: String, maxlength: 254 },
      address: { type: String, maxlength: 250 },
    },
    items: { type: [orderItemSchema], required: true },
    paymentMethod: { type: String, required: true, enum: ["payphone", "transfer"] as PaymentMethod[] },
    status: {
      type: String,
      required: true,
      enum: ["awaiting_transfer", "pending_payphone", "paid", "cancelled"] as OrderStatus[],
    },
    subtotalCents: { type: Number, required: true, min: 0 },
    shippingCents: { type: Number, required: true, min: 0 },
    totalCents: { type: Number, required: true, min: 0 },
    clientTransactionId: { type: String, unique: true, sparse: true },
    payphoneTransactionId: { type: String },
    paymentConfirmationEmailSentAt: { type: Date },
    transferReceipt: {
      publicId: { type: String },
      url: { type: String },
      uploadedAt: { type: Date },
    },
  },
  { timestamps: true },
);

export type OrderDocument = InferSchemaType<typeof orderSchema>;
export const Order = model("Order", orderSchema);
