# Wdrożenie multiplayera Dureń

Multiplayer jest prywatny, host-authoritative i P2P. Cloudflare Worker służy wyłącznie do utworzenia pokoju oraz wymiany SDP potrzebnej do zestawienia WebRTC. Po otwarciu DataChannel stan gry nie przechodzi przez Workera.

## Pliki gry

Na serwer WWW wgraj razem:

- `durniak.html` — wejście do gry offline/online,
- `durniak-offline.html` — niezmodyfikowany silnik gry i AI,
- `multiplayer.js`, `mp/` — warstwa lobby, WebRTC, filtrowania stanu i routingu akcji,
- `multiplayer.css` — interfejs lobby.

Plik `durniak-offline.html` można nadal otworzyć samodzielnie bez sieci i bez Workera.

## Architektura

- seat 0: host i autorytatywny silnik gry,
- seat 1: co najmniej jeden zdalny człowiek,
- seat 2: opcjonalnie drugi zdalny człowiek **albo** bot hosta,
- goście wysyłają tylko intencje ruchów,
- host weryfikuje turę, własność karty i legalność ruchu,
- każdy gość dostaje stan obrócony do własnego miejsca i bez kart przeciwników / kolejności talonu,
- bot nigdy nie uruchamia się u gościa,
- sesja multiplayer nie trafia do lokalnego auto-save gry offline.

## Cloudflare Worker

Katalog `cloudflare-signaling/` zawiera Durable Object dla pokojów i WebSocket do sygnalizacji.

Wymagania: Node.js 20+, domena `qqnd.fyi` w Cloudflare, `duren.qqnd.fyi` proxied przez Cloudflare oraz HTTPS dla strony.

```powershell
cd cloudflare-signaling
npm install
npx wrangler login
npm run deploy
```

`wrangler.jsonc` kieruje wyłącznie `duren.qqnd.fyi/api/*` do Workera. Pliki statyczne nadal obsługuje zwykły serwer WWW.

## Test usługi

Po deployu otwórz `https://duren.qqnd.fyi/api/health`. Oczekiwana odpowiedź:

```json
{"ok":true,"service":"duren-signaling"}
```

Potem otwórz grę w dwóch niezależnych przeglądarkach lub na dwóch urządzeniach:

1. Host wybiera **Gra online → Utwórz pokój**.
2. Drugi gracz wpisuje kod `XXXX-XXXX`.
3. Host może rozpocząć grę 1 na 1, poczekać na trzeciego człowieka albo zaznaczyć bota na trzecim miejscu.
4. Po starcie Worker zamyka pokój sygnalizacyjny; właściwa rozgrywka idzie po WebRTC DataChannel.

## NAT / TURN

Domyślnie klient korzysta ze STUN. Dwie bardzo restrykcyjne sieci mogą wymagać TURN. Przed załadowaniem `multiplayer.js` można wtedy ustawić `window.DURAK_ICE_SERVERS` na własną listę STUN/TURN. TURN przekazuje transport WebRTC; nie staje się serwerem zasad gry.

## Polityka rozłączeń

Pierwsza wersja celowo nie próbuje automatycznego reconnectu. Jeżeli DataChannel zniknie w trakcie rozdania, host zatrzymuje automaty botów i obie strony dostają widoczny ekran rozłączenia.

## CI

Workflow `.github/workflows/multiplayer-regression.yml` sprawdza skład host + człowiek, host + dwóch ludzi, host + człowiek + bot, pełne rozdania, zachowanie 36 kart, brak duplikatów, filtrowanie ukrytych kart, błędne miejsce gracza i cztery wymagane rozdzielczości lobby.
