# Duren Single-Runtime Menu & Multiplayer Design

**Date:** 2026-09-08  
**Status:** Approved design, pending implementation plan  
**Repository:** `quendae/Duren`

## Goal

Replace the current two-layer Duren frontend (`index.html` shell + `durniak-offline.html` iframe) with one browser application served from `index.html`, while preserving the existing offline game, autosave, tutorial, bot logic and QQND multiplayer.

The visible result must be one coherent main menu where offline play, online play and resume are first-class options. The old floating **Gra online** button must disappear.

## Non-goals

This refactor does **not** change Duren rules, bot strategy, card rendering, scoring, QQND backend protocol or the current Phase 1 browser-host-authoritative multiplayer model.

It also does not implement the later server-authoritative Duren B2 engine.

## Current state

The repository currently has:

```text
index.html
  -> embeds durniak-offline.html in #durak-game iframe
  -> owns QQND multiplayer overlay
  -> loads multiplayer.css, mp/*.js and multiplayer.js

durniak-offline.html
  -> owns game markup and styles
  -> owns window.Durak modules
  -> owns offline main menu
  -> owns autosave / resume
  -> owns rules, UI and bots

mp/core.js
mp/game.js
mp/network-server.js
multiplayer.js
  -> bridge the parent page to iframe.contentWindow.Durak
```

This makes the multiplayer entry point visually separate from the real game menu and forces the multiplayer bridge to work through `iframe.contentWindow` / `iframe.contentDocument`.

## Target architecture

The application becomes a single document and a single DOM/runtime:

```text
index.html                  # only HTML entrypoint; game markup + shared menu + multiplayer overlay

game.css                    # styles extracted from durniak-offline.html

game.js                     # existing window.Durak modules: i18n, rules, bot, UI, controller/autosave

multiplayer.css              # QQND lobby / presence / multiplayer styles
multiplayer.js               # QQND UI orchestration and shared-menu integration

mp/
  core.js                    # multiplayer utilities against same-page window.Durak
  game.js                    # action validation, state projection, host bridge
  network-server.js          # QQND WebSocket/session/room transport

tests/
```

`durniak-offline.html` is deleted after the single-runtime implementation passes regression tests.

There must be no iframe in the production runtime.

## Runtime contract

The offline game remains the canonical browser game implementation and continues exposing `window.Durak`.

Multiplayer code must no longer depend on iframe traversal. It operates against the same page:

```js
const game = window.Durak;
const gameDocument = document;
```

Equivalent helper behavior in `mp/core.js` should resolve directly to the page runtime, for example:

```js
D.gameDoc = () => document;
D.hideGameMenu = () => document.getElementById('main-menu')?.classList.add('hidden');
D.showGameMenu = () => window.Durak?.game?.showMainMenu?.();
```

Any bridge fields whose only purpose was storing an iframe, `frameWindow`, `contentWindow` or `contentDocument` are removed.

Existing public game behavior and multiplayer behavior should otherwise remain stable.

## Shared main menu

The old offline menu becomes the only main menu for the application.

The primary actions are shown in this order:

1. **Kontynuuj grę / Kontynuuj grę online** — conditional; hidden when nothing can be resumed.
2. **Nowa gra** — opens the existing offline setup.
3. **Gra online** — opens the QQND multiplayer browser/lobby flow.
4. **Jak grać** — opens the existing tutorial/help flow.
5. Language selector remains part of the menu.

The menu keeps the existing Duren visual language rather than introducing a separate multiplayer style.

The former floating `#mp-launch` control is removed completely.

## Continue-game priority

The single Continue action follows this strict priority:

```text
valid/resumable online session
        ↓ otherwise
valid offline autosave
        ↓ otherwise
button hidden
```

### Online resume

When client-side QQND resume credentials indicate an active or potentially resumable Duren room, the main menu shows an online-aware Continue action.

Preferred copy:

```text
Kontynuuj grę online
Pokój ABCD-EFGH
```

Selecting it must:

1. establish the shared QQND WebSocket connection;
2. use the stored session id/resume token with `session.resume`;
3. recover the Duren room membership;
4. if the room is still `in_game`, restore the correct seat and request `game.state.get`;
5. render the recovered private/canonical view according to the existing Phase 1 host/guest rules;
6. close the main menu only after the online game has actually been recovered.

