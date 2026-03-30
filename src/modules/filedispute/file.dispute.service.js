import { firebaseAdmin } from "../../config/firebase.js";

const db = firebaseAdmin.firestore();

export const fileClientDispute = async (payload) => {
  const {
    userName,
    userPhone,
    userRole,
    userQuery,
    userAddress,
    userService,
  } = payload;

  const docRef = db.collection("client_file_disputes").doc(userPhone);

  const data = {
    userName,
    userPhone,
    userRole,
    userQuery,
    userAddress,
    userService: userService || "Loan Settlement",
    submittedAt: Math.floor(Date.now() / 1000), // Unix epoch (UTC)
  };

  await docRef.set(data, { merge: true });

  return {
    id: userPhone,
    ...data,
  };
};
