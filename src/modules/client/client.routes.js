import express from "express";
import { getClientData,getTotalDues } from "./client.controller.js";

const router = express.Router();

router.post("/client/data", getClientData);
router.post("/client/dues", getTotalDues);

export default router;