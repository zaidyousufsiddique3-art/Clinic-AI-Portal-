export default async function handler(req, res) {
    const envStatus = {
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
        FIREBASE_PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        FIREBASE_PRIVATE_KEY_STARTS_WITH: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 20) || "N/A",
        WHATSAPP_TOKEN: !!process.env.WHATSAPP_TOKEN,
        WHATSAPP_PHONE_NUMBER_ID: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
        WHATSAPP_VERIFY_TOKEN: !!process.env.WHATSAPP_VERIFY_TOKEN,
    };

    // Test Firebase initialization
    let firebaseStatus = "Not tested";
    try {
        const { isInitialized, getInitError } = await import("./firebase-admin.js");
        if (isInitialized) {
            firebaseStatus = "✅ Initialized successfully";
        } else {
            const error = getInitError();
            firebaseStatus = `❌ Failed: ${error?.message || "Unknown error"}`;
        }
    } catch (err) {
        firebaseStatus = `❌ Import failed: ${err.message}`;
    }

    return res.status(200).json({
        ...envStatus,
        firebaseStatus,
        message: "Environment check complete",
        timestamp: new Date().toISOString(),
    });
}
