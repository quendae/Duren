# Duren Single-Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the iframe-based Duren shell with one modular `index.html` runtime that supports offline play, QQND multiplayer, and Continue priority `online → offline → hidden` from one coherent main menu.

**Architecture:** Keep the existing `window.Durak` game implementation and mechanically extract it from `durniak-offline.html` into `game.css` + `game.js`. Rewire the QQND bridge to the same-page `window.Durak`/`document`, then integrate multiplayer resume detection into the existing main menu without changing Duren rules or the Phase 1 browser-host-authoritative trust model.

**Tech Stack:** Browser HTML/CSS/vanilla JS, Playwright, Node.js 22, QQND WebSocket protocol at `wss://api.qqnd.fyi/api/v1/ws`.

**Spec:** `docs/superpowers/specs/2026-09-08-duren-single-runtime-design.md`

## Global Constraints

- `index.html` is the only production HTML entrypoint.
- Preserve offline save keys and save shape: `durniowie-meta-v1` and `durniowie-session-v1`.
- Keep shared-server session key compatible: `duren.qqnd.server-session.v1`; adding optional room metadata is allowed.
- Do not change Duren rules, bot strategy, scoring, or Phase 1 host-authoritative semantics.
- Do not reintroduce WebRTC, `RTCPeerConnection`, Cloudflare signaling, or a legacy signaling adapter.
- Preserve 2-human, 3-human, and 2-human+bot starts.
- Preserve per-seat private state projection; opponent hands must never be published to guests.
- Preserve 60-second reconnect grace, substitute bot takeover, and seat reclaim.
- Continue priority is strictly online candidate first, offline autosave second, otherwise hidden.
- A failed/stale online resume must not delete or overwrite a valid offline save.
- Opening the main menu during a game does not leave the room or clear game state.
- Final production runtime contains no `<iframe>`, `contentWindow`, `contentDocument`, `durniak-offline.html`, `RTCPeerConnection`, or `cloudflare-signaling` references.

---

## Target File Structure

```text
index.html
  # game markup + shared main menu + settings/tutorial/result overlays + QQND overlay

game.css
  # all game/menu/responsive CSS formerly embedded in durniak-offline.html

game.js
  # existing window.Durak modules in current order

multiplayer.css
multiplayer.js
mp/core.js
mp/game.js
mp/network-server.js

tests/multiplayer_smoke.mjs
tests/shared_server_smoke.mjs
tests/single_runtime_smoke.mjs
tests/resume_smoke.mjs
.github/workflows/multiplayer-regression.yml
DEPLOY_MULTIPLAYER.md
```

---

### Task 1: Add a failing single-runtime/menu regression before changing runtime code

**Files:**
- Create: `tests/single_runtime_smoke.mjs`
- Modify: `.github/workflows/multiplayer-regression.yml`

**Interfaces:**
- Consumes: current `/index.html` entrypoint.
- Produces: a guard that defines the desired runtime structure and shared-menu behavior.

- [ ] **Step 1: Add a structural browser test that fails against the current iframe shell**

Create `tests/single_runtime_smoke.mjs` using the same lightweight HTTP server pattern as `tests/shared_server_smoke.mjs`. The assertions must include all of these conditions:

```js
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = process.cwd();
const indexSource = await fs.readFile(path.join(root, 'index.html'), 'utf8');

assert.ok(!/<iframe\b/i.test(indexSource), 'production index.html must not contain an iframe');
assert.ok(!/durniak-offline\.html/i.test(indexSource), 'production index.html must not reference durniak-offline.html');
assert.ok(!/id=["']mp-launch["']/i.test(indexSource), 'floating online launcher must be removed');
assert.match(indexSource, /game\.css/);
assert.match(indexSource, /game\.js/);

const runtimeFiles = ['index.html','game.js','multiplayer.js','mp/core.js','mp/game.js','mp/network-server.js'];
for (const file of runtimeFiles) {
  const source = await fs.readFile(path.join(root, file), 'utf8');
  assert.ok(!/contentWindow|contentDocument|RTCPeerConnection|cloudflare-signaling/.test(source), `${file} still contains a forbidden legacy runtime reference`);
}
```

