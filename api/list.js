import { connectDB, UserCommand } from './db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        await connectDB();

        const { botNumber } = req.query;

        if (!botNumber) {
            return res.status(400).json({
                success: false,
                error: 'botNumber is required'
            });
        }

        const commands = await UserCommand.find({ botNumber })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            total: commands.length,
            commands
        });

    } catch (e) {
        console.error('❌ [List] Error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}
