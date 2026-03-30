import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export const env = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  crmFirebase: {
    projectId: process.env.CRM_FIREBASE_PROJECT_ID,
    clientEmail: process.env.CRM_FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.CRM_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }
};
