import express from "express";
import { getClientData, getTotalDues } from "./client.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
const router = express.Router();


router.post("/client/data", authMiddleware, getClientData);
router.post("/client/dues", authMiddleware, getTotalDues);

export default router;