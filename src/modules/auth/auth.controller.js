import { firebaseAdmin } from "../../config/firebase.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const db = firebaseAdmin.firestore();


const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_SECRET,
    { expiresIn: "60d" } // ✅ 2 months
  );

  return { accessToken, refreshToken };
};

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
    if (!name || !City || !employment || !provider) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }
    const userId = uuidv4();

    // const phoneWithCode = `91${phone}`;

    // const userRef = db.collection("users").doc(phoneWithCode);
    const userRef = db.collection("users").doc(userId);

    const existingUser = await userRef.get();

    if (existingUser.exists) {
      return res.status(409).json({
        message: "User already exists",
      });
    }
    // const { accessToken, refreshToken } = generateTokens(phoneWithCode);
    const { accessToken, refreshToken } =
      generateTokens(userId);
    // =========================
    // DATA STRUCTURE
    // =========================
    const data = {
      name,
      email,
      phone,
      userId,
      role: "user",
      topic: "all_users",
      countryCode: "+91",
      city: City,
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
      refreshTokens: [refreshToken],

    };

    await userRef.set(data);

    // =========================
    // JWT TOKEN
    // =========================
    // const token = jwt.sign(
    //   { phone: phoneWithCode },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "7d" }
    // );




    return res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      userId,
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
    if (!firebase_uid || !idToken) {
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
    const userId = userData.userId;
    const { accessToken, refreshToken } = generateTokens(userId);
    // store refresh token in DB
    // await userDoc.ref.update({ refreshToken });
    await userDoc.ref.update({
      refreshTokens: firebaseAdmin.firestore.FieldValue.arrayUnion(refreshToken),
    });
    // =========================
    // JWT TOKEN
    // =========================
    // const token = jwt.sign(
    //   { userId: userDoc.id },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "7d" }
    // );
    const freshUser = (await userDoc.ref.get()).data();

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      userId,
      user: freshUser,
    });
  } catch (error) {
    next(error);
  }
};


export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    const userRef = db.collection("users").doc(decoded.userId);
    const user = await userRef.get();

    if (!user.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const tokens = user.data().refreshTokens || [];

    // ✅ ✅ ADD CLEANUP HERE
    const validTokens = tokens.filter(token => {
      try {
        jwt.verify(token, process.env.REFRESH_SECRET);
        return true;
      } catch {
        return false;
      }
    });

    // update DB with only valid tokens
    await userRef.update({ refreshTokens: validTokens });

    // ✅ use cleaned tokens for further checks
    if (!validTokens.includes(refreshToken)) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // ✅ generate new tokens
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { userId: decoded.userId },
      process.env.REFRESH_SECRET,
      { expiresIn: "60d" }
    );

    // ✅ rotate tokens
    await userRef.update({
      refreshTokens: firebaseAdmin.firestore.FieldValue.arrayRemove(refreshToken),
    });

    await userRef.update({
      refreshTokens: firebaseAdmin.firestore.FieldValue.arrayUnion(newRefreshToken),
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

  } catch (err) {
    return res.status(403).json({
      message: "Refresh token expired. Please login again",
    });
  }
};



export const logout = async (req, res) => {
  const userId = req.user.userId;
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  await db.collection("users").doc(userId).update({
    refreshTokens: firebaseAdmin.firestore.FieldValue.arrayRemove(refreshToken),
  });

  return res.json({ message: "Logged out successfully" });
};



export const updatePhoneNumber = async (req, res) => {
  try {
    const { userId, phone } = req.body;

    // =========================
    // VALIDATION
    // =========================
    if (!userId || !phone) {
      return res.status(400).json({
        message: "userId and phone are required",
      });
    }

    // Indian phone number validation
    const cleanPhone = phone.trim();

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        message: "Please enter a valid 10-digit phone number",
      });
    }

    // =========================
    // FIND USER
    // =========================
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // =========================
    // UPDATE PHONE NUMBER
    // =========================
    await userRef.update({
      phone: cleanPhone,
      countryCode: "+91",
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      message: "Phone number updated successfully",
      phone: cleanPhone,
      countryCode: "+91",
    });
  } catch (error) {
    console.error("Update Phone Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateFirebaseUid = async (req, res) => {
  try {
    const { userId, firebase_uid } = req.body;

    if (!userId || !firebase_uid) {
      return res.status(400).json({
        message: "userId and firebase_uid are required",
      });
    }

    // const phoneWithCode = `91${phone}`;
    // const userRef = db.collection("users").doc(phoneWithCode);

    const userRef = db.collection("users").doc(userId);


    const user = await userRef.get();

    if (!user.exists) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // update firebase uid
    await userRef.update({
      firebase_uid,
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      message: "Firebase UID updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};