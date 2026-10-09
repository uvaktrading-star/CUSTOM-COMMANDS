// api/api-validator.js
import { verifyBot, parseBody, setCors } from './db';

export default async function handler(req, res) {
  setCors(res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { id, password, url, method, queries } = parseBody(req.body);

    const auth = await verifyBot(id, password);
    if (!auth.ok) return res.status(401).json({ success: false, error: auth.error });

    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    // validate URL
    let finalUrl;
    try {
      finalUrl = new URL(url);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL' });
    }

    // attach query params
    if (Array.isArray(queries)) {
      queries.forEach(q => {
        if (q && q.name) finalUrl.searchParams.set(q.name, q.default ?? '');
      });
    }

    const httpMethod = String(method || 'GET').toUpperCase();
    if (!['GET', 'POST'].includes(httpMethod)) {
      return res.status(400).json({ success: false, error: 'Only GET and POST allowed' });
    }

    // fetch with 15s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const start = Date.now();

    let apiRes;
    try {
      apiRes = await fetch(finalUrl.toString(), {
        method: httpMethod,
        headers: {
          'User-Agent': 'ZANTA-MD/1.0',
          'Accept': 'application/json, text/plain, */*',
        },
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      return res.status(200).json({
        success: false,
        error: err.name === 'AbortError'
          ? 'Request timed out (15s)'
          : `Fetch failed: ${err.message}`,
      });
    }
    clearTimeout(timeout);

    const elapsed = Date.now() - start;
    const rawText = await apiRes.text();

    let parsed;
    try { parsed = JSON.parse(rawText); }
    catch { parsed = { raw: rawText }; }

    return res.status(200).json({
      success: true,
      status: apiRes.status,
      elapsed,
      url: finalUrl.toString(),
      response: parsed,
    });
  } catch (e) {
    console.error('[api-validator]', e);
    return res.status(500).json({ success: false, error: e.message || 'Server error' });
  }
}
