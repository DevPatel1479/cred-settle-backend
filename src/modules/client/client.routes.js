import express from "express";
import { getClientData } from "./client.controller.js";

const router = express.Router();

router.post("/client/data", getClientData);

export default router;