
import { firebaseAdmin } from "../../config/firebase.js";

const admin = firebaseAdmin;
const db = admin.firestore();

export const sendTopicNotification = async (req, res) => {
  try {
    const { user_id, topic, n_title, n_body, send_weekly } = req.body;

    if (!user_id || !topic || !n_title || !n_body) {
      return res.status(400).json({
        success: false,
        message: "user_id, topic, n_title and n_body are required",
      });
    }

    const topics = Array.isArray(topic) ? topic : [topic];
    // const parts = user_id.split("_");
    // const phone = parts[1];
    const userDoc = await db.collection("users").doc(user_id).get();
    // Verify user exists (optional)
    // const userDoc = await db.collection("users").doc(`91${phone}`).get();
    // console.log("User doc:", userDoc.exists, `91${phone}`);

    if (!userDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const phoneField = "GLOBAL";
    const messagePayload = {
      notification: {
        title: n_title,
        body: n_body,
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        title: n_title,
        body: n_body,
        has_new_notification: "true",
      },
      android: {
        notification: {
          sound: "default",
          priority: "high",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
          "apns-push-type": "alert",
          "apns-topic": "com.loancredsettle.app", // update if needed
        },
        payload: {
          aps: {
            alert: {
              title: n_title,
              body: n_body,
            },
            sound: "default",
            badge: 1,
            "content-available": 1, // 👈 Needed for background delivery
          },
        },
      },
    };
    const unixTs = Math.floor(Date.now() / 1000);
    const baseMessageDoc = {
      n_title,
      n_body,
      timestamp: unixTs,
      sent_by: user_id,
      topics,
      phone: phoneField,
      send_weekly: !!send_weekly,
    };

    if (send_weekly) {
      const weekTopics = topics; // e.g., ["first_week", "third_week"]

      // Send notification once per topic
      const sendPromises = weekTopics.map((week) => {
        const msg = { ...messagePayload, topic: week };
        return admin.messaging().send(msg); // only 1 send per topic
      });

      await Promise.all(sendPromises);

      // Store notification under 'client' role with week_notification: true
      const unixTs = Math.floor(Date.now() / 1000);
      const messageDoc = {
        n_title,
        n_body,
        timestamp: unixTs,
        sent_by: user_id,
        phone: phoneField,
        topics: weekTopics,
        week_notification: true,
      };
      await db
        .collection("notifications")
        .doc("client")
        .collection("messages")
        .add(messageDoc);

      await db
        .collection("notification_history")
        .doc(user_id)
        .collection("messages")
        .add({
          ...baseMessageDoc,
          week_notification: true,
        });

      return res.status(200).json({
        success: true,
        message: `Weekly notification sent to topic(s): ${weekTopics.join(
          ", ",
        )}`,
      });
    } else {
      // DEFAULT LOGIC (all_clients / all_advocates / all_users)
      const sendPromises = topics.map(async (t) => {
        const msg = { ...messagePayload, topic: t };
        return admin.messaging().send(msg);
      });
      await Promise.all(sendPromises);

      const unixTs = Math.floor(Date.now() / 1000);
      const messageDoc = {
        n_title,
        n_body,
        timestamp: unixTs,
        sent_by: user_id,
        phone: phoneField,
        topics: topics,
      };

      const rolesToStore = [];
      if (topics.includes("all_clients")) rolesToStore.push("client");
      //   if (topics.includes("all_advocates")) rolesToStore.push("advocate");
      if (topics.includes("all_users")) rolesToStore.push("user");
      //   if (topics.includes("all_legal_experts"))
      //     rolesToStore.push("legal_expert");

      const storePromises = rolesToStore.map((role) =>
        db
          .collection("notifications")
          .doc(role)
          .collection("messages")
          .add(messageDoc),
      );
      await Promise.all(storePromises);
      await db
        .collection("notification_history")
        .doc(user_id)
        .collection("messages")
        .add(baseMessageDoc);
      return res.status(200).json({
        success: true,
        message: `Notification sent to topic(s): ${topics.join(", ")}`,
      });
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};


export const getLastOpenedNotificationTime = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // const documentId = `91${phone}`;
    const userRef = db.collection("users").doc(userId);
    const snap = await userRef.get();

    if (!snap.exists) {
      return res.status(200).json({
        success: true,
        lastOpenedNotificationTime: null,
      });
    }

    const data = snap.data();

    return res.status(200).json({
      success: true,
      lastOpenedNotificationTime: data.lastOpenedNotificationTime ?? null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch last opened notification time",
    });
  }
};

export const updateLastOpenedNotificationTime = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // const documentId = `91${phone}`;
    const userRef = db.collection("users").doc(userId);

    // ✅ UNIX timestamp (seconds)
    const unixTs = Math.floor(Date.now() / 1000);

    await userRef.set(
      {
        lastOpenedNotificationTime: unixTs,
      },
      { merge: true },
    );

    return res.status(200).json({
      success: true,
      lastOpenedNotificationTime: unixTs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update last opened notification time",
    });
  }
};