An online resume candidate must not suppress a valid offline autosave forever. If the server rejects the resume credentials or the room can no longer be resumed, the stale online-resume marker/credentials relevant to that room are cleared or treated as invalid, the menu is refreshed, and offline Continue becomes available immediately when an offline autosave exists.

### Offline resume

If no online game can be resumed, Continue uses the existing offline save path (`readSavedSession()` / `continueSaved()` behavior).

The existing offline save format should remain compatible. Splitting `durniak-offline.html` into `game.js` must not intentionally change offline `localStorage` keys or serialized state shape.

### No resume

If neither source exists, the Continue button is hidden rather than disabled.

## Menu behavior while a game is active

Opening **Menu** during a game displays the same shared main menu.

Opening the menu alone must not:

- end the offline game;
- clear its autosave;
- leave an online room;
- close the QQND session;
- surrender the online seat.

Starting a new game or explicitly leaving an online room may replace/end the current session through the appropriate existing flow.

## Offline flow

**Nowa gra** keeps the current offline configuration and rules UI. The refactor should preserve:

- supported bot counts;
- bot difficulty selection;
- rules toggles/settings;
- tutorial/practice flow;
- current rendering and controls;
- autosave behavior;
- save metadata/preferences;
- localization.

No game-rule changes belong in this refactor.

## Online flow

**Gra online** opens the existing QQND multiplayer interface inside the same page.

The flow keeps:

- shared server at `wss://api.qqnd.fyi/api/v1/ws`;
- guest session create/resume;
- public Duren room browser;
- public/private room creation;
- join-by-code;
- 2 human players;
- 3 human players;
- 2 humans + optional browser-hosted permanent bot seat;
- 60-second disconnect grace;
- substitute-bot takeover for a disconnected player;
- reclaiming the same seat on reconnect;
- private per-seat state projections;
- browser-host-authoritative `game.state.commit` / `game.state.publish` bridge for Duren Phase 1.

The refactor must not reintroduce WebRTC or Cloudflare signaling.

## Intentional Phase 1 limitation

Duren remains browser-host-authoritative in this work.

If the original browser host is lost long enough that generic backend host promotion occurs, a guest cannot safely become the simulation authority from only a seat-private projection. The UI must continue to handle this honestly rather than pretending the game can migrate authority.

Eliminating this limitation belongs to Duren B2 server authority, not this menu/runtime refactor.

## Source decomposition

The existing `durniak-offline.html` should be split mechanically rather than redesigned while moving code.

### `index.html`

Owns:

- full application/game markup formerly inside `durniak-offline.html`;
- shared main menu;
- new-game/settings/tutorial/result overlays;
- multiplayer overlay/lobby markup;
- presence/disconnect UI;
- references to `game.css`, `game.js`, `multiplayer.css`, `mp/*.js`, `multiplayer.js`.

### `game.css`

Receives the game/menu/layout/responsive CSS currently embedded in `durniak-offline.html`.

The visual output should remain materially unchanged except for the intended main-menu integration.

### `game.js`

Receives the existing inline game modules in their current order so globals and initialization remain compatible:

1. constants + i18n;
2. rules/deck/legal moves;
3. bots;
4. UI rendering;
5. game controller, autosave, menu and tutorial.

`window.Durak` remains the integration namespace.

### Multiplayer files

`mp/core.js`, `mp/game.js`, `mp/network-server.js` and `multiplayer.js` are modified only as needed to target the same-page `window.Durak` and shared menu lifecycle.

Do not mix unrelated gameplay refactors into this migration.

## Initialization order

The browser must initialize in a deterministic order:

```text
HTML / DOM
→ game.js creates and initializes window.Durak
→ mp/core.js
→ mp/game.js
→ mp/network-server.js
→ multiplayer.js integrates QQND UI/resume into the existing menu
```

Multiplayer startup must not require a later iframe `load` event.

The current hook installation logic should be simplified accordingly.

## Resume-source detection

The menu needs one small integration function that determines the best available resume source without mutating game state merely by inspecting it.

Conceptual interface:

```js
getResumeCandidate() ->
  { type: 'online', roomId: string } |
  { type: 'offline', summary?: object } |
  null
```

