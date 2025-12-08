import { db } from "./firebase-admin.js";
import { sendWhatsAppMessage } from "./whatsapp-utils.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!db) {
        return res.status(500).json({ error: "Database not initialized" });
    }

    try {
        const { conversationId, staffId, text } = req.body;

        if (!conversationId || !staffId || !text) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Get conversation and patient info
        const convDoc = await db.collection("conversations").doc(conversationId).get();
        if (!convDoc.exists) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const conv = convDoc.data();
        const patientDoc = await db.collection("patients").doc(conv.patientId).get();

        if (!patientDoc.exists) {
            return res.status(404).json({ error: "Patient not found" });
        }

        const patient = patientDoc.data();

        // Send WhatsApp message
        const sent = await sendWhatsAppMessage(patient.phone, text);

        if (!sent) {
            return res.status(500).json({ error: "Failed to send WhatsApp message" });
        }

        // Save message to Firestore
        await db.collection("messages").add({
            conversationId,
            patientId: conv.patientId,
            from: "staff",
            staffId: staffId,
            text: text,
            language: "en", // Could detect but staff messages usually English
            createdAt: new Date(),
        });

        // Update conversation lastMessageAt
        await db.collection("conversations").doc(conversationId).update({
            lastMessageAt: new Date()
        });

        return res.status(200).json({
            success: true,
            message: "Message sent successfully"
        });

    } catch (error) {
        console.error("Staff Message Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
