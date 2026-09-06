# Dureń / Durak

Browser-Version des klassischen Durak mit 36 Karten, Offline-Spiel und Online-Mehrspieler.

[English](README.md) · [Polski](README.pl.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

## Funktionen

- 36-Karten-Blatt von 6 bis Ass
- 1–3 Computergegner im Offline-Spiel
- Bot-Stufen: Leicht / Normal / Schwer / Experte
- optionale Übergabe-/Perevodnoy-Regel
- optionales Sechs-Karten-Limit
- Anfängerhinweise und Tutorial
- responsive Oberfläche
- Polnisch, Englisch, Deutsch und Russisch
- Online-Räume über den gemeinsamen QQND-Spieleserver
- Online-Partien mit 2 Spielern, 3 Spielern oder 2 Spielern + Bot
- Reconnect mit 60 Sekunden Rückkehrzeit

## Start

Für die gehostete Version ist der Einstiegspunkt:

```text
index.html
```

Benötigte Runtime-Dateien:

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

`index.html` ist der öffentliche Einstieg. `durniak-offline.html` enthält Spiel-Engine und UI und kann weiterhin direkt für Offline-Spiel geöffnet werden.

## Multiplayer-Architektur

Online verbindet sich per WebSocket mit dem gemeinsamen QQND-Backend unter `api.qqnd.fyi`. Cloudflare Worker und WebRTC-Signalisierung gehören nicht mehr zu diesem Repository.

Duren ist derzeit host-authoritative: Der Host-Browser führt die Regeln aus und sendet jedem entfernten Spieler eine private Zustandsansicht. Der nächste Schritt ist die vollständige server-authoritative Spiel-Engine im Backend.

## Tests

GitHub Actions prüft Spielregression, responsive Layouts und einen Browser-Smoke-Test des gemeinsamen QQND-Servers.

Details zur Bereitstellung stehen in [DEPLOY_MULTIPLAYER.md](DEPLOY_MULTIPLAYER.md).
