import admin from "firebase-admin";

let firebaseInitialized = false;
let initError = null;

try {
    if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        // Log what we have (without exposing sensitive data)
        console.log("Firebase Init - Project ID:", projectId ? "SET" : "MISSING");
        console.log("Firebase Init - Client Email:", clientEmail ? "SET" : "MISSING");
        console.log("Firebase Init - Private Key:", privateKey ? `SET (${privateKey.length} chars)` : "MISSING");

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error("Missing Firebase environment variables");
        }

        // Handle private key - remove surrounding quotes if present
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        }
        if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
            privateKey = privateKey.slice(1, -1);
        }

        // Replace escaped newlines with actual newlines
        privateKey = privateKey.replace(/\\n/g, "\n");

        console.log("Firebase Init - Private Key processed, starting with:", privateKey.substring(0, 30));

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });

        console.log("✅ Firebase Admin initialized successfully!");
        firebaseInitialized = true;
    } else {
        firebaseInitialized = true;
    }
} catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
    initError = error;
    firebaseInitialized = false;
}

export const db = firebaseInitialized ? admin.firestore() : null;
export const isInitialized = firebaseInitialized;
export const getInitError = () => initError;
export { admin };
