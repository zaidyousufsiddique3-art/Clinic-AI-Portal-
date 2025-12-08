import { db } from "./firebase-admin.js";
import { sendWhatsAppMessage } from "./whatsapp-utils.js";

export default async function handler(req, res) {
    // Check authorization (Vercel Cron header)
    // if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return res.status(401).end('Unauthorized');
    // }
    // Not strictly required by prompt but good practice. Checking if user requested it... Not explicitly.

    if (!db) {
        return res.status(500).json({ error: "Database not initialized" });
    }

    try {
        const now = new Date();
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        // Find confirmed appointments in the next 2 hours where reminderSent is false
        // Note: Storing date as string or timestamp? Prompt said "updates.dateTime".
        // I will assume ISO string for query compatibility or Timestamp. 
        // If it's real timestamp objects (admin SDK), we use standard comparison.
        // If string, we might need to be careful. 
        // "dateTime is within next 2 hours".
        // I'll assume standard Firestore Timestamp or ISO string.
        // Let's assume ISO string to match previous code style, but Firestore timestamps are better.
        // I'll try to query for range.

        // Firestore query might require composite index if filtering by multiple fields.
        // We filter by: status == 'confirmed', reminderSent != true, dateTime > now, dateTime < twoHoursLater.
        // 'reminderSent != true' is hard in Firestore (no '!='). 
        // We can use 'reminderSent == false' or missing.
        // Usually easier to fetch 'status' == 'confirmed' and filtering in code if dataset is small, 
        // or 'reminderSent' == null.
        // Let's use 'reminderSent' == false (we should set it to false on creation logic, or check for non-existence).

        // Simplest: status == 'confirmed', dateTime >= now, dateTime <= twoHoursLater.
        // Then filter in code for reminderSent.

        const snapshot = await db.collection("appointments")
            .where("status", "==", "confirmed")
            .where("dateTime", ">=", now.toISOString())
            .where("dateTime", "<=", twoHoursLater.toISOString())
            .get();

        const emailsToSend = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.reminderSent) {
                emailsToSend.push({ id: doc.id, ...data });
            }
        });

        let count = 0;
        for (const appt of emailsToSend) {
            // We need patient phone. Fetch patient.
            const patientDoc = await db.collection("patients").doc(appt.patientId).get();
            if (patientDoc.exists) {
                const patient = patientDoc.data();
                const timeString = new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                const message = `Reminder: You have an appointment today at ${timeString}. Please arrive 10 minutes early.`;

                const sent = await sendWhatsAppMessage(patient.phone, message);

                if (sent) {
                    await db.collection("appointments").doc(appt.id).update({ reminderSent: true });
                    count++;
                }
            }
        }

        return res.status(200).json({ success: true, processed: count });

    } catch (error) {
        console.error("Cron Reminder Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
