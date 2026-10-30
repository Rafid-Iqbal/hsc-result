export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-php-session');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const cleanAction = typeof req.query.action === 'string' ? req.query.action.trim().replace(/\.+$/, '') : '';

    if (cleanAction === 'captcha') {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const homeResponse = await fetch('http://www.eboardresults.com/v2/home', {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            clearTimeout(timeoutId);

            const setCookie = homeResponse.headers.get('set-cookie') || '';
            const phpSessionMatch = setCookie.match(/PHPSESSID=([^;]+)/);
            const phpSessionId = phpSessionMatch ? phpSessionMatch[1] : '';

            const captchaController = new AbortController();
            const captchaTimeoutId = setTimeout(() => captchaController.abort(), 5000);

            const captchaResponse = await fetch('http://www.eboardresults.com/v2/captcha', {
                signal: captchaController.signal,
                headers: {
                    'Cookie': `PHPSESSID=${phpSessionId}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'http://www.eboardresults.com/v2/home'
                }
            });
            clearTimeout(captchaTimeoutId);

            const arrayBuffer = await captchaResponse.arrayBuffer();
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('x-php-session', phpSessionId);
            return res.send(Buffer.from(arrayBuffer));
        } catch (error) {
            return res.status(500).json({ error: 'Upstream server timed out or blocked the request: ' + error.message });
        }
    }

    if (cleanAction === 'result') {
        try {
            const phpSessionId = req.headers['x-php-session'] || '';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const resultResponse = await fetch('http://www.eboardresults.com/v2/search', {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `PHPSESSID=${phpSessionId}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'http://www.eboardresults.com/v2/home',
                    'Origin': 'http://www.eboardresults.com'
                },
                body: JSON.stringify(req.body)
            });
            clearTimeout(timeoutId);

            const data = await resultResponse.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ status: 1, msg: 'Upstream search failed: ' + error.message });
        }
    }

    return res.status(400).json({ error: 'Invalid action', receivedQuery: req.query });
}
