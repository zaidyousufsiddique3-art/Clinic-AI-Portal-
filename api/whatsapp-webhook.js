import { sendWhatsAppMessage } from "./whatsapp-utils.js";
import { detectLanguage, generateAIReply, analyzeIntent } from "./ai-service.js";

// ========== HELPER FUNCTIONS (from previous implementation) ==========

function extractEmail(text) {
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    const match = text.match(emailRegex);
    return match ? match[0] : null;
}

function extractPhone(text) {
    const cleaned = text.replace(/\s+/g, '');
    const phoneRegex = /(\+?\d{8,15})/;
    const match = cleaned.match(phoneRegex);
    return match ? match[0] : null;
}

async function updateLeadActivity(db, patientId, messageText, stage = null, service = null) {
    try {
        const snap = await db.collection("leads")
            .where("patientId", "==", patientId)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (snap.empty) {
            console.log(`⚠️ No lead found for patient ${patientId} to update.`);
            return;
        }

        const leadRef = snap.docs[0].ref;

        const updates = {
            lastMessage: messageText,
            updatedAt: new Date(),
        };

        if (stage) updates.stage = stage;
        if (service) updates.service = service;

        await leadRef.update(updates);
        console.log(`✅ Updated lead for patient ${patientId}`);
    } catch (error) {
        console.error("❌ Error updating lead:", error.message);
    }
}

function detectService(text) {
    const lowered = text.toLowerCase();

    if (lowered.includes("whitening")) return "Whitening";
    if (lowered.includes("invisalign")) return "Invisalign";
    if (lowered.includes("clean")) return "Cleaning";
    if (lowered.includes("brace")) return "Braces";
    if (lowered.includes("implant")) return "Implants";
    if (lowered.includes("checkup") || lowered.includes("check-up")) return "Checkup";

    return null;
}

