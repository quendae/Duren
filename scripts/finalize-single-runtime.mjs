import fs from 'node:fs/promises';

async function read(path) { return fs.readFile(path, 'utf8'); }
async function write(path, value) { return fs.writeFile(path, value.replace(/\r\n/g, '\n'), 'utf8'); }
function replaceOnce(text, oldValue, newValue, label) {
  if (!text.includes(oldValue)) throw new Error(`Missing replacement target: ${label}`);
  return text.replace(oldValue, newValue);
}

let text = await read('game.js');
for (const [oldValue, newValue, label] of [
  ["eyebrow: 'OFFLINE · KARTY · DURZEŃ', yourCards:", "eyebrow: 'KARTY · DUREŃ', yourCards:", 'PL common eyebrow'],
  ["eyebrow: 'OFFLINE · KARTY · DURZEŃ',\n      subtitle: 'Klasyczny Durak · jeden gracz i do trzech botów',", "eyebrow: 'OFFLINE · ONLINE · KARTY · DUREŃ',\n      subtitle: 'Klasyczny Durak · offline i online',", 'PL menu copy'],
  ["eyebrow: 'OFFLINE · CARDS · THE FOOL', yourCards:", "eyebrow: 'CARDS · DURAK', yourCards:", 'EN common eyebrow'],
  ["eyebrow: 'OFFLINE · CARDS · THE FOOL',\n      subtitle: 'Classic Durak · one player and up to three bots',", "eyebrow: 'OFFLINE · ONLINE · CARDS · DURAK',\n      subtitle: 'Classic Durak · offline and online',", 'EN menu copy'],
  ["eyebrow: 'OFFLINE · KARTEN · DER NARR', yourCards:", "eyebrow: 'KARTEN · DURAK', yourCards:", 'DE common eyebrow'],
  ["eyebrow: 'OFFLINE · KARTEN · DER NARR',\n        subtitle: 'Klassisches Durak · ein Spieler und bis zu drei Bots',", "eyebrow: 'OFFLINE · ONLINE · KARTEN · DURAK',\n        subtitle: 'Klassisches Durak · offline und online',", 'DE menu copy'],
  ["eyebrow: 'ОФЛАЙН · КАРТЫ · ДУРАК', yourCards:", "eyebrow: 'КАРТЫ · ДУРАК', yourCards:", 'RU common eyebrow'],
  ["eyebrow: 'ОФЛАЙН · КАРТЫ · ДУРАК',\n        subtitle: 'Классический Дурак · один игрок и до трёх ботов',", "eyebrow: 'ОФЛАЙН · ОНЛАЙН · КАРТЫ · ДУРАК',\n        subtitle: 'Классический Дурак · офлайн и онлайн',", 'RU menu copy'],
]) text = replaceOnce(text, oldValue, newValue, label);
await write('game.js', text);

text = await read('index.html');
text = replaceOnce(text, '<div class="eyebrow" data-i18n="menu.eyebrow">OFFLINE · KARTY · DURZEŃ</div>', '<div class="eyebrow" data-i18n="menu.eyebrow">OFFLINE · ONLINE · KARTY · DUREŃ</div>', 'static menu eyebrow');
text = replaceOnce(text, '<p class="menu-subtitle" data-i18n="menu.subtitle">Klasyczny Durak · jeden gracz i do trzech botów</p>', '<p class="menu-subtitle" data-i18n="menu.subtitle">Klasyczny Durak · offline i online</p>', 'static menu subtitle');
text = replaceOnce(text, '<div class="eyebrow" data-i18n="common.eyebrow">OFFLINE · KARTY · DURZEŃ</div>', '<div class="eyebrow" data-i18n="common.eyebrow">KARTY · DUREŃ</div>', 'static game eyebrow');
await write('index.html', text);

