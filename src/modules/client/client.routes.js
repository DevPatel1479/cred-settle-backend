import express from "express";
import { getClientData, getTotalDues, updateClientData, getUserData } from "./client.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
const router = express.Router();


router.post("/client/data", authMiddleware, getClientData);
router.post("/client/dues", authMiddleware, getTotalDues);
router.put("/client/update", authMiddleware, updateClientData);
router.post("/client/userdata", authMiddleware, getUserData);

export default router;