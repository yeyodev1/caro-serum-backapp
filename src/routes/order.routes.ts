import { Router } from "express";
import {
  confirmPayphoneOrderController,
  createOrderController,
  getAdminTransferReceiptController,
  getOrderController,
  listAdminOrdersController,
  lookupOrdersController,
  resendOrderEmailController,
  retryPayphoneOrderController,
  updateOrderStatusController,
  uploadTransferReceiptController,
} from "../controllers/order.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const orderRouter = Router();

orderRouter.post("/", createOrderController);
orderRouter.post("/payphone/confirm", confirmPayphoneOrderController);
orderRouter.post("/lookup", lookupOrdersController);
orderRouter.post("/:id/transfer-receipt", uploadTransferReceiptController);
orderRouter.post("/:id/resend-email", resendOrderEmailController);
orderRouter.post("/:id/payphone/retry", retryPayphoneOrderController);
orderRouter.get("/admin/list", authMiddleware, listAdminOrdersController);
orderRouter.get("/admin/:id/receipt", authMiddleware, getAdminTransferReceiptController);
orderRouter.patch("/admin/:id/status", authMiddleware, updateOrderStatusController);
orderRouter.get("/:id", getOrderController);

export default orderRouter;
