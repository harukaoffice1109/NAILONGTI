import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const dist = path.join(root, 'dist');
const port = 0;

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const requested = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = path.normalize(path.join(dist, requested));
    if (!filePath.startsWith(dist) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType(filePath), 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not determine server port');
  return `http://127.0.0.1:${address.port}/`;
}

async function main() {
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    throw new Error('dist/index.html missing; run npm run build or npm run check first');
  }

  const server = createServer();
  const base = await listen(server);
  try {
    const html = await fetch(base).then((res) => res.text());
    if (!html.includes('奶龙TI人格测试')) throw new Error('HTML title/meta missing');
    const jsMatch = html.match(/src="(\/assets\/[^".]+\.js)"/);
    const cssMatch = html.match(/href="(\/assets\/[^".]+\.css)"/);
    if (!jsMatch || !cssMatch) throw new Error('Built assets missing');

    const jsStatus = await fetch(new URL(jsMatch[1], base)).then((res) => res.status);
    const cssStatus = await fetch(new URL(cssMatch[1], base)).then((res) => res.status);
    if (jsStatus !== 200 || cssStatus !== 200) throw new Error(`Asset status invalid js=${jsStatus} css=${cssStatus}`);

    console.log(JSON.stringify({ ok: true, base, html: html.length, jsStatus, cssStatus }, null, 2));
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
