// Tests for scripts/stamp-hero.mjs. They need the system ffmpeg (with drawtext), ffprobe and a DejaVu or
// Liberation font, the same as the tool. Nothing here skips: with ffmpeg absent the fixture step below
// throws and the whole file fails loudly, so a machine that cannot stamp can never report a green run.
import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import {
  FONT_CANDIDATES,
  INK_ON_DARK,
  INK_ON_LIGHT,
  MARKER_PREFIX,
  Refusal,
  STAMP_TEXT,
  checkTools,
  drawtextFilter,
  escapeFilterValue,
  findFont,
  findMarker,
  injectMarker,
  inkFor,
  jpegComments,
  stampHero,
} from './stamp-hero.mjs';
import { tempDir } from './test-support.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT = fileURLToPath(new URL('./stamp-hero.mjs', import.meta.url));
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

/** Run the CLI as a child process: { code, stdout, stderr }. */
async function cli(args, env = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [SCRIPT, ...args], { env: { ...process.env, ...env } });
    return { code: 0, stdout, stderr };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

/** Make a fixture image with ffmpeg's lavfi sources (a real JPEG at quality 2, like the hero pipeline's). */
function makeImage(dir, name, source, { size = '1600x900', extra = [] } = {}) {
  const file = join(dir, name);
  execFileSync('ffmpeg', ['-v', 'error', '-nostdin', '-y', '-f', 'lavfi', '-i', `${source.replace('SIZE', size)}`, ...extra, '-frames:v', '1', '-q:v', '2', '-update', '1', file]);
  return file;
}

/** ffprobe a file: { codec, width, height }. */
function probe(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height', '-of', 'json', file], { encoding: 'utf8' });
  const stream = JSON.parse(out).streams[0];
  return { codec: stream.codec_name, width: stream.width, height: stream.height };
}

/** Raw rgb24 pixels of a 1600x900 image. */
function pixels(file) {
  return execFileSync('ffmpeg', ['-v', 'error', '-nostdin', '-i', file, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 64 * 1024 * 1024 });
}

const files = (dir) => readdirSync(dir).sort();

// ---- fixtures (a missing ffmpeg throws here, loudly) -----------------------------------------------------
const FIX = tempDir('stamp-hero-fixtures-');
const fixtures = {
  dark: makeImage(FIX, 'dark.jpg', 'color=c=0x101820:s=SIZE:d=1'),
  black: makeImage(FIX, 'black.jpg', 'color=c=black:s=SIZE:d=1'),
  light: makeImage(FIX, 'light.jpg', 'color=c=0xf2ead8:s=SIZE:d=1'),
  white: makeImage(FIX, 'white.jpg', 'color=c=white:s=SIZE:d=1'),
  midGrey: makeImage(FIX, 'mid-grey.jpg', 'color=c=0x808080:s=SIZE:d=1'),
  // Paper-like: a colour gradient with grain, so the box is never flat.
  grain: makeImage(FIX, 'grain.jpg', 'gradients=s=SIZE:d=1:c0=0x2f4858:c1=0xe9dcc3:seed=7', { extra: ['-vf', 'noise=alls=14:allf=t+u'] }),
  pattern: makeImage(FIX, 'pattern.jpg', 'testsrc2=s=SIZE:d=1'),
  // Hard structure right under the stamp: a vertical edge through the box, and stripes across it.
  edge: makeImage(FIX, 'edge.jpg', 'color=c=black:s=SIZE:d=1', { extra: ['-vf', 'drawbox=x=1450:y=0:w=150:h=900:color=white:t=fill'] }),
  stripes: makeImage(FIX, 'stripes.jpg', 'color=c=0x202020:s=SIZE:d=1', { extra: ['-vf', 'drawbox=x=0:y=840:w=1600:h=6:color=white:t=fill,drawbox=x=0:y=860:w=1600:h=6:color=white:t=fill'] }),
};
const png = join(FIX, 'real.png');
execFileSync('ffmpeg', ['-v', 'error', '-nostdin', '-y', '-f', 'lavfi', '-i', 'color=c=0x336699:s=1600x900:d=1', '-frames:v', '1', '-update', '1', png]);
const pngNamedJpg = join(FIX, 'png-in-disguise.jpg');
copyFileSync(png, pngNamedJpg);
const notAnImage = join(FIX, 'notes.jpg');
writeFileSync(notAnImage, 'this is text, not a picture');
const wrongSizes = {
  small: makeImage(FIX, 'small.jpg', 'color=c=0x336699:s=SIZE:d=1', { size: '800x450' }),
  oneShort: makeImage(FIX, 'one-short.jpg', 'color=c=0x336699:s=SIZE:d=1', { size: '1600x899' }),
  portrait: makeImage(FIX, 'portrait.jpg', 'color=c=0x336699:s=SIZE:d=1', { size: '900x1600' }),
};

