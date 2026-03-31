import { firebaseAdmin } from "../../config/firebase.js";
import jwt from "jsonwebtoken";

const db = firebaseAdmin.firestore();

export const signup = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      City,
      employment,
      query,
      provider,
      firebase_uid
    } = req.body;

    // =========================
    // VALIDATION
    // =========================
    if (!name || !email || !phone || !City || !employment || !provider) {
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
      city : City,
      provider,
      firebase_uid,
      employment: {
        employmentStatus: employment["Employment Status"] ?? null,
        monthlyIncome: employment["Monthly income"] ?? null,
        harassment: employment["Facing Harassment?"] ?? null,
        creditCardDues: employment["Total Credit Card Dues?"] ?? null,
        personalLoanDues: employment["Total Personal Loan Dues?"] ?? null,
        startPayment: employment["Can you pay ₹2,000 to ₹5,000 to start the process?"] ?? null,
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






export const login = async (req, res, next) => {
  try {
    const { email, firebase_uid, idToken } = req.body;

    // =========================
    // VALIDATION
    // =========================
    if (!email || !firebase_uid || !idToken) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // =========================
    // VERIFY FIREBASE TOKEN 🔐
    // =========================
    const decodedToken = await firebaseAdmin
      .auth()
      .verifyIdToken(idToken);

    if (decodedToken.uid !== firebase_uid) {
      return res.status(401).json({
        message: "Invalid Firebase token",
      });
    }

    // =========================
    // FIND USER IN FIRESTORE
    // =========================
    const usersRef = db.collection("users");

    const snapshot = await usersRef
      .where("firebase_uid", "==", firebase_uid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        message: "User not found. Please signup first.",
      });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // =========================
    // JWT TOKEN
    // =========================
    const token = jwt.sign(
      { userId: userDoc.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      userId: userDoc.id,
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};