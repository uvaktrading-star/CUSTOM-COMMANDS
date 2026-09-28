// ═══════════════════════════════════════════
// 🎯 WEB-AUTH VERIFY MIDDLEWARE
// ═══════════════════════════════════════════
const WEB_AUTH_API = process.env.WEB_AUTH_API || 'https://zanta-web-auth.vercel.app/api/auth';

export async function authMiddleware(req, res, next) {
    try {
        // 🔥 Frontend එකෙන් botNumber + token එවනවා
        const botNumber = req.headers['x-bot-number'] || req.body.botNumber;
        const token = req.headers.authorization?.split(' ')[1] || req.body.token;

        if (!botNumber) {
            return res.status(401).json({ 
                success: false, 
                error: 'Bot number required' 
            });
        }

        // 🔥 web-auth API එකට verify request එක යවනවා
        // NOTE: ඔබේ web-auth API එකේ verify endpoint එකට ගැලපෙන විදියට මේක වෙනස් කරන්න
        const verifyRes = await fetch(`${WEB_AUTH_API}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: botNumber, 
                token: token 
            })
        });

        // Response එක JSON ද නැද්ද කියලා check කරන්න
        let verifyData;
        try {
            verifyData = await verifyRes.json();
        } catch (e) {
            // JSON නැත්නම්, web-auth API එකේ verify endpoint එකක් නැහැ කියන එක
            return res.status(401).json({ 
                success: false, 
                error: 'Auth verification failed - verify endpoint not available' 
            });
        }

        if (!verifyData.success) {
            return res.status(401).json({ 
                success: false, 
                error: verifyData.error || 'Invalid credentials' 
            });
        }

        // ✅ Verified! දැන් botNumber එක req එකට දාන්න
        req.botNumber = botNumber;
        req.user = verifyData.user || { botNumber };
        next();

    } catch (error) {
        console.error('❌ Auth middleware error:', error.message);
        res.status(401).json({ 
            success: false, 
            error: 'Auth verification failed' 
        });
    }
}
