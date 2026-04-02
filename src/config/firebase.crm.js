import admin from "firebase-admin";
import { env } from "./env.js";

// ✅ create SECOND firebase app
const crmApp = admin.initializeApp(
  {
    credential: admin.credential.cert({
      projectId: env.crmFirebase.projectId,
      clientEmail: env.crmFirebase.clientEmail,
      privateKey: env.crmFirebase.privateKey,
    }),
  },
  "crmDB" 
);

// ✅ separate firestore instance
const crmFirestore = crmApp.firestore();

export {admin, crmFirestore};