/** A fresh output folder, so "nothing was written" is a statement about one test. */
const outDir = (prefix) => tempDir(`stamp-hero-${prefix}-`);

// ---- the machine -----------------------------------------------------------------------------------------
test('the machine can stamp: ffmpeg with drawtext, ffprobe and a stamp font are installed', async () => {
  assert.match(await checkTools(), /^ffmpeg version \S+/);
  assert.ok(FONT_CANDIDATES.includes(findFont()), 'a listed font exists');
  assert.match(findFont(), /DejaVuSans\.ttf$|LiberationSans-Regular\.ttf$/);
});

// ---- refusals first: every one exits 2 and writes nothing ------------------------------------------------
test('a name that already exists is never overwritten, and the original is untouched', async () => {
  const dir = outDir('exists');
  const out = join(dir, 'taken.jpg');
  writeFileSync(out, 'precious');
  const inputBefore = sha256(fixtures.dark);
  const res = await cli(['--in', fixtures.dark, '--out', out]);
  assert.equal(res.code, 2);
  assert.match(res.stderr, /already exists/);
  assert.equal(readFileSync(out, 'utf8'), 'precious');
  assert.deepEqual(files(dir), ['taken.jpg']);
  assert.equal(sha256(fixtures.dark), inputBefore);
});

test('a dangling symlink at --out counts as existing', async () => {
  const dir = outDir('dangling');
  symlinkSync(join(dir, 'nowhere'), join(dir, 'link.jpg'));
  const res = await cli(['--in', fixtures.dark, '--out', join(dir, 'link.jpg')]);
  assert.equal(res.code, 2);
  assert.match(res.stderr, /already exists/);
  assert.deepEqual(files(dir), ['link.jpg']);
});

test('--in equal to --out is refused, by path and through a symlink', async () => {
  const dir = outDir('same');
  const copy = join(dir, 'hero.jpg');
  copyFileSync(fixtures.dark, copy);
  const before = sha256(copy);
  const same = await cli(['--in', copy, '--out', copy]);
  assert.equal(same.code, 2);
  assert.match(same.stderr, /same file/);
  symlinkSync(copy, join(dir, 'alias.jpg'));
  const alias = await cli(['--in', copy, '--out', join(dir, 'alias.jpg')]);
  assert.equal(alias.code, 2);
  assert.equal(sha256(copy), before);
  assert.deepEqual(files(dir), ['alias.jpg', 'hero.jpg']);
});

test('input that is not a JPEG is refused: text, a PNG, a PNG named .jpg', async () => {
  for (const [input, pattern] of [[notAnImage, /not a JPEG/], [png, /not a JPEG/], [pngNamedJpg, /not a JPEG/]]) {
    const dir = outDir('notjpeg');
    const res = await cli(['--in', input, '--out', join(dir, 'out.jpg')]);
    assert.equal(res.code, 2, input);
    assert.match(res.stderr, pattern, input);
    assert.deepEqual(files(dir), [], input);
  }
});

test('a JPEG that is not exactly 1600 x 900 is refused', async () => {
  for (const [name, input] of Object.entries(wrongSizes)) {
    const dir = outDir('size');
    const res = await cli(['--in', input, '--out', join(dir, 'out.jpg')]);
    assert.equal(res.code, 2, name);
    assert.match(res.stderr, /exactly 1600 x 900/, name);
    assert.deepEqual(files(dir), [], name);
  }
});

