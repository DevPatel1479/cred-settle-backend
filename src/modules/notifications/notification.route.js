import express from "express";

import {
    sendTopicNotification,
    getLastOpenedNotificationTime,
    updateLastOpenedNotificationTime,
    adminGetLastOpenedNotificationTime,
    adminUpdateLastOpenedNotificationTime,
    getNotificationsByRole,
    getUserNotificationHistory
}
    from "./notification.controller.js";

const router = express.Router();

router.post("/send/topic/notif", sendTopicNotification);
router.post("/last-seen", getLastOpenedNotificationTime);
router.post("/mark-seen", updateLastOpenedNotificationTime);
router.post("/admin/last-seen", adminGetLastOpenedNotificationTime);
router.post("/admin/mark-seen", adminUpdateLastOpenedNotificationTime);
router.get("/get-notification/:role", getNotificationsByRole);
router.get("/history/:userId", getUserNotificationHistory);
export default router;
