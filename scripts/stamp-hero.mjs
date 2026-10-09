#!/usr/bin/env node
/**
 * Burn the site address into the pixels of a new hero image, as the LAST step before upload.
 *
 *   node scripts/stamp-hero.mjs --in <original.jpg> --out <stamped.jpg> [--receipt <receipt.json>]
 *
 * Exit 0 stamped; 2 refused (nothing written); 1 an unexpected failure (nothing written, except that a
 * receipt that cannot be written rolls the new stamped file back).
 *
 * Where it fits (the one ordered procedure for writers is docs/guides/hero-procedure.md): every hero carries
 * exactly ONE site mark, `© https://aitamer.news`. Path A: the image model draws it in the same generation (Codex
 * imagegen), and this tool is never run on that file. Path B: the model draws NO lettering and this tool burns the
 * mark in as the last step (the Grok bots, Claude, Cursor, and the fallback for path A). Shared rules this tool
 * serves: never stamp an image that already carries a mark (so it refuses one, including a model-drawn mark of
 * any size, place or colour); the final file is exactly 1600 x 900; the raw original is kept with its SHA-256
 * (the receipt records it); the stamped file is uploaded under a NEW content-hashed key; a live hero is never
 * re-stamped.
 *
 * What it does. It runs the system `ffmpeg` (drawtext) and `ffprobe` through `execFile`, never through a
 * shell: 20 px DejaVu Sans (Liberation Sans if DejaVu is missing; no font, no stamp), inset 24 px from the
 * right and bottom edges of the 1600 x 900 frame. The ink follows the picture under the stamp: the mean luma of
 * that area (ffmpeg `crop` + `signalstats`, YAVG) decides white ink at 0.85 alpha on a dark area, dark slate at
 * 0.85 on a light one. Everything is deterministic: the same input gives the same output bytes (bit-exact
 * encoder flags, no timestamps in the image; the time is only in the receipt).
 *
 * Refused, exit 2, nothing written: `--out` exists (or equals `--in`); `--receipt` exists; the input is not a
 * JPEG of exactly 1600 x 900; the input already carries the mark; ffmpeg/ffprobe is missing or ffmpeg has no
 * `drawtext`; no font file is installed.
 *
 * How an existing mark is detected (three independent lines; any one refuses):
 *   a. The marker. Every stamped file gets a JPEG comment segment (COM) right after its JFIF header:
 *      `aitamer-hero-stamp v1 ...` with the text and the SHA-256 of the original. It is lossless and
 *      deterministic, and survives a copy. It does NOT survive a re-encode that drops metadata.
 *   b. The exact box. The tool draws the stamp in white on black to get the glyph mask, then measures the
 *      Pearson correlation between that mask and the input's luma in the stamp box (at or above 0.5 the
 *      input is refused). That catches this tool's own mark, whatever ink and however often re-encoded.
 *   c. The corner search. Image models drew the mark themselves under the old guide, in any place, size and
 *      ink. So the right 700 x bottom 140 pixels are searched for a line of text: boxes of 14-26 px height
 *      and about the width of the site words (0.9-1.2 of the DejaVu width), every 2 px. A box is a
 *      candidate when its horizontal-edge energy (|dx| of the luma) stands well above the ring around it
 *      (contrast >= RING_MIN), and it counts as text when its edge energy is spread over most of its columns
 *      (>= COLUMN_ACTIVITY_MIN of them active, which a dot grid, a window row or a paper edge are not) without
 *      being periodic (autocorrelation at lags 6-40 <= PERIODICITY_MAX, which a dot grid or a bar row is).
 *      The thresholds come from real art: see docs/reports/2026-10-09-stamp-detection-calibration.md.
 *   The search cannot read the words, so any line of lettering in that corner refuses the input.
 *   None of these is a lock: a different mark in another corner, or a mark too faint to stand out, is not
 *   recognised. The tool wants a CLEAN original (no lettering drawn by the image model); when it refuses,
 *   regenerate the art without lettering, never work around the refusal.
 *
 * Verified before anything is published to `--out`: the result is a 1600 x 900 JPEG, every pixel outside
 * the stamp box (the text box grown to whole 16 px JPEG blocks plus one block of margin) is within JPEG
 * re-encoding tolerance of the input, and the box itself did change. The input file is only ever read.
 *
 * Needs ffmpeg 6.x with libfreetype (drawtext) and DejaVu Sans or Liberation Sans. Measured on ffmpeg
 * 6.1.1, Ubuntu 24.04 (`sudo apt-get install ffmpeg fonts-dejavu-core`).
 */
