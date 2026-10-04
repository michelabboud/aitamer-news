import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { buildPost, bodyLinks, extractFields, countWords, digest, factCheckHints, ledgerLines, main, repairFields } from './post-builder.mjs';

const ok200 = async () => ({ status: 200 });
const fields = (extra = {}) => ({
  title: 'Cloudflare adds a web search API',
  description: 'Cloudflare says its AI Gateway now offers web search for agents.',
  section: 'devops',
  tags: ['cloudflare', 'agents'],
  body: 'Cloudflare says [the API](https://blog.example.com/a) is available.\n\n## What it costs\n\nThe page lists prices.\n',
  sources: [{ title: 'Cloudflare blog', url: 'https://blog.example.com/a' }],
  wildness: { rating: 3, verified: 'The page was read', claimed: 'Prices are vendor claims' },
  verdict: 'Search becomes one call.',
  ...extra,
});
const ctx = (extra = {}) => ({
  author: 'quill', pubDate: '2026-10-05T09:30:00Z', heroImage: 'https://media.aitamer.news/heroes/x-0123abcd.jpg', heroAlt: 'A drawer.',
  model: 'sol', type: 'news', attempt: 1, maxAttempts: 2, fetcher: ok200, taken: new Set(), roster: { fallbacks: { sol: 'opus' }, vendors: { sol: 'openai' } }, ...extra,
});

test('repair drops fields a model may not set, maps the section, fixes em-dashes and keeps digests', () => {
  const { fields: f, repairs } = repairFields({ ...fields({ section: 'News', description: 'Fast — and cheap.' }), pubDate: '2026-01-01', author: 'x', specimen: 5 });
  assert.equal(f.section, 'general');
  assert.equal(f.description, 'Fast, and cheap.');
  assert.deepEqual(repairs.filter((r) => r.code === 'drop-field').map((r) => r.field).sort(), ['author', 'pubDate', 'specimen']);
  const dash = repairs.find((r) => r.code === 'em-dash');
  assert.equal(dash.before, digest('Fast — and cheap.'));
  assert.equal(dash.after, digest('Fast, and cheap.'));
  assert.ok(!('pubDate' in f) && !('author' in f));
});

test('repair rewrites em-dashes in prose but never inside code', () => {
  const { fields: f } = repairFields(fields({ body: 'It works — fast.\n\n```sh\necho "a — b"\n```\n\nUse `x — y` here.\n' }));
  assert.match(f.body, /It works, fast\./);
  assert.match(f.body, /echo "a — b"/);
  assert.match(f.body, /`x — y`/);
});

test('tags are normalised and sources deduplicated', () => {
  const { fields: f, repairs } = repairFields(fields({ tags: ['AI Agents', 'ai agents', 'Web_Search'], sources: [{ title: 'A', url: 'https://a.example/' }, { title: 'B', url: 'https://a.example/' }] }));
  assert.deepEqual(f.tags, ['ai-agents', 'web-search']);
  assert.equal(f.sources.length, 1);
  assert.ok(repairs.some((r) => r.code === 'sources'));
});

test('a clean draft builds a post file code owns: author, slot, hero, no model YAML', async () => {
  const r = await buildPost({ ...fields(), pubDate: '1999-01-01', author: 'evil' }, ctx());
  assert.equal(r.status, 'ok', JSON.stringify(r.problems));
  const [, fm, body] = r.file.split(/^---\n|\n---\n/m);
  const data = yaml.load(fm);
  assert.equal(data.author, 'quill');
  assert.equal(String(data.pubDate), '2026-10-05T09:30:00Z');
  assert.equal(data.heroImage, 'https://media.aitamer.news/heroes/x-0123abcd.jpg');
  assert.equal(data.draft, false);
  assert.match(body, /Cloudflare says/);
  assert.ok(r.repairs.some((x) => x.code === 'drop-field' && x.field === 'author'));
});

test('a failing draft is a retry first, with a prompt naming every problem, then a fallback with an issue', async () => {
  const long = fields({ description: 'x'.repeat(300) });
  const first = await buildPost(long, ctx({ attempt: 1 }));
  assert.equal(first.status, 'retry');
  assert.equal(first.file, null);
  assert.match(first.retryPrompt, /description/);
  assert.match(first.retryPrompt, /FIELDS only/);
  const second = await buildPost(long, ctx({ attempt: 2 }));
  assert.equal(second.status, 'fallback');
  assert.equal(second.fallbackModel, 'opus');
  assert.match(second.issue.title, /failed validation after 2 attempt/);
  assert.match(second.issue.body, /Fallback writer: \*\*opus\*\*/);
});

