export default async function handler(req, res) {
    // ========== GET: Meta Verification ==========
    // This runs FIRST without any Firebase imports
    if (req.method === "GET") {
        const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "clinicai_verify_2025";
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        console.log("GET Verification:", { mode, tokenMatch: token === VERIFY_TOKEN });

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("✅ Webhook verified!");
            return res.status(200).send(challenge);
        }

        console.log("❌ Verification failed - token mismatch");
        return res.status(403).send("Verification failed");
    }

    // ========== POST: Incoming Messages ==========
    if (req.method === "POST") {
        console.log("📨 POST request received");

        try {
            const body = req.body || {};

            // Check if there's a message in the payload
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const messages = value?.messages;

            if (!messages || messages.length === 0) {
                console.log("No message in payload - acknowledging");
                return res.status(200).send("OK");
            }

            const message = messages[0];
            const from = message.from;
            const messageText = message.text?.body || "";
            const timestamp = message.timestamp;

            console.log("📩 Message received:", { from, text: messageText });

            // Lazy load Firebase only for POST requests
            let db = null;
            let firebaseReady = false;

            try {
                const firebaseModule = await import("./firebase-admin.js");
                db = firebaseModule.db;
                firebaseReady = firebaseModule.isInitialized;

                if (!firebaseReady) {
                    const error = firebaseModule.getInitError();
                    console.error("Firebase not initialized:", error?.message);
                }
            } catch (importErr) {
                console.error("Failed to import firebase-admin:", importErr.message);
            }

            // Save message to Firestore (if Firebase is ready)
            if (db && firebaseReady) {
                try {
                    await db.collection("whatsapp_messages").add({
                        from,
                        message: messageText,
                        timestamp: parseInt(timestamp) || Date.now(),
                        received_at: new Date().toISOString(),
                    });
                    console.log("✅ Message saved to Firestore");
                } catch (firestoreErr) {
                    console.error("❌ Firestore write error:", firestoreErr.message);
                }
            } else {
                console.log("⚠️ Skipping Firestore save - Firebase not initialized");
            }

            // Send auto-reply via WhatsApp Cloud API
            const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
            const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

            if (!WHATSAPP_TOKEN) {
                console.error("❌ WHATSAPP_TOKEN is missing");
            }
            if (!PHONE_NUMBER_ID) {
                console.error("❌ WHATSAPP_PHONE_NUMBER_ID is missing");
            }

            if (WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
                try {
                    const replyResponse = await fetch(
                        `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                messaging_product: "whatsapp",
                                to: from,
                                type: "text",
                                text: { body: "Hello! Your message has been received 👋" },
                            }),
                        }
                    );

                    if (replyResponse.ok) {
                        console.log("✅ Auto-reply sent successfully");
                    } else {
                        const errorText = await replyResponse.text();
                        console.error("❌ WhatsApp API error:", replyResponse.status, errorText);
                    }
                } catch (sendErr) {
                    console.error("❌ WhatsApp send failed:", sendErr.message);
                }
            } else {
                console.log("⚠️ Skipping auto-reply - missing WhatsApp credentials");
            }

            // Always return 200 to Meta
            return res.status(200).send("OK");

        } catch (err) {
            console.error("❌ Webhook error:", err.message);
            // Still return 200 to prevent Meta from retrying
            return res.status(200).send("OK");
        }
    }

    // ========== Other Methods ==========
    return res.status(405).send("Method not allowed");
}
