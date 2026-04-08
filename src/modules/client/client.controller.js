import { crmFirestore } from "../../config/firebase.crm.js";
import { firebaseAdmin } from "../../config/firebase.js";

const admin = firebaseAdmin;
const db = admin.firestore();




export const getClientData = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: "Phone is required",
      });
    }

    // =========================
    // QUERY FIRESTORE
    // =========================
    const snapshot = await crmFirestore
      .collection("clients")
      .where("phone", "==", phone)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    const doc = snapshot.docs[0];

    return res.status(200).json({
      message: "Client data fetched successfully",
      data: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    next(error);
  }
};




export const getTotalDues = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: "Phone is required",
      });
    }

    // 🔥 Fetch only required client
    const snapshot = await crmFirestore
      .collection("users")
      .where("phone", "==", phone)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    const banks = data.banks || [];

    // =========================
    // 🔥 CALCULATE TOTAL DUES
    // =========================
    const totalDues = banks.reduce((sum, bank) => {
      // ignore settled loans
      if (bank.settled === true) return sum;

      const amount = Number(bank.loanAmount) || 0;

      return sum + amount;
    }, 0);

    return res.status(200).json({
      message: "Total dues calculated successfully",
      totalDues,
    });
  } catch (error) {
    next(error);
  }
};



export const updateClientData = async (req, res, next) => {
  try {
    const { phone, updateData } = req.body;

    // =========================
    // VALIDATION
    // =========================
    if (!phone) {
      return res.status(400).json({
        message: "Phone is required",
      });
    }

    if (!updateData || typeof updateData !== "object") {
      return res.status(400).json({
        message: "updateData must be a valid object",
      });
    }

    // =========================
    // FIND CLIENT (FAST QUERY)
    // =========================
    const docRef = db.collection("users").doc(`91${phone}`);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        message: "Client not found",
      });
    }



    // =========================
    // PREPARE UPDATE OBJECT
    // =========================
    const finalUpdate = {
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // =========================
    // UPDATE DATA (PARTIAL)
    // =========================
    await docRef.update(finalUpdate);

    return res.status(200).json({
      message: "Client updated successfully",
      updatedFields: Object.keys(updateData),
    });

  } catch (error) {
    console.error("Update Client Error:", error);

    return res.status(500).json({
      message: "Failed to update client",
      error: error.message,
    });
  }
};


export const getUserData = async (req, res, next) => {
  try {
    const { phone } = req.body;

    // =========================
    // VALIDATION
    // =========================
    if (!phone) {
      return res.status(400).json({
        message: "Phone is required",
      });
    }

    // =========================
    // DIRECT DOC FETCH (FASTEST)
    // =========================
    const docRef = db.collection("users").doc(`91${phone}`);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // =========================
    // RESPONSE
    // =========================
    return res.status(200).json({
      message: "User data fetched successfully",
      data: {
        id: docSnap.id,
        ...docSnap.data(),
      },
    });

  } catch (error) {
    console.error("Get User Error:", error);

    return res.status(500).json({
      message: "Failed to fetch user data",
      error: error.message,
    });
  }
};