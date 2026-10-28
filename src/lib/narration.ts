/**
 * Where a post's narration lives and how it is described (`narration` in src/content/post-schema.ts).
 * The host and folder are fixed here; frontmatter only ever names slugs. `media-src` in
 * scripts/csp-headers.mjs already allows the bot bucket's public host (added for the self-hosted video).
 */
export const NARRATION_HOST = 'https://bots.aitamer.news';

export interface Narration {
  key: string;
  file: string;
  durationSeconds: number;
  voice?: string;
  disclosure: string;
}

/** `https://bots.aitamer.news/audio/<key>/<file>.mp3` */
export function narrationUrl(narration: Pick<Narration, 'key' | 'file'>): string {
  return `${NARRATION_HOST}/audio/${narration.key}/${narration.file}.mp3`;
}

/** The player label's length: `M:SS`, or `H:MM:SS` from one hour. */
export function narrationLength(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${ss}` : `${minutes}:${ss}`;
}

/** ISO 8601 duration for schema.org, e.g. `PT4M5S`. */
export function isoDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${seconds || totalSeconds === 0 ? `${seconds}S` : ''}`;
}

/** The NewsArticle `audio` value, or undefined (so JSON-LD omits the key) when the post has no narration. */
export function narrationAudioObject(narration: Narration | undefined) {
  if (!narration) return undefined;
  return {
    '@type': 'AudioObject',
    contentUrl: narrationUrl(narration),
    encodingFormat: 'audio/mpeg',
    duration: isoDuration(narration.durationSeconds),
  };
}
