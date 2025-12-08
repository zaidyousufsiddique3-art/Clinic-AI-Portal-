
export async function sendWhatsAppMessage(to, bodyText) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
        console.error("❌ Missing WhatsApp credentials");
        return false;
    }

    try {
        const response = await fetch(
            `https://graph.facebook.com/v19.0/${phoneId}/messages`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: to,
                    type: "text",
                    text: { body: bodyText },
                }),
            }
        );

        if (!response.ok) {
            const err = await response.text();
            console.error("❌ WhatsApp API Error:", err);
            return false;
        } else {
            console.log(`✅ Sent WhatsApp message to ${to}`);
            return true;
        }
    } catch (error) {
        console.error("❌ Network Error sending WhatsApp message:", error.message);
        return false;
    }
}
