/**
 * Serialize structured data for a `<script type="application/ld+json">` block.
 *
 * `JSON.stringify` leaves `<`, `>` and `&` as they are, and `set:html` writes the result raw, so a
 * title containing `</script>` would close the block and let the rest run as HTML, and `<!--` would
 * swallow the page (docs/reviews/2026-09-25-batch-bc-deep-review.md, N1). Titles and tags come from
 * bots and the posts tool, so every JSON-LD block goes through here. The escapes are JSON-valid:
 * a parser reads `<` back as `<`.
 */
export function toJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
