# Dureń / Durak

Przeglądarkowa wersja klasycznego Durnia na 36 kart, z trybem offline i multiplayerem online.

[English](README.md) · [Polski](README.pl.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

## Funkcje

- talia 36 kart od 6 do Asa
- 1–3 przeciwników komputerowych offline
- poziomy botów: Łatwy / Normalny / Trudny / Ekspert
- opcjonalne przerzucanie / perewod
- opcjonalny limit sześciu kart
- podpowiedzi dla początkujących i samouczek
- responsywny interfejs
- języki: polski, angielski, niemiecki i rosyjski
- jedno wspólne menu dla gry offline i online
- pokoje online przez wspólny serwer QQND
- multiplayer dla 2 graczy, 3 graczy oraz 2 graczy + bot
- reconnect z 60-sekundowym czasem na powrót
- Kontynuuj preferuje możliwą do wznowienia grę online, a następnie zapis offline

## Uruchomienie

W wersji hostowanej punktem wejścia jest:

```text
index.html
```

Produkcyjny zestaw runtime:

```text
index.html
game.css
game.js
multiplayer.css
multiplayer.js
mp/
  core.js
  game.js
  network-server.js
```

`index.html` jest jedynym plikiem HTML aplikacji. Gra offline i online korzystają z tego samego DOM-u oraz `window.Durak`; nie ma osobnej strony offline ani iframe.

## Architektura multiplayer

Tryb online łączy się przez WebSocket ze wspólnym backendem QQND pod `api.qqnd.fyi`. W repozytorium nie ma już Cloudflare Workera ani transportu WebRTC.

Duren jest obecnie host-authoritative: przeglądarka hosta wykonuje zasady i wysyła każdemu zdalnemu graczowi prywatny widok stanu. Kolejnym etapem będzie przeniesienie pełnego silnika zasad na backend.

## Testy

GitHub Actions sprawdza strukturę single-runtime, priorytet wznawiania online/offline, regresję rozgrywki, responsywność, prywatność widoków stanu i pełny smoke test klienta wspólnego serwera QQND.

Szczegóły wdrożenia są w [DEPLOY_MULTIPLAYER.md](DEPLOY_MULTIPLAYER.md).
