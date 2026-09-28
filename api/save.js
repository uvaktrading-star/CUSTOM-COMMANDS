import { connectDB, UserCommand } from './db.js';

export default async function handler(req, res) {
    // 🎯 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        await connectDB();

        const { botNumber, pattern, ...data } = req.body;

        // 🎯 Validation
        if (!botNumber || !pattern) {
            return res.status(400).json({
                success: false,
                error: 'botNumber and pattern are required'
            });
        }

        // 🎯 Pattern validation
        if (!/^[a-z0-9_]+$/.test(pattern.toLowerCase())) {
            return res.status(400).json({
                success: false,
                error: 'Pattern must contain only lowercase letters, numbers, and underscores'
            });
        }

        // 🎯 API URL validation (if api action)
        if (data.actionType === 'api' && data.apiUrl) {
            if (data.apiUrl.includes('localhost') || 
                data.apiUrl.includes('127.0.0.1') ||
                data.apiUrl.includes('192.168.') ||
                data.apiUrl.includes('169.254.')) {
                return res.status(400).json({
                    success: false,
                    error: 'Internal URLs are not allowed'
                });
            }
        }

        // 🎯 Upsert
        const command = await UserCommand.findOneAndUpdate(
            { botNumber, pattern: pattern.toLowerCase() },
            {
                ...data,
                botNumber,
                pattern: pattern.toLowerCase(),
                updatedAt: new Date()
            },
            { upsert: true, new: true, lean: true }
        );

        console.log('✅ [Save] Command saved:', pattern);

        res.json({
            success: true,
            message: 'Command saved successfully',
            command
        });

    } catch (e) {
        console.error('❌ [Save] Error:', e.message);

        if (e.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Command pattern already exists'
            });
        }

        res.status(500).json({ success: false, error: e.message });
    }
}
