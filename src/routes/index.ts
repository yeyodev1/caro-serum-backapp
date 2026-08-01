import express, { Application } from "express";
import orderRouter from "./order.routes";

function routerApi(app: Application) {
  const router = express.Router();
  app.use("/api", router);

  router.use("/orders", orderRouter);
}

export default routerApi;
