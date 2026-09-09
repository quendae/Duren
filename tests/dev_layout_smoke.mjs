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

async function startPractice(page) {
  await page.waitForFunction(() => window.Durak?.game?.startPractice && window.DurakDevLayout);
  await page.evaluate(() => window.Durak.game.startPractice());
  await page.waitForFunction(() => window.Durak.game.state?.dealAnimation === false);
  await page.waitForSelector('#human-hand .card');
}

async function setNumber(page, key, value) {
  const input = page.locator(`#dev-layout-popup input[type="number"][data-dev-key="${key}"]`);
  await input.fill(String(value));
  await input.dispatchEvent('input');
}

try {
  const context = await browser.newContext({ viewport:{width:1440,height:900} });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil:'load' });
  await startPractice(page);

  assert.equal(await page.locator('#dev-layout-button').isVisible(), true, 'DEV must have its own topbar button');
  assert.equal(await page.locator('#dev-layout-section').count(), 0, 'DEV must no longer live inside Options');
  assert.equal(await page.locator('#dev-layout-popup').isVisible(), false, 'DEV popup starts closed');

  await page.click('#dev-layout-button');
  await page.waitForSelector('#dev-layout-popup:not(.hidden)');
  assert.equal(await page.locator('#dev-layout-popup').getAttribute('aria-modal'), null, 'DEV popup must be non-modal');

  // The game remains interactive while DEV is open.
  const beforeTableCount = await page.locator('#table-cards .card').count();
  const playable = page.locator('#human-hand .card.playable').first();
  await playable.click();
  await page.waitForFunction((before) => document.querySelectorAll('#table-cards .card').length > before, beforeTableCount);

  // Dragging the popup header must move the popup without creating an overlay.
  const popupBefore = await page.locator('#dev-layout-popup').boundingBox();
  const handle = page.locator('#dev-layout-drag-handle');
  const handleBox = await handle.boundingBox();
  await page.mouse.move(handleBox.x + 50, handleBox.y + 14);
  await page.mouse.down();
  await page.mouse.move(handleBox.x - 120, handleBox.y + 90, { steps: 5 });
  await page.mouse.up();
  const popupAfter = await page.locator('#dev-layout-popup').boundingBox();
  assert.ok(Math.abs(popupAfter.x - popupBefore.x) > 40 || Math.abs(popupAfter.y - popupBefore.y) > 40, 'DEV popup must be draggable');

  await setNumber(page, 'handCardW', 126);
  await setNumber(page, 'handY', -35);
  await setNumber(page, 'botBackW', 61);
  await setNumber(page, 'tableCardW', 126);

  const live = await page.evaluate(() => ({
    hand: getComputedStyle(document.querySelector('#human-hand .card')).width,
    botBack: getComputedStyle(document.querySelector('.bot-hand .card-back')).width,
    handVar: getComputedStyle(document.documentElement).getPropertyValue('--dev-hand-card-w').trim(),
    tableVar: getComputedStyle(document.documentElement).getPropertyValue('--dev-table-card-w').trim(),
    saved: JSON.parse(localStorage.getItem(window.DurakDevLayout.storageKey)).values,
  }));
  assert.equal(live.hand, '126px', 'hand card width must update live');
  assert.equal(live.botBack, '61px', 'opponent back width must update live');
  assert.equal(live.handVar, '126px');
  assert.equal(live.tableVar, '126px');
  assert.equal(live.saved.handCardW, 126, 'DEV values must persist immediately');
  assert.equal(live.saved.handY, -35);

  await page.reload({ waitUntil:'load' });
  await startPractice(page);
  const persisted = await page.evaluate(() => ({
    hand: getComputedStyle(document.querySelector('#human-hand .card')).width,
    botBack: getComputedStyle(document.querySelector('.bot-hand .card-back')).width,
    values: window.DurakDevLayout.values,
  }));
  assert.equal(persisted.hand, '126px', 'hand width must survive reload');
  assert.equal(persisted.botBack, '61px', 'opponent back width must survive reload');
  assert.equal(persisted.values.handY, -35);

  await page.click('#dev-layout-button');
  const imported = { version:1, profile:'desktop', values:{ handCardW:118, tableCardW:118, seatSideX:52 } };
  await page.locator('#dev-layout-json').fill(JSON.stringify(imported));
  await page.click('[data-dev-action="apply-json"]');
  const afterImport = await page.evaluate(() => ({
    hand: getComputedStyle(document.querySelector('#human-hand .card')).width,
    values: window.DurakDevLayout.values,
  }));
  assert.equal(afterImport.hand, '118px', 'JSON import must apply live');
  assert.equal(afterImport.values.tableCardW, 118);
  assert.equal(afterImport.values.seatSideX, 52);

  await page.click('[data-dev-action="reset"]');
  const reset = await page.evaluate(() => ({
    hand: getComputedStyle(document.querySelector('#human-hand .card')).width,
    values: window.DurakDevLayout.values,
    saved: localStorage.getItem(window.DurakDevLayout.storageKey),
  }));
  assert.equal(reset.hand, '102px', 'reset must restore DEV desktop defaults');
  assert.equal(reset.values.handCardW, 102);
  assert.equal(reset.saved, null, 'reset must remove persisted DEV override');

  await page.click('#dev-layout-close');
  assert.equal(await page.locator('#dev-layout-popup').isVisible(), false, 'DEV popup can be closed independently');

  // Desktop DEV values may be stored on smaller screens, but must not override mobile/tablet geometry.
  await page.evaluate(() => window.DurakDevLayout.set('handCardW', 140));
  await page.setViewportSize({ width:900, height:700 });
  await page.waitForTimeout(60);
  const mobileWidth = await page.evaluate(() => getComputedStyle(document.querySelector('#human-hand .card')).width);
  assert.notEqual(mobileWidth, '140px', 'desktop DEV override must not leak into smaller breakpoints');

  console.log('DEV layout popup smoke: PASS');
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
