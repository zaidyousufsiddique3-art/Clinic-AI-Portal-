export default async function handler(req, res) {
    // ========== GET: Meta Verification ==========
    if (req.method === "GET") {
        const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        }

        return res.status(403).send("Verification failed");
    }

    // ========== POST: Incoming Messages ==========
    if (req.method === "POST") {
        try {
            // Lazy load Firebase only when needed
            const { db } = await import("./firebase-admin.js");

            const body = req.body || {};

            // Check if there's a message
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const messages = value?.messages;

            if (!messages || messages.length === 0) {
                return res.status(200).send("OK");
            }

            const message = messages[0];
            const from = message.from;
            const messageText = message.text?.body || "";
            const timestamp = message.timestamp;

            // Save message to Firestore
            try {
                await db.collection("whatsapp_messages").add({
                    from,
                    message: messageText,
                    timestamp: parseInt(timestamp) || Date.now(),
                    received_at: new Date().toISOString(),
                });
            } catch (firestoreErr) {
                console.error("Firestore error:", firestoreErr);
            }

            // Send auto-reply
            const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
            const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

            if (WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
                try {
                    await fetch(
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
                } catch (sendErr) {
                    console.error("WhatsApp send error:", sendErr);
                }
            }

            return res.status(200).send("OK");
        } catch (err) {
            console.error("Webhook error:", err);
            return res.status(200).send("OK");
        }
    }

    return res.status(405).send("Method not allowed");
}
