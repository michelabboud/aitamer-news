#!/usr/bin/env node
/**
 * The post builder: a writing model returns FIELDS, code builds, repairs and checks the post file.
 * Michel's rule (2026-10-03): the model prepares the post, code owns the format, and nothing publishes
 * without strict validation. A model never writes pubDate, author, hero, specimen or YAML.
 *
 *   node scripts/post-builder.mjs --fields fields.json --author ari --pubDate 2026-10-04T12:00:00Z \
 *        --hero https://media.aitamer.news/heroes/x-0123abcd.jpg --heroAlt "..." \
 *        [--reply]   (the --fields file is a raw model reply; extract the JSON object from it)
 *        [--model sol --type short --slug my-post --attempt 1 --max-attempts 2 --min-words 250 --max-words 450] \
 *        [--roster roster.json] [--ledger misses.jsonl] [--out src/content/posts/slug.md] \
 *        [--news] [--no-links] [--open-issue]
 *
 * fields.json: { title, description, section, tags[], body, sources:[{title,url}],
 *                wildness:{rating,verified,claimed}, verdict, subsection?, heroAlt? }
 *
 * Stdout is one JSON result: { status: "ok" | "retry" | "fallback", file, repairs, problems, warnings,
 * factCheckHints, retryPrompt, fallbackModel, issue }. Exit 0 on ok, 1 otherwise. The file is written
 * (--out) only when status is "ok". Every run appends one line to the misstep ledger (--ledger), so the
 * backoffice can see which model slips how often.
 *
 * Repairs are mechanical and recorded (a model is never silently "fixed"): unknown fields dropped, the
 * section mapped to a habitat, em-dashes rewritten, whitespace and tags normalised, sources deduplicated.
 * Anything that needs judgment (a long description, a wrong claim, a dead link, a missing source) is a
 * problem for the writer, who gets a retry prompt; a second failure falls back to the roster's next writer.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { postSchema } from '../src/content/post-schema.ts';
import { FRONTMATTER_SECTIONS, SECTION_ALIASES, HABITATS } from '../src/lib/habitats.ts';
import { leaksIn } from './check-reader-text.mjs';
import { heroProblems, newsSlotProblems, slotProblems, styleProblems, takenSlots } from './bot-preflight.mjs';

/** The only keys a model may supply; everything else is dropped and recorded. */
export const FIELD_KEYS = ['title', 'description', 'section', 'subsection', 'tags', 'body', 'sources', 'wildness', 'verdict', 'heroAlt'];
/** Section values models invent that map to a habitat (the schema's own aliases are applied first). */
export const SECTION_FIXES = Object.freeze({ news: 'general', announcement: 'general', article: 'general', explainer: 'general', review: 'tools', tutorial: 'dev' });
export const MAX_TAGS = 6;
export const DEFAULT_MAX_ATTEMPTS = 2;
/** Statuses where an unreachable page is a warning, not a dead link: the site blocks bots, the page is not gone. */
export const SOFT_LINK_STATUSES = new Set([401, 403, 405, 429, 999]);

