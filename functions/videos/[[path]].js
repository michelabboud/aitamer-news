/**
 * Captions proxy for SelfHostedVideo (src/components/SelfHostedVideo.astro).
 *
 * A caption `<track>` must come from the page's own origin unless the file host sends CORS headers,
 * and the buckets send none. A video lives in its post hero's bucket (Michel, 2026-11-01), so the
 * player asks this site for `/videos/<key>/<stem>.en.vtt` (the bot bucket, https://bots.aitamer.news)
 * or `/videos/media/<key>/<stem>.en.vtt` (the media bucket, https://media.aitamer.news), and this
 * Pages Function fetches `videos/<key>/<stem>.en.vtt` from that bucket. A video post then needs only
 * its frontmatter: the captions sit in R2 next to the video.
 *
 * Limits, on purpose:
 * - Runs only under /videos/ (public/_routes.json includes nothing else).
 * - GET and HEAD only; any other method gets 405.
 * - Only paths matching CAPTION_PATH; anything else under /videos/ gets 404, so it never becomes
 *   a general proxy for the bucket.
 * - The upstream host is fixed per path shape: one of the two buckets, never a host taken from the
 *   request. The two shapes have a different number of segments, so no path matches both.
 *   Nothing from the reader's request (headers, cookies, query) is sent
 *   upstream, and nothing from the upstream response except the body is passed back.
 * - Only an upstream 200 is served, as text/vtt, and only if it is at most MAX_BYTES.
 */
export const UPSTREAM = 'https://bots.aitamer.news';
export const MEDIA_UPSTREAM = 'https://media.aitamer.news';
export const CAPTION_PATH = /^\/videos\/[a-z0-9-]{1,120}\/[a-z0-9-]{1,140}\.en\.vtt$/;
export const MEDIA_CAPTION_PATH = /^\/videos\/media(\/[a-z0-9-]{1,120}\/[a-z0-9-]{1,140}\.en\.vtt)$/;

/** The bucket URL for a caption path, or null for any other path. */
export function captionSource(pathname) {
  const media = MEDIA_CAPTION_PATH.exec(pathname);
  if (media) return `${MEDIA_UPSTREAM}/videos${media[1]}`;
  return CAPTION_PATH.test(pathname) ? UPSTREAM + pathname : null;
}
export const MAX_BYTES = 1024 * 1024;

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  // A caption file is never a document; if one is ever opened directly it can do nothing.
  'Content-Security-Policy': "default-src 'none'; sandbox",
};

function plain(status, text, extra = {}) {
  return new Response(text, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...SECURITY_HEADERS, ...extra },
  });
}

/** Reads at most `limit` bytes; returns null if the body is larger. */
async function readCapped(body, limit) {
  if (!body) return new Uint8Array(0);
  const reader = body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * @param {Request} request
 * @param {typeof fetch} fetchImpl the fetch to reach the bucket with (tests pass a fake)
 */
export async function handleCaptions(request, fetchImpl = fetch) {
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD') return plain(405, 'Method Not Allowed\n', { Allow: 'GET, HEAD' });
  const { pathname } = new URL(request.url);
  const source = captionSource(pathname);
  if (!source) return plain(404, 'Not Found\n');

  let upstream;
  try {
    upstream = await fetchImpl(source, {
      method: 'GET',
      redirect: 'manual',
      cf: { cacheEverything: true, cacheTtl: 3600 },
    });
  } catch {
    return plain(502, 'Bad Gateway\n');
  }
  if (upstream.status !== 200) {
    await upstream.body?.cancel();
    return plain(404, 'Not Found\n');
  }
  const declared = Number(upstream.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    await upstream.body?.cancel();
    return plain(404, 'Not Found\n');
  }
  const bytes = await readCapped(upstream.body, MAX_BYTES);
  if (bytes === null) return plain(404, 'Not Found\n');

  return new Response(method === 'HEAD' ? null : bytes, {
    status: 200,
    headers: {
      'Content-Type': 'text/vtt; charset=utf-8',
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'public, max-age=3600',
      ...SECURITY_HEADERS,
    },
  });
}

/** Pages Functions entry point: every request under /videos/. */
export const onRequest = ({ request }) => handleCaptions(request);
