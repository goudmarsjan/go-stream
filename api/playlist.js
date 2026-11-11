// Server-side M3U fetcher. The provider hostname is deliberately allowlisted
// to prevent this endpoint from becoming an arbitrary URL/SSRF proxy.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Gebruik POST om een playlist op te halen.' });
  }

  try {
    const raw = typeof req.body?.playlistUrl === 'string' ? req.body.playlistUrl : '';
    if (!raw || raw.length > 4096) {
      return res.status(400).json({ error: 'Vul een geldige playlistlink in.' });
    }

    let url;
    try { url = new URL(raw); } catch {
      return res.status(400).json({ error: 'De playlistlink is ongeldig.' });
    }

    // Only the provider host supplied for this setup is allowed.
    if (url.hostname !== 'link.reseller-online.net' ||
        !['http:', 'https:'].includes(url.protocol) ||
        url.username || url.password) {
      return res.status(400).json({ error: 'Deze providerhost wordt niet toegelaten. Controleer de playlistlink.' });
    }

    if (!url.pathname.toLowerCase().endsWith('/get.php')) {
      return res.status(400).json({ error: 'Dit lijkt geen geldige M3U Plus get.php-link.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let upstream;
    try {
      upstream = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'error',
        signal: controller.signal,
        headers: { 'Accept': 'application/x-mpegURL, audio/x-mpegurl, text/plain, */*' }
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!upstream.ok) {
      return res.status(502).json({ error: 'De IPTV-provider antwoordde met HTTP ' + upstream.status + '. Controleer je gegevens of contacteer je provider.' });
    }

    const length = Number(upstream.headers.get('content-length') || 0);
    if (length > 15 * 1024 * 1024) {
      return res.status(413).json({ error: 'De playlist is groter dan 15 MB en kan niet via deze functie worden geladen.' });
    }

    const playlist = await upstream.text();
    if (playlist.length > 15 * 1024 * 1024) {
      return res.status(413).json({ error: 'De playlist is groter dan 15 MB en kan niet via deze functie worden geladen.' });
    }
    if (!playlist.trimStart().startsWith('#EXTM3U')) {
      return res.status(502).json({ error: 'De provider gaf geen geldige M3U-playlist terug. Controleer je account en playlisttype.' });
    }

    return res.status(200).json({ playlist });
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? 'De provider reageerde niet op tijd. Probeer later opnieuw.'
      : 'GO STREAM kon geen verbinding maken met de IPTV-provider.';
    return res.status(502).json({ error: message });
  }
}
