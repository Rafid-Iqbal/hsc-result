export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Clean up any accidental trailing dots or spaces from the query parameter
    const action = (req.query.action || '').trim().replace(/\.+$/, '');

    if (action === 'captcha') {
        try {
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
        } catch (error) {
            return res.status(500).json({ error: 'Upstream fetch failed: ' + error.message });
        }
    }

    return res.status(400).json({ 
        error: 'Invalid action', 
        receivedQuery: req.query 
    });
}
