import express from "express";
import { fileDisputeController } from "./file.dispute.controller.js";

const router = express.Router();

// POST /api/file-dispute
router.post("/file/dispute", fileDisputeController);

export default router;
