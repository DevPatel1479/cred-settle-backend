import { signup, login, refreshAccessToken, logout, updateFirebaseUid, updatePhoneNumber } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { Router } from "express";
const router = Router();

router.post("/signup", signup);
router.post("/login", login);


// ✅ ADD THESE
router.post("/refresh", refreshAccessToken);
router.post("/logout", authMiddleware, logout);

router.post('/signup/update-firebase-uid', updateFirebaseUid);

router.patch("/update-phone", updatePhoneNumber);

export default router;