test('a missing input, a missing output folder and bad arguments are refused', async () => {
  const dir = outDir('args');
  const missing = await cli(['--in', join(dir, 'nope.jpg'), '--out', join(dir, 'out.jpg')]);
  assert.equal(missing.code, 2);
  assert.match(missing.stderr, /does not exist/);
  const noFolder = await cli(['--in', fixtures.dark, '--out', join(dir, 'no-such-folder', 'out.jpg')]);
  assert.equal(noFolder.code, 2);
  assert.match(noFolder.stderr, /folder/);
  const none = await cli([]);
  assert.equal(none.code, 2);
  assert.match(none.stderr, /--in and --out are required/);
  const unknown = await cli(['--in', fixtures.dark, '--out', join(dir, 'o.jpg'), '--force']);
  assert.equal(unknown.code, 2);
  assert.match(unknown.stderr, /usage/);
  assert.deepEqual(files(dir), []);
});

test('an input directory is refused', async () => {
  const dir = outDir('dirin');
  const res = await cli(['--in', dir, '--out', join(dir, 'out.jpg')]);
  assert.equal(res.code, 2);
  assert.match(res.stderr, /not a regular file/);
});

test('a second stamp is refused when the marker is present, and the stamped file is untouched', async () => {
  const dir = outDir('twice');
  const once = join(dir, 'once.jpg');
  assert.equal((await cli(['--in', fixtures.grain, '--out', once])).code, 0);
  const before = sha256(once);
  const twice = await cli(['--in', once, '--out', join(dir, 'twice.jpg')]);
  assert.equal(twice.code, 2);
  assert.match(twice.stderr, /already carries the site mark/);
  assert.equal(sha256(once), before);
  assert.deepEqual(files(dir), ['once.jpg']);
});

test('a second stamp is refused even when a re-encode stripped the marker (the pixels give it away)', async () => {
  for (const [name, source] of [['grain', fixtures.grain], ['dark', fixtures.dark], ['light', fixtures.light]]) {
    const dir = outDir('stripped');
    const once = join(dir, 'once.jpg');
    assert.equal((await cli(['--in', source, '--out', once])).code, 0, name);
    const stripped = join(dir, 'stripped.jpg');
    execFileSync('ffmpeg', ['-v', 'error', '-nostdin', '-y', '-i', once, '-q:v', '2', '-map_metadata', '-1', '-update', '1', stripped]);
    assert.equal(findMarker(readFileSync(stripped)), null, `${name}: the re-encode really dropped the marker`);
    const res = await cli(['--in', stripped, '--out', join(dir, 'twice.jpg')]);
    assert.equal(res.code, 2, name);
    assert.match(res.stderr, /already shows the site mark/, name);
    assert.deepEqual(files(dir), ['once.jpg', 'stripped.jpg'], name);
  }
});

test('a receipt that already exists is refused before anything is written', async () => {
  const dir = outDir('receipt-exists');
  const receipt = join(dir, 'receipt.json');
  writeFileSync(receipt, '{"keep":"me"}');
  const res = await cli(['--in', fixtures.dark, '--out', join(dir, 'out.jpg'), '--receipt', receipt]);
  assert.equal(res.code, 2);
  assert.match(res.stderr, /receipt .* already exists/);
  assert.equal(readFileSync(receipt, 'utf8'), '{"keep":"me"}');
  assert.deepEqual(files(dir), ['receipt.json']);
  const sameAsOut = await cli(['--in', fixtures.dark, '--out', join(dir, 'same.jpg'), '--receipt', join(dir, 'same.jpg')]);
  assert.equal(sameAsOut.code, 2);
  assert.deepEqual(files(dir), ['receipt.json']);
});

test('no ffmpeg or ffprobe on the path is refused with a clear message', async () => {
  const dir = outDir('no-ffmpeg');
  const empty = join(dir, 'empty-bin');
  mkdirSync(empty);
  const res = await cli(['--in', fixtures.dark, '--out', join(dir, 'out.jpg')], { PATH: empty });
  assert.equal(res.code, 2);
  assert.match(res.stderr, /ffmpeg is not installed/);
  assert.deepEqual(files(dir), ['empty-bin']);
});

