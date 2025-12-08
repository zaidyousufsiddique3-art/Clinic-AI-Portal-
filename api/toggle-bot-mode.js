import { db } from "./firebase-admin.js";

/**
 * Toggle Bot Mode API
 * POST /api/toggle-bot-mode
 * Body: { conversationId: string, mode: "bot" | "human" }
 */
export default async function handler(req, res) {
    // CORS headers for frontend usage
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
        const { conversationId, mode } = req.body;
        if (!conversationId || (mode !== "bot" && mode !== "human")) {
            return res.status(400).json({ error: "Missing or invalid conversationId/mode" });
        }

        const convRef = db.collection("conversations").doc(conversationId);
        const convSnap = await convRef.get();
        if (!convSnap.exists) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const updates: any = { mode };
        // If switching back to bot, reset state to ready unless already in a booking flow
        if (mode === "bot") {
            const data = convSnap.data();
            if (data && data.state && data.state !== "booking" && data.state !== "awaiting_datetime" && data.state !== "awaiting_confirmation") {
                updates.state = "ready";
            }
        } else {
            // human mode – set state to human_handoff for UI clarity
            updates.state = "human_handoff";
        }

        await convRef.update(updates);
        console.log(`✅ Conversation ${conversationId} mode set to ${mode}`);
        return res.status(200).json({ success: true, conversationId, mode });
    } catch (error) {
        console.error("❌ toggle-bot-mode error:", error);
        return res.status(500).json({ error: error.message });
    }
}
