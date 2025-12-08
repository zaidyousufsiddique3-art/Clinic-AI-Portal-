import { sendWhatsAppMessage } from "./whatsapp-utils.js";
import {
    detectLanguage,
    analyzeMessage,
    buildKnowledgeContext,
    generateClinicReply,
    parseDateTimeFromMessage,
    checkDoctorAvailability,
    generateAvailableSlots,
} from "./ai-service.js";

// ========== HELPER FUNCTIONS ==========

function extractEmail(text) {
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    const match = text.match(emailRegex);
    return match ? match[0].toLowerCase() : null;
}

function extractPhone(text) {
    const cleaned = text.replace(/\s+/g, "");
    const phoneRegex = /(\+?\d{8,15})/;
    const match = cleaned.match(phoneRegex);
    return match ? match[0] : null;
}

// ========== DATABASE OPERATIONS ==========

async function getOrCreatePatient(db, phone) {
    try {
        const snap = await db.collection("patients").where("phone", "==", phone).get();

        if (!snap.empty) {
            const doc = snap.docs[0];
            await doc.ref.update({ lastSeenAt: new Date() });
            return { id: doc.id, ...doc.data(), isNew: false };
        }

        // Create new patient
        const patientRef = await db.collection("patients").add({
            phone,
            email: null,
            name: null,
            language: null,
            createdAt: new Date(),
            lastSeenAt: new Date(),
        });

        console.log(`✅ Created new patient: ${patientRef.id}`);
        return { id: patientRef.id, phone, email: null, name: null, isNew: true };
    } catch (error) {
        console.error("❌ Error in getOrCreatePatient:", error.message);
        throw error;
    }
}