test('a dead link is a problem, a bot-blocked link is only a warning', async () => {
  const f = fields({ body: 'See [a](https://blog.example.com/a) and [b](https://b.example/x).\n', sources: [{ title: 'a', url: 'https://blog.example.com/a' }, { title: 'b', url: 'https://b.example/x' }] });
  const dead = await buildPost(f, ctx({ fetcher: async (u) => ({ status: u.includes('b.example') ? 404 : 200 }) }));
  assert.ok(dead.problems.some((p) => p.code === 'dead-link' && /b\.example/.test(p.message)));
  const blocked = await buildPost(f, ctx({ fetcher: async (u) => ({ status: u.includes('b.example') ? 403 : 200 }) }));
  assert.equal(blocked.status, 'ok');
  assert.ok(blocked.warnings.some((w) => w.code === 'link-unverified'));
});

test('a body link that is not in sources is a problem; a source never linked is a warning', async () => {
  const r = await buildPost(fields({ body: 'See [x](https://other.example/y).\n' }), ctx());
  assert.ok(r.problems.some((p) => p.code === 'link-not-in-sources'));
  assert.ok(r.warnings.some((w) => w.code === 'source-not-linked'));
});

test('first-person experience claims fail outside voices, and are allowed in voices', async () => {
  const body = 'In my experience this is slow. [a](https://blog.example.com/a)\n';
  const bad = await buildPost(fields({ body }), ctx());
  assert.ok(bad.problems.some((p) => p.code === 'experience-claim'));
  const est = await buildPost(fields({ body: 'These are working estimates from building small fine-tunes. [a](https://blog.example.com/a)\n' }), ctx());
  assert.ok(est.problems.some((p) => p.code === 'experience-claim'));
  const voices = await buildPost(fields({ section: 'voices', body }), ctx());
  assert.ok(!voices.problems.some((p) => p.code === 'experience-claim'));
});

test('a leaked working note fails, and so does a draft with no sources unless it is a poem', async () => {
  const leak = await buildPost(fields({ body: 'HARD: keep MIT explicit. [a](https://blog.example.com/a)\n' }), ctx());
  assert.ok(leak.problems.some((p) => p.code === 'leak'));
  const none = await buildPost(fields({ sources: [], body: 'Plain.\n' }), ctx());
  assert.ok(none.problems.some((p) => p.code === 'no-sources'));
  const poem = await buildPost(fields({ sources: [], tags: ['poem'], section: 'voices', body: 'Plain.\n' }), ctx());
  assert.ok(!poem.problems.some((p) => p.code === 'no-sources'));
});

test('word bounds, the section check and a taken slot are all problems', async () => {
  const short = await buildPost(fields(), ctx({ minWords: 300 }));
  assert.ok(short.problems.some((p) => p.code === 'length'));
  const badSection = await buildPost(fields({ section: 'banana' }), ctx());
  assert.ok(badSection.problems.some((p) => p.code === 'schema' && p.field === 'section'));
  const taken = await buildPost(fields(), ctx({ taken: new Set(['2026-10-05T09:30']) }));
  assert.ok(taken.problems.some((p) => p.code === 'slot'));
});

test('news mode takes a near time off the grid and sharing a slot, but not a far one', async () => {
  const now = new Date('2026-10-05T09:00:00Z');
  const near = await buildPost(fields(), ctx({ news: true, now, pubDate: '2026-10-05T09:12:00Z', taken: new Set(['2026-10-05T09:12']) }));
  assert.equal(near.status, 'ok', JSON.stringify(near.problems));
  const far = await buildPost(fields(), ctx({ news: true, now, pubDate: '2026-10-05T20:00:00Z' }));
  assert.ok(far.problems.some((p) => p.code === 'slot'));
});

test('helpers: word count skips code, links are found, numeric claims are listed for the fact-checker', () => {
  assert.equal(countWords('one two\n\n```sh\nignored words here\n```\nthree\n'), 3);
  assert.deepEqual(bodyLinks('See [a](https://a.example/x) and https://b.example/y.'), ['https://a.example/x', 'https://b.example/y']);
  assert.deepEqual(factCheckHints('It costs $5 per month. It is nice.'), ['It costs $5 per month.']);
});

test('the ledger writes one line per repair, problem, warning and the result, in the shape ops proposed', async () => {
  const r = await buildPost({ ...fields({ description: 'x'.repeat(300) }), pubDate: 'z' }, ctx({ slug: 'p1', now: new Date('2026-10-05T09:00:00Z') }));
  const lines = ledgerLines(r, ctx({ slug: 'p1', now: new Date('2026-10-05T09:00:00Z') })).map((l) => JSON.parse(l));
  for (const l of lines) for (const k of ['ts', 'post_type', 'slug', 'model', 'vendor', 'stage', 'rule', 'action', 'field']) assert.ok(k in l, k);
  assert.ok(lines.some((l) => l.stage === 'intake' && l.rule === 'drop-field'));
  assert.ok(lines.some((l) => l.stage === 'validate' && l.action === 'failed'));
  assert.equal(lines.at(-1).rule, 'result');
  assert.equal(lines.at(-1).vendor, 'openai');
});

