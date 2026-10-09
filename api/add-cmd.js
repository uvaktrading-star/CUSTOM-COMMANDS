// api/add-cmd.js
import { connectToDatabase, verifyBot, parseBody, setCors, ObjectId } from './db';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // ==================== GET: list user commands ====================
    if (req.method === 'GET') {
      const { id, password } = req.query;
      const auth = await verifyBot(id, password);
      if (!auth.ok) return res.status(401).json({ success: false, error: auth.error });

      const { db } = await connectToDatabase();
      const commands = await db.collection('commands')
        .find({ userId: String(id) })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ success: true, commands });
    }

    // ==================== POST: create new command ====================
    if (req.method === 'POST') {
      const { id, password, command } = parseBody(req.body);
      const auth = await verifyBot(id, password);
      if (!auth.ok) return res.status(401).json({ success: false, error: auth.error });

      if (!command || !command.name) {
        return res.status(400).json({ success: false, error: 'Command name is required' });
      }

      const cleanName = String(command.name).toLowerCase().trim();

      // basic validation
      if (!/^[a-z0-9_-]+$/.test(cleanName)) {
        return res.status(400).json({
          success: false,
          error: 'Command name can only contain letters, numbers, _ and -',
        });
      }

      const { db } = await connectToDatabase();

      // duplicate check
      const existing = await db.collection('commands').findOne({
        userId: String(id),
        name: cleanName,
      });
      if (existing) {
        return res.status(409).json({ success: false, error: 'Command name already exists' });
      }

      const doc = {
        userId: String(id),
        name: cleanName,
        description: String(command.description || '').trim(),
        aliases: Array.isArray(command.aliases)
          ? command.aliases.map(a => String(a).toLowerCase().trim()).filter(Boolean)
          : [],
        react: String(command.react || '').trim(),
        type: command.type === 'api' ? 'api' : 'text',

        // text type
        mediaType: command.mediaType || 'text', // 'text' | 'audio' | 'video'
        content: command.content || null,
        mediaLink: command.mediaLink || '',
        mediaCaption: command.mediaCaption || '',

        // api type
        apiMethod: (command.apiMethod || 'GET').toUpperCase(),
        apiUrl: command.apiUrl || '',
        hasQuery: !!command.hasQuery,
        queries: Array.isArray(command.queries)
          ? command.queries.filter(q => q && q.name).map(q => ({
              name: String(q.name).trim(),
              default: String(q.default ?? '').trim(),
            }))
          : [],

        // response
        responseTemplate: command.responseTemplate || '💬 ${content}',
        sampleResponse: command.sampleResponse || null,

        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('commands').insertOne(doc);

      return res.status(200).json({
        success: true,
        message: 'Command saved',
        commandId: result.insertedId,
      });
    }

    // ==================== DELETE: remove command ====================
    if (req.method === 'DELETE') {
      const { id, password, commandId } = parseBody(req.body);
      const auth = await verifyBot(id, password);
      if (!auth.ok) return res.status(401).json({ success: false, error: auth.error });

      if (!ObjectId.isValid(commandId)) {
        return res.status(400).json({ success: false, error: 'Invalid command id' });
      }

      const { db } = await connectToDatabase();
      const result = await db.collection('commands').deleteOne({
        _id: new ObjectId(commandId),
        userId: String(id), // ownership check
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, error: 'Command not found' });
      }

      return res.status(200).json({ success: true, message: 'Command deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (e) {
    console.error('[add-cmd]', e);
    return res.status(500).json({ success: false, error: e.message || 'Server error' });
  }
}