Serve `/index.html`, `/game.css`, `/game.js`, `/multiplayer.css`, `/multiplayer.js`, and `/mp/*.js`, then launch Chromium and assert:

```js
await page.goto(base, { waitUntil: 'load' });
await page.waitForFunction(() => window.Durak?.game?.state);

assert.equal(await page.locator('#main-menu').isVisible(), true);
assert.equal(await page.locator('[data-action="menu-new-game"]').isVisible(), true);
assert.equal(await page.locator('[data-action="menu-online"]').isVisible(), true);
assert.equal(await page.locator('[data-action="menu-tutorial"]').isVisible(), true);
assert.equal(await page.locator('#menu-continue').isVisible(), false);

await page.click('[data-action="menu-online"]');
assert.equal(await page.locator('#mp-overlay').isVisible(), true);
await page.click('#mp-close');
assert.equal(await page.locator('#main-menu').isVisible(), true);
```

- [ ] **Step 2: Wire the new test into CI before implementation**

Add after the Playwright install step:

```yaml
      - name: Single runtime and shared menu smoke
        run: node tests/single_runtime_smoke.mjs
```

Do not remove the old structure assertions yet; this first commit is intentionally red.

- [ ] **Step 3: Run the test and confirm the expected failure**

Run:

```bash
npm install --no-save --no-package-lock playwright
npx playwright install chromium
node tests/single_runtime_smoke.mjs
```

Expected: FAIL because current `index.html` contains `<iframe id="durak-game">`, references `durniak-offline.html`, lacks `game.js`/`game.css`, and still has `#mp-launch`.

- [ ] **Step 4: Commit the red test**

```bash
git add tests/single_runtime_smoke.mjs .github/workflows/multiplayer-regression.yml
git commit -m "test: define Duren single-runtime contract"
```

---

### Task 2: Mechanically split the offline monolith into `index.html`, `game.css`, and `game.js`

**Files:**
- Create: `game.css`
- Create: `game.js`
- Modify: `index.html`
- Keep temporarily: `durniak-offline.html`

**Interfaces:**
- Consumes: current `durniak-offline.html` markup, `<style>`, and five inline `window.Durak` scripts.
- Produces: same-page `window.Durak` runtime loaded directly by `index.html`.

- [ ] **Step 1: Extract game CSS without redesigning it**

Copy the complete contents of the single embedded `<style>...</style>` block from `durniak-offline.html` into `game.css`, byte-for-byte except for removing the enclosing `<style>` tags.

The first declarations in `game.css` must remain the current game variables:

```css
:root {
  --bg: #08110d;
  --panel: #111a16;
  --panel-2: #17231d;
  --felt: #15573a;
  --felt-hi: #20734c;
  --felt-dark: #0d3d29;
  --ink: #edf5ef;
  --muted: #97aa9f;
  --gold: #d7b45e;
}
```

Do not move QQND overlay rules into `game.css`; they stay in `multiplayer.css`.

- [ ] **Step 2: Extract the five inline game scripts in their existing order**

Concatenate the JavaScript bodies of the five current inline `<script>` modules into `game.js` in this exact order:

```text
1. constants + i18n
2. rules/deck/legal moves
3. bots
4. UI rendering
5. controller/autosave/menu/tutorial
```

Preserve each existing IIFE and the `window.Durak` namespace. Do not convert this migration to ES modules.

The end of `game.js` must still initialize the game with the current logic:

```js
D.game = { state, init, startNewGame, startPractice, showMainMenu, refresh: draw };
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

This public object is extended in Task 4; do not change its behavior yet.

- [ ] **Step 3: Replace the shell `index.html` with the actual game document**

Use the existing body markup from `durniak-offline.html` as the main body. In `<head>`, keep these single-runtime metadata and stylesheets:

```html
<meta name="duren-api-url" content="https://api.qqnd.fyi">
<meta name="duren-client-build" content="20260908-single1">
<link rel="stylesheet" href="./game.css?v=20260908-single1">
<link rel="stylesheet" href="./multiplayer.css?v=20260908-single1">
```

Remove all inline `<style>` and inline game `<script>` blocks from the resulting HTML.

Append the existing multiplayer overlay markup (`#mp-overlay` and `#mp-disconnect`) to the same body, but do not include `#mp-launch`.

