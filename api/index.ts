import type { Request, Response } from "express";
import { createApp } from "../src/app";
import { dbConnect } from "../src/config/mongo";

const { app } = createApp();

export default async function handler(req: Request, res: Response) {
  await dbConnect();
  return app(req, res);
}
