import { db } from "./firebase-admin.js";
import { sendWhatsAppMessage } from "./whatsapp-utils.js";

export default async function handler(req, res) {
    if (!db) {
        return res.status(500).json({ error: "Database not initialized" });
    }

    try {
        const now = new Date();

        // Find past appointments where feedback hasn't been requested
        // dateTime < now, status = 'confirmed', feedbackRequested != true
        const snapshot = await db.collection("appointments")
            .where("status", "==", "confirmed")
            .where("dateTime", "<", now.toISOString())
            .get();

        const toFollowUp = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.feedbackRequested) {
                toFollowUp.push({ id: doc.id, ...data });
            }
        });

        let count = 0;
        for (const appt of toFollowUp) {
            // Fetch patient for phone
            const patientDoc = await db.collection("patients").doc(appt.patientId).get();
            if (patientDoc.exists) {
                const patient = patientDoc.data();

                const message = `We hope your visit went well! Could you rate your experience from 1–5?`;

                const sent = await sendWhatsAppMessage(patient.phone, message);

                if (sent) {
                    await db.collection("appointments").doc(appt.id).update({
                        feedbackRequested: true,
                        feedbackRequestedAt: new Date().toISOString()
                    });
                    count++;
                }
            }
        }

        return res.status(200).json({ success: true, processed: count });

    } catch (error) {
        console.error("Cron Followup Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
