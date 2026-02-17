import { firebaseAdmin } from "../../config/firebase.js";

const db = firebaseAdmin.firestore();

export const createClientQuery = async ({
  userRole,
  userPhone,
  query_content,
  userId,
  userName,
}) => {
  if (userRole !== "client") {
    const err = new Error("Only clients can raise queries");
    err.status = 403;
    throw err;
  }

  const now = Math.floor(Date.now() / 1000); // unix epoch (seconds)

  const doc = {
    userRole,
    userPhone,
    query_content,
    userId,
    userName,
    createdAt: now,
    lastUpdatedAt: now,
    status: "pending",
  };

  // Fast write: let Firestore auto-generate doc ID
  const ref = await db.collection("client_queries").add(doc);

  return { id: ref.id, ...doc };
};



export const resolveClientQueryById = async ({
  resolverId,
  resolverName,
  resolverRole,
  remarks,
  queryId,
}) => {
  const docRef = db.collection("client_queries").doc(queryId);

  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return { error: "NOT_FOUND" };
  }

  const queryData = docSnap.data();

  if (queryData.status === "resolved") {
    return { error: "ALREADY_RESOLVED" };
  }

  const now = Date.now();

  await docRef.update({
    status: "resolved",
    lastUpdatedAt: now,
    resolvedBy: {
      resolverId,
      resolverName,
      resolverRole,
      remarks: remarks ?? null,
      resolvedAt: now,
    },
  });

  return { success: true, queryId };
};