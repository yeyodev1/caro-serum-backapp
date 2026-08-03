import { Router } from "express";
import { createAdminUserController, deleteAdminUserController, listAdminUsersController, loginController, updateAdminUserController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const authRouter = Router();
authRouter.post("/login", loginController);
authRouter.get("/users", authMiddleware, listAdminUsersController);
authRouter.post("/users", authMiddleware, createAdminUserController);
authRouter.patch("/users/:id", authMiddleware, updateAdminUserController);
authRouter.delete("/users/:id", authMiddleware, deleteAdminUserController);

export default authRouter;