const EXPERIENCE_CLAIMS = [
  /\bin my experience\b/i,
  /\bI (?:measured|benchmarked|timed|tested|ran|built|deployed)\b/i,
  /\bI(?:'ve| have) (?:seen|used|run|built|measured|tested|shipped)\b/i,
  /\bmy (?:own )?(?:tests?|benchmarks?|measurements?|numbers)\b/i,
  /\bwe (?:measured|benchmarked|tested)\b/i,
  /\b(?:from|based on) (?:my|our) (?:own )?(?:experience|work|tests?|runs?)\b/i,
  /\bestimates from (?:building|running|training|testing)\b/i,
];

/** Fenced and inline code, kept out of prose rewrites and prose lints. */
const CODE = /```[\s\S]*?```|`[^`\n]*`/g;
const mapProse = (text, fn) => {
  const parts = []; let last = 0;
  for (const m of text.matchAll(CODE)) { parts.push(fn(text.slice(last, m.index)), m[0]); last = m.index + m[0].length; }
  parts.push(fn(text.slice(last)));
  return parts.join('');
};
const proseOnly = (text) => text.replace(CODE, ' ');
export const countWords = (body) => proseOnly(body).split(/\s+/).filter(Boolean).length;

/** Short digest of a field value, so a repair can be audited without keeping the text. */
export const digest = (v) => createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex').slice(0, 12);

const fixDashes = (s) => s.replace(/\s*—\s*/g, ', ');

/**
 * The fields object inside a raw model reply: the whole reply, a fenced json block, or the outermost braces.
 * A reply with no parseable object is `null`, which the CLI reports as a retry (the writer sent no fields).
 * @param {string} text @returns {Record<string, any> | null}
 */
export function extractFields(text) {
  const tries = [text.trim(), (text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [])[1], text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)];
  for (const t of tries) {
    if (!t) continue;
    try { const v = JSON.parse(t); if (v && typeof v === 'object' && !Array.isArray(v)) return v; } catch { /* next */ }
  }
  return null;
}

/** @returns {{fields: Record<string, any>, repairs: {code: string, field: string, detail: string}[]}} */
export function repairFields(input) {
  const repairs = [];
  const note = (code, field, detail, before, after) => repairs.push({ code, field, detail, ...(before === undefined ? {} : { before: digest(before), after: digest(after) }) });
  const f = {};
  for (const [k, v] of Object.entries(input ?? {})) {
    if (FIELD_KEYS.includes(k)) f[k] = v;
    else note('drop-field', k, `a model may not set "${k}"; dropped (code sets it)`);
  }
  for (const k of ['title', 'description', 'verdict', 'subsection', 'heroAlt']) {
    if (typeof f[k] === 'string') {
      const t = f[k].replace(/\s+/g, ' ').trim();
      if (t !== f[k]) note('whitespace', k, 'collapsed whitespace', f[k], t);
      f[k] = t;
    }
  }
  if (typeof f.section === 'string') {
    const raw = f.section;
    let s = raw.trim().toLowerCase();
    if (Object.hasOwn(SECTION_FIXES, s)) s = SECTION_FIXES[s];
    if (s !== raw) note('section', 'section', `"${raw}" mapped to "${s}"`, raw, s);
    f.section = s;
  }
  for (const k of ['title', 'description', 'verdict', 'heroAlt']) {
    if (typeof f[k] === 'string' && f[k].includes('—')) { const b = f[k]; f[k] = fixDashes(b); note('em-dash', k, 'rewrote em-dash as a comma', b, f[k]); }
  }
  for (const k of ['verified', 'claimed']) {
    if (typeof f.wildness?.[k] === 'string' && f.wildness[k].includes('—')) { const b = f.wildness[k]; f.wildness[k] = fixDashes(b); note('em-dash', `wildness.${k}`, 'rewrote em-dash', b, f.wildness[k]); }
  }
  if (typeof f.body === 'string') {
    let body = f.body.replace(/\r\n/g, '\n').trim() + '\n';
    const fixed = mapProse(body, (p) => (p.includes('—') ? fixDashes(p) : p));
    if (fixed !== body) note('em-dash', 'body', 'rewrote em-dashes in the prose as commas', body, fixed);
    f.body = fixed;
  }
  if (Array.isArray(f.tags)) {
    const tags = [...new Set(f.tags.map((t) => String(t).trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')).filter(Boolean))].map((t) => t.slice(0, 60)).slice(0, MAX_TAGS);
    if (JSON.stringify(tags) !== JSON.stringify(f.tags)) note('tags', 'tags', 'normalised to lowercase-hyphenated, deduplicated, at most six', f.tags, tags);
    f.tags = tags;
  }
  if (Array.isArray(f.sources)) {
    const seen = new Set(); const out = [];
    for (const s of f.sources) {
      if (!s || typeof s.url !== 'string') { out.push(s); continue; }
      const url = s.url.trim(); const title = String(s.title ?? '').replace(/\s+/g, ' ').trim() || url;
      if (seen.has(url)) { note('sources', 'sources', `dropped duplicate ${url}`); continue; }
      seen.add(url); out.push({ title, url });
    }
    f.sources = out;
  }
  return { fields: f, repairs };
}

/** The frontmatter object code assembles around the model's fields (never the model's own). */
export function assemble(f, { author, pubDate, heroImage, heroAlt }) {
  const data = {
    title: f.title, description: f.description, pubDate, section: f.section,
    ...(f.subsection ? { subsection: f.subsection } : {}),
    tags: f.tags ?? [], draft: false,
    ...(heroImage ? { heroImage } : {}), ...((heroAlt ?? f.heroAlt) ? { heroAlt: heroAlt ?? f.heroAlt } : {}),
    wildness: f.wildness, verdict: f.verdict, sources: f.sources ?? [],
  };
  return data;
}

export function renderPost(data, author, body) {
  const withAuthor = { ...data };
  const order = ['title', 'description', 'pubDate', 'section', 'subsection', 'tags', 'draft', 'heroImage', 'heroAlt', 'author', 'wildness', 'verdict', 'sources'];
  const sorted = {};
  for (const k of order) { if (k === 'author') sorted.author = author; else if (k in withAuthor) sorted[k] = withAuthor[k]; }
  return `---\n${yaml.dump(sorted, { lineWidth: -1, quotingType: '"', forceQuotes: false }).trimEnd()}\n---\n\n${body.trim()}\n`;
}

/** Links in the body prose (markdown links and bare https URLs). */
export function bodyLinks(body) {
  const links = new Set();
  for (const m of proseOnly(body).matchAll(/\]\((https?:\/\/[^)\s]+)\)|(?<![(\w])<?(https?:\/\/[^\s<>)\]]+)/g)) links.add((m[1] ?? m[2]).replace(/[.,;]+$/, ''));
  return [...links];
}

/** @param {string} url @param {typeof fetch} fetcher */
export async function linkStatus(url, fetcher = fetch) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const r = await fetcher(url, { method, redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'Mozilla/5.0 aitamer-post-builder' } });
      if (r.status < 400 || method === 'GET') return r.status;
    } catch (e) { if (method === 'GET') return `ERR ${e.cause?.code ?? e.name}`; }
  }
  return 'ERR';
}

export async function checkLinks(urls, fetcher = fetch, concurrency = 6) {
  const out = {}; let i = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
    while (i < urls.length) { const u = urls[i++]; out[u] = await linkStatus(u, fetcher); }
  }));
  return out;
}

/** Numeric claims a fact-checker must verify (prices, percentages, versions, limits, dates). */
export function factCheckHints(body) {
  const hints = [];
  for (const line of proseOnly(body).split(/(?<=[.!?])\s+|\n+/)) {
    if (/\$\s?\d|\d\s?%|\bv?\d+\.\d+(?:\.\d+)?\b|\b\d[\d,]*\s?(?:ms|s|GB|MB|TB|tokens?|requests?|users?|stars?|hours?|days?|minutes?)\b|\b20\d\d\b/.test(line)) hints.push(line.trim().slice(0, 200));
  }
  return hints.slice(0, 40);
}

/**
 * @param {Record<string, any>} rawFields the model's reply
 * @param {object} ctx { author, pubDate, heroImage, heroAlt, model, type, attempt, maxAttempts, minWords, maxWords,
 *   news, postsDir, fetcher, noLinks, roster, allowFirstPerson }
 */
export async function buildPost(rawFields, ctx) {
  const { fields, repairs } = repairFields(rawFields);
  const problems = []; const warnings = [];
  if (!rawFields || Object.keys(rawFields).length === 0) {
    const attempt0 = ctx.attempt ?? 1; const max0 = ctx.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    const p0 = [{ code: 'no-fields', field: '(reply)', message: 'the reply held no JSON fields object; reply with one JSON object and nothing else' }];
    const fb = attempt0 >= max0 ? (ctx.roster?.fallbacks?.[ctx.model] ?? null) : null;
    return { status: attempt0 < max0 ? 'retry' : 'fallback', file: null, repairs, problems: p0, warnings, factCheckHints: [], words: 0, fallbackModel: fb,
      retryPrompt: attempt0 < max0 ? `Your reply held no JSON fields object. Reply with ONE JSON object and nothing else, in the shape the brief gives. Do not add pubDate, author, hero, specimen or YAML.` : null,
      issue: attempt0 >= max0 ? buildIssue({ title: '(no fields returned)', model: ctx.model, type: ctx.type, attempt: attempt0, problems: p0, fallbackModel: fb, pubDate: ctx.pubDate }) : null };
  }
  const P = (code, field, message) => problems.push({ code, field, message });
  const W = (code, field, message) => warnings.push({ code, field, message });

  if (typeof fields.body !== 'string' || !fields.body.trim()) P('no-body', 'body', 'the reply has no body');
  const body = typeof fields.body === 'string' ? fields.body : '';
  const data = assemble(fields, ctx);

  const parsed = postSchema.safeParse({ ...data, author: ctx.author });
  if (!parsed.success) for (const issue of parsed.error.issues) P('schema', issue.path.join('.') || '(post)', issue.message);
  if (FRONTMATTER_SECTIONS.includes(fields.section) && fields.section in SECTION_ALIASES) {
    repairs.push({ code: 'section', field: 'section', detail: `"${fields.section}" is a deprecated alias; filed under ${SECTION_ALIASES[fields.section]}` });
  }
  // The schema and the sources check below already report a bad section and missing sources; do not report them twice.
  for (const m of styleProblems({ ...data, section: fields.section, tags: fields.tags }, body)) if (!/^section |^no sources/.test(m)) P('style', 'prose', m);
  for (const m of heroProblems(data)) P('hero', 'heroImage', m);
  if (ctx.news) for (const m of newsSlotProblems(ctx.pubDate, ctx.now ?? new Date())) P('slot', 'pubDate', m);
  else for (const m of slotProblems(ctx.pubDate, ctx.taken ?? takenSlots(ctx.postsDir))) P('slot', 'pubDate', m);

  const words = countWords(body);
  if (ctx.minWords && words < ctx.minWords) P('length', 'body', `${words} words; the brief asks for at least ${ctx.minWords}`);
  if (ctx.maxWords && words > ctx.maxWords) P('length', 'body', `${words} words; the brief asks for at most ${ctx.maxWords}`);

  const leaks = leaksIn(`${fields.title}\n${fields.description}\n${fields.verdict}\n${body}`);
  for (const l of leaks) P('leak', 'prose', `working note in reader text: ${String(l).slice(0, 120)}`);

  if (fields.section !== 'voices' && !ctx.allowFirstPerson) {
    for (const re of EXPERIENCE_CLAIMS) {
      const m = proseOnly(body).match(re);
      if (m) P('experience-claim', 'body', `first-person experience claim "${m[0]}": an AI writer has no such experience; cite a source or rewrite as a sourced statement`);
    }
  }

  const sourceUrls = new Set((fields.sources ?? []).map((s) => s?.url).filter(Boolean));
  const links = bodyLinks(body);
  if (!(fields.tags ?? []).includes('poem') && sourceUrls.size === 0) P('no-sources', 'sources', 'no sources: every factual post cites what it read');
  for (const u of links) if (!sourceUrls.has(u)) P('link-not-in-sources', 'body', `body link ${u} is not in the sources list`);
  for (const u of sourceUrls) if (!links.includes(u)) W('source-not-linked', 'sources', `${u} is listed but never linked in the body`);

  if (!ctx.noLinks) {
    const statuses = await checkLinks([...new Set([...sourceUrls, ...links])], ctx.fetcher);
    for (const [u, st] of Object.entries(statuses)) {
      if (typeof st === 'number' && st < 400) continue;
      if (typeof st === 'number' && SOFT_LINK_STATUSES.has(st)) W('link-unverified', 'sources', `${u} answered ${st} (the site may block bots); check by hand`);
      else P('dead-link', 'sources', `${u} answered ${st}`);
    }
  }

  const hints = factCheckHints(body);
  const attempt = ctx.attempt ?? 1; const maxAttempts = ctx.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  let status = 'ok'; let fallbackModel = null; let retryPrompt = null; let issue = null;
  if (problems.length) {
    if (attempt < maxAttempts) {
      status = 'retry';
      retryPrompt = `Your draft failed these checks. Return the corrected FIELDS only (same JSON shape), changing only what the checks name. Do not add pubDate, author, hero, specimen or YAML.\n${problems.map((p, i) => `${i + 1}. [${p.field}] ${p.message}`).join('\n')}`;
    } else {
      status = 'fallback';
      fallbackModel = ctx.roster?.fallbacks?.[ctx.model] ?? null;
      issue = buildIssue({ title: fields.title, model: ctx.model, type: ctx.type, attempt, problems, fallbackModel, pubDate: ctx.pubDate });
    }
  }
  const file = status === 'ok' ? renderPost(data, ctx.author, body) : null;
  return { status, file, repairs, problems, warnings, factCheckHints: hints, retryPrompt, fallbackModel, issue, words };
}

export function buildIssue({ title, model, type, attempt, problems, fallbackModel, pubDate }) {
  return {
    title: `Post failed validation after ${attempt} attempt(s): ${String(title ?? '(untitled)').slice(0, 80)}`,
    body: `A ${type ?? 'post'} draft by **${model ?? 'unknown model'}** for the ${pubDate} slot did not pass validation and was not published.\n\n${problems.map((p) => `- \`${p.code}\` (${p.field}): ${p.message}`).join('\n')}\n\n${fallbackModel ? `Fallback writer: **${fallbackModel}**.` : 'No fallback writer is configured for this model.'}\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
  };
}

