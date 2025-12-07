import { db } from "./firebase-admin.js";

// ENVIRONMENT VARIABLES
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "clinicai_verify_2025";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Send WhatsApp Message via Cloud API
 */
async function sendWhatsAppMessage(to, message) {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        console.error("Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
        return;
    }

    try {
        const response = await fetch(
            `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to,
                    type: "text",
                    text: { body: message },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("WhatsApp API Error:", error);
        }
    } catch (err) {
        console.error("Error sending WhatsApp message:", err);
    }
}

/**
 * Main Webhook Handler
 */
export default async function handler(req, res) {
    // ========== GET: Meta Verification ==========
    if (req.method === "GET") {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        console.log("Verification attempt:", { mode, token });

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("✅ Webhook verified successfully!");
            return res.status(200).send(challenge);
        } else {
            console.error("❌ Verification failed");
            return res.status(403).send("Verification failed");
        }
    }

    // ========== POST: Incoming Messages ==========
    if (req.method === "POST") {
        try {
            const body = req.body;

            // Check if there's a message
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const messages = value?.messages;

            if (!messages || messages.length === 0) {
                console.log("No message in payload");
                return res.status(200).send("OK");
            }

            const message = messages[0];
            const from = message.from;
            const messageText = message.text?.body || "";
            const timestamp = message.timestamp;

            console.log("📨 Received message:", { from, messageText, timestamp });

            // Save message to Firestore
            try {
                await db.collection("whatsapp_messages").add({
                    from,
                    message: messageText,
                    timestamp: parseInt(timestamp) || Date.now(),
                    received_at: new Date().toISOString(),
                });
                console.log("✅ Message saved to Firestore");
            } catch (firestoreErr) {
                console.error("❌ Firestore error:", firestoreErr);
            }

            // Send auto-reply
            const replyMessage = "Hello! Your message has been received 👋";
            await sendWhatsAppMessage(from, replyMessage);

            // Always return 200 to Meta
            return res.status(200).send("OK");
        } catch (err) {
            console.error("❌ Webhook error:", err);
            // Still return 200 to prevent Meta from retrying
            return res.status(200).send("OK");
        }
    }

    // ========== Other Methods ==========
    return res.status(405).send("Method not allowed");
}
