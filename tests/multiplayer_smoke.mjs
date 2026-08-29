import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = process.cwd();
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.md':'text/markdown; charset=utf-8' };
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    const rel = url.pathname === '/' ? '/durniak.html' : url.pathname;
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
const base = `http://127.0.0.1:${port}/durniak.html`;
const browser = await chromium.launch({ headless:true });

async function ready(page) {
  await page.goto(base, {waitUntil:'load'});
  await page.waitForFunction(() => window.DurakMultiplayer?.debug?.state?.game?.state);
}

try {
  for (const viewport of [{width:1440,height:900},{width:1024,height:768},{width:390,height:844},{width:844,height:390}]) {
    const page = await browser.newPage({viewport});
    await ready(page);
    await page.click('#mp-launch');
    const layout = await page.evaluate(() => { const card=document.querySelector('.mp-card').getBoundingClientRect(); return {cardLeft:card.left,cardRight:card.right,width:innerWidth,overlayVisible:!document.querySelector('#mp-overlay').classList.contains('hidden')}; });
    assert.equal(layout.overlayVisible,true,`lobby hidden at ${viewport.width}x${viewport.height}`);
    assert.ok(layout.cardLeft >= -1 && layout.cardRight <= layout.width + 1,`lobby overflows horizontally at ${viewport.width}x${viewport.height}`);
    await page.close();
  }

  const scenarios=[
    {guestCount:1,bot:false,difficulty:'normal',rounds:4,label:'host + human'},
    {guestCount:2,bot:false,difficulty:'normal',rounds:4,label:'host + 2 humans'},
    {guestCount:1,bot:true,difficulty:'easy',rounds:4,label:'host + human + easy bot'},
    {guestCount:1,bot:true,difficulty:'expert',rounds:4,label:'host + human + expert bot'},
  ];

  for (const scenario of scenarios) {
    const page=await browser.newPage({viewport:{width:1280,height:800}}); await ready(page);
    const started=await page.evaluate((s)=>window.DurakMultiplayer.debug.startHostGameForTest(s),scenario); assert.equal(started,true,`${scenario.label}: did not start`);
    await page.evaluate(()=>{const w=document.querySelector('#durak-game').contentWindow;w.Durak.game.state.settings.animations=false;w.Durak.game.state.settings.speed='fast';w.Durak.SPEEDS.fast=0.01;w.Durak.game.refresh();});
    const playerInfo=await page.evaluate(()=>document.querySelector('#durak-game').contentWindow.Durak.game.state.players.map(p=>({name:p.name,isBot:p.isBot,difficulty:p.difficulty})));
    assert.equal(playerInfo.length,1+scenario.guestCount+(scenario.bot?1:0)); assert.equal(playerInfo[1].isBot,false,`${scenario.label}: remote human became permanent bot`); if(scenario.bot)assert.equal(playerInfo.at(-1).isBot,true,`${scenario.label}: bot seat missing`);
    const privacy=await page.evaluate(()=>{const view=window.DurakMultiplayer.debug.stateForSeat(1);return{ownReal:view.hands[0].every(card=>card&&typeof card.id==='string'),opponentsHidden:view.hands.slice(1).every(hand=>hand.every(card=>card===null)),deckHidden:view.deck.every(card=>card===null)};});
    assert.equal(privacy.ownReal,true);assert.equal(privacy.opponentsHidden,true,`${scenario.label}: opponent hand leaked`);assert.equal(privacy.deckHidden,true,`${scenario.label}: deck order leaked`);

    let completed=0,iterations=0;
    while(completed<scenario.rounds&&iterations<12000){
      iterations++;
      const snap=await page.evaluate(()=>{const s=document.querySelector('#durak-game').contentWindow.Durak.game.state;return{phase:s.phase,inv:window.DurakMultiplayer.debug.invariants()};});
      if(snap.inv.stable){assert.equal(snap.inv.total,36,`${scenario.label}: card conservation failed`);assert.equal(snap.inv.unique,true,`${scenario.label}: duplicate card detected`);}
      if(snap.phase==='end'){completed++;if(completed<scenario.rounds)await page.evaluate(()=>document.querySelector('#durak-game').contentDocument.querySelector('[data-action="next-round"]').click());}
      else await page.evaluate(()=>window.DurakMultiplayer.debug.autoStep());
      await page.waitForTimeout(8);
    }
    assert.equal(completed,scenario.rounds,`${scenario.label}: gameplay deadlock after ${iterations} steps`);
    const spoof=await page.evaluate(()=>window.DurakMultiplayer.debug.validateAction(99,'play-card',{cardId:'S-A'})); assert.equal(spoof.ok,false,`${scenario.label}: invalid seat accepted`);
    await page.close();
  }
  console.log('Multiplayer regression: PASS');
} finally { await browser.close(); await new Promise((resolve)=>server.close(resolve)); }
