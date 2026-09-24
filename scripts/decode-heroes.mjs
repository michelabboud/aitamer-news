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
  return raw.replace(/\s+/g, '');
}

const partRe = /^(.+\.png\.b64)\.p(\d+)$/;
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
  for (const p of parts) fs.unlinkSync(path.join(dir, p.name));
  console.log('assembled', base, 'from', parts.length, 'parts');
}

let n = 0;
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.png.b64')) continue;
  const src = path.join(dir, name);
  let raw = stripPad(fs.readFileSync(src, 'utf8'));
  if (raw.length % 4 === 1) {
    console.warn(`skip truncated ${name} (length ${raw.length} ≡1 mod 4)`);
    continue;
  }
  raw += '='.repeat((4 - (raw.length % 4)) % 4);
  const buf = Buffer.from(raw, 'base64');
  if (buf.length < 100) {
    console.warn(`skip ${name}: decoded only ${buf.length} bytes`);
    continue;
  }
  const out = path.join(dir, name.slice(0, -4));
  fs.writeFileSync(out, buf);
  fs.unlinkSync(src);
  n += 1;
  console.log('materialized', out, buf.length, 'bytes');
}
console.log(`decode-heroes: ${n} file(s)`);
