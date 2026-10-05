/** Pure allocation on trusted main data. This module performs no filesystem writes. */
import { createHash } from 'node:crypto';
import yaml from 'js-yaml';
import { readFrontmatter, SLUG, SLUG_MAX_LENGTH } from './frontmatter.mjs';
import { assignNumbers, findProblems, ledgerLine, ledgerState, parseLedger, readPost, withSpecimen } from './stamp-specimens.mjs';

// Resource bounds apply before parsing untrusted YAML or hashing article bodies.
const MAX_POST_BYTES = 1024 * 1024;
const MAX_LEDGER_BYTES = 4 * 1024 * 1024;
const MAX_POSTS = 10000;
const MAX_CANDIDATES = 100;
const FENCE = /^((?:[ \t]*\n)*---[ \t]*\n)(?:([\s\S]*?)\n)?---[ \t]*(?:\n|$)/;
const SIMPLE_SCALAR = /^(?:[ \t]*(?:#.*)?|[ \t]*(?:"(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^\s\[\]{}|>&!*'"#][^\[\]{}\n]*?)[ \t]*(?:#.*)?)$/;

/** Remove only safely separable, plain top-level specimen scalar lines. */
export function stripSpecimen(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text) > MAX_POST_BYTES) throw new Error('post exceeds input limit');
  if (text.includes('\r') || text.includes('\uFEFF')) throw new Error('post must use LF without BOM');
  const match = FENCE.exec(text);
  if (!match) throw new Error('post has no unambiguous YAML frontmatter');
  const raw = match[2] ?? '';
  // Permit duplicate keys only during boundary discovery. The normalized block is then
  // checked by the repository's strict parser, which rejects every editorial duplicate.
  const opened = [];
  const quotedRanges = [];
  try {
    yaml.load(raw, { json: true, listener(event, state) {
      if (event === 'open') { opened.push(state.position); return; }
      const start = opened.pop();
      if (state.kind === 'scalar' && /^[\s]*["']/.test(raw.slice(start, state.position))) quotedRanges.push([start, state.position]);
    } });
  } catch { throw new Error('frontmatter is not valid YAML; cannot isolate specimen'); }
  const lines = raw.split('\n');
  let offset = 0;
  const removed = [];
  const kept = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineOffset = offset;
    offset += line.length + 1;
    if (!line.startsWith('specimen:')) { kept.push(line); continue; }
    if (quotedRanges.some(([start, end]) => start < lineOffset && end > lineOffset)) throw new Error('specimen text belongs to an editorial scalar');
    const value = line.slice('specimen:'.length);
    if (!SIMPLE_SCALAR.test(value) || /^\s*[^"'].*:\s/.test(value)) throw new Error('ambiguous specimen value');
    // Multiline plain/quoted scalars and nested values must never swallow editorial bytes.
    let next = i + 1;
    while (next < lines.length && /^\s*(?:#.*)?$/.test(lines[next])) next++;
    if (next < lines.length && /^[ \t]+\S/.test(lines[next])) throw new Error('ambiguous specimen continuation');
    removed.push(line);
  }
  const cleanRaw = kept.join('\n');
  const clean = text.slice(0, match[1].length) + cleanRaw + text.slice(match[1].length + raw.length);
  const fm = readFrontmatter(clean);
  if (!fm || Object.hasOwn(fm.data, 'specimen')) throw new Error('specimen must be a plain top-level scalar');
  return { text: clean, removed };
}

function checkedMap(posts, limit, label) {
  if (!(posts instanceof Map) || posts.size > limit) throw new Error(`${label} must be a bounded Map`);
  for (const [slug, text] of posts) {
    if (typeof slug !== 'string' || !SLUG.test(slug) || slug.length > SLUG_MAX_LENGTH) throw new Error('unsafe post slug');
    if (typeof text !== 'string' || Buffer.byteLength(text) > MAX_POST_BYTES) throw new Error('post exceeds input limit');
  }
}

/** Hash exact editorial bytes and slug identities; numbering and Map insertion order do not matter. */
export function editorialDigest(candidatePosts) {
  checkedMap(candidatePosts, MAX_CANDIDATES, 'candidatePosts');
  const canonical = [...candidatePosts].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([slug, text]) => [slug, stripSpecimen(text).text]);
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

/**
 * Candidate map contains added/modified posts only, not deletions. Caller verifies paths and
 * provenance. Trusted ledger bytes are never taken from the candidate branch.
 */
export function planAdmission({ basePosts, candidatePosts, ledgerText }) {
  checkedMap(basePosts, MAX_POSTS, 'basePosts');
  checkedMap(candidatePosts, MAX_CANDIDATES, 'candidatePosts');
  if (typeof ledgerText !== 'string' || Buffer.byteLength(ledgerText) > MAX_LEDGER_BYTES) throw new Error('ledger exceeds input limit');
  const ledger = parseLedger(ledgerText);
  if (ledger.errors.length) throw new Error(ledger.errors.join('; '));
  if (ledger.entries.some(({ n }) => !Number.isSafeInteger(n) || n < 1)) throw new Error('unsafe ledger number');
  const state = ledgerState(ledger.entries);
  if (state.problems.length) throw new Error(state.problems.join('; '));
  const baseline = [...basePosts].map(([slug, text]) => readPost(slug, text));
  // Source/byline editorial validation belongs to candidate/main checks, not allocation.
  const problems = findProblems(baseline, ledger.entries).filter((p) => !p.includes('published with no sources') && !p.includes('files under `voices`'));
  if (baseline.some((p) => p.specimen !== null && !Number.isSafeInteger(p.specimen))) problems.push('unsafe baseline number');
  if (problems.length) throw new Error(`invalid trusted baseline: ${problems.join('; ')}`);
  const posts = new Map();
  const repairs = [];
  for (const [slug, text] of candidatePosts) {
    const clean = stripSpecimen(text);
    const post = readPost(slug, clean.text);
    if (post.errors.length) throw new Error(`${slug}: ${post.errors.join('; ')}`);
    const base = baseline.find((p) => p.slug === slug);
    if (!base && ledger.entries.some((e) => e.slug === slug)) throw new Error(`${slug}: historical slug cannot be reused`);
    let normalized = clean.text;
    if (base?.specimen !== null && base?.specimen !== undefined) normalized = withSpecimen(normalized, base.specimen);
    posts.set(slug, normalized);
    if (normalized !== text) repairs.push({ slug, kind: base ? 'restore' : 'remove', from: clean.removed, to: base?.specimen ?? null });
  }
  const allocations = assignNumbers([...posts].map(([slug, text]) => readPost(slug, text)), ledger.entries);
  if (allocations.some(({ n }) => !Number.isSafeInteger(n))) throw new Error('specimen range exhausted');
  let nextLedger = ledgerText;
  if (allocations.length) {
    // A newline is an appended byte too: preserve even a trusted ledger missing its final LF.
    if (nextLedger && !nextLedger.endsWith('\n')) nextLedger += '\n';
    nextLedger += allocations.map(ledgerLine).join('\n') + '\n';
  }
  for (const { slug, n } of allocations) {
    posts.set(slug, withSpecimen(posts.get(slug), n));
    repairs.push({ slug, kind: 'allocate', from: null, to: n });
  }
  if (!nextLedger.startsWith(ledgerText)) throw new Error('ledger prefix changed');
  if (editorialDigest(posts) !== editorialDigest(candidatePosts)) throw new Error('editorial content changed');
  return { posts, ledgerText: nextLedger, repairs, editorialDigest: editorialDigest(candidatePosts) };
}
