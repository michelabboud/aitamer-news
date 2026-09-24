import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'public', 'heroes');
if (!fs.existsSync(dir)) {
  console.log('no public/heroes dir; skip');
  process.exit(0);
}

function stripPad(raw) {
  raw = raw.trim();
  const pad = raw.indexOf('PADPAD');
  if (pad >= 0) raw = raw.slice(0, pad);
  raw = raw.replace(/P{10,}$/, '');
  return raw;
}

// Assemble split parts: foo.png.b64.p0, foo.png.b64.p1, ... -> foo.png.b64
const partRe = /^(.*\.png\.b64)\.p(\d+)$/;
const byBase = new Map();
for (const name of fs.readdirSync(dir)) {
  const m = name.match(partRe);
  if (!m) continue;
  const [, base, idx] = m;
  if (!byBase.has(base)) byBase.set(base, []);
  byBase.get(base).push({ idx: Number(idx), name });
}
for (const [base, parts] of byBase) {
  parts.sort((a, b) => a.idx - b.idx);
  let joined = '';
  for (const p of parts) {
    joined += stripPad(fs.readFileSync(path.join(dir, p.name), 'utf8'));
  }
  fs.writeFileSync(path.join(dir, base), joined);
  console.log('assembled', base, 'from', parts.length, 'parts');
}

let n = 0;
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.png.b64')) continue;
  const src = path.join(dir, name);
  let raw = stripPad(fs.readFileSync(src, 'utf8'));
  raw += '='.repeat((4 - (raw.length % 4)) % 4);
  const out = path.join(dir, name.slice(0, -4)); // foo.png.b64 -> foo.png
  fs.writeFileSync(out, Buffer.from(raw, 'base64'));
  n += 1;
  console.log('materialized', out, fs.statSync(out).size, 'bytes');
}
console.log(`decode-heroes: ${n} file(s)`);
