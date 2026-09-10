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
  await page.goto(`http://127.0.0.1:${port}/?dev=1`, { waitUntil:'load' });
  await startPractice(page);

  assert.equal(await page.locator('#dev-layout-button').isVisible(), true, 'DEV must remain available through ?dev=1');
  assert.equal(await page.locator('#dev-layout-section').count(), 0, 'DEV must no longer live inside Options');
  assert.equal(await page.locator('#dev-layout-popup').isVisible(), false, 'DEV popup starts closed');

  const defaults = await page.evaluate(() => ({
    values: window.DurakDevLayout.defaults,
    storageKey: window.DurakDevLayout.storageKey,
    uiEnabled: window.DurakDevLayout.uiEnabled,
    release: window.DurakDevLayout.release,
  }));
  assert.equal(defaults.uiEnabled, true, '?dev=1 must explicitly enable DEV UI');
  assert.equal(defaults.release, '1.0.0', 'DEV layout must identify the 1.0 release defaults');
  assert.equal(defaults.storageKey, 'duren.dev.layout.v2', '1.0 must not inherit stale pre-release DEV overrides');
  assert.deepEqual({
    sidebarW: defaults.values.sidebarW,
    topbarH: defaults.values.topbarH,
    handCardW: defaults.values.handCardW,
    handCardH: defaults.values.handCardH,
    handY: defaults.values.handY,
    handOverlap: defaults.values.handOverlap,
    handSlotH: defaults.values.handSlotH,
    tableCardW: defaults.values.tableCardW,
    tableCardH: defaults.values.tableCardH,
    tableX: defaults.values.tableX,
    tableY: defaults.values.tableY,
    tableZoneW: defaults.values.tableZoneW,
    tableGapX: defaults.values.tableGapX,
    tableGapY: defaults.values.tableGapY,
    defenseX: defaults.values.defenseX,
    defenseY: defaults.values.defenseY,
    seatTopY: defaults.values.seatTopY,
    seatSideY: defaults.values.seatSideY,
    seatLeftX: defaults.values.seatLeftX,
    seatRightX: defaults.values.seatRightX,
    seatW: defaults.values.seatW,
    botBackW: defaults.values.botBackW,
    botBackH: defaults.values.botBackH,
    botBackOverlap: defaults.values.botBackOverlap,
    stackCardW: defaults.values.stackCardW,
    stackCardH: defaults.values.stackCardH,
    talonX: defaults.values.talonX,
    talonY: defaults.values.talonY,
    discardX: defaults.values.discardX,
    discardY: defaults.values.discardY,
    actionW: defaults.values.actionW,
    actionMinH: defaults.values.actionMinH,
    actionSpaceH: defaults.values.actionSpaceH,
    actionX: defaults.values.actionX,
    actionY: defaults.values.actionY,
    brandSize: defaults.values.brandSize,
    brandX: defaults.values.brandX,
    brandY: defaults.values.brandY,
  }, {
    sidebarW:350, topbarH:92,
    handCardW:102, handCardH:145, handY:-29, handOverlap:-24, handSlotH:190,
    tableCardW:102, tableCardH:145, tableX:0, tableY:0, tableZoneW:760, tableGapX:20, tableGapY:16, defenseX:21, defenseY:22,
    seatTopY:34, seatSideY:50, seatLeftX:220, seatRightX:220, seatW:246,
    botBackW:102, botBackH:145, botBackOverlap:-48,
    stackCardW:102, stackCardH:145, talonX:300, talonY:14, discardX:300, discardY:14,
    actionW:680, actionMinH:108, actionSpaceH:200, actionX:0, actionY:0,
    brandSize:62, brandX:0, brandY:0,
  }, 'release defaults must match the approved desktop JSON, with seatSideX mirrored to both sides');

  await page.click('#dev-layout-button');
  await page.waitForSelector('#dev-layout-popup:not(.hidden)');
  assert.equal(await page.locator('#dev-layout-popup').getAttribute('aria-modal'), null, 'DEV popup must be non-modal');

  for (const key of ['seatLeftX','seatRightX','botHandLeftX','botHandRightX','botHandTopX']) {
    assert.equal(await page.locator(`[data-dev-key="${key}"]`).count() > 0, true, `DEV must expose ${key}`);
  }

  const beforeTableCount = await page.locator('#table-cards .card').count();
  const playable = page.locator('#human-hand .card.playable').first();
  await playable.click();
  await page.waitForFunction((before) => document.querySelectorAll('#table-cards .card').length > before, beforeTableCount);

  const popupBefore = await page.locator('#dev-layout-popup').boundingBox();
  const handle = page.locator('#dev-layout-drag-handle');
  const handleBox = await handle.boundingBox();
  await page.mouse.move(handleBox.x + 50, handleBox.y + 14);
  await page.mouse.down();
  await page.mouse.move(handleBox.x - 120, handleBox.y + 90, { steps: 5 });
  await page.mouse.up();
  const popupAfter = await page.locator('#dev-layout-popup').boundingBox();
  assert.ok(Math.abs(popupAfter.x - popupBefore.x) > 40 || Math.abs(popupAfter.y - popupBefore.y) > 40, 'DEV popup must be draggable');

  await page.click('[data-dev-action="reset-position"]');
  const popupReset = await page.locator('#dev-layout-popup').boundingBox();
  assert.ok(Math.abs(popupReset.x - popupBefore.x) < 12 && Math.abs(popupReset.y - popupBefore.y) < 12, 'popup position reset must restore standard location');

  await setNumber(page, 'handCardW', 126);
  await setNumber(page, 'handY', -35);
  await setNumber(page, 'botBackW', 61);
  await setNumber(page, 'tableCardW', 126);

  await page.click('[data-dev-reset-key="handY"]');
  assert.equal(await page.locator('#dev-layout-popup input[type="number"][data-dev-key="handY"]').inputValue(), '-29');
  assert.equal(await page.evaluate(() => window.DurakDevLayout.values.handY), -29);
  await setNumber(page, 'handY', -35);

  await page.evaluate(() => {
    const fixture = document.createElement('div');
    fixture.id = 'dev-opponent-fixture';
    fixture.style.visibility = 'hidden';
    fixture.innerHTML = `
      <div class="bot-seat slot-left"><div class="nameplate"></div><div class="bot-hand"><div class="card-back"></div><div class="card-back"></div></div></div>
      <div class="bot-seat slot-right"><div class="nameplate"></div><div class="bot-hand"><div class="card-back"></div><div class="card-back"></div></div></div>`;
    document.body.appendChild(fixture);
  });

  await setNumber(page, 'seatLeftX', 83);
  await setNumber(page, 'seatRightX', 117);
  await setNumber(page, 'botHandLeftX', -14);
  await setNumber(page, 'botHandRightX', 11);
  const opponentLayout = await page.evaluate(() => ({
    leftSeat: getComputedStyle(document.querySelector('#dev-opponent-fixture .bot-seat.slot-left')).left,
    rightSeat: getComputedStyle(document.querySelector('#dev-opponent-fixture .bot-seat.slot-right')).right,
    leftHandTransform: getComputedStyle(document.querySelector('#dev-opponent-fixture .bot-seat.slot-left .bot-hand')).transform,
    rightHandTransform: getComputedStyle(document.querySelector('#dev-opponent-fixture .bot-seat.slot-right .bot-hand')).transform,
    leftXVar: getComputedStyle(document.documentElement).getPropertyValue('--dev-seat-left-x').trim(),
    rightXVar: getComputedStyle(document.documentElement).getPropertyValue('--dev-seat-right-x').trim(),
  }));
  assert.equal(opponentLayout.leftSeat, '83px');
  assert.equal(opponentLayout.rightSeat, '117px');
  assert.equal(opponentLayout.leftXVar, '83px');
  assert.equal(opponentLayout.rightXVar, '117px');
  assert.notEqual(opponentLayout.leftHandTransform, opponentLayout.rightHandTransform, 'left/right hand offsets must be independent');

  const live = await page.evaluate(() => ({
    hand: getComputedStyle(document.querySelector('#human-hand .card')).width,
    botBack: getComputedStyle(document.querySelector('#dev-opponent-fixture .bot-hand .card-back')).width,
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
  assert.equal(live.saved.seatLeftX, 83);
  assert.equal(live.saved.seatRightX, 117);

  await page.reload({ waitUntil:'load' });
  await startPractice(page);
  const persisted = await page.evaluate(() => ({
    hand: getComputedStyle(document.querySelector('#human-hand .card')).width,
    values: window.DurakDevLayout.values,
  }));
  assert.equal(persisted.hand, '126px', 'hand width must survive reload');
  assert.equal(persisted.values.botBackW, 61, 'opponent card width setting must survive reload');
  assert.equal(persisted.values.handY, -35);
  assert.equal(persisted.values.seatLeftX, 83);
  assert.equal(persisted.values.seatRightX, 117);

  await page.click('#dev-layout-button');
  const imported = { version:1, profile:'desktop', values:{ handCardW:118, tableCardW:118, seatSideX:52, handY:-8 } };
  await page.locator('#dev-layout-json').fill(JSON.stringify(imported));
  await page.click('[data-dev-action="apply-json"]');
  const afterImport = await page.evaluate(() => ({
    hand: getComputedStyle(document.querySelector('#human-hand .card')).width,
    values: window.DurakDevLayout.values,
  }));
  assert.equal(afterImport.hand, '118px', 'JSON import must apply live');
  assert.equal(afterImport.values.tableCardW, 118);
  assert.equal(afterImport.values.seatLeftX, 52, 'legacy seatSideX must migrate to the left seat');
  assert.equal(afterImport.values.seatRightX, 52, 'legacy seatSideX must migrate to the right seat');

  await page.click('[data-dev-action="reset"]');
  const reset = await page.evaluate(() => ({
    hand: getComputedStyle(document.querySelector('#human-hand .card')).width,
    values: window.DurakDevLayout.values,
    saved: localStorage.getItem(window.DurakDevLayout.storageKey),
  }));
  assert.equal(reset.hand, '102px', 'reset must restore release desktop defaults');
  assert.equal(reset.values.handCardW, 102);
  assert.equal(reset.values.handY, -29);
  assert.equal(reset.values.seatSideY, 50);
  assert.equal(reset.values.seatLeftX, 220);
  assert.equal(reset.values.seatRightX, 220);
  assert.equal(reset.values.botBackW, 102);
  assert.equal(reset.values.botBackH, 145);
  assert.equal(reset.values.botBackOverlap, -48);
  assert.equal(reset.values.stackCardW, 102);
  assert.equal(reset.values.stackCardH, 145);
  assert.equal(reset.values.talonX, 300);
  assert.equal(reset.values.discardX, 300);
  assert.equal(reset.saved, null, 'reset must remove persisted DEV override');

  // 1.0 regression: twelve visible opponent cards must stay inside a symmetric desktop stage.
  const crowded = await page.evaluate(() => {
    document.getElementById('release-opponent-stage')?.remove();
    const stage = document.createElement('div');
    stage.id = 'release-opponent-stage';
    stage.style.cssText = 'position:relative;width:1200px;height:340px;visibility:hidden;';
    const cards = Array.from({length:12}, (_, index) => {
      const mid = 5.5;
      const offset = index - mid;
      return `<div class="card-back" style="--fan-angle:${offset * 2.1}deg;--fan-y:${Math.abs(offset) * 1.1}px"></div>`;
    }).join('');
    stage.innerHTML = `
      <div class="bot-seat slot-left"><div class="nameplate"></div><div class="bot-hand">${cards}</div></div>
      <div class="bot-seat slot-right"><div class="nameplate"></div><div class="bot-hand">${cards}</div></div>`;
    document.body.appendChild(stage);

    const stageRect = stage.getBoundingClientRect();
    const measure = (selector) => {
      const seat = stage.querySelector(selector);
      const plate = seat.querySelector('.nameplate').getBoundingClientRect();
      const cardRects = [...seat.querySelectorAll('.card-back')].map((card) => card.getBoundingClientRect());
      const left = Math.min(...cardRects.map((rect) => rect.left));
      const right = Math.max(...cardRects.map((rect) => rect.right));
      return {
        seat: seat.getBoundingClientRect(),
        plateCenter: (plate.left + plate.right) / 2,
        handLeft: left,
        handRight: right,
        handCenter: (left + right) / 2,
        firstMargin: getComputedStyle(seat.querySelector('.card-back')).marginRight,
      };
    };
    const left = measure('.slot-left');
    const right = measure('.slot-right');
    return {
      stageLeft: stageRect.left,
      stageRight: stageRect.right,
      leftSeatInset: left.seat.left - stageRect.left,
      rightSeatInset: stageRect.right - right.seat.right,
      leftHandInside: left.handLeft >= stageRect.left && left.handRight <= stageRect.right,
      rightHandInside: right.handLeft >= stageRect.left && right.handRight <= stageRect.right,
      leftCenterDelta: Math.abs(left.handCenter - left.plateCenter),
      rightCenterDelta: Math.abs(right.handCenter - right.plateCenter),
      leftMargin: left.firstMargin,
      rightMargin: right.firstMargin,
    };
  });
  assert.ok(Math.abs(crowded.leftSeatInset - crowded.rightSeatInset) < 1, 'side opponent nameplates must be symmetric');
  assert.equal(crowded.leftHandInside, true, '12-card left opponent hand must stay inside the table');
  assert.equal(crowded.rightHandInside, true, '12-card right opponent hand must stay inside the table');
  assert.ok(crowded.leftCenterDelta < 4, 'left opponent cards must stay centered on the nameplate');
  assert.ok(crowded.rightCenterDelta < 4, 'right opponent cards must stay centered on the nameplate');
  assert.ok(parseFloat(crowded.leftMargin) < -48, 'crowded hands must automatically increase overlap');
  assert.ok(parseFloat(crowded.rightMargin) < -48, 'crowded hands must compact symmetrically');

  await page.click('#dev-layout-close');
  assert.equal(await page.locator('#dev-layout-popup').isVisible(), false, 'DEV popup can be closed independently');

  await page.evaluate(() => window.DurakDevLayout.set('handCardW', 140));
  await page.setViewportSize({ width:900, height:700 });
  await page.waitForTimeout(60);
  const mobileWidth = await page.evaluate(() => getComputedStyle(document.querySelector('#human-hand .card')).width);
  assert.notEqual(mobileWidth, '140px', 'desktop DEV override must not leak into smaller breakpoints');

  // Production 1.0 hides the DEV controls unless they are explicitly requested in the URL.
  const prodPage = await context.newPage();
  await prodPage.goto(`http://127.0.0.1:${port}/`, { waitUntil:'load' });
  await prodPage.waitForFunction(() => window.DurakDevLayout);
  assert.equal(await prodPage.locator('#dev-layout-button').count(), 0, 'DEV button must be hidden in normal 1.0 runtime');
  assert.equal(await prodPage.locator('#dev-layout-popup').count(), 0, 'DEV popup must not mount in normal 1.0 runtime');
  assert.equal(await prodPage.evaluate(() => window.DurakDevLayout.uiEnabled), false, 'normal runtime must report DEV UI disabled');
  await prodPage.close();

  console.log('Duren 1.0 desktop layout/DEV smoke: PASS');
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
