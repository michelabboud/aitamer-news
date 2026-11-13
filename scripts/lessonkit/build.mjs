#!/usr/bin/env node
// Build the lesson-kit PDFs (cheat sheet, homework, answer key) for one or more lessons.
//
//   CHROME_PATH=/usr/bin/google-chrome npm run build:lesson-kits            # every src/lessonkits/*.json
//   CHROME_PATH=/usr/bin/google-chrome npm run build:lesson-kits -- k8s-02  # one lesson
//   ... -- --keep-html                                                     # also write the HTML next to the PDFs
//   ... -- --preview                                                       # stamp PREVIEW on every page (review builds)
//
// Runs locally only. The PDFs are committed under public/lessonkits/; the site build never needs Chrome.

import { readFile, writeFile, readdir, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import QRCode from 'qrcode';
import { render } from './render.mjs';
import { withUtm } from './utm.mjs';
import { seriesLine } from './series.mjs';
import { wrapCommand } from './shellwrap.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const TEMPLATES = path.join(here, 'templates');
const CONTENT = path.join(root, 'src/lessonkits');
const OUT = path.join(root, 'public/lessonkits');
const FONTS = path.join(root, 'src/assets/fonts');
const MASCOT = path.join(root, 'public/favicon.svg');
const SERIES = path.join(root, 'src/data/series.json');
const SITE = 'https://aitamer.news/';

// The three documents in a kit. `key` is also the utm_content value.
const DOCS = [
  { key: 'cheatsheet', template: 'cheatsheet.html', label: 'Cheat sheet', intro: (d) => d.cheatsheet.intro },
  { key: 'homework', template: 'homework.html', label: 'Homework', intro: () => 'Exercises drawn only from the lesson: recall, run this and explain, predict the outcome.' },
  { key: 'answer-key', template: 'answer-key.html', label: 'Answer key', intro: () => 'The answers to the homework sheet, matched by exercise number. Every answer comes from the lesson. Names with random suffixes will differ on your cluster.' },
];

// The site's self-hosted fonts (src/styles/fonts.css), latin subset; Chrome embeds the glyphs it uses.
const FONT_FACES = [
  ['Gloock', 'normal', '400', 'gloock-400-latin.woff2'],
  ['Newsreader', 'normal', '500 600', 'newsreader-latin.woff2'],
  ['Hanken Grotesk', 'normal', '400 700', 'hanken-grotesk-latin.woff2'],
  ['Hanken Grotesk', 'italic', '400', 'hanken-grotesk-italic-400-latin.woff2'],
  ['IBM Plex Mono', 'normal', '400', 'ibm-plex-mono-400-latin.woff2'],
  ['IBM Plex Mono', 'normal', '500', 'ibm-plex-mono-500-latin.woff2'],
  ['IBM Plex Mono', 'normal', '600', 'ibm-plex-mono-600-latin.woff2'],
];

function fontFaces() {
  return FONT_FACES.map(([family, style, weight, file]) => {
    const p = path.join(FONTS, file);
    if (!existsSync(p)) throw new Error(`Missing font ${p}`);
    return `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:block;src:url('${pathToFileURL(p)}') format('woff2');}`;
  }).join('\n');
}

// Characters per printed command line on the cheat sheet (IBM Plex Mono 6.4pt is ~1.36 mm a character):
// one of the two columns holds ~66, the full width ~135. Kept a little under, for safety.
const CMD_COLUMN_CHARS = 62;
const CMD_WIDE_CHARS = 128;
const CMD_FONT_PT = 6.4;

// Commands are printed with `white-space: pre`, broken only at spaces outside quotes with a trailing ` \`,
// so a command copied from the PDF still runs. A group whose longest word does not fit a column goes
// full width; if a word is still too long, that command's font shrinks instead of the word breaking.
function layoutCommands(groups) {
  return groups.map((g) => {
    let wide = false;
    let commands = g.commands.map((c) => ({ ...c, ...wrapCommand(c.cmd, CMD_COLUMN_CHARS) }));
    if (commands.some((c) => c.longest > CMD_COLUMN_CHARS)) {
      wide = true;
      commands = g.commands.map((c) => ({ ...c, ...wrapCommand(c.cmd, CMD_WIDE_CHARS) }));
    }
    const limit = wide ? CMD_WIDE_CHARS : CMD_COLUMN_CHARS;
    commands = commands.map((c) => ({
      ...c,
      style: c.longest > limit ? `font-size:${(CMD_FONT_PT * limit / c.longest).toFixed(2)}pt` : '',
    }));
    return { ...g, wide, commands };
  });
}

// Number exercises across sections, and turn `lines` into something the template can loop over.
function prepare(data) {
  if (data.cheatsheet?.commandGroups) {
    const laid = layoutCommands(data.cheatsheet.commandGroups);
    data.cheatsheet.columnGroups = laid.filter((g) => !g.wide);
    data.cheatsheet.wideGroups = laid.filter((g) => g.wide);
  }
  let n = 0;
  for (const s of data.homework?.sections ?? []) {
    for (const ex of s.exercises) {
      ex.n = ++n;
      ex.lineList = Array.from({ length: ex.lines ?? 2 }, () => ({}));
    }
  }
  return data;
}

async function main() {
  const args = process.argv.slice(2);
  const keepHtml = args.includes('--keep-html');
  const preview = args.includes('--preview');
  const wanted = args.filter((a) => !a.startsWith('--'));
  const chrome = process.env.CHROME_PATH;
  if (!chrome || !existsSync(chrome)) {
    throw new Error('Set CHROME_PATH to a local Chrome or Chromium binary, e.g. CHROME_PATH=/usr/bin/google-chrome');
  }

  const [base, css, paginateJs, mascotSvg, seriesJson] = await Promise.all([
    readFile(path.join(TEMPLATES, 'base.html'), 'utf8'),
    readFile(path.join(TEMPLATES, 'kit.css'), 'utf8'),
    readFile(path.join(TEMPLATES, 'paginate.js'), 'utf8'),
    readFile(MASCOT, 'utf8'),
    readFile(SERIES, 'utf8'),
  ]);
  const catalog = JSON.parse(seriesJson);
  const faces = fontFaces();

  const files = (await readdir(CONTENT)).filter((f) => f.endsWith('.json'));
  const lessons = files.map((f) => f.replace(/\.json$/, '')).filter((s) => !wanted.length || wanted.includes(s));
  if (!lessons.length) throw new Error(`No lesson data found for: ${wanted.join(', ') || '(all)'}`);

  await mkdir(OUT, { recursive: true });
  const work = await mkdtemp(path.join(tmpdir(), 'lessonkit-'));
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--allow-file-access-from-files'] });
  let failed = false;
  try {
    for (const slug of lessons) {
      const data = prepare(JSON.parse(await readFile(path.join(CONTENT, `${slug}.json`), 'utf8')));
      // Fails the build if the series or the lesson's arc is not in src/data/series.json.
      const series = seriesLine(catalog, data.lesson.seriesSlug, data.lesson.number);
      const artPath = path.join(CONTENT, data.art.file);
      if (!existsSync(artPath)) throw new Error(`Missing art ${artPath}`);

      for (const doc of DOCS) {
        const utm = { campaign: data.campaign ?? slug, content: doc.key };
        const links = {
          lesson: withUtm(data.lesson.url, utm),
          next: withUtm(data.next.url, utm),
          home: withUtm(SITE, utm),
        };
        const qrSvg = await QRCode.toString(links.lesson, {
          type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#111513', light: '#ffffff' },
        });
        const docTemplate = await readFile(path.join(TEMPLATES, doc.template), 'utf8');
        const html = render(base, {
          ...data,
          docTitle: `${data.lesson.title} · ${doc.label}${preview ? ' · PREVIEW' : ''} · aitamer.news`,
          seriesLine: series.label, preview,
          docLabel: doc.label,
          docKey: doc.key,
          docIntro: doc.intro(data),
          links, qrSvg, mascotSvg, css, paginateJs,
          fontFaces: faces,
          artUrl: pathToFileURL(artPath).href,
        }, { doc: docTemplate });

        const name = `aitamer-${slug}-${doc.key}`;
        const htmlPath = path.join(keepHtml ? OUT : work, `${name}.html`);
        await writeFile(htmlPath, html);

        const page = await browser.newPage();
        await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
        });
        // Fail loudly if a font did not load: the PDF must use the brand fonts, not a fallback.
        const missing = await page.evaluate(() =>
          ['Gloock', 'Newsreader', 'Hanken Grotesk', 'IBM Plex Mono'].filter((f) => !document.fonts.check(`12px "${f}"`)));
        if (missing.length) throw new Error(`${name}: fonts not loaded: ${missing.join(', ')}`);
        const result = await page.evaluate(() => window.__paginate());
        if (result.problems.length) { failed = true; console.error(`${name}: ${result.problems.join('; ')}`); }

        const pdfPath = path.join(OUT, `${name}.pdf`);
        await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, tagged: true });
        await page.close();
        console.log(`${path.relative(root, pdfPath)}  ${result.pages} page(s)`);
      }
    }
  } finally {
    await browser.close();
    await rm(work, { recursive: true, force: true });
  }
  if (failed) process.exit(1);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
