import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'public', 'heroes');
if (!fs.existsSync(dir)) {
  console.log('no public/heroes dir; skip');
  process.exit(0);
}

let n = 0;
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.png.b64')) continue;
  const src = path.join(dir, name);
  let raw = fs.readFileSync(src, 'utf8').trim();
  const pad = raw.indexOf('PADPAD');
  if (pad >= 0) raw = raw.slice(0, pad);
  // Strip MCP transport padding (run of P)
  raw = raw.replace(/P{10,}$/, '');
  raw += '='.repeat((4 - (raw.length % 4)) % 4);
  const out = path.join(dir, name.slice(0, -4)); // foo.png.b64 -> foo.png
  fs.writeFileSync(out, Buffer.from(raw, 'base64'));
  n += 1;
  console.log('materialized', out, fs.statSync(out).size, 'bytes');
}
console.log(`decode-heroes: ${n} file(s)`);
