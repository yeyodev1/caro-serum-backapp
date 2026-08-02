import express, { Application } from "express";
import orderRouter from "./order.routes";
import authRouter from "./auth.routes";

function routerApi(app: Application) {
  const router = express.Router();
  app.use("/api", router);

  router.use("/orders", orderRouter);
  router.use("/auth", authRouter);
}

export default routerApi;
