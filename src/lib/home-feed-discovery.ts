/** Reader fragments are excluded from sitemap discovery, including project-site builds. */
export function isHomeFeedBatchPath(pathname: string, base = '/'): boolean {
  const prefix = `/${base.replace(/^\/+|\/+$/g, '')}/home-feed/`.replace(/^\/\//, '/');
  return pathname.startsWith(prefix);
}
