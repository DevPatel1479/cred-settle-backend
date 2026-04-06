import express from "express";
import { storeFcmToken, updateFcmToken } from "./fcm.controller";

const router = express.Router();

router.post("/store/fcm", storeFcmToken);
router.put("/update/fcm", updateFcmToken);

export default router;
