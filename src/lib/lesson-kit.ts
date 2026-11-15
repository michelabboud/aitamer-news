/**
 * Which lesson-kit files a story page lists. The PDFs are built by `scripts/lessonkit/`
 * (Art Desk's templates) and committed under `public/lessonkits/`. A lab zip is listed only
 * when that file is actually there. Links inside the PDFs are built by `scripts/lessonkit/utm.mjs`.
 */
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const LESSON_KIT_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const LESSON_KIT_PARTS = [
  { key: 'cheatsheet', label: 'Cheat sheet', ext: 'pdf' },
  { key: 'homework', label: 'Homework', ext: 'pdf' },
  { key: 'answer-key', label: 'Answer key', ext: 'pdf' },
  { key: 'lab', label: 'Lab files', ext: 'zip' },
] as const;

export interface LessonKitLink {
  key: string;
  label: string;
  filename: string;
  href: string;
}

export function lessonKitFilename(id: string, key: string, ext: string): string {
  if (!LESSON_KIT_ID.test(id)) throw new Error(`lesson kit id "${id}" must be a lowercase slug`);
  return `aitamer-${id}-${key}.${ext}`;
}

/**
 * Files that exist in `dir` (usually `public/lessonkits`). Missing PDFs and a missing lab zip
 * are left out. An empty list means the story page draws no box, so a merge without the PDFs
 * has no broken download links.
 */
/** `public/lessonkits`, or `LESSON_KIT_DIR` when a test points somewhere else. */
export function lessonKitDirectory(): string {
  return process.env.LESSON_KIT_DIR ?? join(process.cwd(), 'public/lessonkits');
}

export interface LessonKitInventory {
  links: LessonKitLink[];
  /** Changes when a kit file appears, disappears, or is replaced. */
  mark: string;
}

/**
 * Files that exist in `dir` (usually `public/lessonkits`). Missing PDFs and a missing lab zip
 * are left out. An empty list means the story page draws no box, so a merge without the PDFs
 * has no broken download links.
 */
export function lessonKitInventory(id: string, dir: string): LessonKitInventory {
  const links: LessonKitLink[] = [];
  const marks: string[] = [];
  for (const part of LESSON_KIT_PARTS) {
    const filename = lessonKitFilename(id, part.key, part.ext);
    const file = join(dir, filename);
    if (!existsSync(file)) continue;
    const stat = statSync(file);
    links.push({ key: part.key, label: part.label, filename, href: `/lessonkits/${filename}` });
    marks.push(`${filename}:${stat.size}:${stat.mtimeMs}`);
  }
  return { links, mark: marks.join('|') };
}

export function lessonKitLinks(id: string, dir: string): LessonKitLink[] {
  return lessonKitInventory(id, dir).links;
}
