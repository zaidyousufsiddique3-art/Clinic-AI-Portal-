import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../src/backend/firebase-admin.js";

// CONSTANTS
const VERIFY_TOKEN = "clinicai_verify_2025";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

// Send WhatsApp Message
async function sendWhatsAppMessage(phoneNumberId: string, to: string, message: string) {
    await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: message },
        }),
    });
}

// GPT-4.1 AI Response
async function getAIResponse(userMessage: string, history: any[]) {
    const messages = [
        { role: "system", content: "You are ClinicAI, a helpful medical assistant." },
        ...history,
        { role: "user", content: userMessage }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-4.1",
            messages,
            temperature: 0.3,
        }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I'm here to assist you.";
}

// Menu
function getMenuMessage() {
    return `Welcome to ClinicAI 👋

How can I assist you?

1️⃣ Book an appointment  
2️⃣ Clinic timings  
3️⃣ Clinic location  
4️⃣ Talk to a human  
5️⃣ Ask the AI anything  
`;
}

// MAIN HANDLER
export default async function handler(req: VercelRequest, res: VercelResponse) {

    // VERIFY WEBHOOK
    if (req.method === "GET") {
        if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VERIFY_TOKEN) {
            return res.status(200).send(req.query["hub.challenge"]);
        }
        return res.status(403).send("Verification failed");
    }

    // HANDLE INCOMING MESSAGES
    if (req.method === "POST") {
        try {
            const body = req.body;
            const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
            if (!message) return res.status(200).send("No message");

            const from = message.from;
            const text = message.text?.body || "";
            const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;

            // SAVE MESSAGE
            await db.collection("whatsapp_messages").add({
                from,
                message: text,
                timestamp: Date.now(),
            });

            // MENU LOGIC
            const lower = text.toLowerCase();

            if (["hi", "hello", "menu"].includes(lower)) {
                await sendWhatsAppMessage(phoneNumberId, from, getMenuMessage());
                return res.status(200).send("OK");
            }

            if (lower === "1") {
                await sendWhatsAppMessage(phoneNumberId, from, "Sure! What date would you like to book?");
                return res.status(200).send("OK");
            }
            if (lower === "2") {
                await sendWhatsAppMessage(phoneNumberId, from, "Clinic timings: 9 AM – 6 PM, Sunday to Thursday.");
                return res.status(200).send("OK");
            }
            if (lower === "3") {
                await sendWhatsAppMessage(phoneNumberId, from, "Clinic location: Riyadh, Saudi Arabia.");
                return res.status(200).send("OK");
            }
            if (lower === "4") {
                await sendWhatsAppMessage(phoneNumberId, from, "A human agent will assist you shortly.");
                return res.status(200).send("OK");
            }

            // BUILD HISTORY
            const historySnap = await db
                .collection("whatsapp_messages")
                .where("from", "==", from)
                .orderBy("timestamp", "asc")
                .get();

            const history = historySnap.docs.map(doc => ({
                role: "user",
                content: doc.data().message,
            }));

            // AI REPLY
            const aiReply = await getAIResponse(text, history);
            await sendWhatsAppMessage(phoneNumberId, from, aiReply);

            return res.status(200).send("OK");

        } catch (err) {
            console.error("Webhook error:", err);
            return res.status(500).send("Error");
        }
    }

    return res.status(405).send("Method not allowed");
}
