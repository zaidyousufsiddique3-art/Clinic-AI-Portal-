
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ========== LANGUAGE DETECTION ==========

export function detectLanguage(text) {
    if (!text) return "en";

    // Arabic script detection
    const arabicPattern = /[\u0600-\u06FF]/;
    if (arabicPattern.test(text)) return "ar";

    // Urdu/Persian (similar script)
    const urduPattern = /[\u0600-\u06FF\u0750-\u077F]/;
    if (urduPattern.test(text)) return "ur";

    // Hindi/Devanagari
    const hindiPattern = /[\u0900-\u097F]/;
    if (hindiPattern.test(text)) return "hi";

    // Chinese
    const chinesePattern = /[\u4e00-\u9fff]/;
    if (chinesePattern.test(text)) return "zh";

    // Default to English if mostly Latin
    return "en";
}

// ========== INTENT & SERVICE ANALYSIS ==========

export async function analyzeMessage(messageText, previousMessages = [], knowledgeContext = "") {
    try {
        const historyContext = previousMessages
            .slice(-5)
            .map(m => `${m.role}: ${m.content}`)
            .join("\n");

        const systemPrompt = `You are an intent analyzer for a dental clinic. Analyze the user's message and determine:

1. **language**: The language code (e.g., "en", "ar", "ur", "hi", "es", "fr")
2. **intent**: One of:
   - "greeting" (hello, hi, good morning)
   - "ask_question" (asking about services, prices, policies)
   - "book_appointment" (wants to schedule an appointment)
   - "change_appointment" (wants to reschedule)
   - "cancel_appointment" (wants to cancel)
   - "urgent_pain" (dental emergency, severe pain)
   - "talk_to_human" (explicitly asks for human/staff)
   - "provide_contact" (sharing email or phone number)
   - "confirm_slot" (accepting or confirming a proposed time)
   - "reject_slot" (declining a proposed time)
   - "general" (other)
3. **serviceTags**: Array of probable services mentioned (e.g., ["whitening"], ["implants"], ["braces"], ["root canal"], ["cleaning"], ["checkup"], ["extraction"])
4. **extractedEmail**: Email if found in the message, else null
5. **extractedPhone**: Phone number if found, else null
6. **proposedDateTime**: If the user mentions a date/time, parse it and return as ISO string (use today's date: ${new Date().toISOString().split('T')[0]} as reference), else null
7. **confidence**: A number from 0 to 1 indicating how confident you are in the intent classification

Context from previous messages:
${historyContext || "No previous context"}

Clinic Knowledge Context:
${knowledgeContext || "General dental clinic services"}

Respond ONLY with valid JSON.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `User message: "${messageText}"` }
            ],
            response_format: { type: "json_object" },
            temperature: 0,
            max_tokens: 500,
        });

        const result = JSON.parse(response.choices[0].message.content);

        return {
            language: result.language || "en",
            intent: result.intent || "general",
            serviceTags: result.serviceTags || [],
            extractedEmail: result.extractedEmail || null,
            extractedPhone: result.extractedPhone || null,
            proposedDateTime: result.proposedDateTime || null,
            confidence: typeof result.confidence === "number" ? result.confidence : 0.5,
        };
    } catch (error) {
        console.error("❌ analyzeMessage error:", error.message);
        return {
            language: detectLanguage(messageText),
            intent: "general",
            serviceTags: [],
            extractedEmail: null,
            extractedPhone: null,
            proposedDateTime: null,
            confidence: 0,
        };
    }
}

// Backward compatible version
export async function analyzeIntent(text) {
    const result = await analyzeMessage(text);
    return {
        intent: result.intent === "book_appointment" ? "booking" :
            result.intent === "urgent_pain" ? "urgent" :
                result.intent === "talk_to_human" ? "human_handoff" :
                    result.intent,
        date: result.proposedDateTime,
        confidence: result.confidence,
    };
}

// ========== KNOWLEDGE BASE CONTEXT BUILDER ==========

export function buildKnowledgeContext(knowledgeDocs, messageText, serviceTags = []) {
    if (!knowledgeDocs || knowledgeDocs.length === 0) {
        return "No specific clinic information available. Provide general dental guidance.";
    }

    const lowerMessage = messageText.toLowerCase();
    const tagSet = new Set(serviceTags.map(t => t.toLowerCase()));

    // Score each doc by relevance
    const scoredDocs = knowledgeDocs.map(doc => {
        let score = 0;
        const lowerTopic = (doc.topic || "").toLowerCase();
        const lowerContent = (doc.content || "").toLowerCase();
        const docTags = (doc.tags || []).map(t => t.toLowerCase());

        // Topic match
        if (lowerMessage.includes(lowerTopic)) score += 3;

        // Tag match
        docTags.forEach(tag => {
            if (lowerMessage.includes(tag)) score += 2;
            if (tagSet.has(tag)) score += 2;
        });

        // Content keyword match
        const words = lowerMessage.split(/\s+/);
        words.forEach(word => {
            if (word.length > 3 && lowerContent.includes(word)) score += 0.5;
        });

        return { ...doc, score };
    });

    // Sort by score and take top 5
    const topDocs = scoredDocs
        .filter(d => d.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    if (topDocs.length === 0) {
        // Take first few general docs
        return knowledgeDocs
            .slice(0, 3)
            .map(d => `**${d.topic}**: ${d.content}`)
            .join("\n\n");
    }

    return topDocs
        .map(d => `**${d.topic}**: ${d.content}`)
        .join("\n\n");
}

// ========== AI REPLY GENERATION ==========

const LANGUAGE_INSTRUCTIONS = {
    en: "Reply in English.",
    ar: "Reply in Arabic (العربية). Use proper Arabic script.",
    ur: "Reply in Urdu (اردو). Use proper Urdu script.",
    hi: "Reply in Hindi (हिंदी). Use proper Devanagari script.",
    es: "Reply in Spanish (Español).",
    fr: "Reply in French (Français).",
    zh: "Reply in Chinese (中文).",
};

export async function generateClinicReply({
    messageText,
    conversation,
    patient,
    lead,
    knowledgeContext,
    language,
    intent,
    serviceTags = [],
    proposedSlots = null,
}) {
    const langInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;

    let stateContext = "";
    switch (conversation?.state) {
        case "collecting_contact":
            stateContext = "We are currently collecting the patient's contact information (email and phone). Ask for any missing details warmly.";
            break;
        case "awaiting_datetime":
            stateContext = "The patient wants to book an appointment. We are waiting for them to suggest a preferred date/time.";
            break;
        case "awaiting_confirmation":
            stateContext = `We proposed these appointment slots: ${JSON.stringify(proposedSlots)}. Ask the patient to confirm one of these options.`;
            break;
        case "booking":
            stateContext = "The patient is in the appointment booking flow.";
            break;
        default:
            stateContext = "This is a general conversation. Help answer questions and guide toward booking if appropriate.";
    }

    const patientName = patient?.name || "valued patient";
    const leadService = lead?.service || serviceTags?.[0] || null;

    const systemPrompt = `You are ClinicAI, a warm, friendly, and professional dental clinic assistant.

## CORE RULES:
1. **Language**: ${langInstruction}
2. **Tone**: Warm, empathetic, conversational. Use short paragraphs. Add appropriate emojis sparingly (1-2 per message).
3. **Medical Advice**: NEVER give medical diagnoses. Always suggest seeing a dentist for specific symptoms.
4. **Bookings**: Gently encourage appointments when the patient shows interest or has a problem.
5. **Handoff**: If the question is too complex, say you'll connect them with a staff member.
6. **Knowledge**: Use ONLY the information provided below. If unsure, say so honestly.

## PATIENT CONTEXT:
- Name: ${patientName}
- Phone: ${patient?.phone || "unknown"}
- Email: ${patient?.email || "not provided"}
- Interested in: ${leadService || "general inquiry"}

## CONVERSATION STATE:
${stateContext}

## CLINIC KNOWLEDGE:
${knowledgeContext || "No specific clinic information available."}

## FORMATTING:
- Keep responses under 300 characters when possible for WhatsApp readability.
- Use line breaks for clarity.
- Be concise but warm.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: messageText }
            ],
            temperature: 0.7,
            max_tokens: 400,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("❌ generateClinicReply error:", error.message);

        // Fallback responses by language
        const fallbacks = {
            en: "I'm having trouble connecting right now. Please try again in a moment, or call our office directly. 📞",
            ar: "أواجه مشكلة في الاتصال الآن. يرجى المحاولة مرة أخرى أو الاتصال بمكتبنا مباشرة. 📞",
            ur: "ابھی کنکشن میں مسئلہ ہو رہا ہے۔ براہ کرم دوبارہ کوشش کریں یا براہ راست ہمارے دفتر کو کال کریں۔ 📞",
        };

        return fallbacks[language] || fallbacks.en;
    }
}