async function getOrCreateLead(db, patientId) {
    try {
        const snap = await db
            .collection("leads")
            .where("patientId", "==", patientId)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (!snap.empty) {
            const doc = snap.docs[0];
            return { id: doc.id, ...doc.data() };
        }

        // Create new lead
        const leadRef = await db.collection("leads").add({
            patientId,
            source: "whatsapp",
            service: null,
            status: "new",
            reason: null,
            lastMessage: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log(`✅ Created new lead: ${leadRef.id}`);
        return { id: leadRef.id, patientId, status: "new" };
    } catch (error) {
        console.error("❌ Error in getOrCreateLead:", error.message);
        throw error;
    }
}

async function getOrCreateConversation(db, patientId, hasEmail) {
    try {
        const snap = await db
            .collection("conversations")
            .where("patientId", "==", patientId)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (!snap.empty) {
            const doc = snap.docs[0];
            await doc.ref.update({ lastMessageAt: new Date() });
            return { id: doc.id, ...doc.data() };
        }

        // Create new conversation
        const initialState = hasEmail ? "ready" : "collecting_contact";
        const convRef = await db.collection("conversations").add({
            patientId,
            state: initialState,
            mode: "bot",
            language: null,
            currentAppointmentId: null,
            lastMessageAt: new Date(),
            createdAt: new Date(),
        });

        console.log(`✅ Created new conversation: ${convRef.id}`);
        return { id: convRef.id, patientId, state: initialState, mode: "bot" };
    } catch (error) {
        console.error("❌ Error in getOrCreateConversation:", error.message);
        throw error;
    }
}

async function saveMessage(db, conversationId, patientId, from, text, messageType, language, rawPayload = null) {
    try {
        await db.collection("messages").add({
            conversationId,
            patientId,
            from, // "patient" | "bot" | "agent"
            text,
            type: messageType || "text",
            language: language || null,
            rawPayload: rawPayload || null,
            createdAt: new Date(),
        });
    } catch (error) {
        console.error("❌ Error saving message:", error.message);
    }
}

async function updatePatient(db, patientId, updates) {
    try {
        await db.collection("patients").doc(patientId).update(updates);
    } catch (error) {
        console.error("❌ Error updating patient:", error.message);
    }
}

async function updateLead(db, leadId, updates) {
    try {
        await db.collection("leads").doc(leadId).update({
            ...updates,
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error("❌ Error updating lead:", error.message);
    }
}

async function updateConversation(db, conversationId, updates) {
    try {
        await db.collection("conversations").doc(conversationId).update({
            ...updates,
            lastMessageAt: new Date(),
        });
    } catch (error) {
        console.error("❌ Error updating conversation:", error.message);
    }
}

async function getKnowledgeBase(db) {
    try {
        const snapshot = await db.collection("knowledge_base").limit(20).get();
        const kb = [];
        snapshot.forEach((doc) => {
            kb.push({ id: doc.id, ...doc.data() });
        });
        return kb;
    } catch (error) {
        console.error("❌ Error fetching knowledge base:", error.message);
        return [];
    }
}

async function getConversationHistory(db, conversationId, limit = 10) {
    try {
        const snapshot = await db
            .collection("messages")
            .where("conversationId", "==", conversationId)
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get();

        const history = [];
        snapshot.forEach((doc) => {
            const msg = doc.data();
            history.push({
                role: msg.from === "patient" ? "user" : "assistant",
                content: msg.text,
            });
        });

        return history.reverse(); // Oldest first
    } catch (error) {
        console.error("❌ Error fetching history:", error.message);
        return [];
    }
}

async function findMatchingDoctor(db, serviceTags) {
    try {
        let query = db.collection("doctors").where("isActive", "==", true);
        const snapshot = await query.get();

        if (snapshot.empty) return null;

        // Score doctors by tag matching
        const doctors = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            let score = 0;
            const docTags = (data.tags || []).map((t) => t.toLowerCase());

            serviceTags.forEach((tag) => {
                if (docTags.includes(tag.toLowerCase())) {
                    score += 2;
                }
            });

            doctors.push({ id: doc.id, ...data, score });
        });

        // Sort by score and return best match
        doctors.sort((a, b) => b.score - a.score);
        return doctors[0] || null;
    } catch (error) {
        console.error("❌ Error finding doctor:", error.message);
        return null;
    }
}

async function getDoctorAppointments(db, doctorId, date) {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const snapshot = await db
            .collection("appointments")
            .where("doctorId", "==", doctorId)
            .where("dateTime", ">=", startOfDay)
            .where("dateTime", "<=", endOfDay)
            .where("status", "in", ["pending", "confirmed"])
            .get();

        const appointments = [];
        snapshot.forEach((doc) => {
            appointments.push({ id: doc.id, ...doc.data() });
        });

        return appointments;
    } catch (error) {
        console.error("❌ Error fetching appointments:", error.message);
        return [];
    }
}

async function createAppointment(db, patientId, leadId, doctorId, dateTime) {
    try {
        const ref = await db.collection("appointments").add({
            patientId,
            leadId,
            doctorId,
            dateTime: new Date(dateTime),
            status: "pending",
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return ref.id;
    } catch (error) {
        console.error("❌ Error creating appointment:", error.message);
        return null;
    }
}

async function createAgentNotification(db, conversationId, patientId, type, reason) {
    try {
        await db.collection("agent_notifications").add({
            conversationId,
            patientId,
            type,
            reason,
            resolved: false,
            createdAt: new Date(),
        });
    } catch (error) {
        console.error("❌ Error creating notification:", error.message);
    }
}

// ========== STATE MACHINE HANDLERS ==========

async function handleCollectingContact(db, conversation, patient, lead, messageText, analysis, language) {
    const { extractedEmail, extractedPhone } = analysis;

    // Also try regex extraction as backup
    const regexEmail = extractedEmail || extractEmail(messageText);
    const regexPhone = extractedPhone || extractPhone(messageText);

    let updates = {};
    let hasNewInfo = false;

    if (regexEmail && !patient.email) {
        updates.email = regexEmail;
        hasNewInfo = true;
    }

    if (regexPhone && patient.phone !== regexPhone) {
        // Don't update phone usually, as we already have it from WhatsApp
    }

    // Check if we already have email
    const currentEmail = updates.email || patient.email;

    if (hasNewInfo) {
        await updatePatient(db, patient.id, updates);
        console.log(`✅ Updated patient contact info`);
    }

    if (currentEmail) {
        // We have email, move to ready state
        await updateConversation(db, conversation.id, { state: "ready" });
        await updateLead(db, lead.id, { status: "contacted" });

        const readyMessages = {
            en: `Perfect, thank you! 🎉\n\nHow can we help you today?\n• Teeth whitening\n• Braces/Invisalign\n• Dental checkup\n• Tooth pain\n• Implants`,
            ar: `ممتاز، شكراً لك! 🎉\n\nكيف يمكننا مساعدتك اليوم؟\n• تبييض الأسنان\n• تقويم الأسنان\n• فحص الأسنان\n• ألم الأسنان\n• زراعة الأسنان`,
        };

        const reply = readyMessages[language] || readyMessages.en;
        await sendWhatsAppMessage(patient.phone, reply);
        await saveMessage(db, conversation.id, patient.id, "bot", reply, "text", language);

        return true;
    }

    // Still missing email, ask for it
    const askEmailMessages = {
        en: `Before we continue, could you please share your email address? 📧\n\nThis helps us send appointment confirmations and important updates.`,
        ar: `قبل أن نتابع، هل يمكنك مشاركة عنوان بريدك الإلكتروني؟ 📧\n\nهذا يساعدنا في إرسال تأكيدات المواعيد.`,
    };

    const reply = askEmailMessages[language] || askEmailMessages.en;
    await sendWhatsAppMessage(patient.phone, reply);
    await saveMessage(db, conversation.id, patient.id, "bot", reply, "text", language);

    return true;
}

async function handleReadyState(db, conversation, patient, lead, messageText, analysis, language, knowledgeBase) {
    const { intent, serviceTags, confidence } = analysis;

    // Update lead with detected service
    if (serviceTags.length > 0) {
        await updateLead(db, lead.id, { service: serviceTags[0] });
    }

    // Check for handoff conditions
    if (intent === "talk_to_human" || intent === "urgent_pain" || confidence < 0.4) {
        await handleHumanHandoff(db, conversation, patient, messageText, language, intent);
        return true;
    }

    // Handle booking intent
    if (intent === "book_appointment") {
        await updateConversation(db, conversation.id, { state: "awaiting_datetime" });
        await updateLead(db, lead.id, { status: "contacted" });

        const bookingMessages = {
            en: `Great! Let's schedule your appointment 📅\n\nWhen would you prefer to come in?\n(e.g., "Tomorrow at 3pm" or "Friday morning")`,
            ar: `رائع! دعنا نحجز موعدك 📅\n\nمتى تفضل الحضور؟\n(مثال: "غداً الساعة 3" أو "صباح الجمعة")`,
        };

        const reply = bookingMessages[language] || bookingMessages.en;
        await sendWhatsAppMessage(patient.phone, reply);
        await saveMessage(db, conversation.id, patient.id, "bot", reply, "text", language);

        return true;
    }

    // Generate AI reply for questions
    const knowledgeContext = buildKnowledgeContext(knowledgeBase, messageText, serviceTags);
    const history = await getConversationHistory(db, conversation.id);

    const reply = await generateClinicReply({
        messageText,
        conversation,
        patient,
        lead,
        knowledgeContext,
        language,
        intent,
        serviceTags,
    });

    await sendWhatsAppMessage(patient.phone, reply);
    await saveMessage(db, conversation.id, patient.id, "bot", reply, "text", language);

    // Update lead with last message
    await updateLead(db, lead.id, { lastMessage: messageText });

    return true;
}

async function handleAwaitingDateTime(db, conversation, patient, lead, messageText, analysis, language) {
    const { serviceTags } = analysis;

    // Parse the date/time from the message
    const parsedDateTime = await parseDateTimeFromMessage(messageText);

    if (!parsedDateTime.isValid || !parsedDateTime.dateTime) {
        const retryMessages = {
            en: `I couldn't understand that date/time. 🤔\n\nCould you please try again?\n(e.g., "December 15 at 2pm" or "Next Monday morning")`,
            ar: `لم أتمكن من فهم التاريخ/الوقت. 🤔\n\nهل يمكنك المحاولة مرة أخرى؟`,
        };

        const reply = retryMessages[language] || retryMessages.en;
        await sendWhatsAppMessage(patient.phone, reply);
        await saveMessage(db, conversation.id, patient.id, "bot", reply, "text", language);

        return true;
    }

    // Find a matching doctor
    const doctor = await findMatchingDoctor(db, serviceTags.length > 0 ? serviceTags : [lead.service || "general"]);

    if (!doctor) {
        const noDoctorMessages = {
            en: `I'm sorry, we don't have any doctors available right now. Please call our office to schedule. 📞`,
            ar: `عذراً، ليس لدينا أطباء متاحون حالياً. يرجى الاتصال بمكتبنا. 📞`,
        };

        const reply = noDoctorMessages[language] || noDoctorMessages.en;
        await sendWhatsAppMessage(patient.phone, reply);
        await saveMessage(db, conversation.id, patient.id, "bot", reply, "text", language);

        return true;
    }

    // Get existing appointments and generate available slots
    const existingAppointments = await getDoctorAppointments(db, doctor.id, parsedDateTime.dateTime);
    const availableSlots = generateAvailableSlots(doctor, parsedDateTime.dateTime, existingAppointments);

    if (availableSlots.length === 0) {
        const noSlotsMessages = {
            en: `Unfortunately, we don't have availability on ${parsedDateTime.dateString}. 😔\n\nCould you suggest another day?`,
            ar: `للأسف، ليس لدينا مواعيد متاحة في ${parsedDateTime.dateString}. 😔\n\nهل يمكنك اقتراح يوم آخر؟`,
        };

        const reply = noSlotsMessages[language] || noSlotsMessages.en;
        await sendWhatsAppMessage(patient.phone, reply);
        await saveMessage(db, conversation.id, patient.id, "bot", reply, "text", language);

        return true;
    }

    // Store proposed slots in conversation for confirmation
    await updateConversation(db, conversation.id, {
        state: "awaiting_confirmation",
        proposedSlots: availableSlots,
        proposedDoctorId: doctor.id,
    });

    // Format slot options
    const slotOptions = availableSlots
        .map((slot, i) => `${i + 1}. ${slot.dateString} at ${slot.timeString}`)
        .join("\n");

    const confirmMessages = {
        en: `Great! Dr. ${doctor.name} is available! 🎉\n\nPlease choose a slot:\n${slotOptions}\n\nReply with 1, 2, or 3 to confirm.`,
        ar: `رائع! د. ${doctor.name} متاح! 🎉\n\nاختر موعداً:\n${slotOptions}\n\nأرسل 1، 2، أو 3 للتأكيد.`,
    };

    const reply = confirmMessages[language] || confirmMessages.en;
    await sendWhatsAppMessage(patient.phone, reply);
    await saveMessage(db, conversation.id, patient.id, "bot", reply, "text", language);

    return true;
}

async function handleAwaitingConfirmation(db, conversation, patient, lead, messageText, analysis, language) {
    const { intent } = analysis;
    const proposedSlots = conversation.proposedSlots || [];
    const doctorId = conversation.proposedDoctorId;

    // Check if user is rejecting
    if (intent === "reject_slot" || messageText.toLowerCase().includes("no") || messageText.toLowerCase().includes("other")) {
        await updateConversation(db, conversation.id, {
            state: "awaiting_datetime",
            proposedSlots: null,
            proposedDoctorId: null,
        });

        const retryMessages = {
            en: `No problem! When else would work for you? 📅`,
            ar: `لا مشكلة! متى يناسبك أكثر؟ 📅`,
        };

        const reply = retryMessages[language] || retryMessages.en;
        await sendWhatsAppMessage(patient.phone, reply);
        await saveMessage(db, conversation.id, patient.id, "bot", reply, "text", language);

        return true;
    }

    // Try to extract slot choice (1, 2, 3 or "first", "second", etc.)
    let selectedIndex = -1;
    const lowerText = messageText.toLowerCase().trim();

    if (lowerText === "1" || lowerText.includes("first") || lowerText.includes("one")) {
        selectedIndex = 0;
    } else if (lowerText === "2" || lowerText.includes("second") || lowerText.includes("two")) {
        selectedIndex = 1;
    } else if (lowerText === "3" || lowerText.includes("third") || lowerText.includes("three")) {
        selectedIndex = 2;
    } else if (intent === "confirm_slot" || lowerText.includes("yes") || lowerText.includes("ok") || lowerText.includes("confirm")) {
        selectedIndex = 0; // Default to first slot if just confirming
    }

    if (selectedIndex < 0 || selectedIndex >= proposedSlots.length) {
        const clarifyMessages = {
            en: `Please reply with 1, 2, or 3 to select your preferred time slot, or say "other" for different options.`,
            ar: `أرسل 1، 2، أو 3 لاختيار موعدك، أو قل "آخر" لخيارات مختلفة.`,
        };

        const reply = clarifyMessages[language] || clarifyMessages.en;
        await sendWhatsAppMessage(patient.phone, reply);
        await saveMessage(db, conversation.id, patient.id, "bot", reply, "text", language);

        return true;
    }

    // Create the appointment
    const selectedSlot = proposedSlots[selectedIndex];
    const appointmentId = await createAppointment(db, patient.id, lead.id, doctorId, selectedSlot.dateTime);

    if (!appointmentId) {
        const errorMessages = {
            en: `Sorry, there was an error booking your appointment. Please try again or call our office. 📞`,
            ar: `عذراً، حدث خطأ في حجز موعدك. يرجى المحاولة مرة أخرى أو الاتصال بمكتبنا. 📞`,
        };

        const reply = errorMessages[language] || errorMessages.en;
        await sendWhatsAppMessage(patient.phone, reply);
        await saveMessage(db, conversation.id, patient.id, "bot", reply, "text", language);

        return true;
    }

    // Get doctor info for confirmation message
    const doctorDoc = await db.collection("doctors").doc(doctorId).get();
    const doctor = doctorDoc.exists ? doctorDoc.data() : { name: "Our Doctor" };

    // Update conversation and lead
    await updateConversation(db, conversation.id, {
        state: "ready",
        currentAppointmentId: appointmentId,
        proposedSlots: null,
        proposedDoctorId: null,
    });

    await updateLead(db, lead.id, { status: "booked" });

    // Send confirmation
    const confirmationMessages = {
        en: `✅ Your appointment is confirmed!\n\n📅 ${selectedSlot.dateString}\n⏰ ${selectedSlot.timeString}\n👨‍⚕️ Dr. ${doctor.name}\n\nWe'll send you a reminder before your visit. See you soon! 😊`,
        ar: `✅ تم تأكيد موعدك!\n\n📅 ${selectedSlot.dateString}\n⏰ ${selectedSlot.timeString}\n👨‍⚕️ د. ${doctor.name}\n\nسنرسل لك تذكيراً قبل موعدك. نراكم قريباً! 😊`,
    };

    const reply = confirmationMessages[language] || confirmationMessages.en;
    await sendWhatsAppMessage(patient.phone, reply);
    await saveMessage(db, conversation.id, patient.id, "bot", reply, "text", language);

    return true;
}

async function handleHumanHandoff(db, conversation, patient, messageText, language, reason) {
    await updateConversation(db, conversation.id, {
        state: "human_handoff",
        mode: "human",
    });

    await createAgentNotification(
        db,
        conversation.id,
        patient.id,
        reason === "urgent_pain" ? "complex_question" : "handoff_requested",
        messageText.substring(0, 100)
    );

    const handoffMessages = {
        en: `I understand you'd like to speak with someone from our team. 🙏\n\nA staff member will be with you shortly. Thank you for your patience!`,
        ar: `أفهم أنك تريد التحدث مع أحد أعضاء فريقنا. 🙏\n\nسيكون معك أحد الموظفين قريباً. شكراً لصبرك!`,
    };

    const reply = handoffMessages[language] || handoffMessages.en;
    await sendWhatsAppMessage(patient.phone, reply);
    await saveMessage(db, conversation.id, patient.id, "bot", reply, "text", language);
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
        console.log("🔥 NEW WHATSAPP WEBHOOK EXECUTING", Date.now());
        console.log("📨 POST request received");
        console.log("RAW WEBHOOK:", JSON.stringify(req.body, null, 2));

        try {
            const body = req.body || {};

            // Extract with safer fallback structure
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const messages = value?.messages || [];
            const statuses = value?.statuses || [];

            // Handle status updates (delivery/read receipts)
            if (messages.length === 0 && statuses.length > 0) {
                console.log("📊 Status update:", statuses[0]?.status);
                return res.status(200).send("OK");
            }

            // No messages
            if (messages.length === 0) {
                console.log("⚠️ No message in payload");
                return res.status(200).send("OK");
            }

            const message = messages[0];
            console.log("📩 Message:", JSON.stringify(message, null, 2));

            // Extract sender phone number
            const from = message.from;
            if (!from) {
                console.log("❌ No sender phone");
                return res.status(200).send("OK");
            }

            // Extract message text based on type
            let messageText = "";
            const messageType = message.type || "unknown";

            switch (messageType) {
                case "text":
                    messageText = message.text?.body || "";
                    break;
                case "interactive":
                    if (message.interactive?.button_reply) {
                        messageText = message.interactive.button_reply.title || message.interactive.button_reply.id || "";
                    } else if (message.interactive?.list_reply) {
                        messageText = message.interactive.list_reply.title || message.interactive.list_reply.id || "";
                    }
                    break;
                case "image":
                    messageText = message.image?.caption || "[Image received]";
                    break;
                case "document":
                    messageText = message.document?.caption || "[Document received]";
                    break;
                case "audio":
                    messageText = "[Audio message - please type your request]";
                    break;
                case "video":
                    messageText = message.video?.caption || "[Video received]";
                    break;
                case "location":
                    messageText = "[Location shared]";
                    break;
                case "contacts":
                    messageText = "[Contact shared]";
                    break;
                default:
                    messageText = `[${messageType} message received]`;
            }

            console.log("✅ Extracted:", { from, text: messageText, type: messageType });

            // Initialize Firebase
            let db;
            try {
                const firebaseModule = await import("./firebase-admin.js");
                db = firebaseModule.db;
                if (!firebaseModule.isInitialized || !db) {
                    console.error("❌ Firebase not initialized");
                    return res.status(200).send("OK");
                }
            } catch (e) {
                console.error("❌ Firebase import failed:", e.message);
                return res.status(200).send("OK");
            }

            // ========== CORE LOGIC ==========

            // 1. Get or create patient
            const patient = await getOrCreatePatient(db, from);

            // 2. Get or create lead
            const lead = await getOrCreateLead(db, patient.id);

            // 3. Get or create conversation
            const conversation = await getOrCreateConversation(db, patient.id, !!patient.email);

            // 4. Detect language
            const language = detectLanguage(messageText);

            // 5. Save incoming message
            await saveMessage(db, conversation.id, patient.id, "patient", messageText, messageType, language, message);

            // Update patient language if detected
            if (language && language !== patient.language) {
                await updatePatient(db, patient.id, { language });
            }

            // 6. Check mode - if human mode, don't respond
            if (conversation.mode === "human") {
                console.log("🧑‍💼 Conversation in human mode - bot silent");
                return res.status(200).send("OK");
            }

            // 7. Get knowledge base for context
            const knowledgeBase = await getKnowledgeBase(db);

            // 8. Analyze message with AI
            const history = await getConversationHistory(db, conversation.id);
            const knowledgeContext = buildKnowledgeContext(knowledgeBase, messageText, []);
            const analysis = await analyzeMessage(messageText, history, knowledgeContext);

            console.log("🧠 Analysis:", JSON.stringify(analysis, null, 2));

            // 9. State machine processing
            switch (conversation.state) {
                case "collecting_contact":
                    await handleCollectingContact(db, conversation, patient, lead, messageText, analysis, language);
                    break;

                case "awaiting_datetime":
                    await handleAwaitingDateTime(db, conversation, patient, lead, messageText, analysis, language);
                    break;

                case "awaiting_confirmation":
                    await handleAwaitingConfirmation(db, conversation, patient, lead, messageText, analysis, language);
                    break;

                case "human_handoff":
                    // Should not reach here if mode is "human", but just in case
                    console.log("⚠️ In human_handoff state but mode is bot - ignoring");
                    break;

                case "ready":
                case "booking":
                default:
                    await handleReadyState(db, conversation, patient, lead, messageText, analysis, language, knowledgeBase);
                    break;
            }

            return res.status(200).send("OK");
        } catch (err) {
            console.error("❌ Webhook error:", err.message, err.stack);
            // Always return 200 to prevent Meta retries
            return res.status(200).send("OK");
        }
    }

    return res.status(405).send("Method not allowed");
}
