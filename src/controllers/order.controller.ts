import { Request, Response, NextFunction } from "express";
import { confirmPayphoneOrder, createOrder, getPublicOrder } from "../services/order.service";

export async function createOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await createOrder(req.body));
  } catch (error) {
    next(error);
  }
}

export async function confirmPayphoneOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await confirmPayphoneOrder(req.body));
  } catch (error) {
    next(error);
  }
}

export async function getOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const reference = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    res.json({ order: await getPublicOrder(reference) });
  } catch (error) {
    next(error);
  }
}
