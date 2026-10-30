export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;

    try {
        if (action === 'captcha') {
            const homeResponse = await fetch('http://www.eboardresults.com/v2/home', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const setCookie = homeResponse.headers.get('set-cookie') || '';
            const phpSessionMatch = setCookie.match(/PHPSESSID=([^;]+)/);
            const phpSessionId = phpSessionMatch ? phpSessionMatch[1] : '';

            const captchaResponse = await fetch('http://www.eboardresults.com/v2/captcha', {
                headers: {
                    'Cookie': `PHPSESSID=${phpSessionId}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'http://www.eboardresults.com/v2/home'
                }
            });

            const arrayBuffer = await captchaResponse.arrayBuffer();
            res.setHeader('Content-Type', 'image/png');
            return res.send(Buffer.from(arrayBuffer));
        }

        return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
