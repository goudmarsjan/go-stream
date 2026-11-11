# GO STREAM

Een responsieve M3U/M3U Plus-speler en Android-app.

## Webversie
```bash
npm install
npm run dev
```

## Android APK bouwen
De GitHub Actions-workflow **Build GO STREAM Android APK** bouwt een installeerbare debug-APK. Start de workflow handmatig via GitHub Actions of push een wijziging aan de app.

Na een geslaagde workflow vind je de APK bij **Actions → Build GO STREAM Android APK → Artifacts → go-stream-android**.

## Android-netwerk
De native Android-build gebruikt Capacitor's native HTTP-fetch patch. Daardoor worden playlistaanvragen rechtstreeks vanaf het Android-toestel gedaan in plaats van vanaf Vercel; browser-CORS is dan niet van toepassing. HTTP-cleartext is ingeschakeld omdat de geconfigureerde provider een http-playlist gebruikt.

## Beperkingen
- De webversie blijft de serverendpoint gebruiken en kan nog steeds time-outs krijgen als de provider verbindingen vanaf cloudservers weigert.
- Native directe playlistophaling lost geen ongeldige accountgegevens, providerblokkades of netwerkproblemen op.
- Streamafspelen hangt nog af van Android WebView/MSE, codecs en de provider. Native ExoPlayer-integratie en Chromecast zijn vervolgstappen.
- Dit is momenteel een debug-APK, niet ondertekend voor Play Store-publicatie.
- Gebruik alleen streams waarvoor je toestemming hebt.

## Veiligheid
Bewaar IPTV-gegevens niet in broncode, GitHub of publieke screenshots. Als je gegevens publiek zichtbaar waren, wijzig je wachtwoord bij de provider.