text = await read('mp/network-server.js');
text = replaceOnce(text, "const CLIENT_BUILD = '20260906-shared1';", "const CLIENT_BUILD = '20260908-single1';", 'client build');
text = replaceOnce(text, "onlineEligible: mp.roomObj?.status === 'in_game' ? true : previous.onlineEligible", "onlineEligible: mp.roomObj ? mp.roomObj.status === 'in_game' : Boolean(previous.onlineEligible)", 'resume eligibility');
text = replaceOnce(text, "      if (room) {\n        syncRoom(room);\n        if (room.status === 'in_game') socketSend({ type: 'game.state.get', roomId: room.id });\n      }", "      if (room) syncRoom(room);", 'duplicate state request');
await write('mp/network-server.js', text);

text = await read('mp/game.js');
text = replaceOnce(
  text,
  "    const target=event.target,actionEl=target.closest?.('[data-action]'),cardEl=target.closest?.('[data-card-id]'),pairEl=target.closest?.('[data-pair-index]');\n    if(mp.role==='host'){",
  "    const target=event.target,actionEl=target.closest?.('[data-action]'),cardEl=target.closest?.('[data-card-id]'),pairEl=target.closest?.('[data-pair-index]');\n    const modeSwitch=actionEl?.dataset.action;\n    if(['menu-new-game','menu-tutorial'].includes(modeSwitch)){\n      event.preventDefault();event.stopImmediatePropagation();\n      Promise.resolve(D.leaveMultiplayer?.()).then(()=>document.querySelector('[data-action=\"'+modeSwitch+'\"]')?.click());\n      return;\n    }\n    if(mp.role==='host'){",
  'online-to-offline mode switch',
);
await write('mp/game.js', text);

text = await read('tests/shared_server_smoke.mjs');
text = replaceOnce(text, "window.DurakMultiplayer.clientBuild === '20260906-shared1'", "window.DurakMultiplayer.clientBuild === '20260908-single1'", 'client build assertion');
text = replaceOnce(
  text,
  "  await page.waitForFunction(() => window.DurakMultiplayer.debug.state.roomCode === 'TEST-ROOM');\n",
  "  await page.waitForFunction(() => window.DurakMultiplayer.debug.state.roomCode === 'TEST-ROOM');\n  const waitingSession = await page.evaluate(() => JSON.parse(localStorage.getItem('duren.qqnd.server-session.v1')));\n  assert.equal(waitingSession.onlineEligible,false,'waiting lobby must not appear as resumable online game');\n",
  'waiting-room resume assertion',
);
text = replaceOnce(
  text,
  "  await page.waitForFunction(() => document.getElementById('mp-presence-notice')?.style.visibility === 'hidden');\n\n  await page.close();",
  "  await page.waitForFunction(() => document.getElementById('mp-presence-notice')?.style.visibility === 'hidden');\n\n  const leavesBeforeMenu = await page.evaluate(() => window.__wsFrames.filter((m)=>m.type==='room.leave').length);\n  await page.click('[data-action=\"open-main-menu\"]');\n  await page.waitForFunction(() => !document.getElementById('main-menu').classList.contains('hidden'));\n  const leavesAfterMenu = await page.evaluate(() => window.__wsFrames.filter((m)=>m.type==='room.leave').length);\n  assert.equal(leavesAfterMenu,leavesBeforeMenu,'opening Menu must not leave an active online game');\n  await page.click('[data-action=\"menu-new-game\"]');\n  await page.waitForFunction(() => !document.getElementById('new-game-modal').classList.contains('hidden'));\n  await page.waitForFunction(() => window.DurakMultiplayer.debug.state.inGame === false);\n  const leavesAfterOfflineSwitch = await page.evaluate(() => window.__wsFrames.filter((m)=>m.type==='room.leave').length);\n  assert.ok(leavesAfterOfflineSwitch > leavesAfterMenu,'switching from online to New Game must leave the online room first');\n\n  await page.close();",
  'menu lifecycle regression',
);
await write('tests/shared_server_smoke.mjs', text);

console.log('Final single-runtime hardening applied.');