Load scripts at the end of `<body>` in this exact order:

```html
<script src="./game.js?v=20260908-single1"></script>
<script src="./mp/core.js?v=20260908-single1"></script>
<script src="./mp/game.js?v=20260908-single1"></script>
<script src="./mp/network-server.js?v=20260908-single1"></script>
<script src="./multiplayer.js?v=20260908-single1"></script>
```

- [ ] **Step 4: Add the Online action to the existing menu markup**

Inside the existing `.menu-actions`, keep Continue first and insert Online between New Game and Tutorial:

```html
<button id="menu-continue" class="menu-button primary hidden" data-action="menu-continue">
  <span class="menu-icon">▶</span>
  <span><b data-menu-continue-label data-i18n="menu.continue">Kontynuuj grę</b><small id="menu-continue-detail"></small></span>
  <span class="menu-arrow">›</span>
</button>
<button class="menu-button" data-action="menu-new-game">
  <span class="menu-icon">＋</span><span data-i18n="menu.newGame">Nowa gra</span><span class="menu-arrow">›</span>
</button>
<button class="menu-button" data-action="menu-online">
  <span class="menu-icon">◉</span><span data-i18n="menu.online">Gra online</span><span class="menu-arrow">›</span>
</button>
<button class="menu-button" data-action="menu-tutorial">
  <span class="menu-icon">?</span><span data-i18n="menu.howToPlay">Jak grać</span><span class="menu-arrow">›</span>
</button>
```

Add `menu.online` and `menu.continueOnline` translations to the existing language tables. Use:

```text
pl: Gra online / Kontynuuj grę online
en: Online game / Continue online game
de: Online spielen / Online-Spiel fortsetzen
ru: Игра онлайн / Продолжить онлайн-игру
```

- [ ] **Step 5: Verify that only structural expectations now fail**

Run:

```bash
node --check game.js
node tests/single_runtime_smoke.mjs
```

Expected at this stage: `game.js` syntax PASS. The browser test may still fail because multiplayer bridge code still expects the iframe; that is the expected red state before Task 3.

- [ ] **Step 6: Commit the mechanical split**

```bash
git add index.html game.css game.js
git commit -m "refactor: split Duren into single-page game runtime"
```

---

### Task 3: Rewire multiplayer from iframe traversal to same-page `window.Durak`

**Files:**
- Modify: `mp/core.js`
- Modify: `mp/game.js`
- Modify: `multiplayer.js`
- Modify: `multiplayer.css`
- Modify: `tests/multiplayer_smoke.mjs`
- Modify: `tests/shared_server_smoke.mjs`

**Interfaces:**
- Consumes: same-page `window.Durak` from Task 2.
- Produces: same multiplayer behavior without `frame`, `frameWindow`, `contentWindow`, or `contentDocument`.

- [ ] **Step 1: Replace iframe helpers in `mp/core.js` with same-page helpers**

Remove:

```js
D.frame = document.getElementById('durak-game');
```

Replace iframe-based language and document helpers with:

```js
D.language = () => {
  const value = window.Durak?.game?.state?.settings?.language || window.Durak?.i18n?.language;
  return D.TEXT[value] ? value : 'pl';
};

D.gameDoc = () => document;
D.hideGameMenu = () => document.getElementById('main-menu')?.classList.add('hidden');
D.showGameMenu = () => window.Durak?.game?.showMainMenu?.();
```

Remove `frameWindow` from `D.mp` and any code that populates it.

- [ ] **Step 2: Make `D.installGameHooks()` target `window.Durak` directly**

In `mp/game.js`, the first part becomes:

```js
D.installGameHooks = () => {
  const G = window.Durak;
  if (!G?.game || !G?.ui) return;
  mp.game = G.game;
  if (G.ui.__durakMpHooked) {
    mp.hooksInstalled = true;
    return;
  }
  Object.defineProperty(G.ui, '__durakMpHooked', { value: true });
  mp.originalRender = G.ui.render.bind(G.ui);
  G.ui.render = function(state) {
    mp.originalRender(state);
    decorateHumans(state);
    if (mp.role === 'host' && mp.inGame && !mp.paused && state === G.game.state) D.queueBroadcast();
  };
  // keep the existing bot interception bodies unchanged, but reference G directly
};
```

