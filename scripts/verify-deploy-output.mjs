import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distIndex = path.join(root, 'dist', 'index.html');
const sourceIndex = path.join(root, 'index.html');

if (!fs.existsSync(distIndex)) {
  throw new Error('dist/index.html not found. Run npm run build before deployment.');
}

const builtHtml = fs.readFileSync(distIndex, 'utf8');
if (builtHtml.includes('/src/main.tsx')) {
  throw new Error('dist/index.html still points at /src/main.tsx; build output is invalid.');
}

if (!builtHtml.includes('/assets/')) {
  throw new Error('dist/index.html does not reference built assets.');
}

const sourceHtml = fs.readFileSync(sourceIndex, 'utf8');
const rootIsDevEntry = sourceHtml.includes('/src/main.tsx');

console.log(JSON.stringify({
  ok: true,
  distIndex: true,
  builtAssetsReferenced: true,
  rootIndexIsDevEntry: rootIsDevEntry,
  deployOutputDirectory: 'dist',
}, null, 2));
