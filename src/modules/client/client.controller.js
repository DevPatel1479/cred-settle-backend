import { crmFirestore } from "../../config/firebase.crm.js";

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