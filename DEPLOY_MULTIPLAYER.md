# Dureń — wdrożenie

Aktualna wersja korzysta ze wspólnego backendu QQND pod `https://api.qqnd.fyi` / `wss://api.qqnd.fyi/api/v1/ws`.

Cloudflare Worker, WebRTC i osobny signaling dla Duren nie są już częścią projektu.

## Pliki wymagane na hostingu

W katalogu publikowanym jako `https://duren.qqnd.fyi/` muszą znajdować się:

```text
index.html
durniak-offline.html
multiplayer.css
multiplayer.js
mp/
  core.js
  game.js
  network-server.js
```

`index.html` jest jedynym wejściem do wersji hostowanej. `durniak-offline.html` pozostaje silnikiem i UI samej gry, uruchamianym wewnątrz iframe.

## Multiplayer

- pokoje i sesje obsługuje `qqnd-game-server`,
- transport klienta to WebSocket,
- publiczne pokoje są pobierane ze wspólnego backendu,
- reconnect używa zapisanego tokenu sesji,
- aktualnie Duren jest host-authoritative: host wykonuje zasady gry i publikuje prywatny widok stanu dla każdego gracza,
- 2 graczy, 3 graczy oraz 2 graczy + bot są obsługiwane,
- po rozłączeniu obowiązuje 60-sekundowe okno powrotu; potem miejsce może przejąć bot.

## Aktualizacja hostingu

Najbezpieczniej publikować cały powyższy zestaw plików z jednego commita. Nie mieszaj wersji `index.html`, `multiplayer.js` i plików `mp/` z różnych commitów.

Po aktualizacji zrób twarde odświeżenie przeglądarki. Entry point używa cache-bustera `20260906-clean1` dla plików runtime.

## Test

Po publikacji otwórz `https://duren.qqnd.fyi/`. Przycisk **Gra online** powinien być widoczny w prawym górnym rogu.

Minimalny test live:

1. Otwórz grę w dwóch niezależnych profilach przeglądarki.
2. Utwórz pokój w pierwszym profilu.
3. Dołącz drugim profilem.
4. Rozpocznij grę 1 na 1.
5. Powtórz z trzecim graczem oraz wariantem 2 graczy + bot.
6. Sprawdź restart przeglądarki i reconnect.

CI uruchamia regresję lokalnego gameplayu oraz smoke test klienta wspólnego serwera QQND.