test('an ffmpeg without the drawtext filter is refused', async () => {
  const dir = outDir('no-drawtext');
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  const fake = (name, body) => {
    writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`);
    chmodSync(join(bin, name), 0o755);
  };
  fake('ffmpeg', 'case "$*" in *-filters*) echo " T.. scale            V->V       Scale the input video size." ;; *) echo "ffmpeg version fake" ;; esac');
  fake('ffprobe', 'echo "ffprobe version fake"');
  const res = await cli(['--in', fixtures.dark, '--out', join(dir, 'out.jpg')], { PATH: bin });
  assert.equal(res.code, 2);
  assert.match(res.stderr, /no drawtext filter/);
  assert.deepEqual(files(dir), ['bin']);
});

test('no font file is a loud refusal, never a silent fallback to a system default', async () => {
  const dir = outDir('no-font');
  await assert.rejects(
    stampHero({ input: fixtures.dark, output: join(dir, 'out.jpg'), fontCandidates: ['/nonexistent/Font.ttf', '/also/missing.ttf'] }),
    (error) => error instanceof Refusal && /no stamp font installed/.test(error.message) && /Font\.ttf/.test(error.message),
  );
  assert.throws(() => findFont([]), Refusal);
  assert.deepEqual(files(dir), []);
});

// ---- the happy path --------------------------------------------------------------------------------------
test('a stamped hero is a 1600 x 900 JPEG with its marker, and the receipt tells the truth', async () => {
  const dir = outDir('happy');
  const out = join(dir, 'stamped.jpg');
  const receiptFile = join(dir, 'receipt.json');
  const inputBefore = sha256(fixtures.grain);
  const inputStat = statSync(fixtures.grain);
  const res = await cli(['--in', fixtures.grain, '--out', out, '--receipt', receiptFile]);
  assert.equal(res.code, 0, res.stderr);
  assert.match(res.stdout, /stamp-hero: wrote /);
  assert.deepEqual(files(dir), ['receipt.json', 'stamped.jpg'], 'no temporary file is left behind');
  assert.deepEqual(probe(out), { codec: 'mjpeg', width: 1600, height: 900 });
  assert.equal(sha256(fixtures.grain), inputBefore, 'the original is byte for byte unchanged');
  assert.equal(statSync(fixtures.grain).mtimeMs, inputStat.mtimeMs, 'and not even touched');

  const receipt = JSON.parse(readFileSync(receiptFile, 'utf8'));
  assert.equal(receipt.text, '© https://aitamer.news');
  assert.equal(receipt.text, STAMP_TEXT);
  assert.equal(receipt.input.sha256, inputBefore);
  assert.equal(receipt.input.bytes, readFileSync(fixtures.grain).length);
  assert.equal(receipt.output.sha256, sha256(out));
  assert.equal(receipt.output.bytes, readFileSync(out).length);
  assert.match(receipt.fontFile, /DejaVuSans\.ttf$|LiberationSans-Regular\.ttf$/);
  assert.equal(receipt.fontSize, 20);
  assert.equal(receipt.inset, 24);
  assert.ok(['white', 'dark-slate'].includes(receipt.ink.name));
  assert.equal(receipt.ink.alpha, 0.85);
  assert.match(receipt.ffmpegVersion, /^ffmpeg version /);
  assert.match(receipt.createdAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
  assert.equal(findMarker(readFileSync(out)), receipt.marker);
  assert.ok(receipt.marker.startsWith(MARKER_PREFIX) && receipt.marker.includes(inputBefore));
});

test('the stamp sits bottom-right, 24 px in from both edges, and nothing else changes', async () => {
  const dir = outDir('place');
  for (const [name, source] of Object.entries(fixtures)) {
    const out = join(dir, `${name}.jpg`);
    const receiptFile = join(dir, `${name}.json`);
    const res = await cli(['--in', source, '--out', out, '--receipt', receiptFile]);
    assert.equal(res.code, 0, `${name}: ${res.stderr}`);
    const { box } = JSON.parse(readFileSync(receiptFile, 'utf8'));
    const a = pixels(source);
    const b = pixels(out);
    // Every strongly changed pixel, wherever it is: its bounding box is the text box.
    let x0 = 1600, y0 = 900, x1 = -1, y1 = -1, strongOutside = 0, sumOutside = 0, outside = 0, strongInside = 0;
    for (let y = 0; y < 900; y += 1) {
      for (let x = 0; x < 1600; x += 1) {
        const at = (y * 1600 + x) * 3;
        const d = Math.max(Math.abs(a[at] - b[at]), Math.abs(a[at + 1] - b[at + 1]), Math.abs(a[at + 2] - b[at + 2]));
        const inGuard = x >= box.guard.x && x < box.guard.x + box.guard.w && y >= box.guard.y && y < box.guard.y + box.guard.h;
        if (d >= 64) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
          if (inGuard) strongInside += 1; else strongOutside += 1;
        }
        if (!inGuard) {
          sumOutside += d;
          outside += 1;
        }
      }
    }
    assert.ok(Math.abs(JSON.parse(readFileSync(receiptFile, 'utf8')).verification.inputMaskCorrelation) < 0.3, `${name}: an unstamped picture does not follow the letters' shape`);
    assert.equal(strongOutside, 0, `${name}: no strongly changed pixel outside the guard box`);
    assert.ok(strongInside > 300, `${name}: the glyphs changed ${strongInside} pixels`);
    assert.ok(sumOutside / outside < 1.5, `${name}: outside the box the mean change is ${(sumOutside / outside).toFixed(3)} (JPEG tolerance)`);
    assert.ok(x0 >= box.text.x - 2 && x1 <= box.text.x + box.text.w + 1, `${name}: columns ${x0}-${x1}`);
    assert.ok(y0 >= box.text.y - 2 && y1 <= box.text.y + box.text.h + 1, `${name}: rows ${y0}-${y1}`);
    assert.ok(1600 - 1 - x1 >= 24, `${name}: right edge inset is ${1600 - 1 - x1} px`);
    assert.ok(900 - 1 - y1 >= 24, `${name}: bottom edge inset is ${900 - 1 - y1} px`);
    assert.ok(1600 - (box.text.x + box.text.w) >= 24 - 1 && 1600 - (box.text.x + box.text.w) <= 24 + 2, `${name}: text box ends 24 px from the right`);
    // The guard box is the text box grown to whole 16 px blocks plus one block of margin.
    assert.ok(box.guard.x <= box.text.x - 16 + 15 && box.guard.x + box.guard.w >= box.text.x + box.text.w);
    assert.equal(box.guard.x % 16, 0);
    assert.equal(box.guard.y % 16, 0);
  }
});

