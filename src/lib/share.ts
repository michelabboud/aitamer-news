/**
 * The share links at the end of a story (task: sharing options, 2026-10-02).
 *
 * Plain intent URLs only: no third-party script, no widget, no tracker, so a share costs the site
 * nothing and tells nobody who read what. The shared address is the story's canonical URL, passed
 * through untouched (no UTM or other query: a clean address is what the cards and the sitemap use).
 * Facebook is left out on purpose: its crawler cannot fetch the site's cards yet, so a Facebook
 * share would show an empty preview. Add it here when that is fixed.
 */

export type ShareNetwork = 'x' | 'linkedin' | 'bluesky' | 'whatsapp' | 'telegram' | 'email';

export interface ShareInput {
  /** The story's canonical https URL. */
  url: string;
  title: string;
  /** The story's one-paragraph summary (its `description`). */
  summary: string;
}

export interface ShareTarget {
  id: ShareNetwork;
  label: string;
  href: string;
  /** Opens a web page in a new tab; an e-mail link opens the reader's mail program instead. */
  external: boolean;
}

const enc = encodeURIComponent;

/** The six share targets for a story, in the order they are shown. */
export function shareTargets({ url, title, summary }: ShareInput): ShareTarget[] {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error(`share: the story URL must be https, got ${url}`);
  if (title.trim() === '') throw new Error('share: a story needs a title to be shared');
  return [
    { id: 'x', label: 'X', href: `https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}`, external: true },
    { id: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, external: true },
    { id: 'bluesky', label: 'Bluesky', href: `https://bsky.app/intent/compose?text=${enc(`${title} ${url}`)}`, external: true },
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${enc(`${title}\n${url}`)}`, external: true },
    { id: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`, external: true },
    { id: 'email', label: 'Email', href: `mailto:?subject=${enc(title)}&body=${enc(`${summary}\n\n${url}`)}`, external: false },
  ];
}
