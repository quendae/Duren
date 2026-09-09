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
    const data = await fs.readFile(file);
    res.writeHead(200, {'content-type':types[path.extname(file)] || 'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise((resolve) => server.listen(0,'127.0.0.1',resolve));
const port = server.address().port;
const browser = await chromium.launch({ headless:true });

function closeEnough(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
}

try {
  const page = await browser.newPage({ viewport:{width:1440,height:900} });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil:'load' });
  await page.waitForFunction(() => window.Durak?.game?.state && window.Durak?.ui);
  await page.evaluate(() => {
    window.Durak.game.startPractice();
    window.Durak.game.state.settings.speed = 'slow';
    window.Durak.game.refresh();
  });
  await page.waitForFunction(() => window.Durak.game.state.tutorial.active && window.Durak.game.state.phase === 'attack' && window.Durak.game.state.attacker === 0);

  const coach = await page.evaluate(() => window.Durak.game.state.tutorial.coach);
  assert.ok(coach?.goal, 'tutorial coach must state the current goal');
  assert.ok(coach?.move, 'tutorial coach must say what to play/do next');
  assert.ok(coach?.why, 'tutorial coach must explain why the recommendation is useful');
  const coachText = await page.locator('#tutorial-coach').textContent();
  assert.match(coachText, /Cel/i, 'Polish tutorial must visibly label the goal');
  assert.match(coachText, /Zagraj|Zrób/i, 'Polish tutorial must visibly label the recommended move');
  assert.match(coachText, /Dlaczego/i, 'Polish tutorial must visibly explain the reason');

  // Geometry is a settled-layout contract; do not measure while the deal scale animation is active.
  await page.waitForFunction(() => window.Durak.game.state.dealAnimation === false);
  await page.waitForTimeout(40);
  const layoutBefore = await page.evaluate(() => {
    const wrap = document.querySelector('.table-wrap').getBoundingClientRect();
    const humanNode = document.querySelector('#human-hand .card');
    const humanRect = humanNode.getBoundingClientRect();
    const humanStyle = getComputedStyle(humanNode);
    const nameplate = document.querySelector('.bot-seat .nameplate').getBoundingClientRect();
    return {
      wrap:{top:wrap.top,bottom:wrap.bottom},
      human:{cssWidth:parseFloat(humanStyle.width),cssHeight:parseFloat(humanStyle.height),bottom:humanRect.bottom},
      nameplateTop:nameplate.top,
    };
  });
  assert.ok(layoutBefore.human.cssWidth >= 100, `desktop hand card should be slightly larger than old 94px width, got ${layoutBefore.human.cssWidth}`);
  closeEnough(layoutBefore.human.bottom, layoutBefore.wrap.bottom - 29, 9, 'human card lower edge should sit on the inner felt line');
  assert.ok(layoutBefore.nameplateTop - layoutBefore.wrap.top >= 28, 'opponent nameplate should sit inside the felt, not on the table rim');

  const suggested = page.locator('#human-hand .card.coach-target').first();
  await suggested.waitFor({ state:'visible' });
  await suggested.click();
  await page.waitForSelector('#table-cards .card[data-card-id]');
  await page.evaluate(() => window.Durak.game.showMainMenu()); // freezes bot timer without disturbing the rendered table

  const playedLayout = await page.evaluate(() => {
    const humanStyle = getComputedStyle(document.querySelector('#human-hand .card'));
    const tableStyle = getComputedStyle(document.querySelector('#table-cards .card'));
    return {
      human:{width:parseFloat(humanStyle.width),height:parseFloat(humanStyle.height)},
      table:{width:parseFloat(tableStyle.width),height:parseFloat(tableStyle.height)},
    };
  });
  closeEnough(playedLayout.table.width, playedLayout.human.width, 0.1, 'table and hand card CSS width');
  closeEnough(playedLayout.table.height, playedLayout.human.height, 0.1, 'table and hand card CSS height');

  await page.waitForTimeout(330);
  await page.evaluate(() => window.Durak.game.refresh());
  const replayed = await page.locator('#table-cards .card').first().evaluate((node) => node.classList.contains('table-enter'));
  assert.equal(replayed, false, 'a settled table card must not replay the enter animation on a later render');

  const discardExpected = await page.evaluate(() => {
    const pair = document.querySelector('#table-cards .table-pair').getBoundingClientRect();
    const target = document.querySelector('#discard-zone .discard-stack').getBoundingClientRect();
    return { x:(target.left + target.width/2) - (pair.left + pair.width/2), y:(target.top + target.height/2) - (pair.top + pair.height/2) };
  });
  await page.evaluate(() => { window.Durak.game.state.collecting = 'discard'; window.Durak.game.refresh(); });
  const discardVector = await page.locator('#table-cards .table-pair').first().evaluate((node) => ({
    x:parseFloat(node.style.getPropertyValue('--collect-x')),
    y:parseFloat(node.style.getPropertyValue('--collect-y')),
    target:node.dataset.collectTarget,
  }));
  assert.equal(discardVector.target, 'discard', 'successful defence must collect toward the discard pile');
  closeEnough(discardVector.x, discardExpected.x, 3, 'discard collection x vector');
  closeEnough(discardVector.y, discardExpected.y, 3, 'discard collection y vector');

  await page.evaluate(() => { window.Durak.game.state.collecting = null; window.Durak.game.refresh(); });
  const takeExpected = await page.evaluate(() => {
    const pair = document.querySelector('#table-cards .table-pair').getBoundingClientRect();
    const target = document.querySelector('.bot-seat[data-player-index="1"] .bot-hand').getBoundingClientRect();
    return { x:(target.left + target.width/2) - (pair.left + pair.width/2), y:(target.top + target.height/2) - (pair.top + pair.height/2) };
  });
  await page.evaluate(() => { window.Durak.game.state.defender = 1; window.Durak.game.state.collecting = 'take'; window.Durak.game.refresh(); });
  const takeVector = await page.locator('#table-cards .table-pair').first().evaluate((node) => ({
    x:parseFloat(node.style.getPropertyValue('--collect-x')),
    y:parseFloat(node.style.getPropertyValue('--collect-y')),
    target:node.dataset.collectTarget,
  }));
  assert.equal(takeVector.target, 'player-1', 'taken cards must collect toward the actual defender hand');
  closeEnough(takeVector.x, takeExpected.x, 3, 'take collection x vector');
  closeEnough(takeVector.y, takeExpected.y, 3, 'take collection y vector');

  console.log('Desktop motion/tutorial UX smoke: PASS');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