test('the CLI writes the file only on ok, appends the ledger, and exits 2 without author and slot', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pb-'));
  writeFileSync(join(dir, 'f.json'), JSON.stringify(fields()));
  const logs = []; const orig = console.log; console.log = (m) => logs.push(m);
  const out = join(dir, 'p.md'); const ledger = join(dir, 'l.jsonl');
  try {
    const code = await main(['--fields', join(dir, 'f.json'), '--author', 'quill', '--pubDate', '2026-10-05T09:30:00Z', '--hero', 'https://media.aitamer.news/heroes/x-0123abcd.jpg', '--heroAlt', 'A drawer.', '--no-links', '--out', out, '--ledger', ledger, '--model', 'sol', '--type', 'news', '--slug', 'p']);
    assert.equal(code, 0, logs.join());
    assert.ok(existsSync(out));
    assert.ok(readFileSync(ledger, 'utf8').trim().split('\n').length >= 1);
    writeFileSync(join(dir, 'bad.json'), JSON.stringify(fields({ description: 'x'.repeat(300) })));
    const out2 = join(dir, 'q.md');
    const bad = await main(['--fields', join(dir, 'bad.json'), '--author', 'quill', '--pubDate', '2026-10-05T10:00:00Z', '--hero', 'https://media.aitamer.news/heroes/x-0123abcd.jpg', '--heroAlt', 'A drawer.', '--no-links', '--out', out2]);
    assert.equal(bad, 1);
    assert.ok(!existsSync(out2));
    const err = console.error; console.error = () => {};
    try { assert.equal(await main(['--fields', join(dir, 'f.json')]), 2); } finally { console.error = err; }
  } finally { console.log = orig; }
});

test('the CLI flushes a large successful JSON result before exiting', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pb-large-'));
  const body = `${fields().body}\n\`\`\`text\n${'x'.repeat(1024 * 1024)}\n\`\`\`\n`;
  const fieldsPath = join(dir, 'fields.json');
  writeFileSync(fieldsPath, JSON.stringify(fields({ body })));
  const script = fileURLToPath(new URL('./post-builder.mjs', import.meta.url));
  const run = spawnSync(process.execPath, [
    '--experimental-strip-types', '--no-warnings=ExperimentalWarning', script,
    '--fields', fieldsPath, '--author', 'quill', '--pubDate', '2026-10-05T09:30:00Z',
    '--hero', 'https://media.aitamer.news/heroes/x-0123abcd.jpg', '--heroAlt', 'A drawer.', '--no-links',
  ], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  assert.ifError(run.error);
  assert.equal(run.status, 0, run.stderr);
  assert.ok(run.stdout.length > 1024 * 1024, `received only ${run.stdout.length} characters`);
  const result = JSON.parse(run.stdout);
  assert.equal(result.status, 'ok');
  assert.ok(result.file.includes(body));
});

test('the CLI keeps validation and usage exit statuses', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pb-exit-'));
  const fieldsPath = join(dir, 'fields.json');
  writeFileSync(fieldsPath, JSON.stringify(fields({ description: 'x'.repeat(300) })));
  const script = fileURLToPath(new URL('./post-builder.mjs', import.meta.url));
  const nodeArgs = ['--experimental-strip-types', '--no-warnings=ExperimentalWarning', script];
  const invalid = spawnSync(process.execPath, [
    ...nodeArgs, '--fields', fieldsPath, '--author', 'quill', '--pubDate', '2026-10-05T09:30:00Z',
    '--hero', 'https://media.aitamer.news/heroes/x-0123abcd.jpg', '--heroAlt', 'A drawer.', '--no-links',
  ], { encoding: 'utf8' });
  assert.ifError(invalid.error);
  assert.equal(invalid.status, 1, invalid.stderr);
  assert.equal(JSON.parse(invalid.stdout).status, 'retry');

  const usage = spawnSync(process.execPath, nodeArgs, { encoding: 'utf8' });
  assert.ifError(usage.error);
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /usage: post-builder\.mjs/);
});

test('extractFields finds the JSON in a bare reply, a fenced reply, or a reply with prose around it, and null otherwise', () => {
  assert.deepEqual(extractFields('{"a":1}'), { a: 1 });
  assert.deepEqual(extractFields('Here you go:\n```json\n{"a":2}\n```\nDone.'), { a: 2 });
  assert.deepEqual(extractFields('Sure. {"a":3} thanks'), { a: 3 });
  assert.equal(extractFields('no fields here'), null);
  assert.equal(extractFields('[1,2]'), null);
});

test('an empty or non-JSON reply is one clear problem, then a fallback, and a bad section is reported once', async () => {
  const one = await buildPost({}, ctx({ attempt: 1 }));
  assert.equal(one.status, 'retry');
  assert.deepEqual(one.problems.map((p) => p.code), ['no-fields']);
  const two = await buildPost(null, ctx({ attempt: 2 }));
  assert.equal(two.status, 'fallback');
  assert.equal(two.fallbackModel, 'opus');
  const bad = await buildPost(fields({ section: 'banana', sources: [] }), ctx());
  assert.equal(bad.problems.filter((p) => /section/.test(p.message) || p.field === 'section').length, 1);
  assert.equal(bad.problems.filter((p) => p.code === 'no-sources' || /no sources/.test(p.message)).length, 1);
});
