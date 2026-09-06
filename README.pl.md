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
- pokoje online przez wspólny serwer QQND
- multiplayer dla 2 graczy, 3 graczy oraz 2 graczy + bot
- reconnect z 60-sekundowym czasem na powrót

## Uruchomienie

W wersji hostowanej punktem wejścia jest:

```text
index.html
```

Wymagany zestaw runtime:

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

`index.html` jest wejściem do wersji online. `durniak-offline.html` zawiera silnik i UI samej gry i można go nadal otworzyć bezpośrednio do gry offline.

## Architektura multiplayer

Tryb online łączy się przez WebSocket ze wspólnym backendem QQND pod `api.qqnd.fyi`. W repozytorium nie ma już Cloudflare Workera ani transportu WebRTC.

Duren jest obecnie host-authoritative: przeglądarka hosta wykonuje zasady i wysyła każdemu zdalnemu graczowi prywatny widok stanu. Kolejnym etapem będzie przeniesienie pełnego silnika zasad na backend.

## Testy

GitHub Actions uruchamia regresję rozgrywki, testy responsywności oraz smoke test klienta wspólnego serwera QQND.

Szczegóły wdrożenia są w [DEPLOY_MULTIPLAYER.md](DEPLOY_MULTIPLAYER.md).
