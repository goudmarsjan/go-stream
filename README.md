# GO STREAM

Een responsieve M3U/M3U Plus webspeler voor persoonlijke playlists.

## Starten
```bash
npm install
npm run dev
```

## Functies
- M3U-playlist URL invoeren en lokaal op het toestel bewaren.
- Playlist ophalen via een Vercel serverfunctie om browser-CORS bij het ophalen van de playlist te vermijden.
- Basis M3U-parser voor streamnaam, groep en logo.
- Zoeken, categorieën en favorieten.
- MPEG-TS playback via mpegts.js wanneer de browser Media Source Extensions en de streamprovider browsertoegang ondersteunen.
- Responsieve interface voor mobiel, tablet en desktop.

## Beperkingen
- De serverfunctie laat alleen de host `link.reseller-online.net` toe en accepteert alleen `get.php` playlistlinks. Dit voorkomt dat de endpoint als algemene URL-proxy wordt misbruikt.
- Sommige providers weigeren verbindingen vanaf cloudservers. In dat geval kan de playlist nog steeds niet worden opgehaald.
- De serverfunctie haalt alleen de playlist op. De afzonderlijke video-streams lopen nog rechtstreeks vanaf de provider; stream-CORS, browsercodec-ondersteuning en providerbeperkingen kunnen playback verhinderen.
- Volledige Xtream Codes VOD-integratie (films, series, seizoenen en afleveringen), streamproxy en Chromecast/AirPlay/native tv-ondersteuning zijn nog niet inbegrepen.
- Gebruik alleen playlists en streams waarvoor je toestemming hebt.

## Veiligheid
- Zet nooit IPTV-gebruikersnamen of wachtwoorden in broncode, GitHub of publieke screenshots.
- De playlistlink wordt lokaal in de browser bewaard; gebruik dit prototype niet op gedeelde toestellen.
- Als je credentials publiek hebt gedeeld, wijzig dan je IPTV-wachtwoord bij je provider.
- De serverfunctie staat alleen verzoeken toe naar de expliciet ingestelde providerhost en logt de playlistinhoud niet.