// Backward compatible version
export async function generateAIReply(promptContext) {
    const { userText, history, language, knowledgeBase } = promptContext;

    const knowledgeContext = typeof knowledgeBase === "string"
        ? knowledgeBase
        : buildKnowledgeContext(knowledgeBase, userText, []);

    return generateClinicReply({
        messageText: userText,
        conversation: { state: "ready" },
        patient: null,
        lead: null,
        knowledgeContext,
        language: language || "en",
        intent: "general",
    });
}

// ========== DATE/TIME PARSING ==========

export async function parseDateTimeFromMessage(messageText, referenceDate = new Date()) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Parse the date and time from the user's message. Today is ${referenceDate.toISOString().split('T')[0]}.
                    
Return a JSON object with:
- dateTime: ISO string of the parsed date/time (null if not parseable)
- dayOfWeek: The day of the week (e.g., "Monday")
- timeString: Human readable time (e.g., "3:00 PM")
- dateString: Human readable date (e.g., "December 15, 2024")
- isValid: boolean indicating if a valid date/time was found

If the user says "tomorrow", use the day after today.
If only a day is mentioned (e.g., "Friday"), use the next occurrence of that day.
If no time is mentioned, default to 10:00 AM.`
                },
                { role: "user", content: messageText }
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        console.error("❌ parseDateTimeFromMessage error:", error.message);
        return { dateTime: null, isValid: false };
    }
}

// ========== SLOT AVAILABILITY CHECK ==========

export function checkDoctorAvailability(doctor, requestedDateTime) {
    if (!doctor?.workingHours) return false;

    const date = new Date(requestedDateTime);
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const dayKey = dayNames[date.getDay()];

    const daySchedule = doctor.workingHours[dayKey];
    if (!daySchedule || daySchedule.length === 0) return false;

    const requestedTime = date.getHours() * 60 + date.getMinutes();

    for (const slot of daySchedule) {
        const [startHour, startMin] = slot.start.split(":").map(Number);
        const [endHour, endMin] = slot.end.split(":").map(Number);

        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        if (requestedTime >= startTime && requestedTime < endTime) {
            return true;
        }
    }

    return false;
}

export function generateAvailableSlots(doctor, requestedDate, existingAppointments = []) {
    if (!doctor?.workingHours) return [];

    const date = new Date(requestedDate);
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const dayKey = dayNames[date.getDay()];

    const daySchedule = doctor.workingHours[dayKey];
    if (!daySchedule || daySchedule.length === 0) return [];

    const slots = [];
    const bookedTimes = existingAppointments
        .filter(a => {
            const aDate = a.dateTime?.toDate ? a.dateTime.toDate() : new Date(a.dateTime);
            return aDate.toDateString() === date.toDateString();
        })
        .map(a => {
            const aDate = a.dateTime?.toDate ? a.dateTime.toDate() : new Date(a.dateTime);
            return aDate.getHours() * 60 + aDate.getMinutes();
        });

    for (const slot of daySchedule) {
        const [startHour, startMin] = slot.start.split(":").map(Number);
        const [endHour, endMin] = slot.end.split(":").map(Number);

        // Generate 30-minute slots
        for (let time = startHour * 60 + startMin; time < endHour * 60 + endMin; time += 30) {
            if (!bookedTimes.includes(time)) {
                const slotDate = new Date(date);
                slotDate.setHours(Math.floor(time / 60), time % 60, 0, 0);

                // Only future slots
                if (slotDate > new Date()) {
                    slots.push({
                        dateTime: slotDate.toISOString(),
                        timeString: slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        dateString: slotDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
                    });
                }
            }
        }
    }

    return slots.slice(0, 3); // Return top 3 available slots
}
