import { Router } from "express";
import {
  confirmPayphoneOrderController,
  createOrderController,
  getOrderController,
} from "../controllers/order.controller";

const orderRouter = Router();

orderRouter.post("/", createOrderController);
orderRouter.post("/payphone/confirm", confirmPayphoneOrderController);
orderRouter.get("/:id", getOrderController);

export default orderRouter;
