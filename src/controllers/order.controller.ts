import { Request, Response, NextFunction } from "express";
import { confirmPayphoneOrder, createOrder, getAdminTransferReceipt, getPublicOrder, listAdminOrders, lookupOrders, resendOrderEmail, retryPayphoneOrder, updateOrderStatus, uploadTransferReceipt } from "../services/order.service";

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

export async function uploadTransferReceiptController(req: Request, res: Response, next: NextFunction) {
  try {
    const reference = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    res.json({ order: await uploadTransferReceipt(reference, req.body) });
  } catch (error) {
    next(error);
  }
}

export async function listAdminOrdersController(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ orders: await listAdminOrders() });
  } catch (error) {
    next(error);
  }
}

export async function getAdminTransferReceiptController(req: Request, res: Response, next: NextFunction) {
  try {
    const reference = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    res.json(await getAdminTransferReceipt(reference));
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const reference = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    res.json({ order: await updateOrderStatus(reference, req.body.status) });
  } catch (error) {
    next(error);
  }
}

export async function lookupOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ orders: await lookupOrders(req.body) });
  } catch (error) {
    next(error);
  }
}

export async function resendOrderEmailController(req: Request, res: Response, next: NextFunction) {
  try {
    const reference = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    res.json(await resendOrderEmail(reference, req.body));
  } catch (error) {
    next(error);
  }
}

export async function retryPayphoneOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const reference = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    res.json(await retryPayphoneOrder(reference));
  } catch (error) {
    next(error);
  }
}
