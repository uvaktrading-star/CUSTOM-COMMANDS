import { connectDB, UserCommand } from './db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'DELETE') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        await connectDB();

        const { id, botNumber } = req.query;

        if (!id || !botNumber) {
            return res.status(400).json({
                success: false,
                error: 'id and botNumber required'
            });
        }

        const result = await UserCommand.findOneAndDelete({
            _id: id,
            botNumber
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Command not found'
            });
        }

        res.json({ success: true, message: 'Command deleted' });

    } catch (e) {
        console.error('❌ [Delete] Error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}