Convert every remaining `mp.frameWindow.Durak` or `mp.frameWindow?.Durak` reference to `window.Durak`/`G`.

For example:

```js
const G = window.Durak;
const old = G.SPEEDS[speedKey];
G.SPEEDS[speedKey] = 0.01;
try { mp.game.refresh(); } finally { G.SPEEDS[speedKey] = old; }
```

and:

```js
try { localStorage.removeItem('durniowie-session-v1'); } catch {}
```

- [ ] **Step 3: Change Menu interception so opening Menu does not leave multiplayer**

Current host/guest click interception treats `open-main-menu` as `D.leaveMultiplayer()`. Replace that behavior.

For host:

```js
if (actionEl?.dataset.action === 'open-main-menu') {
  event.preventDefault();
  event.stopImmediatePropagation();
  D.showGameMenu();
}
```

For guest:

```js
else if (action === 'open-main-menu') D.showGameMenu();
```

`room.leave` remains bound only to the explicit multiplayer Leave button and disconnect exit flow.

- [ ] **Step 4: Remove iframe-load bootstrapping from `multiplayer.js`**

Delete the entire `D.frame.addEventListener('load', ...)` path and initialize once against the already-loaded same-page game:

```js
D.installGameHooks();
setTimeout(requestCurrentState, 0);
```

Remove any state reset that only existed because iframe reloads recreated `window.Durak`.

- [ ] **Step 5: Remove floating launcher styles from `multiplayer.css`**

Delete `.game-frame`, `.mp-launch`, `.mp-launch:hover`, `.mp-launch-dot`, and responsive `.mp-launch` rules.

Do not change QQND overlay/lobby styling beyond what is necessary for same-page integration.

- [ ] **Step 6: Update browser tests from iframe access to same-page access**

Examples in `tests/shared_server_smoke.mjs`:

Replace:

```js
document.querySelector('#durak-game').contentWindow.Durak.game.state.players[1]
```

with:

```js
window.Durak.game.state.players[1]
```

Replace all waits for iframe load with:

```js
await page.waitForFunction(() => window.Durak?.game?.state && window.DurakMultiplayer?.debug?.state);
```

- [ ] **Step 7: Run existing multiplayer regressions**

Run:

```bash
node --check mp/core.js
node --check mp/game.js
node --check mp/network-server.js
node --check multiplayer.js
node tests/multiplayer_smoke.mjs
node tests/shared_server_smoke.mjs
node tests/single_runtime_smoke.mjs
```

Expected: all PASS except Continue-resume behavior, which is introduced in Task 4.

- [ ] **Step 8: Commit the same-page bridge**

```bash
git add mp/core.js mp/game.js multiplayer.js multiplayer.css tests/multiplayer_smoke.mjs tests/shared_server_smoke.mjs
git commit -m "refactor: run Duren multiplayer in the game page"
```

---

### Task 4: Expose offline resume primitives and make Continue source-aware

**Files:**
- Modify: `game.js`
- Modify: `multiplayer.js`
- Modify: `mp/network-server.js`
- Create: `tests/resume_smoke.mjs`

**Interfaces:**
- Consumes: existing offline autosave functions and QQND session storage.
- Produces: `window.Durak.game.getSavedSession()`, `window.Durak.game.continueSaved()`, `D.getResumeCandidate()`, and `D.continueBestCandidate()`.

- [ ] **Step 1: Extend the public game controller API without changing save format**

At the end of `game.js`, replace the current public object with:

```js
D.game = {
  state,
  init,
  startNewGame,
  startPractice,
  showMainMenu,
  hideMainMenu,
  refreshMainMenu,
  getSavedSession: readSavedSession,
  continueSaved,
  refresh: draw,
};
```

Do not rename `SESSION_KEY` or alter `persistSession()` serialization.

- [ ] **Step 2: Store optional room metadata alongside QQND resume credentials**

In `mp/network-server.js`, keep backward compatibility with old values while extending the stored object:

```js
function storeSession() {
  if (!mp.session?.id || !mp.resumeToken) return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      sessionId: mp.session.id,
      resumeToken: mp.resumeToken,
      nickname: mp.session.nickname,
      roomId: mp.roomCode || mp.roomObj?.id || null,
      roomStatus: mp.roomObj?.status || null,
    }));
  } catch {}
}
```

Call `storeSession()` at the end of `syncRoom(room)` so room id/status stay current:

```js
rebuildPeers();
storeSession();
```

Existing stored objects without `roomId` must still load successfully.

- [ ] **Step 3: Export non-mutating online candidate inspection and explicit resume**

At the end of `mp/network-server.js`, expose:

```js
D.getStoredOnlineSession = () => loadStoredSession();
D.clearStoredOnlineSession = () => clearStoredSession();
D.resumeStoredOnlineSession = async () => {
  const session = await resumeStoredSession(false);
  return {
    session,
    room: mp.roomObj,
    inGame: mp.roomObj?.status === 'in_game',
  };
};
```

This function must not create a new guest session when resume fails.

- [ ] **Step 4: Implement the strict candidate priority in `multiplayer.js`**

Add:

```js
D.getResumeCandidate = () => {
  const online = D.getStoredOnlineSession?.();
  if (online) return { type: 'online', roomId: online.roomId || null };
  const offline = window.Durak?.game?.getSavedSession?.();
  if (offline) return { type: 'offline', summary: { round: offline.round, phase: offline.phase } };
  return null;
};
```

Add a menu renderer:

```js
D.refreshSharedMenu = () => {
  const button = document.getElementById('menu-continue');
  const label = document.querySelector('[data-menu-continue-label]');
  const detail = document.getElementById('menu-continue-detail');
  const info = document.getElementById('menu-session-info');
  const candidate = D.getResumeCandidate();

  button?.classList.toggle('hidden', !candidate);
  if (!candidate) {
    if (detail) detail.textContent = '';
    return;
  }

  if (candidate.type === 'online') {
    if (label) label.textContent = D.tr('continueOnline');
    if (detail) detail.textContent = candidate.roomId ? `Pokój ${candidate.roomId}` : '';
    if (info) info.textContent = candidate.roomId ? `QQND · ${candidate.roomId}` : 'QQND';
    return;
  }

  if (label) label.textContent = window.Durak.i18n.t('menu.continue');
  if (detail) detail.textContent = '';
};
```

Add `continueOnline` to `D.TEXT` language packs.

- [ ] **Step 5: Implement `continueBestCandidate()` with safe fallback**

Use this exact control flow:

```js
D.continueBestCandidate = async () => {
  const candidate = D.getResumeCandidate();
  if (!candidate) return false;

  if (candidate.type === 'online') {
    try {
      const resumed = await D.resumeStoredOnlineSession();
      if (resumed?.session && resumed?.room?.status === 'in_game') {
        D.installGameHooks();
        if (mp.socket?.readyState === WebSocket.OPEN) {
          mp.socket.send(JSON.stringify({ type: 'game.state.get', roomId: resumed.room.id }));
        }
        return true;
      }
      D.clearStoredOnlineSession?.();
    } catch (error) {
      if (/invalid_session_credentials|session_expired|room_not_found|not_in_game/.test(String(error?.message || error))) {
        D.clearStoredOnlineSession?.();
      } else {
        D.setStatus('mp-home-status', D.tr('signalingError'), true);
        return false;
      }
    }
    D.refreshSharedMenu();
  }

  const offline = window.Durak?.game?.getSavedSession?.();
  if (offline) {
    window.Durak.game.continueSaved();
    D.refreshSharedMenu();
    return true;
  }
  D.refreshSharedMenu();
  return false;
};
```

For transient network outages, do not clear stored credentials and do not silently start offline. The fallback-to-offline path is for confirmed stale/invalid online membership/credentials.

- [ ] **Step 6: Route menu actions through the shared menu integration**

The game controller still handles existing offline actions, but `menu-online` and source-aware Continue are intercepted before the game handler executes:

```js
document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'menu-online') {
    event.preventDefault();
    event.stopImmediatePropagation();
    D.openOverlay();
    return;
  }
  if (action === 'menu-continue' && D.getResumeCandidate()?.type === 'online') {
    event.preventDefault();
    event.stopImmediatePropagation();
    D.continueBestCandidate();
  }
}, true);
```