import { execFile } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { constants, existsSync } from 'node:fs';
import { copyFile, link, lstat, mkdtemp, readFile, realpath, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** The exact words burnt into the image. */
export const STAMP_TEXT = '© https://aitamer.news';
/** The only size a hero may have (docs/guides/hero-procedure.md, POST.md §3). */
export const WIDTH = 1600;
export const HEIGHT = 900;
/** Distance of the text from the right and bottom edges, in pixels at 1600 x 900. */
export const INSET = 24;
export const FONT_SIZE = 20;
/** First existing file wins. DejaVu is the house choice, Liberation the fallback; no other font is tried. */
export const FONT_CANDIDATES = Object.freeze([
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
  '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
]);
/** Mean luma (0-255) of the stamp area below which the area counts as dark. */
export const DARK_LUMA_BELOW = 128;
export const INK_ON_DARK = Object.freeze({ name: 'white', hex: 'ffffff', alpha: 0.85 });
export const INK_ON_LIGHT = Object.freeze({ name: 'dark-slate', hex: '1e293b', alpha: 0.85 });
/** JPEG block edge used to grow the stamp box (16 covers 4:2:0 chroma blocks), and the extra margin in blocks. */
export const BLOCK = 16;
export const GUARD_MARGIN_BLOCKS = 1;
/** Pixels outside the stamp box must match the input this well after the re-encode (q:v 2). */
export const OUTSIDE_MEAN_ABS_MAX = 2.5;
export const OUTSIDE_STRONG_DIFF = 48;
export const OUTSIDE_STRONG_SHARE_MAX = 0.002;
/** A channel difference at or above this inside the text box counts as "the glyphs changed this pixel". */
export const GLYPH_DIFF = 64;
/** Share of the text box a fresh stamp must change, or the stamp is not visible and the run fails. */
export const GLYPH_SHARE_MIN = 0.02;
/** |correlation| between the glyph mask and the input's luma in the stamp box at which the input is taken to be stamped already. */
export const ALREADY_STAMPED_CORRELATION = 0.5;
/** The corner searched for a mark the image model drew itself: the right 700 x bottom 140 pixels. */
export const SEARCH = Object.freeze({ x: WIDTH - 700, y: HEIGHT - 140, w: 700, h: 140 });
/** Box heights (px) and width factors (against the site words' width in the stamp font) tried by the search. */
export const SEARCH_HEIGHTS = Object.freeze([14, 16, 18, 20, 22, 24, 26]);
export const SEARCH_WIDTH_FACTORS = Object.freeze([0.9, 1.0, 1.1, 1.2]);
/** Search step in pixels. */
export const SEARCH_STEP = 2;
/** The ring around a candidate box is this share of the box height wide. */
export const RING_WIDTH = 0.6;
/** Added to the ring's mean edge energy so a perfectly flat ring cannot make any speck a mark. */
export const RING_FLOOR = 3;
/** A candidate's edge energy over its ring must stand this far above the ring (contrast = (in - ring) / (ring + floor)). */
export const RING_MIN = 1.5;
/** Share of a candidate's columns that must carry edge energy (above half the box mean) to count as text. */
export const COLUMN_ACTIVITY_MIN = 0.6;
/** Highest autocorrelation of the column energy at lags 6-40 for text; dots, bars and windows repeat more than that. */
export const PERIODICITY_MAX = 0.4;
/** Candidates examined per image, strongest first. */
const MAX_CANDIDATES = 40;
/** Prefix of the JPEG comment segment that marks a stamped file. */
export const MARKER_PREFIX = 'aitamer-hero-stamp v1';
const SAMPLING_FORMATS = new Set(['yuvj420p', 'yuvj422p', 'yuvj444p']);
const MAX_RAW = WIDTH * HEIGHT * 3 + 1024;

/** A refusal: the input or the machine is not fit, nothing was written, exit code 2. */
export class Refusal extends Error {}

/**
 * Run a program without a shell.
 * @param {string} file @param {string[]} args @param {{ binary?: boolean }} [options]
 * @returns {Promise<{ stdout: string | Buffer, stderr: string }>}
 */
async function run(file, args, { binary = false } = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(file, args, {
      encoding: binary ? 'buffer' : 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
    });
    return { stdout, stderr: String(stderr) };
  } catch (error) {
    if (error.code === 'ENOENT') throw new Refusal(`${file} is not installed or not on PATH (install ffmpeg with libfreetype and ffprobe).`);
    const tail = String(error.stderr ?? '').trim().split('\n').slice(-4).join(' | ');
    throw new Error(`${file} failed (${error.code ?? error.signal ?? 'error'}): ${tail || error.message}`);
  }
}

