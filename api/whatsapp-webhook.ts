import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
    const VERIFY_TOKEN = "clinicai_verify_2025";

    // GET: Webhook verification
    if (req.method === "GET") {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        } else {
            return res.status(403).send("Verification failed");
        }
    }

    // POST: Incoming webhook events
    if (req.method === "POST") {
        console.log("Incoming WhatsApp webhook:", JSON.stringify(req.body, null, 2));
        return res.status(200).json({ status: "received" });
    }

    return res.status(405).send("Method Not Allowed");
}