async function getOrCreatePatient(db, phone) {
    const snap = await db.collection("patients").where("phone", "==", phone).get();

    if (!snap.empty) {
        const doc = snap.docs[0];
        await doc.ref.update({ lastSeenAt: new Date() });
        return { id: doc.id, ...doc.data() };
    }

    const patientRef = await db.collection("patients").add({
        phone,
        email: null,
        name: null,
        createdAt: new Date(),
        lastSeenAt: new Date(),
    });

    console.log(`✅ Created new patient: ${patientRef.id}`);

    await db.collection("leads").add({
        patientId: patientRef.id,
        source: "whatsapp",
        stage: "New",
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await db.collection("conversations").add({
        patientId: patientRef.id,
        state: "collecting_contact",
        mode: "bot",
        createdAt: new Date(),
        lastMessageAt: new Date(),
    });

    return { id: patientRef.id, phone, isNew: true };
}

async function handleCollectingContact(db, conversation, patient, text) {
    const email = extractEmail(text);
    const phone = extractPhone(text);

    let updatedEmail = patient.email;
    let updatedPhone = patient.phone;
    let changed = false;

    if (email && !patient.email) {
        updatedEmail = email;
        changed = true;
    }

    if (phone && patient.phone !== phone) {
        updatedPhone = phone;
        changed = true;
    }

    if (changed) {
        await db.collection("patients").doc(patient.id).update({
            email: updatedEmail,
            phone: updatedPhone,
        });
        console.log(`✅ Updated patient contact info for ${patient.id}`);
    }

    if ((patient.email || updatedEmail) && (patient.phone || updatedPhone)) {
        await db.collection("conversations").doc(conversation.id).update({ state: "ready" });
        await updateLeadActivity(db, patient.id, text, "Contacted");

        await sendWhatsAppMessage(patient.phone, `
Great! 🎉 Your details are saved.

How can we help you today?
Examples:
- Whitening
- Invisalign
- Braces
- Implants
- Cleaning
    `);

        return true;
    }

    await sendWhatsAppMessage(patient.phone, `
Before we continue, please send your email and phone number 😊
  `);

    return true;
}

// ========== NEW AI & BOOKING FUNCTIONS ==========

async function saveMessage(db, conversationId, patientId, from, text, language) {
    try {
        await db.collection("messages").add({
            conversationId,
            patientId,
            from, // "bot" | "patient" | "staff"
            text,
            language,
            createdAt: new Date(),
        });
    } catch (error) {
        console.error("Error saving message:", error);
    }
}

async function getKnowledgeBase(db) {
    try {
        const snapshot = await db.collection("knowledge_base").get();
        const kb = [];
        snapshot.forEach(doc => {
            kb.push({ id: doc.id, ...doc.data() });
        });
        return kb;
    } catch (error) {
        console.error("Error fetching knowledge base:", error);
        return [];
    }
}

async function getConversationHistory(db, conversationId, limit = 10) {
    try {
        const snapshot = await db.collection("messages")
            .where("conversationId", "==", conversationId)
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get();

        const history = [];
        snapshot.forEach(doc => {
            const msg = doc.data();
            history.push({
                role: msg.from === "patient" ? "user" : "assistant",
                content: msg.text
            });
        });

        return history.reverse(); // Oldest first
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
}

async function handleBookingIntent(db, conversation, patient, intentData) {
    const { date } = intentData;

    if (!date) {
        // Ask for date/time
        await db.collection("conversations").doc(conversation.id).update({
            state: "awaiting_datetime"
        });

        await sendWhatsAppMessage(patient.phone,
            "When would you like to come in? Please provide a date and time (e.g., 'Tomorrow at 3pm' or 'December 15 at 10am')."
        );
        return true;
    }

    // We have a date, check availability
    await db.collection("conversations").doc(conversation.id).update({
        state: "checking_availability"
    });

    // Simplified: Find any available doctor (in real system, check working hours & existing appointments)
    const doctorsSnap = await db.collection("doctors").limit(1).get();

    if (doctorsSnap.empty) {
        await sendWhatsAppMessage(patient.phone,
            "We're currently unable to schedule appointments. Please call our office."
        );
        return true;
    }

    const doctor = { id: doctorsSnap.docs[0].id, ...doctorsSnap.docs[0].data() };

    // Create appointment
    const appointmentRef = await db.collection("appointments").add({
        patientId: patient.id,
        doctorId: doctor.id,
        dateTime: date, // ISO string from intent analysis
        status: "confirmed",
        createdAt: new Date(),
        reminderSent: false,
        feedbackRequested: false
    });

    // Update lead stage
    await updateLeadActivity(db, patient.id, "Booking confirmed", "Booked");

    // Update conversation state
    await db.collection("conversations").doc(conversation.id).update({
        state: "appointment_confirmed"
    });

    // Confirm via WhatsApp
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString();
    const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    await sendWhatsAppMessage(patient.phone,
        `✅ Your appointment is confirmed!\n\nDate: ${formattedDate}\nTime: ${formattedTime}\nDoctor: ${doctor.name || 'Dr. ' + doctor.id}\n\nWe'll send you a reminder before your appointment. See you soon!`
    );

    return true;
}

async function checkForHandoff(db, conversation, patient, text, intentData) {
    // Check if manual handoff requested
    const lowerText = text.toLowerCase();
    const handoffKeywords = ["speak to human", "talk to staff", "real person", "not helpful", "urgent pain", "emergency"];

    const needsHandoff = handoffKeywords.some(keyword => lowerText.includes(keyword))
        || intentData.intent === "urgent"
        || intentData.intent === "human_handoff"
        || (intentData.confidence && intentData.confidence < 0.7);

    if (needsHandoff) {
        // Trigger handoff
        await db.collection("conversations").doc(conversation.id).update({
            mode: "human",
            handoverReason: "auto_confidence",
            handoverAt: new Date().toISOString()
        });

        // Create notification
        await db.collection("agent_notifications").add({
            conversationId: conversation.id,
            patientId: patient.id,
            type: "handover",
            message: `Patient needs assistance: "${text.substring(0, 50)}..."`,
            createdAt: new Date(),
            seen: false
        });

        await sendWhatsAppMessage(patient.phone,
            "I'll connect you with a staff member who can better assist you. Please hold on."
        );

        return true;
    }

    return false;
}

// ========== MAIN WEBHOOK HANDLER ==========

export default async function handler(req, res) {
    // ========== GET: Meta Verification ==========
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

            console.log("📩 Message received:", { from, text: messageText });

            // Initialize Firebase
            let db;
            try {
                const firebaseModule = await import("./firebase-admin.js");
                db = firebaseModule.db;
                if (!firebaseModule.isInitialized || !db) {
                    console.error("Firebase not initialized");
                    return res.status(200).send("OK");
                }
            } catch (e) {
                console.error("Failed to import/init firebase:", e);
                return res.status(200).send("OK");
            }

            // 1. Get or Create Patient
            const patient = await getOrCreatePatient(db, from);

            // 2. Get/Create Conversation
            let conversation = null;
            const convSnap = await db.collection("conversations")
                .where("patientId", "==", patient.id)
                .orderBy("createdAt", "desc")
                .limit(1)
                .get();

            if (!convSnap.empty) {
                conversation = { id: convSnap.docs[0].id, ...convSnap.docs[0].data() };
            } else {
                const initialState = (!patient.email) ? "collecting_contact" : "ready";
                const ref = await db.collection("conversations").add({
                    patientId: patient.id,
                    state: initialState,
                    mode: "bot",
                    createdAt: new Date(),
                    lastMessageAt: new Date()
                });
                conversation = { id: ref.id, patientId: patient.id, state: initialState, mode: "bot" };
            }

            // 3. Detect Language
            const detectedLanguage = detectLanguage(messageText);

            // 4. Save Incoming Message to Firestore
            await saveMessage(db, conversation.id, patient.id, "patient", messageText, detectedLanguage);

            // 5. Update Lead Activity & Detect Service
            const service = detectService(messageText);
            await updateLeadActivity(db, patient.id, messageText, null, service);

            // 6. Check if in Human Mode (stop bot replies)
            if (conversation.mode === "human") {
                console.log("Conversation in human mode, bot will not reply");
                await db.collection("conversations").doc(conversation.id).update({
                    lastMessageAt: new Date()
                });
                return res.status(200).send("OK");
            }

            // 7. State Machine Logic
            let handled = false;

            // A. Collecting Contact State
            if (conversation.state === "collecting_contact") {
                handled = await handleCollectingContact(db, conversation, patient, messageText);

                // Save bot reply (already sent in handleCollectingContact)
                // We'd need to refactor to return the message text to save it, but for now this is acceptable
                return res.status(200).send("OK");
            }

            // B. Awaiting DateTime for Booking
            if (conversation.state === "awaiting_datetime") {
                const intentData = await analyzeIntent(messageText);
                if (intentData.date) {
                    await handleBookingIntent(db, conversation, patient, intentData);
                    return res.status(200).send("OK");
                } else {
                    await sendWhatsAppMessage(patient.phone,
                        "I couldn't understand the date/time. Could you please specify again? (e.g., 'Tomorrow at 3pm')"
                    );
                    return res.status(200).send("OK");
                }
            }

            // C. Ready State - Process Intent
            if (conversation.state === "ready" || conversation.state === "appointment_confirmed") {
                // Analyze intent
                const intentData = await analyzeIntent(messageText);
                console.log("Intent:", intentData);

                // Check for handoff conditions
                const handedOff = await checkForHandoff(db, conversation, patient, messageText, intentData);
                if (handedOff) {
                    return res.status(200).send("OK");
                }

                // Handle booking intent
                if (intentData.intent === "booking") {
                    await handleBookingIntent(db, conversation, patient, intentData);
                    return res.status(200).send("OK");
                }

                // Otherwise, generate AI reply
                const knowledgeBase = await getKnowledgeBase(db);
                const history = await getConversationHistory(db, conversation.id);

                const aiReply = await generateAIReply({
                    userText: messageText,
                    history: history,
                    language: detectedLanguage,
                    knowledgeBase: knowledgeBase
                });

                // Send AI reply
                await sendWhatsAppMessage(patient.phone, aiReply);

                // Save bot reply to Firestore
                await saveMessage(db, conversation.id, patient.id, "bot", aiReply, detectedLanguage);

                // Update conversation timestamp
                await db.collection("conversations").doc(conversation.id).update({
                    lastMessageAt: new Date()
                });
            }

            return res.status(200).send("OK");

        } catch (err) {
            console.error("❌ Webhook error:", err.message);
            return res.status(200).send("OK");
        }
    }

    return res.status(405).send("Method not allowed");
}