Detection order is always online first, then offline.

Online detection may use the existing stored QQND session metadata as a **candidate**, but actual availability is confirmed against the server when the user chooses Continue. A stale candidate is therefore recoverable and must fall back to offline safely.

## Error handling

### QQND unavailable

If the user chooses **Gra online** while the QQND backend is unreachable, show a clear multiplayer status error. The offline menu and offline game remain usable.

### Failed online resume

If stored online credentials or room membership are stale:

- show a concise status/toast explaining that the online game could not be resumed;
- invalidate only the stale online resume path;
- recompute the menu;
- preserve any offline save;
- do not silently start a new online game.

### Corrupt offline save

Existing safe-read behavior remains: an invalid save must not crash the application. If it cannot be loaded, Continue is removed/falls through appropriately.

## Responsive requirements

The shared menu must remain usable on:

- desktop 1280×800 and larger;
- typical 10-inch tablet portrait and landscape;
- typical phone portrait;
- typical phone landscape.

The current compact landscape menu behavior may be retained, but the addition of the Online action and conditional Continue must not overflow, overlap or push the language control off-screen.

## Test requirements

The change is not complete until automated tests cover both the structural migration and the user-visible flows.

### Structural single-runtime guard

CI must fail if production runtime reintroduces any of:

```text
durniak-offline.html
<iframe
contentWindow
contentDocument
RTCPeerConnection
cloudflare-signaling
```

The test may ignore documentation/history when appropriate, but active runtime files must be clean.

### Shared menu smoke

Playwright must verify from `/index.html` that:

- there is no floating Online control;
- the main menu contains **Nowa gra**, **Gra online** and **Jak grać**;
- Continue is hidden with no resume source;
- clicking **Gra online** opens the QQND multiplayer UI;
- closing the multiplayer UI returns to the same menu.

### Offline resume regression

Test sequence:

```text
start offline game
→ produce a valid autosave
→ reload page
→ Continue appears
→ click Continue
→ prior game state is restored
```

At minimum verify stable round/phase/player-hand data rather than only visibility changes.

### Online resume priority

With both a valid offline autosave and an online resume candidate:

- the menu identifies online Continue;
- selecting Continue attempts `session.resume` first;
- successful server resume restores the online game, not the offline save.

### Online fallback to offline

With an offline save plus stale online credentials:

- Continue first attempts online;
- failed online resume does not delete offline save;
- menu recomputes to offline Continue;
- offline Continue successfully restores the saved game.

### Multiplayer regression

Existing shared-server smoke/regression coverage remains and is adapted to same-page access. It must continue testing:

- public-room list;
- create/join;
- two-human start;
- three-human start;
- two-human + bot start;
- host state commit and private publish;
- no opponent hand leakage;
- disconnect presence notice;
- 60-second bot takeover behavior (or shortened deterministic grace in test harness);
- reconnect/reclaim behavior.

### Responsive menu regression

Playwright screenshots/geometry assertions cover desktop, tablet, phone portrait and phone landscape. All menu actions and language controls must be reachable without overlap.

## CI expectations

The existing multiplayer regression workflow is updated so it validates the new source layout.

It should syntax-check the split JS files, run the offline/game regression tests, run the shared QQND browser smoke, and run the new single-runtime/menu/resume tests.

All required checks must pass before deleting `durniak-offline.html` in the final migration commit.

## Deployment result

The production runtime becomes:

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

There is no separate offline HTML entry point.

A clean Synology deployment can replace the runtime directory with the files above (plus any future static assets) without carrying legacy signaling or iframe files.

## Definition of Done

The work is complete when all of the following are true:

- `index.html` is the only game HTML entrypoint;
- `durniak-offline.html` is deleted;
- no production iframe remains;
- the floating **Gra online** button is gone;
- **Gra online** is a normal main-menu action;
- one shared menu is used before and during play;
- Continue priority is online → offline → hidden;
- stale online resume safely falls back to offline;
- existing offline autosaves remain compatible;
- existing offline gameplay/rules/bots remain functionally unchanged;
- existing QQND Duren multiplayer remains functional;
- no WebRTC/Cloudflare signaling returns;
- automated offline, online, resume, privacy and responsive tests pass;
- deployment documentation lists only the new single-runtime files.
