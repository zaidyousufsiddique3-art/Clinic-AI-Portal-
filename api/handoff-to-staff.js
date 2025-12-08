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
        const { conversationId, staffId, reason = "manual" } = req.body;

        if (!conversationId || !staffId) {
            return res.status(400).json({ error: "Missing conversationId or staffId" });
        }

        // Update conversation to human mode
        await db.collection("conversations").doc(conversationId).update({
            mode: "human",
            staffAssigned: staffId,
            handoverReason: reason,
            handoverAt: new Date().toISOString()
        });

        // Get patient info to send WhatsApp message
        const convDoc = await db.collection("conversations").doc(conversationId).get();
        if (!convDoc.exists) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const conv = convDoc.data();
        const patientDoc = await db.collection("patients").doc(conv.patientId).get();

        if (patientDoc.exists) {
            const patient = patientDoc.data();
            await sendWhatsAppMessage(patient.phone, "A staff member will now assist you.");
        }

        // Create notification for staff dashboard
        await db.collection("agent_notifications").add({
            conversationId,
            patientId: conv.patientId,
            type: "handover",
            message: "A patient needs staff assistance",
            staffId: staffId,
            createdAt: new Date(),
            seen: false
        });

        return res.status(200).json({
            success: true,
            message: "Conversation handed off to staff"
        });

    } catch (error) {
        console.error("Handoff Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
