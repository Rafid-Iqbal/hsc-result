export default async function handler(req, res) {
    // Enable CORS for your frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;

    try {
        if (action === 'captcha') {
            // 1. Fetch home page to get session cookie (PHPSESSID)
            const homeResponse = await fetch('http://www.eboardresults.com/v2/home', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const setCookie = homeResponse.headers.get('set-cookie') || '';
            const phpSessionMatch = setCookie.match(/PHPSESSID=([^;]+)/);
            const phpSessionId = phpSessionMatch ? phpSessionMatch[1] : '';

            // 2. Fetch the captcha image using the session cookie
            const captchaResponse = await fetch('http://www.eboardresults.com/v2/captcha', {
                headers: {
                    'Cookie': `PHPSESSID=${phpSessionId}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'http://www.eboardresults.com/v2/home'
                }
            });

            if (!captchaResponse.ok) {
                throw new Error('Failed to fetch captcha from upstream server');
            }

            const arrayBuffer = await captchaResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Pass the session back to the frontend header
            res.setHeader('X-Php-Session', phpSessionId);
            res.setHeader('Content-Type', 'image/png');
            return res.send(buffer);
        }

        if (req.method === 'POST') {
            // Handle result checking submission proxying here if needed
            return res.status(200).json({ success: true, message: 'Proxy active' });
        }

        return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
