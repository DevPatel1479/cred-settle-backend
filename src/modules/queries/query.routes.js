import { Router } from "express";
import { raiseQuery, resolveQuery } from "./query.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/raise",  raiseQuery);
router.post("/resolve", resolveQuery); 

export default router;