/**
 * One JSON line per repair, problem or warning, in the shape atn-ops proposed so the backoffice can join it
 * with the posts MCP audit log on slug: { ts, post_type, slug, model, vendor, stage, rule, action, field }.
 * A clean post still writes one `validate / ok` line, so a model's pass rate is countable.
 */
export function ledgerLines(result, ctx) {
  const base = { ts: (ctx.now ?? new Date()).toISOString(), post_type: ctx.type ?? null, slug: ctx.slug ?? null, model: ctx.model ?? null, vendor: ctx.roster?.vendors?.[ctx.model] ?? null, attempt: ctx.attempt ?? 1 };
  const lines = [
    ...result.repairs.map((r) => ({ ...base, stage: r.code === 'drop-field' ? 'intake' : 'repair', rule: r.code, action: 'repaired', field: r.field, before: r.before, after: r.after })),
    ...result.problems.map((p) => ({ ...base, stage: 'validate', rule: p.code, action: 'failed', field: p.field })),
    ...result.warnings.map((w) => ({ ...base, stage: 'validate', rule: w.code, action: 'flagged', field: w.field })),
  ];
  lines.push({ ...base, stage: 'validate', rule: 'result', action: result.status, field: null });
  return lines.map((l) => JSON.stringify(l));
}

function arg(argv, name, fallback) { const i = argv.indexOf(name); return i === -1 ? fallback : argv[i + 1]; }