test('the ink follows the picture: white on dark, dark slate on light (from mean luma 128 up)', async () => {
  const dir = outDir('ink');
  const expected = {
    dark: INK_ON_DARK, black: INK_ON_DARK,
    light: INK_ON_LIGHT, white: INK_ON_LIGHT, midGrey: INK_ON_LIGHT,
  };
  for (const [name, ink] of Object.entries(expected)) {
    const receiptFile = join(dir, `${name}.json`);
    assert.equal((await cli(['--in', fixtures[name], '--out', join(dir, `${name}.jpg`), '--receipt', receiptFile])).code, 0, name);
    const receipt = JSON.parse(readFileSync(receiptFile, 'utf8'));
    assert.equal(receipt.ink.name, ink.name, `${name} (measured luma ${receipt.ink.measuredMeanLuma})`);
    assert.equal(receipt.ink.hex, ink.hex);
  }
  assert.equal(inkFor(127.9), INK_ON_DARK);
  assert.equal(inkFor(128), INK_ON_LIGHT);
  // The text really is visible against the ink it chose: a dark picture gets lighter pixels, a light one darker.
  const lightOut = join(dir, 'light.jpg');
  const a = pixels(fixtures.light);
  const b = pixels(lightOut);
  let darker = 0;
  for (let i = 0; i < a.length; i += 3) if (b[i] < a[i] - 100) darker += 1;
  assert.ok(darker > 300, `dark ink on a light picture darkened ${darker} red samples`);
});

