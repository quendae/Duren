import fs from 'node:fs/promises';

const path = 'index.html';
let html = await fs.readFile(path, 'utf8');

if (!html.includes('dev-layout.css')) {
  const marker = /(<link rel="stylesheet" href="\.\/multiplayer\.css\?v=[^"]+">)/;
  if (!marker.test(html)) throw new Error('multiplayer.css marker not found in index.html');
  html = html.replace(marker, `$1\n  <link rel="stylesheet" href="./dev-layout.css?v=20260909-dev1">`);
}

if (!html.includes('dev-layout.js')) {
  const marker = /(<script src="\.\/game\.js\?v=[^"]+"><\/script>)/;
  if (!marker.test(html)) throw new Error('game.js marker not found in index.html');
  html = html.replace(marker, `$1\n  <script src="./dev-layout.js?v=20260909-dev1"></script>`);
}

await fs.writeFile(path, html.replace(/\r\n/g, '\n'), 'utf8');
console.log('DEV layout assets wired into index.html');
