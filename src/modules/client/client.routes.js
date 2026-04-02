import express from "express";
import { getClientData, getTotalDues } from "./client.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
const router = express.Router();

router.use(authMiddleware);
router.post("/client/data", getClientData);
router.post("/client/dues", getTotalDues);

export default router;