export async function main(argv) {
  const fieldsPath = arg(argv, '--fields');
  if (!fieldsPath) { console.error('usage: post-builder.mjs --fields fields.json --author a --pubDate ISO --hero URL ...'); return 2; }
  const roster = arg(argv, '--roster') && existsSync(arg(argv, '--roster')) ? JSON.parse(readFileSync(arg(argv, '--roster'), 'utf8')) : null;
  const ctx = {
    author: arg(argv, '--author'), pubDate: arg(argv, '--pubDate'), heroImage: arg(argv, '--hero'), heroAlt: arg(argv, '--heroAlt'),
    model: arg(argv, '--model'), type: arg(argv, '--type'), slug: arg(argv, '--slug'), attempt: Number(arg(argv, '--attempt', 1)), maxAttempts: Number(arg(argv, '--max-attempts', DEFAULT_MAX_ATTEMPTS)),
    minWords: Number(arg(argv, '--min-words', 0)) || undefined, maxWords: Number(arg(argv, '--max-words', 0)) || undefined,
    news: argv.includes('--news'), noLinks: argv.includes('--no-links'), allowFirstPerson: argv.includes('--allow-first-person'), roster, postsDir: 'src/content/posts',
  };
  if (!ctx.author || !ctx.pubDate) { console.error('--author and --pubDate are required (code sets them, not the model)'); return 2; }
  const raw = readFileSync(fieldsPath, 'utf8');
  const parsedFields = argv.includes('--reply') ? extractFields(raw) : JSON.parse(raw);
  const result = await buildPost(parsedFields ?? {}, ctx);
  const ledger = arg(argv, '--ledger');
  if (ledger) { mkdirSync(dirname(ledger), { recursive: true }); appendFileSync(ledger, ledgerLines(result, ctx).join('\n') + '\n'); }
  const out = arg(argv, '--out');
  if (result.status === 'ok' && out) writeFileSync(out, result.file);
  if (result.status === 'fallback' && argv.includes('--open-issue') && result.issue) {
    try { result.issueUrl = execFileSync('gh', ['issue', 'create', '--title', result.issue.title, '--body', result.issue.body], { encoding: 'utf8' }).trim(); }
    catch (e) { result.issueError = String(e.message).slice(0, 200); }
  }
  console.log(JSON.stringify(result, null, 2));
  return result.status === 'ok' ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
