// UTM link builder for lesson kits. Kept as one small module so the site's own helper
// can replace it: anything exporting `withUtm(url, params)` with the same shape will do.

/**
 * Add UTM parameters to a site URL.
 * @param {string} url Absolute URL on aitamer.news.
 * @param {{source?: string, medium?: string, campaign: string, content?: string}} p
 * @returns {string}
 */
export function withUtm(url, { source = 'lessonkit', medium = 'pdf', campaign, content } = {}) {
  const u = new URL(url);
  u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_medium', medium);
  if (campaign) u.searchParams.set('utm_campaign', campaign);
  if (content) u.searchParams.set('utm_content', content);
  return u.toString();
}
