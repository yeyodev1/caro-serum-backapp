import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { CustomError } from "../errors/customError.error";
import { AdminUser } from "../models/AdminUser";

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) throw new CustomError("Admin login is not configured", 503);
    const user = await AdminUser.findOne({ email, role: "admin" }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new CustomError("Invalid email or password", 401);
    const accessToken = jwt.sign({ userId: String(user._id), email: user.email, accountType: "admin" }, secret, { expiresIn: "8h" });
    res.json({ accessToken, userId: String(user._id) });
  } catch (error) {
    next(error);
  }
}
