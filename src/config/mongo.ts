import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | undefined;

export async function dbConnect() {
  const DB_URI = process.env.DB_URI;

  if (!DB_URI) {
    throw new Error("DB_URI is not defined in environment variables");
  }

  if (mongoose.connection.readyState === 1) return;

  connectionPromise ??= mongoose.connect(DB_URI);
  try {
    await connectionPromise;
  } catch (error) {
    connectionPromise = undefined;
    throw error;
  }
}