test('the same input gives the same output bytes, run after run', async () => {
  const dir = outDir('determinism');
  const runs = [];
  for (const name of ['one', 'two', 'three']) {
    const out = join(dir, `${name}.jpg`);
    const receiptFile = join(dir, `${name}.json`);
    assert.equal((await cli(['--in', fixtures.grain, '--out', out, '--receipt', receiptFile])).code, 0);
    runs.push({ bytes: readFileSync(out), receipt: JSON.parse(readFileSync(receiptFile, 'utf8')) });
  }
  assert.ok(runs[0].bytes.equals(runs[1].bytes) && runs[1].bytes.equals(runs[2].bytes), 'identical bytes');
  assert.equal(runs[0].receipt.output.sha256, runs[2].receipt.output.sha256);
  assert.equal(runs[0].receipt.marker, runs[2].receipt.marker);
  // The same bytes through a different file name, still the same stamp.
  const copy = join(dir, 'renamed.jpg');
  copyFileSync(fixtures.grain, copy);
  assert.equal((await cli(['--in', copy, '--out', join(dir, 'renamed-out.jpg')])).code, 0);
  assert.ok(readFileSync(join(dir, 'renamed-out.jpg')).equals(runs[0].bytes));
});

test('--receipt is optional, and without it only the stamped file is written', async () => {
  const dir = outDir('no-receipt');
  assert.equal((await cli(['--in', fixtures.dark, '--out', join(dir, 'out.jpg')])).code, 0);
  assert.deepEqual(files(dir), ['out.jpg']);
});

test('a font path with a colon, a quote, a backslash and a space is escaped and still stamps', async () => {
  const dir = outDir('font-escape');
  const odd = join(dir, "we:ird 'dir\\x");
  mkdirSync(odd);
  const font = join(odd, "Dej:aVu 'Sans'.ttf");
  copyFileSync(findFont(), font);
  const out = join(dir, 'out.jpg');
  const { receipt } = await stampHero({ input: fixtures.dark, output: out, fontCandidates: [font] });
  assert.equal(receipt.fontFile, font);
  assert.equal(receipt.verification.glyphShare > 0.05, true);
  assert.equal(escapeFilterValue("a:b'c\\d"), "a\\:b\\'c\\\\d");
  const filter = drawtextFilter({ fontfile: '/f.ttf', ink: INK_ON_DARK });
  assert.equal(filter, "drawtext=fontfile='/f.ttf':text='© https\\://aitamer.news':fontsize=20:fontcolor=ffffff@0.85:x=w-tw-24:y=h-th-24");
});

test('the first font in the list that exists wins', async () => {
  const dir = outDir('font-order');
  const out = join(dir, 'out.jpg');
  const { receipt } = await stampHero({ input: fixtures.dark, output: out, fontCandidates: ['/does/not/exist.ttf', findFont(), '/never/reached.ttf'] });
  assert.equal(receipt.fontFile, findFont());
});

// ---- the marker ------------------------------------------------------------------------------------------
test('the marker goes right after the JFIF header, leaves the picture decodable, and is found again', () => {
  const dir = outDir('marker');
  const bytes = readFileSync(fixtures.dark);
  assert.equal(findMarker(bytes), null);
  const marked = injectMarker(bytes, `${MARKER_PREFIX} test`);
  assert.equal(findMarker(marked), `${MARKER_PREFIX} test`);
  assert.ok(jpegComments(marked).includes(`${MARKER_PREFIX} test`));
  assert.equal(jpegComments(marked)[0], `${MARKER_PREFIX} test`, 'ours comes first, before the encoder\'s own comment');
  assert.equal(marked[2], 0xff);
  assert.equal(marked[3], 0xe0, 'the JFIF APP0 segment stays first');
  const file = join(dir, 'marked.jpg');
  writeFileSync(file, marked);
  assert.deepEqual(probe(file), { codec: 'mjpeg', width: 1600, height: 900 });
  assert.ok(pixels(file).equals(pixels(fixtures.dark)), 'the marker changes no pixel');
  assert.ok(existsSync(file));
});

test('the marker finder ignores other comments and survives junk', () => {
  const bytes = readFileSync(fixtures.dark);
  assert.equal(findMarker(injectMarker(bytes, 'some other comment')), null);
  assert.equal(findMarker(Buffer.from([0xff, 0xd8])), null);
  assert.equal(findMarker(Buffer.from('not a jpeg')), null);
  assert.equal(findMarker(Buffer.alloc(0)), null);
});