/** Escape one value for an ffmpeg filter option: backslash, quote and colon each get a backslash. */
export function escapeFilterValue(value) {
  return String(value).replace(/[\\':]/g, (ch) => `\\${ch}`);
}

/** The drawtext filter for one ink; the text and the font file are escaped, nothing else is variable. */
export function drawtextFilter({ fontfile, ink, text = STAMP_TEXT }) {
  // Option level: \ ' : escaped. Filtergraph level: the quotes keep , ; [ ] literal; a quote inside is closed, escaped, reopened.
  const quoted = (value) => `'${escapeFilterValue(value).replace(/'/g, "'\\''")}'`;
  const options = [
    `fontfile=${quoted(fontfile)}`,
    `text=${quoted(text)}`,
    `fontsize=${FONT_SIZE}`,
    `fontcolor=${ink.hex}@${ink.alpha}`,
    `x=w-tw-${INSET}`,
    `y=h-th-${INSET}`,
  ];
  return `drawtext=${options.join(':')}`;
}

/** @param {readonly string[]} [candidates] @returns {string} the first font file that exists */
export function findFont(candidates = FONT_CANDIDATES) {
  const found = candidates.find((file) => existsSync(file));
  if (!found) throw new Refusal(`no stamp font installed; looked for ${candidates.join(', ')} (install fonts-dejavu-core).`);
  return found;
}

/** @returns {Promise<string>} the first line of `ffmpeg -version`, after proving ffmpeg, ffprobe and drawtext exist */
export async function checkTools() {
  const version = String((await run('ffmpeg', ['-hide_banner', '-version'])).stdout).split('\n')[0].trim();
  await run('ffprobe', ['-hide_banner', '-version']);
  const filters = String((await run('ffmpeg', ['-hide_banner', '-filters'])).stdout);
  if (!/^\s*\S+\s+drawtext\s/m.test(filters)) {
    throw new Refusal('this ffmpeg has no drawtext filter (it was built without libfreetype); install a build that has it.');
  }
  return version;
}

/** @param {Buffer} bytes @returns {string} */
export const sha256Hex = (bytes) => createHash('sha256').update(bytes).digest('hex');

/**
 * Prove a file is a JPEG of exactly 1600 x 900 and report its pixel format.
 * @param {string} file @param {Buffer} bytes the file's bytes @returns {Promise<{ pixFmt: string }>}
 */
export async function probeJpeg(file, bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new Refusal(`${file} is not a JPEG (it does not start with the JPEG signature).`);
  }
  let probe;
  try {
    const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height,pix_fmt', '-of', 'json', file]);
    probe = JSON.parse(String(stdout)).streams?.[0];
  } catch (error) {
    if (error instanceof Refusal) throw error;
    throw new Refusal(`${file} cannot be read as an image: ${error.message}`);
  }
  if (!probe || probe.codec_name !== 'mjpeg') throw new Refusal(`${file} is not a JPEG (codec ${probe?.codec_name ?? 'unknown'}).`);
  if (probe.width !== WIDTH || probe.height !== HEIGHT) {
    throw new Refusal(`${file} is ${probe.width} x ${probe.height}; a hero is exactly ${WIDTH} x ${HEIGHT}.`);
  }
  return { pixFmt: SAMPLING_FORMATS.has(probe.pix_fmt) ? probe.pix_fmt : 'yuvj420p' };
}

/**
 * The marker segments of a JPEG: the text of every COM segment before the image data.
 * @param {Buffer} bytes @returns {string[]}
 */
export function jpegComments(bytes) {
  const comments = [];
  let at = 2;
  while (at + 4 <= bytes.length && bytes[at] === 0xff) {
    const marker = bytes[at + 1];
    if (marker === 0xda || marker === 0xd9) break; // start of scan / end of image
    if (marker === 0xff) { at += 1; continue; } // fill byte
    const length = bytes.readUInt16BE(at + 2);
    if (length < 2) break;
    if (marker === 0xfe) comments.push(bytes.subarray(at + 4, at + 2 + length).toString('utf8'));
    at += 2 + length;
  }
  return comments;
}

/** @param {Buffer} bytes @returns {string | null} the stamp marker text, if the file carries it */
export function findMarker(bytes) {
  return jpegComments(bytes).find((comment) => comment.startsWith(MARKER_PREFIX)) ?? null;
}

/**
 * Put the marker right after the leading APPn segments (the JFIF header stays first, as the format wants).
 * @param {Buffer} bytes @param {string} text @returns {Buffer}
 */
export function injectMarker(bytes, text) {
  const payload = Buffer.from(text, 'utf8');
  if (payload.length + 2 > 0xffff) throw new Error('stamp marker is too long for one JPEG comment segment');
  let at = 2;
  while (at + 4 <= bytes.length && bytes[at] === 0xff && bytes[at + 1] >= 0xe0 && bytes[at + 1] <= 0xef) {
    at += 2 + bytes.readUInt16BE(at + 2);
  }
  const segment = Buffer.alloc(4);
  segment[0] = 0xff;
  segment[1] = 0xfe;
  segment.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([bytes.subarray(0, at), segment, payload, bytes.subarray(at)]);
}

/** Decode a 1600 x 900 image to raw rgb24. @param {string} file @returns {Promise<Buffer>} */
async function decodeRgb(file) {
  const { stdout } = await run('ffmpeg', ['-v', 'error', '-nostdin', '-i', file, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { binary: true });
  if (stdout.length !== WIDTH * HEIGHT * 3) throw new Error(`decoding ${file} gave ${stdout.length} bytes, expected ${WIDTH * HEIGHT * 3}`);
  return stdout;
}

/**
 * Where the stamp lands, measured by drawing it in white on black with the same filter: the text box,
 * the glyph mask inside it, and the guard box (the text box grown to whole blocks plus a margin) outside
 * which nothing may change.
 * @param {string} fontfile
 */
export async function measureBox(fontfile) {
  const filter = drawtextFilter({ fontfile, ink: { name: 'white', hex: 'ffffff', alpha: 1 } });
  const { stdout } = await run('ffmpeg', ['-v', 'error', '-nostdin', '-f', 'lavfi', '-i', `color=c=black:s=${WIDTH}x${HEIGHT}:d=1`, '-vf', `${filter},format=gray`, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { binary: true });
  if (stdout.length !== WIDTH * HEIGHT) throw new Error(`measuring the stamp box gave ${stdout.length} bytes`);
  let x0 = WIDTH, y0 = HEIGHT, x1 = -1, y1 = -1;
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (stdout[y * WIDTH + x] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error('the stamp drew no pixels; the font or the filter is broken');
  const text = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  const mask = new Uint8Array(text.w * text.h);
  for (let y = 0; y < text.h; y += 1) {
    for (let x = 0; x < text.w; x += 1) mask[y * text.w + x] = stdout[(text.y + y) * WIDTH + text.x + x];
  }
  const margin = GUARD_MARGIN_BLOCKS * BLOCK;
  const gx0 = Math.max(0, Math.floor(text.x / BLOCK) * BLOCK - margin);
  const gy0 = Math.max(0, Math.floor(text.y / BLOCK) * BLOCK - margin);
  const gx1 = Math.min(WIDTH, Math.ceil((text.x + text.w) / BLOCK) * BLOCK + margin);
  const gy1 = Math.min(HEIGHT, Math.ceil((text.y + text.h) / BLOCK) * BLOCK + margin);
  return { text, guard: { x: gx0, y: gy0, w: gx1 - gx0, h: gy1 - gy0 }, mask };
}

/** Mean luma (0-255) of a box of an image, by ffmpeg's own signalstats. */
export async function meanLuma(file, box) {
  const { stdout } = await run('ffmpeg', ['-v', 'error', '-nostdin', '-i', file, '-vf', `crop=${box.w}:${box.h}:${box.x}:${box.y},signalstats,metadata=mode=print:file=-`, '-frames:v', '1', '-f', 'null', '-']);
  const match = /lavfi\.signalstats\.YAVG=([0-9.]+)/.exec(String(stdout));
  if (!match) throw new Error('could not read the luma of the stamp area');
  return Number(match[1]);
}

/** Dark under the stamp means white ink; light means dark slate. */
export const inkFor = (luma) => (luma < DARK_LUMA_BELOW ? INK_ON_DARK : INK_ON_LIGHT);

/** Draw the stamp: one frame, bit-exact encoder, JPEG quality 2, the input's chroma layout, no input metadata. */
async function render(input, output, filter, pixFmt) {
  await run('ffmpeg', [
    '-v', 'error', '-nostdin', '-y', '-i', input, '-vf', filter, '-frames:v', '1',
    '-c:v', 'mjpeg', '-q:v', '2', '-pix_fmt', pixFmt, '-map_metadata', '-1',
    '-fflags', '+bitexact', '-flags:v', '+bitexact', '-f', 'image2', '-update', '1', output,
  ]);
}

/**
 * Pearson correlation between the glyph mask and the luma of an rgb24 frame over the text box; 0 for a flat box.
 * @param {Buffer} rgb @param {{ x: number, y: number, w: number, h: number }} box @param {Uint8Array} mask
 */
export function maskCorrelation(rgb, box, mask) {
  const n = box.w * box.h;
  const luma = new Float64Array(n);
  for (let y = 0; y < box.h; y += 1) {
    for (let x = 0; x < box.w; x += 1) {
      const at = ((box.y + y) * WIDTH + box.x + x) * 3;
      luma[y * box.w + x] = 0.299 * rgb[at] + 0.587 * rgb[at + 1] + 0.114 * rgb[at + 2];
    }
  }
  let meanL = 0, meanM = 0;
  for (let i = 0; i < n; i += 1) { meanL += luma[i]; meanM += mask[i]; }
  meanL /= n;
  meanM /= n;
  let cov = 0, varL = 0, varM = 0;
  for (let i = 0; i < n; i += 1) {
    const l = luma[i] - meanL, m = mask[i] - meanM;
    cov += l * m;
    varL += l * l;
    varM += m * m;
  }
  return varL < 1e-9 || varM < 1e-9 ? 0 : cov / Math.sqrt(varL * varM);
}

/**
 * Look for lettering that looks like the site words anywhere in the bottom-right corner, at any ink and a
 * range of sizes. Deterministic. See the header for the method and docs/reports for the thresholds.
 * @param {Buffer} rgb 1600 x 900 rgb24 @param {number} aspect width / height of the site words in the stamp font
 * @returns {{ found: boolean, hit: null | { x: number, y: number, w: number, h: number, contrast: number, columnActivity: number, periodicity: number }, topContrast: number }}
 */
export function searchForMark(rgb, aspect) {
  const { w: RW, h: RH } = SEARCH;
  const luma = new Float32Array(RW * RH);
  for (let y = 0; y < RH; y += 1) {
    for (let x = 0; x < RW; x += 1) {
      const at = ((SEARCH.y + y) * WIDTH + SEARCH.x + x) * 3;
      luma[y * RW + x] = (299 * rgb[at] + 587 * rgb[at + 1] + 114 * rgb[at + 2]) / 1000;
    }
  }
  const edge = new Float32Array(RW * RH);
  for (let y = 0; y < RH; y += 1) {
    for (let x = 1; x < RW - 1; x += 1) edge[y * RW + x] = Math.abs(luma[y * RW + x + 1] - luma[y * RW + x - 1]);
  }
  const stride = RW + 1;
  const integral = new Float64Array(stride * (RH + 1));
  for (let y = 0; y < RH; y += 1) {
    let row = 0;
    for (let x = 0; x < RW; x += 1) {
      row += edge[y * RW + x];
      integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + row;
    }
  }
  const area = (x, y, w, h) => {
    const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(RW, x + w), y1 = Math.min(RH, y + h);
    if (x1 <= x0 || y1 <= y0) return [0, 0];
    return [integral[y1 * stride + x1] - integral[y0 * stride + x1] - integral[y1 * stride + x0] + integral[y0 * stride + x0], (x1 - x0) * (y1 - y0)];
  };

  const candidates = [];
  for (const h of SEARCH_HEIGHTS) {
    for (const factor of SEARCH_WIDTH_FACTORS) {
      const w = Math.round(h * aspect * factor);
      const ring = Math.round(h * RING_WIDTH);
      for (let y = 0; y + h <= RH; y += SEARCH_STEP) {
        for (let x = 0; x + w <= RW; x += SEARCH_STEP) {
          const [inside, insideN] = area(x, y, w, h);
          const [outer, outerN] = area(x - ring, y - ring, w + 2 * ring, h + 2 * ring);
          if (outerN - insideN < 0.5 * ((w + 2 * ring) * (h + 2 * ring) - w * h)) continue; // mostly outside the corner
          const contrast = (inside / insideN - (outer - inside) / (outerN - insideN)) / ((outer - inside) / (outerN - insideN) + RING_FLOOR);
          if (contrast >= RING_MIN) candidates.push({ x, y, w, h, contrast });
        }
      }
    }
  }
  candidates.sort((a, b) => b.contrast - a.contrast || a.y - b.y || a.x - b.x);
  const topContrast = candidates.length ? candidates[0].contrast : 0;

  const examined = [];
  for (const c of candidates) {
    if (examined.length >= MAX_CANDIDATES) break;
    if (examined.some((e) => Math.abs(e.x + e.w / 2 - c.x - c.w / 2) < c.w / 2 && Math.abs(e.y + e.h / 2 - c.y - c.h / 2) < c.h)) continue;
    examined.push(c);
    const columns = new Float64Array(c.w);
    for (let x = 0; x < c.w; x += 1) {
      let sum = 0;
      for (let y = 0; y < c.h; y += 1) sum += edge[(c.y + y) * RW + c.x + x];
      columns[x] = sum;
    }
    let mean = 0;
    for (const v of columns) mean += v;
    mean /= c.w;
    let active = 0;
    for (const v of columns) if (v > 0.5 * mean) active += 1;
    const columnActivity = active / c.w;
    let energy = 0;
    for (const v of columns) energy += (v - mean) ** 2;
    let periodicity = 0;
    for (let lag = 6; lag <= 40 && lag < c.w; lag += 1) {
      let sum = 0;
      for (let i = 0; i + lag < c.w; i += 1) sum += (columns[i] - mean) * (columns[i + lag] - mean);
      periodicity = Math.max(periodicity, energy > 0 ? sum / energy : 0);
    }
    if (columnActivity >= COLUMN_ACTIVITY_MIN && periodicity <= PERIODICITY_MAX) {
      return { found: true, hit: { ...c, columnActivity, periodicity }, topContrast };
    }
  }
  return { found: false, hit: null, topContrast };
}

/** How much of `box` differs strongly between two rgb24 frames, and the mean difference outside `outer`. */
function compare(a, b, { box, outer }) {
  let strongInBox = 0;
  for (let y = box.y; y < box.y + box.h; y += 1) {
    for (let x = box.x; x < box.x + box.w; x += 1) {
      const at = (y * WIDTH + x) * 3;
      if (Math.max(Math.abs(a[at] - b[at]), Math.abs(a[at + 1] - b[at + 1]), Math.abs(a[at + 2] - b[at + 2])) >= GLYPH_DIFF) strongInBox += 1;
    }
  }
  let sum = 0, strong = 0, count = 0;
  for (let y = 0; y < HEIGHT; y += 1) {
    const insideRow = y >= outer.y && y < outer.y + outer.h;
    for (let x = 0; x < WIDTH; x += 1) {
      if (insideRow && x >= outer.x && x < outer.x + outer.w) continue;
      const at = (y * WIDTH + x) * 3;
      const d = Math.max(Math.abs(a[at] - b[at]), Math.abs(a[at + 1] - b[at + 1]), Math.abs(a[at + 2] - b[at + 2]));
      sum += Math.abs(a[at] - b[at]) + Math.abs(a[at + 1] - b[at + 1]) + Math.abs(a[at + 2] - b[at + 2]);
      if (d >= OUTSIDE_STRONG_DIFF) strong += 1;
      count += 1;
    }
  }
  return {
    glyphShare: strongInBox / (box.w * box.h),
    outsideMeanAbs: sum / (count * 3),
    outsideStrongShare: strong / count,
  };
}

/** Does `path` exist as anything at all, a dangling symlink included? */
async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

/** The real location of a path whose last part may not exist yet. */
async function realTarget(path) {
  const full = resolve(path);
  try {
    return await realpath(full);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return join(await realpath(dirname(full)), basename(full));
  }
}

/**
 * Stamp one image. Throws `Refusal` for every case the tool will not touch.
 * @param {{ input: string, output: string, receipt?: string | undefined, fontCandidates?: readonly string[] }} options
 * @returns {Promise<{ receipt: object, output: string }>}
 */
export async function stampHero({ input, output, receipt, fontCandidates = FONT_CANDIDATES }) {
  if (!input || !output) throw new Refusal('both --in and --out are required.');
  const inputStat = await stat(input).catch((error) => {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') throw new Refusal(`input ${input} does not exist.`);
    throw error;
  });
  if (!inputStat.isFile()) throw new Refusal(`input ${input} is not a regular file.`);
  const [realIn, realOut] = [await realTarget(input), await realTarget(output).catch(() => null)];
  if (realOut === null) throw new Refusal(`the folder for ${output} does not exist.`);
  if (realIn === realOut) throw new Refusal('--in and --out are the same file; the original is never overwritten.');
  if (await exists(output)) throw new Refusal(`${output} already exists; this tool never overwrites. Choose a new name.`);
  if (receipt !== undefined) {
    if (await exists(receipt)) throw new Refusal(`receipt ${receipt} already exists; a receipt is never overwritten.`);
    const realReceipt = await realTarget(receipt).catch(() => null);
    if (realReceipt === null) throw new Refusal(`the folder for the receipt ${receipt} does not exist.`);
    if (realReceipt === realIn || realReceipt === realOut) throw new Refusal('--receipt must be a different file from --in and --out.');
  }

  const ffmpegVersion = await checkTools();
  const fontfile = findFont(fontCandidates);
  const original = await readFile(input);
  const { pixFmt } = await probeJpeg(input, original);
  const marker = findMarker(original);
  if (marker !== null) {
    throw new Refusal(`${input} already carries the site mark (${marker}); a stamped hero is never stamped again.`);
  }

  const work = await mkdtemp(join(tmpdir(), 'stamp-hero-'));
  try {
    const { mask, ...box } = await measureBox(fontfile);
    const before = await decodeRgb(input);
    const correlation = maskCorrelation(before, box.text, mask);
    if (Math.abs(correlation) >= ALREADY_STAMPED_CORRELATION) {
      throw new Refusal(`${input} already shows the site mark: the stamp box follows the letters' shape (correlation ${correlation.toFixed(2)}, limit ${ALREADY_STAMPED_CORRELATION}). A stamped hero is never stamped again.`);
    }
    const search = searchForMark(before, box.text.w / box.text.h);
    if (search.found) {
      const { hit } = search;
      throw new Refusal(`${input} already shows lettering near the bottom-right corner, taken to be a site mark (a text-like band at x ${SEARCH.x + hit.x}, y ${SEARCH.y + hit.y}, ${hit.w} x ${hit.h} px; edge contrast ${hit.contrast.toFixed(2)}, limit ${RING_MIN}). A stamped hero is never stamped again, and the tool needs a CLEAN original: regenerate the art with no lettering at all, then stamp that.`);
    }
    const luma = await meanLuma(input, box.text);
    const ink = inkFor(luma);
    const filter = drawtextFilter({ fontfile, ink });
    const rendered = join(work, 'stamped.jpg');
    await render(input, rendered, filter, pixFmt);

    const inputSha = sha256Hex(original);
    const markerText = `${MARKER_PREFIX} text=${STAMP_TEXT} input-sha256=${inputSha}`;
    const stamped = injectMarker(await readFile(rendered), markerText);
    const final = join(work, 'final.jpg');
    await writeFile(final, stamped);

    // Verify the exact bytes that will be published.
    await probeJpeg(final, stamped);
    if (findMarker(stamped) !== markerText) throw new Error('the marker did not survive being written');
    const verdict = compare(before, await decodeRgb(final), { box: box.text, outer: box.guard });
    if (verdict.glyphShare < GLYPH_SHARE_MIN) throw new Error(`verification: the stamp box changed only ${(verdict.glyphShare * 100).toFixed(2)}%; the stamp is not visible`);
    if (verdict.outsideMeanAbs > OUTSIDE_MEAN_ABS_MAX || verdict.outsideStrongShare > OUTSIDE_STRONG_SHARE_MAX) {
      throw new Error(`verification: pixels outside the stamp box moved (mean ${verdict.outsideMeanAbs.toFixed(2)}, ${(verdict.outsideStrongShare * 100).toFixed(3)}% beyond ${OUTSIDE_STRONG_DIFF}); the re-encode is not within tolerance`);
    }

    await publish(final, output);
    const outBytes = await readFile(output);
    const receiptBody = {
      tool: 'scripts/stamp-hero.mjs',
      text: STAMP_TEXT,
      input: { path: resolve(input), sha256: inputSha, bytes: original.length },
      output: { path: resolve(output), sha256: sha256Hex(outBytes), bytes: outBytes.length },
      fontFile: fontfile,
      fontSize: FONT_SIZE,
      inset: INSET,
      ink: { ...ink, measuredMeanLuma: luma, darkBelow: DARK_LUMA_BELOW },
      box,
      verification: {
        glyphShare: Number(verdict.glyphShare.toFixed(4)),
        outsideMeanAbs: Number(verdict.outsideMeanAbs.toFixed(4)),
        outsideStrongShare: Number(verdict.outsideStrongShare.toFixed(6)),
        inputMaskCorrelation: Number(correlation.toFixed(4)),
        inputCornerTopContrast: Number(search.topContrast.toFixed(3)),
      },
      marker: markerText,
      ffmpegVersion,
      createdAt: new Date().toISOString(),
    };
    if (receipt !== undefined) {
      try {
        await writeFile(receipt, `${JSON.stringify(receiptBody, null, 2)}\n`, { flag: 'wx' });
      } catch (error) {
        await unlink(output); // the stamped file was created by this run and has no receipt: take it back
        throw new Error(`could not write the receipt ${receipt} (${error.message}); the stamped file was removed again`);
      }
    }
    return { receipt: receiptBody, output };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

/** Put the finished file at `output` without ever replacing something that appeared meanwhile. */
async function publish(source, output) {
  const part = `${output}.part-${randomBytes(4).toString('hex')}`;
  await copyFile(source, part, constants.COPYFILE_EXCL);
  try {
    await link(part, output); // fails with EEXIST if the name was taken in the meantime
  } catch (error) {
    if (error.code === 'EEXIST') throw new Refusal(`${output} appeared while stamping; this tool never overwrites.`);
    if (error.code !== 'EPERM' && error.code !== 'ENOTSUP' && error.code !== 'EXDEV') throw error;
    if (await exists(output)) throw new Refusal(`${output} appeared while stamping; this tool never overwrites.`);
    await rename(part, output); // a filesystem without hard links
    return;
  } finally {
    await rm(part, { force: true });
  }
}

const USAGE = 'usage: node scripts/stamp-hero.mjs --in <original.jpg> --out <stamped.jpg> [--receipt <receipt.json>]';

/** @param {string[]} argv @returns {Promise<number>} the exit code */
export async function main(argv = process.argv.slice(2)) {
  let values;
  try {
    ({ values } = parseArgs({ args: argv, options: { in: { type: 'string' }, out: { type: 'string' }, receipt: { type: 'string' }, help: { type: 'boolean', short: 'h' } }, strict: true, allowPositionals: false }));
  } catch (error) {
    console.error(`stamp-hero: ${error.message}\n${USAGE}`);
    return 2;
  }
  if (values.help) {
    console.log(USAGE);
    return 0;
  }
  try {
    const { receipt, output } = await stampHero({ input: values.in, output: values.out, receipt: values.receipt });
    console.log(`stamp-hero: wrote ${output} (${receipt.output.bytes} bytes, sha256 ${receipt.output.sha256}); ink ${receipt.ink.name} at luma ${receipt.ink.measuredMeanLuma}; original sha256 ${receipt.input.sha256}`);
    if (values.receipt) console.log(`stamp-hero: receipt ${values.receipt}`);
    return 0;
  } catch (error) {
    if (error instanceof Refusal) {
      console.error(`stamp-hero: refused: ${error.message}`);
      return 2;
    }
    console.error(`stamp-hero: failed: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = await main();
}
