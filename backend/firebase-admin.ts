import * as admin from "firebase-admin";

// Initialize Firebase Admin with environment variables
const adminApp = !admin.apps.length
    ? admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    })
    : admin.app();

export const db = admin.firestore();
export { admin };
