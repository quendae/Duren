import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = process.cwd();
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8' };
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    const rel = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = path.join(root, rel.replace(/^\/+/,''));
    if (!file.startsWith(root)) throw new Error('bad path');
    const data = await fs.readFile(file);
    res.writeHead(200, {'content-type':types[path.extname(file)] || 'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});
await new Promise((resolve) => server.listen(0,'127.0.0.1',resolve));
const port = server.address().port;
const base = `http://127.0.0.1:${port}/index.html`;
const browser = await chromium.launch({ headless:true });

const HOST_ID = '11111111-1111-4111-8111-111111111111';
const GUEST_ID = '22222222-2222-4222-8222-222222222222';

async function makePage() {
  const page = await browser.newPage({ viewport:{width:1280,height:800} });
  await page.addInitScript(({ HOST_ID, GUEST_ID }) => {
    const listeners = new WeakMap();
    const emit = (ws, type, event = {}) => {
      for (const fn of listeners.get(ws)?.get(type) || []) fn.call(ws, event);
      const handler = ws[`on${type}`];
      if (typeof handler === 'function') handler.call(ws, event);
    };
    class FakeWebSocket {
      static CONNECTING = 0; static OPEN = 1; static CLOSING = 2; static CLOSED = 3;
      constructor(url) {
        this.url = url; this.readyState = FakeWebSocket.CONNECTING;
        listeners.set(this, new Map());
        window.__wsFrames = window.__wsFrames || [];
        window.__fakeWs = this;
        window.__emitServer = (payload) => setTimeout(() => emit(this, 'message', { data: JSON.stringify(payload) }), 0);
        setTimeout(() => {
          this.readyState = FakeWebSocket.OPEN;
          emit(this, 'open', {});
          window.__emitServer({ type:'hello', protocol:1, service:'qqnd-game-server' });
        }, 0);
      }
      addEventListener(type, fn, options) {
        const map = listeners.get(this); const list = map.get(type) || [];
        if (options?.once) {
          const wrap = (...args) => { this.removeEventListener(type, wrap); fn.apply(this,args); };
          list.push(wrap);
        } else list.push(fn);
        map.set(type,list);
      }
      removeEventListener(type, fn) {
        const map = listeners.get(this); map.set(type,(map.get(type)||[]).filter((item)=>item!==fn));
      }
      send(raw) {
        const message = JSON.parse(raw); window.__wsFrames.push(message);
        const emitServer = window.__emitServer;
        if (message.type === 'rooms.list') {
          const now = Date.now();
          emitServer({ type:'rooms.list', rooms:[{ id:'OPEN-ROOM', game:'duren', name:'Open Duren', visibility:'public', source:'manual', status:'waiting', ownerSessionId:GUEST_ID, minPlayers:2, maxPlayers:3, players:[{id:GUEST_ID,nickname:'Alice',connected:true,createdAt:now,lastSeenAt:now,joinedAt:now}], createdAt:now, updatedAt:now }] });
        }
        if (message.type === 'session.create') emitServer({ type:'session.created', session:{id:HOST_ID,nickname:message.nickname,connected:true,createdAt:Date.now(),lastSeenAt:Date.now()}, resumeToken:'r'.repeat(64) });
        if (message.type === 'room.create') {
          const now=Date.now();
          window.__serverRoom={ id:'TEST-ROOM', game:'duren', name:message.name||'Duren', visibility:message.visibility, source:'manual', status:'waiting', ownerSessionId:HOST_ID, minPlayers:2, maxPlayers:3, players:[{id:HOST_ID,nickname:'Tester',connected:true,createdAt:now,lastSeenAt:now,joinedAt:now}], createdAt:now, updatedAt:now };
          emitServer({type:'room.created',room:structuredClone(window.__serverRoom)});
        }
        if (message.type === 'game.start') {
          window.__serverRoom.status='in_game';
          emitServer({ type:'game.started', game:'duren', room:structuredClone(window.__serverRoom), seat:0, hostSessionId:HOST_ID, botSeats:message.botCount===1?[2]:[], seatCount:window.__serverRoom.players.length+message.botCount, revision:0, authoritative:false, presence:window.__serverRoom.players.map((p,seat)=>({sessionId:p.id,seat,nickname:p.nickname,connected:p.connected,graceDeadline:null,botActive:false})) });
        }
        if (message.type === 'game.state.commit') emitServer({type:'game.state.committed',roomId:message.roomId,revision:message.revision});
        if (message.type === 'room.leave') emitServer({type:'room.left',roomId:message.roomId});
      }
      close() { this.readyState = FakeWebSocket.CLOSED; emit(this,'close',{code:1000,reason:''}); }
    }
    window.WebSocket = FakeWebSocket;
    window.__ids = { HOST_ID, GUEST_ID };
  }, { HOST_ID, GUEST_ID });
  await page.goto(base,{waitUntil:'load'});
  await page.waitForFunction(() => window.DurakMultiplayer?.debug?.state?.game?.state && window.DurakMultiplayer.clientBuild === '20260908-single1');
  return page;
}

try {
  const page = await makePage();
  await page.click('[data-action="menu-online"]');
  await page.waitForSelector('#mp-server-browser');
  await page.waitForFunction(() => document.querySelectorAll('[data-room-id]').length === 1);
  await page.fill('#mp-name','Tester');
  await page.click('#mp-create');
  await page.waitForFunction(() => window.DurakMultiplayer.debug.state.roomCode === 'TEST-ROOM');
  const waitingSession = await page.evaluate(() => JSON.parse(localStorage.getItem('duren.qqnd.server-session.v1')));
  assert.equal(waitingSession.onlineEligible,false,'waiting lobby must not appear as resumable online game');

  await page.evaluate(({ GUEST_ID }) => {
    const room=window.__serverRoom; const now=Date.now();
    room.players.push({id:GUEST_ID,nickname:'Alice',connected:true,createdAt:now,lastSeenAt:now,joinedAt:now});
    window.__emitServer({type:'room.updated',room:structuredClone(room)});
  }, { GUEST_ID });
  await page.waitForFunction(() => !document.getElementById('mp-start').disabled);
  await page.click('#mp-start');
  await page.waitForFunction(() => window.DurakMultiplayer.debug.state.inGame === true);
  await page.waitForFunction(() => window.__wsFrames.some((m)=>m.type==='game.state.commit') && window.__wsFrames.some((m)=>m.type==='game.state.publish'));

  const startFrame = await page.evaluate(() => window.__wsFrames.find((m)=>m.type==='game.start'));
  assert.equal(startFrame.botCount,0,'2-human Duren should start without forcing a bot');
  const publish = await page.evaluate(() => window.__wsFrames.find((m)=>m.type==='game.state.publish'));
  assert.equal(publish.toSessionId,GUEST_ID);
  assert.ok(publish.state.hands[0].every((card)=>card&&card.id),'guest own hand should be visible in private projection');
  assert.ok(publish.state.hands.slice(1).every((hand)=>hand.every((card)=>card===null)),'opponent hands leaked in private projection');

  await page.evaluate(({ GUEST_ID }) => window.__emitServer({type:'game.player.connection',roomId:'TEST-ROOM',sessionId:GUEST_ID,seat:1,nickname:'Alice',connected:false,reason:'disconnect',graceDeadline:Date.now()+60000,botSeats:[],hostSessionId:window.__ids.HOST_ID,authoritative:false}),{GUEST_ID});
  await page.waitForFunction(() => { const n=document.getElementById('mp-presence-notice'); return n?.style.visibility==='visible' && /Alice/.test(n.textContent) && /bot/i.test(n.textContent); });
  const lostNotice = await page.locator('#mp-presence-notice').textContent();

  await page.evaluate(({ GUEST_ID }) => window.__emitServer({type:'game.player.bot_takeover',roomId:'TEST-ROOM',sessionId:GUEST_ID,seat:1,nickname:'Alice',botSeats:[1],hostSessionId:window.__ids.HOST_ID,authoritative:false}),{GUEST_ID});
  await page.waitForFunction(() => window.Durak.game.state.players[1]?.isBot === true);
  const botNotice = await page.locator('#mp-presence-notice').textContent();

  await page.evaluate(({ GUEST_ID }) => window.__emitServer({type:'game.player.connection',roomId:'TEST-ROOM',sessionId:GUEST_ID,seat:1,nickname:'Alice',connected:true,reclaimedFromBot:true,botSeats:[],hostSessionId:window.__ids.HOST_ID,authoritative:false}),{GUEST_ID});
  await page.waitForFunction(() => window.Durak.game.state.players[1]?.isBot === false);
  await page.waitForFunction(() => document.getElementById('mp-presence-notice')?.style.visibility === 'hidden');

  const leavesBeforeMenu = await page.evaluate(() => window.__wsFrames.filter((m)=>m.type==='room.leave').length);
  await page.click('[data-action="open-main-menu"]');
  await page.waitForFunction(() => !document.getElementById('main-menu').classList.contains('hidden'));
  const leavesAfterMenu = await page.evaluate(() => window.__wsFrames.filter((m)=>m.type==='room.leave').length);
  assert.equal(leavesAfterMenu,leavesBeforeMenu,'opening Menu must not leave an active online game');
  await page.click('[data-action="menu-new-game"]');
  await page.waitForFunction(() => !document.getElementById('new-game-modal').classList.contains('hidden'));
  await page.waitForFunction(() => window.DurakMultiplayer.debug.state.inGame === false);
  const leavesAfterOfflineSwitch = await page.evaluate(() => window.__wsFrames.filter((m)=>m.type==='room.leave').length);
  assert.ok(leavesAfterOfflineSwitch > leavesAfterMenu,'switching from online to New Game must leave the online room first');

  await page.close();

  const hybrid = await makePage();
  await hybrid.click('[data-action="menu-online"]'); await hybrid.fill('#mp-name','Tester'); await hybrid.click('#mp-create');
  await hybrid.waitForFunction(() => window.DurakMultiplayer.debug.state.roomCode === 'TEST-ROOM');
  await hybrid.evaluate(({ GUEST_ID }) => { const room=window.__serverRoom,now=Date.now();room.players.push({id:GUEST_ID,nickname:'Alice',connected:true,createdAt:now,lastSeenAt:now,joinedAt:now});window.__emitServer({type:'room.updated',room:structuredClone(room)}); },{GUEST_ID});
  await hybrid.waitForFunction(() => document.getElementById('mp-bot-panel') && !document.getElementById('mp-bot-panel').classList.contains('hidden'));
  await hybrid.check('#mp-use-bot');
  await hybrid.click('#mp-start');
  await hybrid.waitForFunction(() => window.DurakMultiplayer.debug.state.inGame === true);
  const hybridStart = await hybrid.evaluate(() => window.__wsFrames.find((m)=>m.type==='game.start'));
  assert.equal(hybridStart.botCount,1,'hybrid start did not request server bot seat');
  assert.equal(await hybrid.evaluate(() => window.Durak.game.state.players.length),3);
  assert.equal(await hybrid.evaluate(() => window.Durak.game.state.players[2]?.isBot),true);
  await hybrid.close();

  console.log('Shared QQND server browser smoke: PASS');
  console.log({ lostNotice, botNotice });
} finally {
  await browser.close();
  await new Promise((resolve)=>server.close(resolve));
}
