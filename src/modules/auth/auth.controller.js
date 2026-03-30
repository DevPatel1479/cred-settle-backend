import { firebaseAdmin } from "../../config/firebase.js";
import jwt from "jsonwebtoken";

const db = firebaseAdmin.firestore();

export const signup = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      city,
      employment,
      query,
    } = req.body;

    // =========================
    // VALIDATION
    // =========================
    if (!name || !email || !phone || !city || !employment) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const phoneWithCode = `91${phone}`;

    const userRef = db.collection("users").doc(phoneWithCode);

    const existingUser = await userRef.get();

    if (existingUser.exists) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // =========================
    // DATA STRUCTURE
    // =========================
    const data = {
  name,
  email,
  phone,
  countryCode: "+91",
  city,

  employment: {
    employmentStatus: employment["Employment Status"] ?? null,
    monthlyIncome: employment["Monthly income"] ?? null,
    harassment: employment["Facing Harassment?"] ?? null,
    creditCardDues: employment["Total Credit Card Dues?"] ?? null,
    personalLoanDues: employment["Total Personal Loan Dues?"] ?? null,
    startPayment:
      employment["Can you pay ₹2,000 to ₹5,000 to start the process?"] ?? null,
  },

  ...(query && { query }),

  isVerified: false,

  createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
  updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
};

    await userRef.set(data);

    // =========================
    // JWT TOKEN
    // =========================
    const token = jwt.sign(
      { phone: phoneWithCode },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "User registered successfully",
      token,
      userId: phoneWithCode,
    });
  } catch (error) {
    next(error);
  }
};