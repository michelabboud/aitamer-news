/** Same-origin transport with a time and byte budget covering the body, not only headers. */
export const HOME_FEED_TIMEOUT_MS = 15000;
export const HOME_FEED_MAX_BYTES = 1024 * 1024;

export async function loadHomeFeedHtml(url: string, options: {
  fetch?: typeof fetch; signal?: AbortSignal; timeoutMs?: number; maxBytes?: number;
} = {}): Promise<string> {
  const request = new AbortController();
  const maxBytes = options.maxBytes ?? HOME_FEED_MAX_BYTES;
  const timeoutMs = options.timeoutMs ?? HOME_FEED_TIMEOUT_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let rejectAbort: (reason: unknown) => void = () => {};
  const abort = () => { request.abort(options.signal?.reason); rejectAbort(new Error('Homepage request cancelled')); };
  const cancelled = new Promise<never>((_, reject) => { rejectAbort = reject; });
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) abort();
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { request.abort(); reject(new Error('Homepage request timed out')); }, timeoutMs);
  });
  const work = async () => {
    const response = await (options.fetch ?? fetch)(url, { signal: request.signal, redirect: 'error', credentials: 'same-origin', cache: 'no-cache', headers: { Accept: 'text/html' } });
    if (request.signal.aborted) throw new Error('Homepage request cancelled');
    if (!response.ok || response.redirected || (response.url && response.url !== url)) throw new Error('Unexpected homepage response URL or status');
    if (!/^text\/html(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) throw new Error('Unexpected homepage response type');
    const length = response.headers.get('content-length');
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw new Error('Homepage response too large');
    if (!response.body) throw new Error('Empty homepage response');
    reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let size = 0;
    let html = '';
    while (true) {
      const { done, value } = await reader.read();
      if (request.signal.aborted) throw new Error('Homepage request cancelled');
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Homepage response too large');
      html += decoder.decode(value, { stream: true });
    }
    return html + decoder.decode();
  };
  try { return await Promise.race([work(), timeout, cancelled]); }
  finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
    if (reader) void reader.cancel().catch(() => {});
  }
}
