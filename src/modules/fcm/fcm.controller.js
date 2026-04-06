import { firebaseAdmin } from "../../config/firebase.js";


const db = firebaseAdmin.firestore();

const collectionName = "users";

function extractPhone(user_id) {
    return user_id.split("_").pop();
}


export const storeFcmToken = async (req, res) => {
    try {
        const { phone, fcm_token } = req.body;

        if (!phone || !fcm_token) {
            return res
                .status(400)
                .json({ error: "phone and fcm_token are required" });
        }
        const phone_val = `91${phone}`;

        const userRef = db.collection(collectionName).doc(phone_val);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        await userRef.update({ fcm_token });

        return res.status(200).json({ message: "FCM token stored successfully" });
    } catch (error) {
        console.error("Error storing FCM token:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// Update FCM token
export const updateFcmToken = async (req, res) => {
    try {
        const { phone_val, fcm_token } = req.body;

        if (!phone_val || !fcm_token) {
            return res
                .status(400)
                .json({ error: "phone_val and fcm_token are required" });
        }

        const phone = `91${phone_val}`;

        const userRef = db.collection(collectionName).doc(phone);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        await userRef.update({ fcm_token });

        return res.status(200).json({ message: "FCM token updated successfully" });
    } catch (error) {
        console.error("Error updating FCM token:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
