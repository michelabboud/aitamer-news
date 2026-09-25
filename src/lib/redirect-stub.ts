/**
 * A tiny static page that sends readers from a retired URL to its new home.
 *
 * Why not Astro's `redirects` config: its static template writes the target without the
 * deploy base and builds the canonical from `site`, which was wrong for the base-path build.
 * This page takes both URLs ready-made from the caller (withBase / canonicalUrlFor).
 * Cloudflare also answers these paths with a real 301 from `public/_redirects`; this page is
 * the fallback for any host that serves the files as they are.
 */
export interface RedirectStub {
  /** Where the browser goes: a site path including the deploy base, e.g. `/section/opinion/`. */
  to: string;
  /** Absolute canonical URL of the destination. */
  canonical: string;
  /** Human label of the destination, for the visible link. */
  label: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function redirectStubHtml({ to, canonical, label }: RedirectStub): string {
  const href = escapeHtml(to);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Moved to ${escapeHtml(label)} · AI Tamer</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta http-equiv="refresh" content="0;url=${href}">
</head>
<body>
<p>This section moved. Go to <a href="${href}">${escapeHtml(label)}</a>.</p>
</body>
</html>
`;
}
