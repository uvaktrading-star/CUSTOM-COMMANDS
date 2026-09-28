import express from 'express';
import axios from 'axios';
import { authMiddleware } from './middleware.js';

const router = express.Router();

// ═══════════════════════════════════════════
// 🎯 TEST API ENDPOINT
// POST /api/test-api
// Body: { url, method, headers, body }
// ═══════════════════════════════════════════
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { url, method = 'GET', headers = {}, body = {} } = req.body;

        if (!url) {
            return res.status(400).json({ 
                success: false, 
                error: 'URL is required' 
            });
        }

        console.log('🧪 Testing API:', { url, method });

        const config = {
            method: method.toUpperCase(),
            url: url,
            headers: {
                'User-Agent': 'ZANTA-MD/1.0',
                ...headers
            },
            timeout: 15000
        };

        // POST වලට body එක add කරන්න
        if (method.toUpperCase() === 'POST') {
            config.data = body;
        }

        const response = await axios(config);

        // 🔥 Response එකේ structure එක හඳුනාගන්න
        const data = response.data;
        const detectedPaths = extractPaths(data);

        res.json({
            success: true,
            status: response.status,
            data: data,
            detectedPaths: detectedPaths,  // 🔥 auto-detected paths
            headers: response.headers
        });

    } catch (error) {
        console.error('❌ API Test error:', error.message);
        
        let errorMsg = error.message;
        if (error.response) {
            errorMsg = `HTTP ${error.response.status}: ${error.response.statusText}`;
        } else if (error.code === 'ECONNABORTED') {
            errorMsg = 'Request timeout (15s)';
        }

        res.status(500).json({ 
            success: false, 
            error: errorMsg,
            details: error.response?.data || null
        });
    }
});

// ═══════════════════════════════════════════
// 🎯 PATH EXTRACTION (Auto-detect response paths)
// ═══════════════════════════════════════════
function extractPaths(obj, prefix = '', depth = 0, maxDepth = 3) {
    const paths = [];
    
    if (depth > maxDepth) return paths;
    if (obj === null || obj === undefined) return paths;

    if (Array.isArray(obj)) {
        // Array එකක් නම්, පළවෙනි item එකේ paths ගන්න
        if (obj.length > 0 && typeof obj[0] === 'object') {
            const itemPaths = extractPaths(obj[0], `${prefix}[0].`, depth + 1, maxDepth);
            paths.push(...itemPaths);
        }
        return paths;
    }

    if (typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            
            if (value === null || value === undefined) {
                paths.push(newPrefix);
            } else if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    paths.push(newPrefix);
                    if (value.length > 0 && typeof value[0] === 'object') {
                        const subPaths = extractPaths(value[0], `${newPrefix}[0].`, depth + 1, maxDepth);
                        paths.push(...subPaths);
                    }
                } else {
                    paths.push(newPrefix);
                    const subPaths = extractPaths(value, `${newPrefix}.`, depth + 1, maxDepth);
                    paths.push(...subPaths);
                }
            } else {
                paths.push(newPrefix);
            }
        }
    }
    
    return paths;
}

export default router;
