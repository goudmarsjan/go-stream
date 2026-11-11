// Stream the M3U response through Vercel instead of buffering it into JSON.
// Large M3U Plus playlists can exceed ordinary serverless JSON response limits.
export const config = { api: { responseLimit: false, bodyParser: { sizeLimit: '8kb' } } };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Gebruik POST om een playlist op te halen.' });
  }

  let upstream;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const raw = typeof req.body?.playlistUrl === 'string' ? req.body.playlistUrl : '';
    if (!raw || raw.length > 4096) return res.status(400).json({ error: 'Vul een geldige playlistlink in.' });

    let url;
    try { url = new URL(raw); } catch { return res.status(400).json({ error: 'De playlistlink is ongeldig.' }); }

    if (url.hostname !== 'link.reseller-online.net' ||
        !['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        !url.pathname.toLowerCase().endsWith('/get.php')) {
      return res.status(400).json({ error: 'Deze providerhost of playlistlink wordt niet toegelaten.' });
    }

    upstream = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'Accept': 'application/x-mpegURL, audio/x-mpegurl, text/plain, */*',
        'User-Agent': 'VLC/3.0.20 LibVLC/3.0.20',
        'Connection': 'keep-alive'
      }
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: 'De IPTV-provider antwoordde met HTTP ' + upstream.status + '.' });
    }
    const length = Number(upstream.headers.get('content-length') || 0);
    if (length && length > 250 * 1024 * 1024) {
      return res.status(413).json({ error: 'De playlist is groter dan 250 MB.' });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/x-mpegurl; charset=utf-8');
    res.setHeader('X-Playlist-Stream', '1');

    if (!upstream.body) return res.end();

    const reader = upstream.body.getReader();
    let firstChunk = true;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (firstChunk) {
        firstChunk = false;
        const preview = new TextDecoder().decode(value.slice(0, Math.min(value.length, 32)));
        if (!preview.trimStart().startsWith('#EXTM3U')) {
          reader.cancel().catch(() => {});
          if (!res.headersSent) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ error: 'De provider gaf geen geldige M3U-playlist terug. Controleer je link.' }));
          }
          return res.end();
        }
      }
      if (!res.write(Buffer.from(value))) {
        await new Promise(resolve => res.once('drain', resolve));
      }
    }
    return res.end();
  } catch (error) {
    if (!res.headersSent) {
      const message = error?.name === 'AbortError'
        ? 'De provider reageerde niet binnen 55 seconden. De playlist is mogelijk te traag of de server wordt geweigerd.'
        : 'GO STREAM kon geen verbinding maken met de IPTV-provider.';
      return res.status(502).json({ error: message });
    }
    return res.end();
  } finally {
    clearTimeout(timeout);
  }
}
