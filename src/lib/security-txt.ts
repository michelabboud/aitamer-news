/**
 * `/.well-known/security.txt` (RFC 9116): where to report a vulnerability. Generated at build time
 * rather than kept as a static file, because `Expires` is required and a hand-written date would
 * quietly lapse. Pure, so `node:test` covers it.
 *
 * Contacts are the ones `SECURITY.md` in the site's repository already publishes: GitHub's private
 * vulnerability reporting (enabled on the repository, checked 2026-10-24), and the contact form on
 * the About page once it is open. No email address is invented.
 */
import { SITE } from './site-meta.ts';

const REPOSITORY = 'https://github.com/michelabboud/aitamer-news';

/** The file is valid for this long after each build. The site is built and deployed often, and a site that stops deploying should let its file expire. RFC 9116 asks for under a year. */
export const SECURITY_TXT_VALID_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The text of the file for a build made at `now`. */
export function securityTxt(now: Date, options: { contactFormLive: boolean }): string {
  const expires = new Date(now.valueOf() + SECURITY_TXT_VALID_DAYS * DAY_MS).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const lines = [`Contact: ${REPOSITORY}/security/advisories/new`];
  if (options.contactFormLive) lines.push(`Contact: ${SITE.url}/about/#contact`);
  lines.push(
    `Expires: ${expires}`,
    'Preferred-Languages: en',
    `Canonical: ${SITE.url}/.well-known/security.txt`,
    `Policy: ${REPOSITORY}/blob/main/SECURITY.md`,
  );
  return `${lines.join('\n')}\n`;
}