export const adminGetLastOpenedNotificationTime = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // const documentId = `91${phone}`;
    const userRef = db.collection("users").doc(userId);
    const snap = await userRef.get();

    if (!snap.exists) {
      return res.status(200).json({
        success: true,
        adminLastOpenedNotificationTime: null,
      });
    }

    const data = snap.data();

    return res.status(200).json({
      success: true,
      adminLastOpenedNotificationTime:
        data.adminLastOpenedNotificationTime ?? null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch last opened notification time",
    });
  }
};


export const adminUpdateLastOpenedNotificationTime = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // const documentId = `91${phone}`;
    const userRef = db.collection("users").doc(userId);

    // ✅ UNIX timestamp (seconds)
    const unixTs = Math.floor(Date.now() / 1000);

    await userRef.set(
      {
        adminLastOpenedNotificationTime: unixTs,
      },
      { merge: true },
    );

    return res.status(200).json({
      success: true,
      adminLastOpenedNotificationTime: unixTs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update last opened notification time",
    });
  }
};



export const getNotificationsByRole = async (req, res) => {
  try {
    const role = (req.params.role || "").toLowerCase();
    const userId = req.query.userId;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin notifications blocked",
      });
    }

    const limit = parseInt(req.query.limit, 10) || 10;
    const lastDocId = req.query.lastDocId || null;

    let queryRef = db
      .collection("notifications")
      .doc(role)
      .collection("messages")
      // .where("phone", "in", ["GLOBAL", phone])
      .orderBy("timestamp", "desc")
      .limit(limit);

    // Pagination cursor
    if (lastDocId) {
      const lastDoc = await db
        .collection("notifications")
        .doc(role)
        .collection("messages")
        .doc(lastDocId)
        .get();

      if (lastDoc.exists) {
        queryRef = queryRef.startAfter(lastDoc);
      }
    }

    const snapshot = await queryRef.get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        lastDocId: null,
        hasMore: false,
      });
    }

    const results = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.n_title,
        body: d.n_body,
        timestamp: d.timestamp,
        sent_by: d.sent_by || null,
        topics: d.topics || [],
        phone: d.phone || "GLOBAL",
      };
    });

    const newLastDocId = snapshot.docs[snapshot.docs.length - 1]?.id || null;

    return res.status(200).json({
      success: true,
      data: results,
      lastDocId: newLastDocId,
      hasMore: snapshot.docs.length === limit,
    });
  } catch (error) {
    console.error("Notification fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Fetch failed",
      error: error.message,
    });
  }
};



export const getUserNotificationHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { pageSize = 10, lastTimestamp } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const pageLimit = parseInt(pageSize, 10);
    if (isNaN(pageLimit) || pageLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid pageSize parameter",
      });
    }

    // const parts = user_id.split("_");
    // const phone = parts[1];

    const userMessagesRef = db
      .collection("notification_history")
      .doc(userId)
      .collection("messages");

    let queryRef = userMessagesRef
      .orderBy("timestamp", "desc")
      .limit(pageLimit);

    // 👇 Proper pagination: use snapshot, not raw value
    if (lastTimestamp) {
      const lastDocSnapshot = await userMessagesRef
        .where("timestamp", "==", parseInt(lastTimestamp, 10))
        .limit(1)
        .get();

      if (!lastDocSnapshot.empty) {
        queryRef = queryRef.startAfter(lastDocSnapshot.docs[0]);
      }
    }

    const snapshot = await queryRef.get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        nextCursor: null,
        message: "No more notifications found",
      });
    }

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = lastVisibleDoc.data().timestamp;

    return res.status(200).json({
      success: true,
      count: notifications.length,
      nextCursor,
      data: notifications,
    });
  } catch (error) {
    console.error("🔥 Error fetching user notification history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
