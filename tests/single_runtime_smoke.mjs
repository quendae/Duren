import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root=process.cwd();
const indexSource=await fs.readFile(path.join(root,'index.html'),'utf8');
assert.ok(!/<iframe\b/i.test(indexSource),'production index.html must not contain an iframe');
assert.ok(!/durniak-offline\.html/i.test(indexSource),'production index.html must not reference durniak-offline.html');
assert.ok(!/id=["']mp-launch["']/i.test(indexSource),'floating online launcher must be removed');
assert.match(indexSource,/game\.css/); assert.match(indexSource,/game\.js/);
for(const file of ['index.html','game.js','multiplayer.js','mp/core.js','mp/game.js','mp/network-server.js']){
  const source=await fs.readFile(path.join(root,file),'utf8');
  assert.ok(!/contentWindow|contentDocument|RTCPeerConnection|cloudflare-signaling/.test(source),`${file} still contains a forbidden legacy runtime reference`);
}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1');const rel=url.pathname==='/'?'/index.html':url.pathname;const file=path.join(root,rel.replace(/^\/+/,''));const data=await fs.readFile(file);res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data)}catch{res.writeHead(404);res.end('not found')}});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'load'});await page.waitForFunction(()=>window.Durak?.game?.state&&window.DurakMultiplayer);assert.equal(await page.locator('#main-menu').isVisible(),true);assert.equal(await page.locator('[data-action="menu-new-game"]').isVisible(),true);assert.equal(await page.locator('[data-action="menu-online"]').isVisible(),true);assert.equal(await page.locator('[data-action="menu-tutorial"]').isVisible(),true);assert.equal(await page.locator('#menu-continue').isVisible(),false);await page.click('[data-action="menu-online"]');assert.equal(await page.locator('#mp-overlay').isVisible(),true);await page.click('#mp-close');assert.equal(await page.locator('#main-menu').isVisible(),true);console.log('Single runtime and shared menu smoke: PASS')}finally{await browser.close();await new Promise(r=>server.close(r))}
