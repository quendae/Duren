import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFile(path.join(root, file), 'utf8');
const write = (file, content) => fs.writeFile(path.join(root, file), content.replace(/\r\n/g, '\n'), 'utf8');

function requireMatch(value, regex, label) {
  const match = value.match(regex);
  if (!match) throw new Error(`Migration could not find ${label}`);
  return match;
}

function replaceOnce(value, search, replacement, label) {
  if (!value.includes(search)) throw new Error(`Migration could not find ${label}`);
  return value.replace(search, replacement);
}

function replaceRegex(value, regex, replacement, label) {
  if (!regex.test(value)) throw new Error(`Migration could not find ${label}`);
  regex.lastIndex = 0;
  return value.replace(regex, replacement);
}

const legacy = await read('durniak-offline.html');
const shell = await read('index.html');

// --- mechanically extract the offline game ---
const gameCss = requireMatch(legacy, /<style>\s*([\s\S]*?)<\/style>/i, 'legacy style block')[1].trim() + `\n\n/* shared-menu additions */\n.menu-button .menu-copy{display:grid;gap:2px;min-width:0;text-align:left}\n.menu-button .menu-copy b{font:inherit;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.menu-button .menu-copy small{display:block;color:#82948a;font-size:9px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n@media (orientation:landscape) and (max-height:520px) and (max-width:1000px){.menu-button .menu-copy small{display:none}}\n`;