After game initialization, call:

```js
D.refreshSharedMenu();
```

When the game language changes or menu opens, refresh the shared menu so Online/Continue labels stay localized.

- [ ] **Step 7: Add deterministic offline/online resume regression coverage**

Create `tests/resume_smoke.mjs` with a fake WebSocket based on `tests/shared_server_smoke.mjs` and two scenarios.

Scenario A — offline only:

```js
await page.evaluate(() => {
  localStorage.setItem('durniowie-session-v1', JSON.stringify({
    round: 4,
    players: [{name:'Ty',isBot:false,difficulty:'normal'},{name:'Bot',isBot:true,difficulty:'normal'}],
    hands: [[{id:'C6',suit:'C',rank:'6'}],[{id:'D7',suit:'D',rank:'7'}]],
    deck: [], trump: 'C', trumpCard: null, discard: [], discardCount: 0,
    table: [], attacker: 0, defender: 1, phase: 'attack', taking: false,
    passed: [], thrower: null, defenseTarget: 0, boutDefenderStart: 1,
    maxAttacks: 1, out: [false,false], outOrder: [], log: [],
    status: {key:'status.yourAttack',vars:null}, rules: {throwInAll:true,transfer:false,limitSix:true},
    botConfig: ['normal'], botCount: 1, stats: {wins:0,losses:0,draws:0}
  }));
});
await page.reload();
await page.click('#menu-continue');
assert.equal(await page.evaluate(() => window.Durak.game.state.round), 4);
assert.equal(await page.evaluate(() => window.Durak.game.state.phase), 'attack');
```

Scenario B — online candidate plus offline save:

```js
localStorage.setItem('duren.qqnd.server-session.v1', JSON.stringify({
  sessionId: HOST_ID,
  resumeToken: 'r'.repeat(64),
  nickname: 'Tester',
  roomId: 'TEST-ROOM',
  roomStatus: 'in_game'
}));
```

Assert the Continue label is online-aware and the first sent auth frame is `session.resume`, not offline restore.

Then configure fake server response `error: invalid_session_credentials`; assert the QQND key is removed, `durniowie-session-v1` remains, menu recomputes to offline Continue, and clicking again restores round 4.

- [ ] **Step 8: Run resume tests and commit**

Run:

```bash
node tests/resume_smoke.mjs
node tests/single_runtime_smoke.mjs
node tests/shared_server_smoke.mjs
```

Expected: PASS.

Commit:

```bash
git add game.js multiplayer.js mp/network-server.js tests/resume_smoke.mjs
git commit -m "feat: unify Duren offline and online resume"
```

---

### Task 5: Make multiplayer menu lifecycle consistent and preserve live games

**Files:**
- Modify: `multiplayer.js`
- Modify: `mp/game.js`
- Modify: `mp/network-server.js`
- Modify: `tests/shared_server_smoke.mjs`

**Interfaces:**
- Consumes: shared menu and same-page runtime.
- Produces: explicit Leave vs non-destructive Menu behavior.

- [ ] **Step 1: Ensure `D.openOverlay()` is entered only from the menu action**

Remove the obsolete `#mp-launch` listener entirely:

```js
// delete: D.$('mp-launch').addEventListener('click', D.openOverlay);
```

Keep `#mp-close`, create, join, copy, bot, start, leave, and disconnect listeners.

- [ ] **Step 2: Stop reloading the page after explicit multiplayer leave**

Replace the current reload-based leave with a same-page reset:

```js
D.leaveMultiplayer = async () => {
  try { await D.sharedLeaveRoom?.(false); } catch {}
  D.resetNetworkOnly();
  D.$('mp-overlay')?.classList.add('hidden');
  D.$('mp-disconnect')?.classList.add('hidden');
  window.Durak?.game?.showMainMenu?.();
  D.refreshSharedMenu?.();
};
```

This removes the existing intentional-leave/autoresume race caused by `location.reload()` while preserving the long-lived guest credentials unless the network layer explicitly invalidates them.

- [ ] **Step 3: Keep Main Menu non-destructive for both host and guest**

Add a multiplayer regression that starts a live game, clicks the in-game Menu button, and asserts:

