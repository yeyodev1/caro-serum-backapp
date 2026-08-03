import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { CustomError } from "../errors/customError.error";
import { AdminUser } from "../models/AdminUser";
import { AuthRequest } from "../types/AuthRequest";

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

function readUserInput(body: unknown, requirePassword: boolean) {
  const value = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  const password = typeof value.password === "string" ? value.password : "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CustomError("A valid email is required", 400);
  if ((requirePassword && password.length < 8) || (!requirePassword && password && password.length < 8)) throw new CustomError("Password must have at least 8 characters", 400);
  return { email, password };
}

function publicUser(user: { _id: unknown; email: string; createdAt?: Date }) {
  return { id: String(user._id), email: user.email, createdAt: user.createdAt };
}

export async function listAdminUsersController(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await AdminUser.find().sort({ createdAt: -1 });
    res.json({ users: users.map(publicUser) });
  } catch (error) { next(error); }
}

export async function createAdminUserController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password } = readUserInput(req.body, true);
    if (!email) throw new CustomError("A valid email is required", 400);
    if (await AdminUser.exists({ email })) throw new CustomError("This email already has an admin user", 409);
    const user = await AdminUser.create({ email, passwordHash: await bcrypt.hash(password, 12), role: "admin" });
    res.status(201).json({ user: publicUser(user) });
  } catch (error) { next(error); }
}

export async function updateAdminUserController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!mongoose.isValidObjectId(id)) throw new CustomError("Admin user not found", 404);
    const { email, password } = readUserInput(req.body, false);
    if (!email && !password) throw new CustomError("Email or password is required", 400);
    if (email && await AdminUser.exists({ email, _id: { $ne: id } })) throw new CustomError("This email already has an admin user", 409);
    const update: Record<string, string> = {};
    if (email) update.email = email;
    if (password) update.passwordHash = await bcrypt.hash(password, 12);
    const user = await AdminUser.findByIdAndUpdate(id, update, { new: true });
    if (!user) throw new CustomError("Admin user not found", 404);
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
}

export async function deleteAdminUserController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!mongoose.isValidObjectId(id)) throw new CustomError("Admin user not found", 404);
    if (id === req.user?.userId) throw new CustomError("You cannot delete your own user", 403);
    const user = await AdminUser.findByIdAndDelete(id);
    if (!user) throw new CustomError("Admin user not found", 404);
    res.status(204).send();
  } catch (error) { next(error); }
}
