import { db } from "./firebase-admin.js";
import { sendWhatsAppMessage } from "./whatsapp-utils.js";

/**
 * Agent Reply API
 * POST /api/agent-reply
 * 
 * Allows staff to send messages to patients via WhatsApp.
 * Only works when conversation is in human mode or human_handoff state.
 * 
 * Body: { conversationId: string, message: string }
 */
export default async function handler(req, res) {
    // CORS headers for frontend
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!db) {
        console.error("❌ Database not initialized");
        return res.status(500).json({ error: "Database not initialized" });
    }

    try {
        const { conversationId, message } = req.body;

        // Validate input
        if (!conversationId || typeof conversationId !== "string") {
            return res.status(400).json({ error: "Missing or invalid conversationId" });
        }

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return res.status(400).json({ error: "Missing or empty message" });
        }

        const trimmedMessage = message.trim();

        // Get conversation
        const convDoc = await db.collection("conversations").doc(conversationId).get();

        if (!convDoc.exists) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const conversation = convDoc.data();

        // Check if conversation allows agent messages
        if (conversation.mode !== "human" && conversation.state !== "human_handoff") {
            return res.status(400).json({
                error: "Cannot send agent message - conversation is in bot mode. Please use 'Take Over' first.",
                currentMode: conversation.mode,
                currentState: conversation.state
            });
        }

        // Get patient info
        const patientDoc = await db.collection("patients").doc(conversation.patientId).get();

        if (!patientDoc.exists) {
            return res.status(404).json({ error: "Patient not found" });
        }

        const patient = patientDoc.data();

        // Send WhatsApp message
        const sent = await sendWhatsAppMessage(patient.phone, trimmedMessage);

        if (!sent) {
            console.error("❌ Failed to send WhatsApp message to", patient.phone);
            return res.status(500).json({ error: "Failed to send WhatsApp message" });
        }

        // Save message to Firestore
        await db.collection("messages").add({
            conversationId,
            patientId: conversation.patientId,
            from: "agent",
            text: trimmedMessage,
            type: "text",
            language: conversation.language || "en",
            createdAt: new Date(),
        });

        // Update conversation lastMessageAt
        await db.collection("conversations").doc(conversationId).update({
            lastMessageAt: new Date(),
        });

        // Update lead with last message
        const leadSnap = await db.collection("leads")
            .where("patientId", "==", conversation.patientId)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (!leadSnap.empty) {
            await leadSnap.docs[0].ref.update({
                lastMessage: `[Agent] ${trimmedMessage.substring(0, 50)}...`,
                updatedAt: new Date(),
            });
        }

        console.log(`✅ Agent message sent to ${patient.phone}`);

        return res.status(200).json({
            success: true,
            message: "Message sent successfully",
        });

    } catch (error) {
        console.error("❌ Agent Reply Error:", error.message, error.stack);
        return res.status(500).json({ error: error.message });
    }
}
