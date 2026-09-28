// ═══════════════════════════════════════════
// 🎯 WEB-AUTH VERIFY MIDDLEWARE
// 🔥 /verify endpoint නැති නිසා login endpoint එකටම call කරනවා
// ═══════════════════════════════════════════
const WEB_AUTH_API = process.env.WEB_AUTH_API || 'https://zanta-web-auth.vercel.app/api/auth';

export async function authMiddleware(req, res, next) {
    try {
        const botNumber = req.headers['x-bot-number'] || req.body.botNumber;
        const authHeader = req.headers.authorization;
        const password = authHeader ? authHeader.replace('Bearer ', '') : req.body.password;

        console.log('🔍 [AUTH] Verifying:', { botNumber, hasPassword: !!password });

        if (!botNumber || !password) {
            return res.status(401).json({ 
                success: false, 
                error: 'Bot number and password required' 
            });
        }

        // 🔥 web-auth API එකේ login endpoint එකට call කරනවා
        const verifyRes = await fetch(WEB_AUTH_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: botNumber, 
                password: password, 
                action: 'login' 
            })
        });

        const verifyData = await verifyRes.json();
        console.log('🔍 [AUTH] web-auth response:', verifyData);

        // 🔥 success field එක නැත්නම් වෙනත් fields පරීක්ෂා කරන්න
        const isSuccess = 
            verifyData.success === true || 
            verifyData.status === 'success' || 
            verifyData.status === 'ok' ||
            verifyData.loggedIn === true ||
            verifyData.authenticated === true ||
            (verifyData.token && verifyData.token.length > 0);

        if (!isSuccess) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }

        // ✅ Verified!
        req.botNumber = botNumber;
        req.user = verifyData.user || { botNumber };
        next();

    } catch (error) {
        console.error('❌ [AUTH] Middleware error:', error.message);
        res.status(401).json({ 
            success: false, 
            error: 'Auth verification failed: ' + error.message
        });
    }
}