```js
assert.equal(await page.locator('#main-menu').isVisible(), true);
assert.equal(await page.evaluate(() => window.DurakMultiplayer.debug.state.inGame), true);
assert.equal(await page.evaluate(() => window.__wsFrames.some((m) => m.type === 'room.leave')), false);
```

Then close/continue from the menu and assert the same round/hand is still present.

- [ ] **Step 4: Verify explicit Leave still sends `room.leave`**

Open multiplayer lobby/game controls, trigger `#mp-leave`, and assert:

```js
await page.waitForFunction(() => window.__wsFrames.some((m) => m.type === 'room.leave'));
```

- [ ] **Step 5: Run regression and commit**

```bash
node tests/shared_server_smoke.mjs
node tests/resume_smoke.mjs
```

Expected: PASS.

```bash
git add multiplayer.js mp/game.js mp/network-server.js tests/shared_server_smoke.mjs
git commit -m "fix: preserve live Duren games when opening menu"
```

---

### Task 6: Add responsive menu regression for the extra Online/Continue action

**Files:**
- Modify: `tests/single_runtime_smoke.mjs`
- Modify: `game.css`

**Interfaces:**
- Consumes: shared main menu.
- Produces: geometry assertions for desktop/tablet/phone portrait/phone landscape.

- [ ] **Step 1: Add four viewport checks**

Use these viewports:

```js
const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
];
```

For each viewport, open `/index.html`, inject a valid offline save so Continue is visible, then assert every menu action and language control has a positive bounding box fully inside the viewport:

```js
for (const selector of [
  '#menu-continue',
  '[data-action="menu-new-game"]',
  '[data-action="menu-online"]',
  '[data-action="menu-tutorial"]',
  '[data-language-select]'
]) {
  const box = await page.locator(selector).first().boundingBox();
  assert.ok(box && box.width > 0 && box.height > 0, `${name}: ${selector} is not visible`);
  assert.ok(box.x >= 0 && box.y >= 0, `${name}: ${selector} starts outside viewport`);
  assert.ok(box.x + box.width <= width + 1, `${name}: ${selector} overflows horizontally`);
  assert.ok(box.y + box.height <= height + 1, `${name}: ${selector} overflows vertically`);
}
```

- [ ] **Step 2: Adjust only the existing compact-menu responsive rules if the new fourth action overflows**

Retain the current landscape pattern and make the action grid explicitly four columns when height is constrained:

```css
@media (orientation: landscape) and (max-height: 520px) and (max-width: 1000px) {
  .menu-actions { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .menu-button { min-width: 0; }
  .menu-button > span:nth-child(2) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
```

For narrow portrait, keep the existing one-column flow; do not shrink touch targets below the existing menu-button minimum height.

- [ ] **Step 3: Run the responsive test and commit**

```bash
node tests/single_runtime_smoke.mjs
```

Expected: PASS for all four viewports.

```bash
git add game.css tests/single_runtime_smoke.mjs
git commit -m "test: cover Duren shared menu across viewports"
```

---

### Task 7: Delete the legacy HTML and harden CI/deployment docs

**Files:**
- Delete: `durniak-offline.html`
- Modify: `.github/workflows/multiplayer-regression.yml`
- Modify: `DEPLOY_MULTIPLAYER.md`
- Modify: `README.md`
- Modify: `README.pl.md`
- Modify: `README.de.md`
- Modify: `README.ru.md`

**Interfaces:**
- Consumes: green single-runtime tests.
- Produces: clean final repository/deployment artifact list.

- [ ] **Step 1: Replace old workflow structure checks with the final single-runtime contract**

The `Runtime structure and syntax` step must contain:

