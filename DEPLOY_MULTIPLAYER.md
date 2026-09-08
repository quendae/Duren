# Duren deployment

Production entry point: `index.html`.

Copy these runtime files to the Duren web root:

```text
index.html
game.css
game.js
multiplayer.css
multiplayer.js
mp/core.js
mp/game.js
mp/network-server.js
```

QQND multiplayer uses `wss://api.qqnd.fyi/api/v1/ws`. There is no WebRTC, Cloudflare signaling or secondary offline HTML entrypoint.

After deployment verify:

1. the shared main menu shows New Game / Online Game / How to Play;
2. Continue prefers a resumable online session, then an offline autosave;
3. public room list and join/create work;
4. two humans, three humans and two humans + bot can start;
5. disconnect/reconnect and substitute-bot takeover still work.
