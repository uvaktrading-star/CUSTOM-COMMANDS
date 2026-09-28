import axios from 'axios';

export default async function handler(req, res) {
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
        const {
            apiUrl, apiMethod, apiHeaders, apiBody,
            apiResponsePath, template, testQuery
        } = req.body;

        if (!apiUrl) {
            return res.json({ success: false, error: 'API URL required' });
        }

        // 🎯 Build URL
        let finalUrl = apiUrl.replace(/\{\{query\}\}/g, encodeURIComponent(testQuery || 'test'));

        // 🎯 Config
        const config = {
            method: apiMethod || 'GET',
            url: finalUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
                ...(apiHeaders || {})
            },
            timeout: 15000,
            maxContentLength: 5 * 1024 * 1024
        };

        if (apiMethod === 'POST' && apiBody) {
            let bodyStr = JSON.stringify(apiBody);
            bodyStr = bodyStr.replace(/\{\{query\}\}/g, testQuery || 'test');
            config.data = JSON.parse(bodyStr);
        }

        // 🎯 Execute
        const response = await axios(config);
        let apiData = response.data;

        // 🎯 Extract path
        if (apiResponsePath) {
            const pathParts = apiResponsePath.split('.');
            let extracted = apiData;

            for (const key of pathParts) {
                const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
                if (arrayMatch) {
                    extracted = extracted?.[arrayMatch[1]]?.[parseInt(arrayMatch[2])];
                } else {
                    extracted = extracted?.[key];
                }
            }
            apiData = extracted;
        }

        // 🎯 Format
        const resultStr = typeof apiData === 'object' && apiData !== null
            ? JSON.stringify(apiData, null, 2)
            : String(apiData ?? 'No data');

        let output = template || '{{result}}';
        output = output.replace(/\{\{result\}\}/g, resultStr);
        output = output.replace(/\{\{query\}\}/g, testQuery || 'test');

        res.json({
            success: true,
            output,
            rawResponse: response.data
        });

    } catch (e) {
        console.error('❌ [Test] Error:', e.message);
        res.json({
            success: false,
            error: e.message,
            status: e.response?.status,
            data: e.response?.data
        });
    }
}