```yaml
      - name: Runtime structure and syntax
        run: |
          test -f index.html
          test -f game.css
          test -f game.js
          test -f multiplayer.css
          test -f multiplayer.js
          test -f mp/core.js
          test -f mp/game.js
          test -f mp/network-server.js
          test ! -e durniak-offline.html
          test ! -e cloudflare-signaling
          test ! -e mp/network.js
          test ! -e mp/shared-finalize.js
          node --check game.js
          node --check multiplayer.js
          node --check mp/core.js
          node --check mp/game.js
          node --check mp/network-server.js
          ! grep -R -E 'durniak-offline\.html|<iframe|contentWindow|contentDocument|RTCPeerConnection|cloudflare-signaling' index.html game.js multiplayer.js mp/*.js
          grep -q 'game.css?v=20260908-single1' index.html
          grep -q 'network-server.js?v=20260908-single1' index.html
          grep -q 'wss://api.qqnd.fyi/api/v1/ws' mp/network-server.js
          grep -q "type: 'game.state.commit'" mp/network-server.js
          grep -q "type: 'game.state.publish'" mp/network-server.js
```

Run these browser tests in CI:

```yaml
      - name: Single runtime and shared menu smoke
        run: node tests/single_runtime_smoke.mjs
      - name: Offline and online resume smoke
        run: node tests/resume_smoke.mjs
      - name: Multiplayer gameplay and responsive regression
        run: node tests/multiplayer_smoke.mjs
      - name: Shared QQND server browser smoke
        run: node tests/shared_server_smoke.mjs
```

- [ ] **Step 2: Delete `durniak-offline.html` only after all local tests are green**

Run before deletion:

```bash
node tests/single_runtime_smoke.mjs
node tests/resume_smoke.mjs
node tests/multiplayer_smoke.mjs
node tests/shared_server_smoke.mjs
```

Expected: PASS.

Then:

```bash
git rm durniak-offline.html
```

- [ ] **Step 3: Update deployment documentation with the exact final runtime**

`DEPLOY_MULTIPLAYER.md` must list only:

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

Document that clean deployment should remove obsolete files before copying the new runtime.

Update READMEs so they describe one web entrypoint and no iframe/P2P/Cloudflare signaling.

- [ ] **Step 4: Run the final full verification**

```bash
node --check game.js
node --check multiplayer.js
node --check mp/core.js
node --check mp/game.js
node --check mp/network-server.js
node tests/single_runtime_smoke.mjs
node tests/resume_smoke.mjs
node tests/multiplayer_smoke.mjs
node tests/shared_server_smoke.mjs
grep -R -n -E 'durniak-offline\.html|<iframe|contentWindow|contentDocument|RTCPeerConnection|cloudflare-signaling' index.html game.js multiplayer.js mp || true
```

Expected:
- every Node/Playwright command exits 0;
- final grep prints nothing.

- [ ] **Step 5: Commit cleanup**

```bash
git add .github/workflows/multiplayer-regression.yml DEPLOY_MULTIPLAYER.md README.md README.pl.md README.de.md README.ru.md
git add -u
git commit -m "chore: retire legacy Duren iframe runtime"
```

---

### Task 8: Verify the release commit and live-ready behavior

**Files:**
- No new production files unless verification reveals a regression.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: a release-ready `main` commit suitable for the clean Synology deployment.

- [ ] **Step 1: Verify repository HEAD contains only the intended runtime**

```bash
git status --short
git ls-files | grep -E '^(index\.html|game\.(css|js)|multiplayer\.(css|js)|mp/)'
```

Expected runtime listing:

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

- [ ] **Step 2: Confirm Continue behavior in a browser test run**

Verify these three states from `tests/resume_smoke.mjs`:

```text
no candidate         -> Continue hidden
offline only         -> Continue offline
online + offline     -> Continue online first
stale online + save  -> stale online invalidated, offline save preserved and usable
```

- [ ] **Step 3: Confirm live multiplayer regression matrix**

The automated suite must prove:

```text
2 humans
3 humans
2 humans + bot
private guest projection
host commit + publish
presence disconnect
bot takeover
seat reclaim
menu during live game does not leave
explicit Leave does leave
```

- [ ] **Step 4: Check CI on the final commit before declaring completion**

Inspect the GitHub Actions run associated with the final commit. Completion requires the `Multiplayer regression` workflow to be green.

- [ ] **Step 5: Record the deployment instructions in the completion message**

Use this clean-deploy guidance:

```text
Remove the current deployed Duren runtime directory contents, then copy only:
index.html
game.css
game.js
multiplayer.css
multiplayer.js
mp/core.js
mp/game.js
mp/network-server.js
```

The browser entry remains simply:

```text
https://duren.qqnd.fyi/
```
