// api/db.js
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://feature-settings:Akashkavindu12345@feature-settings.stfrtvq.mongodb.net/?retryWrites=true&w=majority&appName=feature-settings';
const dbName = process.env.MONGODB_DB || 'feature-settings';

if (!uri) {
  throw new Error('MONGODB_URI is not defined in environment');
}

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

/**
 * Verify bot user credentials.
 * Returns { ok: true, user } or { ok: false, error }
 */
export async function verifyBot(id, password) {
  if (!id || !password) return { ok: false, error: 'Missing credentials' };

  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ id: String(id) });

  if (!user) return { ok: false, error: 'User not found' };
  if (user.password !== String(password)) {
    return { ok: false, error: 'Invalid password' };
  }

  return { ok: true, user };
}

/**
 * Parse body if it comes in as a string.
 */
export function parseBody(body) {
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body || {};
}

/**
 * Setup CORS on response.
 */
export function setCors(res, methods = 'GET, POST, DELETE, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export { ObjectId };
