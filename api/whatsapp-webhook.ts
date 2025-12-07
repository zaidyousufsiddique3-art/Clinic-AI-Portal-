import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    api: {
        bodyParser: true,
    },
};

const VERIFY_TOKEN = 'clinicai_verify_2025';

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        } else {
            return res.status(403).send('Verification failed');
        }
    }

    if (req.method === 'POST') {
        console.log('Incoming webhook event:', JSON.stringify(req.body, null, 2));
        return res.status(200).json({ status: 'received' });
    }

    return res.status(405).send('Method Not Allowed');
}
