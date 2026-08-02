import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { dbConnect } from "../config/mongo";
import { AdminUser } from "../models/AdminUser";

async function main() {
  const [emailArg, password] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();
  if (!email || !password || password.length < 8) {
    throw new Error("Usage: npm run create-admin -- <email> <password-with-at-least-8-characters>");
  }

  dotenv.config();
  await dbConnect();
  const passwordHash = await bcrypt.hash(password, 12);
  await AdminUser.findOneAndUpdate(
    { email },
    { email, passwordHash, role: "admin" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.log("Admin user is ready");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exit(1);
});
