import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as admin from "firebase-admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requiredEnvVars = [
    "OPENAI_API_KEY",
    "WHATSAPP_TOKEN",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ];

  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return res.status(500).json({
      success: false,
      message: "Missing environment variables",
      missing,
    });
  }

  // Validate Firebase Private Key Formatting
  const privateKey = process.env.FIREBASE_PRIVATE_KEY!;
  const hasRealNewlines = privateKey.includes("-----BEGIN") && privateKey.includes("\n");

  if (hasRealNewlines) {
    return res.status(500).json({
      success: false,
      message:
        "FIREBASE_PRIVATE_KEY contains REAL newlines. Replace real newlines with \\n before deploying.",
    });
  }

  try {
    // Attempt initializing Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    }

    // Try reading a safe Firestore path
    const db = admin.firestore();
    await db.collection("test_connection").limit(1).get();

    return res.status(200).json({
      success: true,
      message: "Environment variables and Firebase Admin SDK are all valid!",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Firebase initialization failed",
      error: error.message,
    });
  }
}