const bodyMatch = requireMatch(legacy, /<body>([\s\S]*?)<script>/i, 'legacy game markup');
let gameMarkup = bodyMatch[1].trim();
const scriptBodies = [...legacy.matchAll(/<script>\s*([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim());
if (scriptBodies.length !== 5) throw new Error(`Expected 5 legacy game scripts, found ${scriptBodies.length}`);
let gameJs = scriptBodies.join('\n\n');

// --- shared menu markup ---
const menuActions = `<div class="menu-actions">
        <button id="menu-continue" class="menu-button primary hidden" data-action="menu-continue">
          <span class="menu-icon">▶</span><span class="menu-copy"><b data-menu-continue-label data-i18n="menu.continue">Kontynuuj grę</b><small id="menu-continue-detail"></small></span><span class="menu-arrow">›</span>
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
      </div>`;
gameMarkup = replaceRegex(
  gameMarkup,
  /<div class="menu-actions">[\s\S]*?<\/div>\s*<label class="menu-language">/,
  `${menuActions}\n      <label class="menu-language">`,
  'main menu actions',
);

// --- i18n additions ---
const translations = [
  ["continue: 'Kontynuuj grę', newGame: 'Nowa gra', howToPlay: 'Jak grać', language: 'Język',", "continue: 'Kontynuuj grę', continueOnline: 'Kontynuuj grę online', newGame: 'Nowa gra', online: 'Gra online', howToPlay: 'Jak grać', language: 'Język',"],
  ["continue: 'Continue game', newGame: 'New game', howToPlay: 'How to play', language: 'Language',", "continue: 'Continue game', continueOnline: 'Continue online game', newGame: 'New game', online: 'Online game', howToPlay: 'How to play', language: 'Language',"],
  ["continue: 'Spiel fortsetzen', newGame: 'Neues Spiel', howToPlay: 'Spielanleitung', language: 'Sprache',", "continue: 'Spiel fortsetzen', continueOnline: 'Online-Spiel fortsetzen', newGame: 'Neues Spiel', online: 'Online spielen', howToPlay: 'Spielanleitung', language: 'Sprache',"],
  ["continue: 'Продолжить игру', newGame: 'Новая игра', howToPlay: 'Как играть', language: 'Язык',", "continue: 'Продолжить игру', continueOnline: 'Продолжить онлайн-игру', newGame: 'Новая игра', online: 'Игра онлайн', howToPlay: 'Как играть', language: 'Язык',"],
];
for (const [from, to] of translations) gameJs = replaceOnce(gameJs, from, to, `translation ${from.slice(0, 24)}`);

// Make the existing offline controller expose resume/menu primitives to the QQND layer.
gameJs = replaceOnce(
  gameJs,
  "  D.game = { state, init, startNewGame, startPractice, showMainMenu, refresh: draw };",
  "  D.game = { state, init, startNewGame, startPractice, showMainMenu, hideMainMenu, refreshMainMenu, readSavedSession, continueSaved, clearSession, refresh: draw };",
  'Durak.game public interface',
);

gameJs = replaceOnce(
  gameJs,
  "        case 'menu-continue': continueSaved(); break;\n        case 'menu-new-game': openNewGameSetup(); break;",
  "        case 'menu-continue': if (window.DurakMP?.continuePreferred) window.DurakMP.continuePreferred(); else continueSaved(); break;\n        case 'menu-new-game': openNewGameSetup(); break;\n        case 'menu-online': window.DurakMP?.openOverlay?.(); break;",
  'shared menu click routing',
);

const oldRefresh = `  function refreshMainMenu() {
    const saved = readSavedSession();
    const button = el('menu-continue');
    const info = el('menu-session-info');
    if (saved) {
      button.classList.remove('hidden');
      const phase = D.i18n.t(\`phase.\${saved.phase}\`);
      info.textContent = T('menu.saved', { round: saved.round, phase: typeof phase === 'string' ? phase : saved.phase });
    } else {
      button.classList.add('hidden');
      info.textContent = T('menu.noSave');
    }
  }`;
const newRefresh = `  function refreshMainMenu() {
    const button = el('menu-continue');
    const label = button?.querySelector('[data-menu-continue-label]');
    const detail = el('menu-continue-detail');
    const info = el('menu-session-info');
    const online = window.DurakMP?.getResumeCandidate?.();
    if (online?.type === 'online') {
      button?.classList.remove('hidden');
      if (button) button.dataset.resumeType = 'online';
      if (label) label.textContent = T('menu.continueOnline');
      if (detail) detail.textContent = online.roomId ? online.roomId : '';
      if (info) info.textContent = online.roomId ? T('menu.continueOnline') + ' · ' + online.roomId : T('menu.continueOnline');
      return;
    }
    const saved = readSavedSession();
    if (saved) {
      button?.classList.remove('hidden');
      if (button) button.dataset.resumeType = 'offline';
      if (label) label.textContent = T('menu.continue');
      const phase = D.i18n.t(\`phase.\${saved.phase}\`);
      const summary = T('menu.saved', { round: saved.round, phase: typeof phase === 'string' ? phase : saved.phase });
      if (detail) detail.textContent = summary;
      if (info) info.textContent = summary;
    } else {
      button?.classList.add('hidden');
      if (button) delete button.dataset.resumeType;
      if (detail) detail.textContent = '';
      if (info) info.textContent = T('menu.noSave');
    }
  }`;
gameJs = replaceOnce(gameJs, oldRefresh, newRefresh, 'resume-aware refreshMainMenu');

// --- copy current QQND overlay into the same page ---
const overlayStart = shell.indexOf('<div id="mp-overlay"');
const multiplayerScripts = shell.indexOf('<script src="./mp/core.js');
if (overlayStart < 0 || multiplayerScripts < 0 || multiplayerScripts <= overlayStart) throw new Error('Could not extract multiplayer overlay markup');
const multiplayerMarkup = shell.slice(overlayStart, multiplayerScripts).trim();

const indexHtml = `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#10261b">
  <meta name="duren-api-url" content="https://api.qqnd.fyi">
  <meta name="duren-client-build" content="20260908-single1">
  <title>Dureń — offline i multiplayer</title>
  <link rel="stylesheet" href="./game.css?v=20260908-single1">
  <link rel="stylesheet" href="./multiplayer.css?v=20260908-single1">
</head>
<body>
${gameMarkup}

${multiplayerMarkup}

  <script src="./game.js?v=20260908-single1"></script>
  <script src="./mp/core.js?v=20260908-single1"></script>
  <script src="./mp/game.js?v=20260908-single1"></script>
  <script src="./mp/network-server.js?v=20260908-single1"></script>
  <script src="./multiplayer.js?v=20260908-single1"></script>
</body>
</html>
`;

await write('game.css', gameCss);
await write('game.js', gameJs);
await write('index.html', indexHtml);

// --- same-page multiplayer bridge ---
let core = await read('mp/core.js');
core = core.replace("  D.frame = document.getElementById('durak-game');\n", '');
core = core.replace("    frameWindow:null, game:null, closeExpected:false, fakeTestMode:false,", "    game:null, closeExpected:false, fakeTestMode:false,");
core = replaceRegex(core, /  D\.language = \(\) => \{[\s\S]*?\n  \};\n  D\.tr =/, `  D.language = () => {
    const value = window.Durak?.game?.state?.settings?.language || window.Durak?.i18n?.language;
    return D.TEXT[value] ? value : 'pl';
  };
  D.tr =`, 'same-page language helper');
core = replaceRegex(core, /  D\.gameDoc = \(\) => \{[\s\S]*?D\.showGameMenu = \(\) => \{ try \{ D\.mp\.game\?\.showMainMenu\?\.\(\); \} catch \{\} \};/, `  D.gameDoc = () => document;
  D.hideGameMenu = () => document.getElementById('main-menu')?.classList.add('hidden');
  D.showGameMenu = () => window.Durak?.game?.showMainMenu?.();`, 'same-page document helpers');
await write('mp/core.js', core);

let mpGame = await read('mp/game.js');
mpGame = replaceOnce(
  mpGame,
  "    const w=D.frame.contentWindow;\n    if(!w?.Durak?.game)return;\n    mp.frameWindow=w; mp.game=w.Durak.game;\n    const G=w.Durak;",
  "    const G=window.Durak;\n    if(!G?.game||!G?.ui)return;\n    mp.game=G.game;",
  'same-page installGameHooks',
);
mpGame = mpGame.replaceAll('mp.frameWindow?.Durak', 'window.Durak');
mpGame = mpGame.replaceAll('mp.frameWindow.Durak', 'window.Durak');
mpGame = mpGame.replaceAll('mp.frameWindow.localStorage', 'localStorage');
mpGame = mpGame.replaceAll('w.Storage?.prototype', 'window.Storage?.prototype');
mpGame = mpGame.replaceAll("D.$('mp-launch').classList.add('hidden');", '');
mpGame = mpGame.replaceAll("D.$('mp-launch')?.classList.add('hidden');", '');
mpGame = replaceOnce(mpGame, "if(actionEl?.dataset.action==='open-main-menu'){event.preventDefault();event.stopImmediatePropagation();D.leaveMultiplayer();}", "if(actionEl?.dataset.action==='open-main-menu'){event.preventDefault();event.stopImmediatePropagation();D.showGameMenu();}", 'host menu interception');
mpGame = replaceOnce(mpGame, "else if(action==='open-main-menu')D.leaveMultiplayer();", "else if(action==='open-main-menu')D.showGameMenu();", 'guest menu interception');
await write('mp/game.js', mpGame);

let network = await read('mp/network-server.js');
network = network.replaceAll('mp.frameWindow?.Durak', 'window.Durak');
network = network.replaceAll('mp.frameWindow.Durak', 'window.Durak');
network = network.replaceAll('mp.frameWindow.localStorage', 'localStorage');
network = network.replaceAll("D.$('mp-launch')?.classList.add('hidden');", '');
network = network.replaceAll("D.$('mp-launch').classList.add('hidden');", '');
network = network.replace(/\n  D\.\$\('mp-launch'\)\?\.addEventListener\([\s\S]*?\);\n  window\.addEventListener\('online'/, "\n  window.addEventListener('online'");

network = replaceOnce(
  network,
  "      localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId: mp.session.id, resumeToken: mp.resumeToken, nickname: mp.session.nickname }));",
  "      const previous = loadStoredSession() || {};\n      localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId: mp.session.id, resumeToken: mp.resumeToken, nickname: mp.session.nickname, roomId: mp.roomCode || previous.roomId || null, onlineEligible: mp.roomObj?.status === 'in_game' ? true : previous.onlineEligible }));",
  'stored session metadata',
);
network = replaceOnce(network, "    rebuildPeers();\n    if (!mp.inGame) {", "    rebuildPeers();\n    storeSession();\n    if (!mp.inGame) {", 'store room metadata');
network = replaceOnce(network, "        if (room.status === 'in_game') socketSend({ type: 'game.state.get', roomId: room.id });\n", '', 'defer state fetch until Continue/reconnect');

const networkExports = `
  D.getStoredServerSession = loadStoredSession;
  D.clearStoredServerSession = clearStoredSession;
  D.clearOnlineResumeCandidate = () => {
    const stored = loadStoredSession();
    if (!stored) return;
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ ...stored, roomId: null, onlineEligible: false })); } catch {}
  };
  D.resumeOnlineGame = async () => {
    await ensureSocket();
    const session = await resumeStoredSession(false);
    const room = mp.roomObj;
    if (!session || !room || room.game !== GAME_ID || room.status !== 'in_game') {
      D.clearOnlineResumeCandidate();
      return false;
    }
    mp.active = true;
    storeSession();
    const stateMessage = await request(
      { type:'game.state.get', roomId:room.id },
      ['game.state','game.state.empty'],
      (message) => message.roomId === room.id,
    );
    return stateMessage.type === 'game.state';
  };
`;
network = replaceOnce(network, "  D.connectSharedServer = async () => {", networkExports + "\n  D.connectSharedServer = async () => {", 'network resume exports');

// Do not auto-resume just by landing on the main menu. Online is explicit through Menu/Continue.
network = replaceRegex(
  network,
  /  prepareSharedUI\(\);\n  const stored = loadStoredSession\(\);[\s\S]*?ensureSocket\(\)\.then\(\(\) => resumeStoredSession\(true\)\)\.then\(\(\) => refreshRooms\(\)\)\.catch\(\(\) => \{\}\);\n\}\)\(\);/,
  `  prepareSharedUI();
  const stored = loadStoredSession();
  if (stored?.nickname && D.$('mp-name')) D.$('mp-name').value = stored.nickname;
})();`,
  'deferred network startup',
);
await write('mp/network-server.js', network);

let multiplayer = await read('multiplayer.js');
multiplayer = multiplayer.replace("  D.$('mp-launch').addEventListener('click', D.openOverlay);\n", '');
multiplayer = replaceRegex(
  multiplayer,
  /  D\.frame\.addEventListener\('load',[\s\S]*?if \(D\.frame\.contentWindow\?\.Durak\?\.game\) D\.installGameHooks\(\);\n  setTimeout\(requestCurrentState, 0\);/,
  `  D.installGameHooks();
  setTimeout(requestCurrentState, 0);`,
  'same-page multiplayer bootstrap',
);

const continueIntegration = `
  D.getResumeCandidate = () => {
    const stored = D.getStoredServerSession?.();
    if (stored?.sessionId && stored?.resumeToken && stored.onlineEligible !== false) {
      return { type:'online', roomId:stored.roomId || '' };
    }
    const saved = window.Durak?.game?.readSavedSession?.();
    return saved ? { type:'offline', summary:saved } : null;
  };

  D.continuePreferred = async () => {
    const candidate = D.getResumeCandidate();
    if (candidate?.type === 'online') {
      const info = D.$('menu-session-info');
      if (info) info.textContent = D.language() === 'pl' ? 'Wznawianie gry online…' : 'Resuming online game…';
      try {
        const resumed = await D.resumeOnlineGame?.();
        if (resumed) {
          D.$('mp-overlay')?.classList.add('hidden');
          window.Durak?.game?.hideMainMenu?.();
          return true;
        }
      } catch (error) {
        console.warn('[Durak MP] resume failed', error);
        if (/invalid_session_credentials|session_expired|room_not_found|not_in_game/.test(String(error?.message || error))) D.clearOnlineResumeCandidate?.();
      }
      D.clearOnlineResumeCandidate?.();
      window.Durak?.game?.refreshMainMenu?.();
      return false;
    }
    if (candidate?.type === 'offline') {
      window.Durak?.game?.continueSaved?.();
      return true;
    }
    window.Durak?.game?.refreshMainMenu?.();
    return false;
  };
`;
multiplayer = replaceOnce(multiplayer, "  function requestCurrentState() {", continueIntegration + "\n  function requestCurrentState() {", 'Continue source integration');

// Intentional Leave must not reload and immediately auto-resume the same room.
multiplayer = replaceRegex(
  multiplayer,
  /  D\.leaveMultiplayer = async \(\) => \{[\s\S]*?\n  \};\n\n  D\.openOverlay/,
  `  D.leaveMultiplayer = async () => {
    try { await D.sharedLeaveRoom?.(false); } catch {}
    D.clearOnlineResumeCandidate?.();
    D.resetNetworkOnly();
    D.$('mp-overlay')?.classList.add('hidden');
    D.$('mp-disconnect')?.classList.add('hidden');
    window.Durak?.game?.showMainMenu?.();
    window.Durak?.game?.refreshMainMenu?.();
  };

  D.openOverlay`,
  'intentional Leave lifecycle',
);
multiplayer = replaceOnce(multiplayer, "  D.installGameHooks();\n  setTimeout(requestCurrentState, 0);", "  D.installGameHooks();\n  window.Durak?.game?.refreshMainMenu?.();\n  setTimeout(requestCurrentState, 0);", 'refresh menu after multiplayer init');
await write('multiplayer.js', multiplayer);

let mpCss = await read('multiplayer.css');
mpCss = mpCss.replace(/^\.game-frame[^\n]*\n/m, '');
mpCss = mpCss.replace(/\.mp-launch \{[\s\S]*?\n\}\n\.mp-launch:hover[^\n]*\n\.mp-launch-dot[^\n]*\n/, '');
mpCss = mpCss.replace(/^\s*\.mp-launch[^\n]*\n/gm, '');
await write('multiplayer.css', mpCss);

// --- adapt existing browser regressions from iframe access to same page ---
let multiplayerSmoke = await read('tests/multiplayer_smoke.mjs');
multiplayerSmoke = multiplayerSmoke
  .replaceAll("document.querySelector('#durak-game').contentWindow.Durak", 'window.Durak')
  .replaceAll("document.querySelector('#durak-game').contentDocument", 'document')
  .replaceAll("document.querySelector('#durak-game').contentWindow", 'window');
multiplayerSmoke = replaceRegex(
  multiplayerSmoke,
  /  for \(const viewport of \[[\s\S]*?\n  const scenarios=/,
  `  for (const viewport of [{width:1440,height:900},{width:1024,height:768},{width:390,height:844},{width:844,height:390}]) {
    const page = await browser.newPage({viewport});
    await ready(page);
    const menu = await page.evaluate(() => {
      const card=document.querySelector('.menu-card')?.getBoundingClientRect();
      const online=document.querySelector('[data-action="menu-online"]')?.getBoundingClientRect();
      const language=document.querySelector('.menu-language')?.getBoundingClientRect();
      return {build:document.querySelector('meta[name="duren-client-build"]')?.content,card,online,language,width:innerWidth,height:innerHeight};
    });
    assert.equal(menu.build,'20260908-single1','wrong entry-point build loaded');
    assert.ok(menu.card && menu.card.left >= -1 && menu.card.right <= menu.width + 1,\`menu overflows horizontally at \${viewport.width}x\${viewport.height}\`);
    assert.ok(menu.online && menu.online.height > 25,'online menu action is not reachable');
    assert.ok(menu.language && menu.language.bottom <= menu.height + 1,\`language selector is outside viewport at \${viewport.width}x\${viewport.height}\`);
    await page.click('[data-action="menu-online"]');
    assert.equal(await page.locator('#mp-overlay').isVisible(),true,\`lobby hidden at \${viewport.width}x\${viewport.height}\`);
    await page.close();
  }

  const scenarios=`,
  'responsive menu block',
);
await write('tests/multiplayer_smoke.mjs', multiplayerSmoke);

let sharedSmoke = await read('tests/shared_server_smoke.mjs');
sharedSmoke = sharedSmoke
  .replaceAll("document.querySelector('#durak-game').contentWindow.Durak", 'window.Durak')
  .replaceAll("document.querySelector('#durak-game').contentDocument", 'document')
  .replaceAll("document.querySelector('#durak-game').contentWindow", 'window')
  .replaceAll("await page.click('#mp-launch');", "await page.click('[data-action=\"menu-online\"]');")
  .replaceAll("await hybrid.click('#mp-launch');", "await hybrid.click('[data-action=\"menu-online\"]');");
await write('tests/shared_server_smoke.mjs', sharedSmoke);

// --- new structural/menu smoke ---
const singleRuntimeSmoke = `import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root=process.cwd();
const indexSource=await fs.readFile(path.join(root,'index.html'),'utf8');
assert.ok(!/<iframe\\b/i.test(indexSource),'production index.html must not contain an iframe');
assert.ok(!/durniak-offline\\.html/i.test(indexSource),'production index.html must not reference durniak-offline.html');
assert.ok(!/id=["']mp-launch["']/i.test(indexSource),'floating online launcher must be removed');
assert.match(indexSource,/game\\.css/); assert.match(indexSource,/game\\.js/);
for(const file of ['index.html','game.js','multiplayer.js','mp/core.js','mp/game.js','mp/network-server.js']){
  const source=await fs.readFile(path.join(root,file),'utf8');
  assert.ok(!/contentWindow|contentDocument|RTCPeerConnection|cloudflare-signaling/.test(source),\`\${file} still contains a forbidden legacy runtime reference\`);
}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1');const rel=url.pathname==='/'?'/index.html':url.pathname;const file=path.join(root,rel.replace(/^\\/+/,''));const data=await fs.readFile(file);res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data)}catch{res.writeHead(404);res.end('not found')}});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto(\`http://127.0.0.1:\${port}/\`,{waitUntil:'load'});await page.waitForFunction(()=>window.Durak?.game?.state&&window.DurakMultiplayer);assert.equal(await page.locator('#main-menu').isVisible(),true);assert.equal(await page.locator('[data-action="menu-new-game"]').isVisible(),true);assert.equal(await page.locator('[data-action="menu-online"]').isVisible(),true);assert.equal(await page.locator('[data-action="menu-tutorial"]').isVisible(),true);assert.equal(await page.locator('#menu-continue').isVisible(),false);await page.click('[data-action="menu-online"]');assert.equal(await page.locator('#mp-overlay').isVisible(),true);await page.click('#mp-close');assert.equal(await page.locator('#main-menu').isVisible(),true);console.log('Single runtime and shared menu smoke: PASS')}finally{await browser.close();await new Promise(r=>server.close(r))}
`;
await write('tests/single_runtime_smoke.mjs', singleRuntimeSmoke);

// --- resume regression with a deterministic fake QQND server ---
const resumeSmoke = `import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root=process.cwd(),types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://127.0.0.1'),rel=u.pathname==='/'?'/index.html':u.pathname,file=path.join(root,rel.replace(/^\\/+/,'')),data=await fs.readFile(file);res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data)}catch{res.writeHead(404);res.end('not found')}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port,browser=await chromium.launch({headless:true});
async function pageWithFake({validOnline=false}={}){const page=await browser.newPage({viewport:{width:1280,height:800}});await page.addInitScript(({validOnline})=>{const listeners=new WeakMap();const emit=(ws,t,e={})=>{for(const f of listeners.get(ws)?.get(t)||[])f.call(ws,e);const h=ws['on'+t];if(typeof h==='function')h.call(ws,e)};class W{static OPEN=1;constructor(){this.readyState=0;listeners.set(this,new Map());setTimeout(()=>{this.readyState=1;emit(this,'open');emit(this,'message',{data:JSON.stringify({type:'hello',protocol:1,service:'qqnd-game-server'})})},0)}addEventListener(t,f){const m=listeners.get(this),a=m.get(t)||[];a.push(f);m.set(t,a)}removeEventListener(){}send(raw){const m=JSON.parse(raw);window.__frames=(window.__frames||[]).concat(m);if(m.type==='session.resume'){setTimeout(()=>{if(validOnline)emit(this,'message',{data:JSON.stringify({type:'session.resumed',session:{id:m.sessionId,nickname:'Tester',connected:true},rooms:[{id:'TEST-ROOM',game:'duren',name:'Resume',visibility:'private',source:'manual',status:'in_game',ownerSessionId:m.sessionId,minPlayers:2,maxPlayers:3,players:[{id:m.sessionId,nickname:'Tester',connected:true},{id:'guest',nickname:'Alice',connected:true}]}]})});else emit(this,'message',{data:JSON.stringify({type:'error',code:'invalid_session_credentials',message:'invalid_session_credentials'})})},0)}if(m.type==='game.state.get'&&validOnline){const s=structuredClone(window.Durak.game.state);s.players=[{name:'Tester',isBot:false,difficulty:'normal'},{name:'Alice',isBot:false,difficulty:'normal'}];s.hands=[[],[]];s.deck=[];s.out=[false,false];s.bubbles=[null,null];s.round=3;s.phase='attack';s.attacker=0;s.defender=1;setTimeout(()=>emit(this,'message',{data:JSON.stringify({type:'game.state',roomId:'TEST-ROOM',revision:9,botSeats:[],hostSessionId:m.sessionId||'',authoritative:false,viewerSeat:0,presence:[],state:s})}),0)}}close(){this.readyState=3;emit(this,'close',{code:1000})}}window.WebSocket=W;window.__validOnline=validOnline},{validOnline});await page.goto(\`http://127.0.0.1:\${port}/\`,{waitUntil:'load'});await page.waitForFunction(()=>window.Durak?.game?.state&&window.DurakMultiplayer);return page}
try{
  const offline=await pageWithFake();await offline.click('[data-action="menu-new-game"]');await offline.click('[data-action="confirm-new-game"]');await offline.waitForFunction(()=>window.Durak.game.state.round>=1);const before=await offline.evaluate(()=>({round:Durak.game.state.round,phase:Durak.game.state.phase,hand:Durak.game.state.hands[0].map(c=>c.id)}));await offline.reload({waitUntil:'load'});await offline.waitForFunction(()=>window.DurakMultiplayer);assert.equal(await offline.locator('#menu-continue').isVisible(),true);await offline.click('#menu-continue');const after=await offline.evaluate(()=>({round:Durak.game.state.round,phase:Durak.game.state.phase,hand:Durak.game.state.hands[0].map(c=>c.id)}));assert.deepEqual(after,before,'offline autosave was not restored');await offline.close();
  const online=await pageWithFake({validOnline:true});await online.evaluate(()=>{localStorage.setItem('durniowie-session-v1',JSON.stringify({round:2,players:[{name:'Offline',isBot:false}],hands:[[]],deck:[],trump:'H',trumpCard:null,discard:[],discardCount:0,table:[],attacker:0,defender:0,phase:'attack',taking:false,passed:[],thrower:null,defenseTarget:0,boutDefenderStart:0,maxAttacks:6,out:[false],outOrder:[],log:[],status:null,rules:{throwInAll:true,transfer:false,limitSix:true},botConfig:[],botCount:0,stats:{wins:0,losses:0,draws:0}}));localStorage.setItem('duren.qqnd.server-session.v1',JSON.stringify({sessionId:'host',resumeToken:'r'.repeat(64),nickname:'Tester',roomId:'TEST-ROOM',onlineEligible:true}));Durak.game.showMainMenu();Durak.game.refreshMainMenu()});assert.equal(await online.locator('#menu-continue').getAttribute('data-resume-type'),'online');await online.click('#menu-continue');await online.waitForFunction(()=>window.DurakMultiplayer.debug.state.inGame===true);assert.equal(await online.evaluate(()=>Durak.game.state.round),3,'online resume did not win priority');await online.close();
  const fallback=await pageWithFake({validOnline:false});await fallback.evaluate(()=>{localStorage.setItem('durniowie-session-v1',JSON.stringify({round:4,players:[{name:'Offline',isBot:false}],hands:[[]],deck:[],trump:'H',trumpCard:null,discard:[],discardCount:0,table:[],attacker:0,defender:0,phase:'attack',taking:false,passed:[],thrower:null,defenseTarget:0,boutDefenderStart:0,maxAttacks:6,out:[false],outOrder:[],log:[],status:null,rules:{throwInAll:true,transfer:false,limitSix:true},botConfig:[],botCount:0,stats:{wins:0,losses:0,draws:0}}));localStorage.setItem('duren.qqnd.server-session.v1',JSON.stringify({sessionId:'bad',resumeToken:'r'.repeat(64),nickname:'Tester',roomId:'OLD-ROOM',onlineEligible:true}));Durak.game.showMainMenu();Durak.game.refreshMainMenu()});await fallback.click('#menu-continue');await fallback.waitForFunction(()=>document.querySelector('#menu-continue')?.dataset.resumeType==='offline');await fallback.click('#menu-continue');assert.equal(await fallback.evaluate(()=>Durak.game.state.round),4,'stale online resume destroyed offline fallback');await fallback.close();
  console.log('Resume priority smoke: PASS');
}finally{await browser.close();await new Promise(r=>server.close(r))}
`;
await write('tests/resume_smoke.mjs', resumeSmoke);

// --- final CI workflow for generated source layout ---
const ci = `name: Multiplayer regression

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  multiplayer:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
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
          node --check game.js
          node --check multiplayer.js
          node --check mp/core.js
          node --check mp/game.js
          node --check mp/network-server.js
          ! grep -R -E 'durniak-offline\\.html|<iframe|contentWindow|contentDocument|RTCPeerConnection|cloudflare-signaling' index.html game.js multiplayer.js mp/core.js mp/game.js mp/network-server.js
          grep -q 'wss://api.qqnd.fyi/api/v1/ws' mp/network-server.js
          grep -q "type: 'game.state.commit'" mp/network-server.js
          grep -q "type: 'game.state.publish'" mp/network-server.js
      - name: Install Playwright
        run: |
          npm install --no-save --no-package-lock playwright
          npx playwright install --with-deps chromium
      - name: Single runtime and shared menu smoke
        run: node tests/single_runtime_smoke.mjs
      - name: Resume priority smoke
        run: node tests/resume_smoke.mjs
      - name: Multiplayer gameplay and responsive regression
        run: node tests/multiplayer_smoke.mjs
      - name: Shared QQND server browser smoke
        run: node tests/shared_server_smoke.mjs
`;
await write('.github/workflows/multiplayer-regression.yml', ci);

// Deployment docs should describe only the single runtime.
const deploy = `# Duren deployment\n\nProduction entry point: \`index.html\`.\n\nCopy these runtime files to the Duren web root:\n\n\`\`\`text\nindex.html\ngame.css\ngame.js\nmultiplayer.css\nmultiplayer.js\nmp/core.js\nmp/game.js\nmp/network-server.js\n\`\`\`\n\nQQND multiplayer uses \`wss://api.qqnd.fyi/api/v1/ws\`. There is no WebRTC, Cloudflare signaling or secondary offline HTML entrypoint.\n\nAfter deployment verify:\n\n1. the shared main menu shows New Game / Online Game / How to Play;\n2. Continue prefers a resumable online session, then an offline autosave;\n3. public room list and join/create work;\n4. two humans, three humans and two humans + bot can start;\n5. disconnect/reconnect and substitute-bot takeover still work.\n`;
await write('DEPLOY_MULTIPLAYER.md', deploy);

await fs.rm(path.join(root, 'durniak-offline.html'));
console.log('Single-runtime migration generated successfully.');
