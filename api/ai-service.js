
import OpenAI from "openai";
import { db } from "./firebase-admin.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper: Detect language
export function detectLanguage(text) {
    // Simple heuristic or use OpenAI. 
    // For cost/speed, heuristic for common ones, else OpenAI.
    // But user requested "Simple heuristic OR OpenAI classification".
    // Let's use a very simple heuristic for Arabic/English/Urdu, falling back to English.

    const arabicPattern = /[\u0600-\u06FF]/;
    // const urduPattern = ... (similar to Arabic, hard to distinguish without more logic)

    if (arabicPattern.test(text)) return "ar";

    // Default to English if mostly Latin
    return "en";
}

// Helper: Generate AI Reply
export async function generateAIReply(promptContext) {
    const {
        userText,
        history, // array of {role: 'user'|'assistant', content: string}
        language,
        knowledgeBase // string or array of strings
    } = promptContext;

    const systemPrompt = `
You are ClinicAI, a smart, warm, and friendly assistant for a dental clinic.
Your goal is to help patients, answer questions based on the provided knowledge base, and encourage them to book an appointment.

RULES:
1. Language: Reply in the detected language: ${language}.
2. Tone: Warm, professional, empathetic.
3. Medical Advice: DO NOT provide medical diagnoses. improved generic advice and suggest seeing a doctor.
4. Bookings: Always gently encourage booking an appointment if the user seems interested or has a problem.
5. knowledge Base: Use the following information to answer questions. If the answer is not here, you can use general dental knowledge but mention you are an AI.
   ${knowledgeBase ? JSON.stringify(knowledgeBase) : "No specific knowledge base provided."}

Follow clinic policies.
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using the standard mini model
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: userText }
            ],
            temperature: 0.3,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI Error:", error);
        return "I'm having trouble connecting right now. Please try again later or call our office.";
    }
}

// Helper: Extract Intent & Entities (Booking)
export async function analyzeIntent(text) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Analyze the user's message. 
          Return a JSON object with:
          - intent: "booking" | "question" | "urgent" | "human_handoff" | "general"
          - date: ISO string if a date/time is mentioned (e.g. "tomorrow at 5pm"), else null.
          - confidence: number (0-1)
          
          User message: "${text}"`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (e) {
        console.error("Intent analysis failed:", e);
        return { intent: "general", confidence: 0 };
    }
}
