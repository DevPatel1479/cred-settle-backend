import admin from "firebase-admin";
import { env } from "./env.js";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.firebase.projectId,
    clientEmail: env.firebase.clientEmail,
    privateKey: env.firebase.privateKey,
  }),
});

export const firebaseAdmin = admin;
