// api/proxy.js
export default async function handler(req, res) {
  const targetHost = 'https://eboardresults.com';
  const action = req.query.action;

  // 1. Forward Captcha Request & Capture Session Cookie (PHPSESSID)
  if (action === 'captcha') {
    try {
      const response = await fetch(`${targetHost}/v2/captcha`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': `${targetHost}/v2/home`
        }
      });

      const setCookieHeader = response.headers.get('set-cookie');
      let phpSessionId = '';
      if (setCookieHeader) {
        const match = setCookieHeader.match(/PHPSESSID=([^;]+)/);
        if (match) phpSessionId = match[1];
      }

      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'image/jpeg');
      if (phpSessionId) {
        res.setHeader('X-Php-Session', phpSessionId);
      }
      return res.status(200).send(Buffer.from(buffer));
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch captcha' });
    }
  }

  // 2. Forward Result POST Request with Session Cookie
  if (action === 'result' && req.method === 'POST') {
    try {
      const phpSessionId = req.headers['x-php-session'];
      const cookieHeader = phpSessionId ? `PHPSESSID=${phpSessionId}` : '';

      const bodyData = new URLSearchParams(req.body).toString();

      const response = await fetch(`${targetHost}/v2/getres`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': cookieHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': `${targetHost}/v2/home`,
          'Origin': targetHost
        },
        body: bodyData
      });

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch result' });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
