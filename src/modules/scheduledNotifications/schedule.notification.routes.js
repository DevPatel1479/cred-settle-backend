import { Router } from "express";

import { createScheduledNotification, getDueScheduledNotifications, updateScheduledNotificationStatus } from "./schedule.notification.controller.js";

const router = Router();

router.post("/schedule", createScheduledNotification);

// From Cloud Scheduler / Cloud Function
router.get("/schedule/due", getDueScheduledNotifications);

// Update after send (sent / failed)
router.post("/schedule/status", updateScheduledNotificationStatus);

export default router;
