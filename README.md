# GO STREAM

Een responsieve IPTV-playlist speler (eerste web/PWA-prototype) voor persoonlijke M3U/M3U Plus-playlists.

## Starten
```bash
npm install
npm run dev
```

## Huidige functies
- M3U-playlist URL invoeren en lokaal bewaren in de browser.
- Basis M3U-parser voor streamnaam, groep en logo.
- Zoeken, categorieën en favorieten.
- MPEG-TS playback via mpegts.js wanneer de browser Media Source Extensions ondersteunt.
- Responsieve interface voor mobiel, tablet en desktop.

## Belangrijke beperkingen
- De IPTV-provider moet browserverzoeken toestaan (CORS). Als dat niet zo is, is een eigen beveiligde backend/proxy nodig. Plaats providercredentials nooit in broncode of GitHub.
- Browser-afspelen van live MPEG-TS verschilt per toestel en browser.
- Chromecast/AirPlay en native Android TV/iOS-app-integratie zijn nog niet ingebouwd; dit is de eerste basisversie.
- De M3U Plus playlist is niet hetzelfde als een volledige VOD-catalogusparser: series/films met aparte Xtream API endpoints vereisen een volgende integratie.
- Gebruik alleen playlists en streams waarvoor je toestemming hebt.

## Veiligheid
Bewaar de playlistlink alleen lokaal op een eigen toestel. Deze prototype bewaart hem in localStorage; gebruik op gedeelde toestellen is daarom niet aanbevolen.