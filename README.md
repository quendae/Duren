# Dureń / Durak

Browser implementation of the classic 36-card Durak game with offline play and online multiplayer.

[English](README.md) · [Polski](README.pl.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

## Features

- 36-card Durak deck, 6 through Ace
- 1–3 computer opponents in offline play
- Easy / Normal / Hard / Expert bot levels
- optional transfer / perevodnoy rule
- optional six-card attack limit
- beginner hints and tutorial
- responsive browser UI
- Polish, English, German and Russian interface
- one shared menu for offline and online play
- online rooms through the shared QQND game server
- 2-player, 3-player and 2-player + bot online games
- reconnect support with a 60-second grace period
- Continue prefers a resumable online game, then falls back to the offline autosave

## Run

For the hosted version, serve the repository as static files and open:

```text
index.html
```

The production runtime is:

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

`index.html` is the only HTML entry point. Offline and online play share the same DOM and `window.Durak` runtime; there is no secondary offline page or iframe.

## Multiplayer architecture

Online play connects to the shared QQND backend at `api.qqnd.fyi` over WebSocket. There is no Cloudflare Worker or WebRTC signaling in this repository anymore.

Duren is currently host-authoritative: the host browser runs the rules and publishes a private state projection for every remote player. Moving the complete rules engine to the shared backend is the next server-authoritative phase.

## Testing

GitHub Actions validates the single-runtime structure, offline/online resume priority, gameplay regressions, responsive layouts, private state projections and the shared QQND browser flow.

Deployment details are in [DEPLOY_MULTIPLAYER.md](DEPLOY_MULTIPLAYER.md).
