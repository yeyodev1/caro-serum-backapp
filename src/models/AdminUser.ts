import { InferSchemaType, model, Schema } from "mongoose";

const adminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["admin"], default: "admin" },
  },
  { timestamps: true },
);

export type AdminUserDocument = InferSchemaType<typeof adminUserSchema>;
export const AdminUser = model("AdminUser", adminUserSchema);
