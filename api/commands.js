import express from 'express';
import { UserCommand, connectDB } from './db.js';
import { authMiddleware } from './middleware.js';

const router = express.Router();

// ═══════════════════════════════════════════
// 🎯 GET ALL COMMANDS (botNumber එකට අදාල)
// ═══════════════════════════════════════════
router.get('/', authMiddleware, async (req, res) => {
    try {
        await connectDB();
        const commands = await UserCommand.find({ botNumber: req.botNumber })
            .sort({ createdAt: -1 });
        res.json({ success: true, commands });
    } catch (error) {
        console.error('Get commands error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ═══════════════════════════════════════════
// 🎯 CREATE COMMAND
// ═══════════════════════════════════════════
router.post('/', authMiddleware, async (req, res) => {
    try {
        await connectDB();
        const {
            pattern, alias, actionType, react, description,
            // text
            response,
            // media
            mediaType, mediaUrl, mediaCaption,
            // api
            apiMethod, apiUrl, apiResponsePaths, apiImageUrl, apiCaption
        } = req.body;

        if (!pattern) {
            return res.status(400).json({ success: false, error: 'Pattern is required' });
        }

        const existing = await UserCommand.findOne({
            botNumber: req.botNumber,
            pattern: pattern.toLowerCase()
        });

        if (existing) {
            return res.status(400).json({ success: false, error: 'Command already exists' });
        }

        const command = await UserCommand.create({
            botNumber: req.botNumber,
            pattern: pattern.toLowerCase(),
            alias: alias || [],
            actionType: actionType || 'text',
            react: react || '⚡',
            description: description || '',
            response: response || '',
            mediaType: mediaType || null,
            mediaUrl: mediaUrl || null,
            mediaCaption: mediaCaption || '',
            apiMethod: apiMethod || 'GET',
            apiUrl: apiUrl || null,
            apiResponsePaths: apiResponsePaths || [],
            apiImageUrl: apiImageUrl || null,
            apiCaption: apiCaption || ''
        });

        res.json({ success: true, message: 'Command created', command });
    } catch (error) {
        console.error('Create command error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// ═══════════════════════════════════════════
// 🎯 UPDATE COMMAND
// ═══════════════════════════════════════════
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        await connectDB();
        const command = await UserCommand.findOne({
            _id: req.params.id,
            botNumber: req.botNumber
        });

        if (!command) {
            return res.status(404).json({ success: false, error: 'Command not found' });
        }

        const allowed = [
            'pattern', 'alias', 'actionType', 'react', 'description',
            'response',
            'mediaType', 'mediaUrl', 'mediaCaption',
            'apiMethod', 'apiUrl', 'apiResponsePaths', 'apiImageUrl', 'apiCaption',
            'enabled'
        ];
        
        allowed.forEach(key => {
            if (req.body[key] !== undefined) command[key] = req.body[key];
        });

        command.updatedAt = Date.now();
        await command.save();

        res.json({ success: true, message: 'Command updated', command });
    } catch (error) {
        console.error('Update command error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ═══════════════════════════════════════════
// 🎯 DELETE COMMAND
// ═══════════════════════════════════════════
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await connectDB();
        const command = await UserCommand.findOneAndDelete({
            _id: req.params.id,
            botNumber: req.botNumber
        });

        if (!command) {
            return res.status(404).json({ success: false, error: 'Command not found' });
        }

        res.json({ success: true, message: 'Command deleted' });
    } catch (error) {
        console.error('Delete command error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ═══════════════════════════════════════════
// 🎯 TOGGLE COMMAND (Enable/Disable)
// ═══════════════════════════════════════════
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
    try {
        await connectDB();
        const command = await UserCommand.findOne({
            _id: req.params.id,
            botNumber: req.botNumber
        });

        if (!command) {
            return res.status(404).json({ success: false, error: 'Command not found' });
        }

        command.enabled = !command.enabled;
        command.updatedAt = Date.now();
        await command.save();

        res.json({ success: true, command });
    } catch (error) {
        console.error('Toggle command error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

export default router;
