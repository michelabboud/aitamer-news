/** Shared editorial author ordering for the homepage and authors directory. */
/** Editorial order on the homepage; independent of kind, post counts and menu ordering. */
export const HOME_AUTHOR_ORDER: readonly string[] = ['wiz-cat', 'mai', 'aviram', 'ari', 'desk-bot', 'quill', 'foxy'];

/** Keep new authors visible after the explicitly ordered roster, without mutating input. */
export function orderHomeAuthors<T extends { id: string }>(authors: readonly T[]): T[] {
  const rank = (id: string) => {
    const index = HOME_AUTHOR_ORDER.indexOf(id);
    return index < 0 ? Number.POSITIVE_INFINITY : index;
  };
  return [...authors].sort((a, b) => {
    const aRank = rank(a.id);
    const bRank = rank(b.id);
    return (aRank === bRank ? 0 : aRank < bRank ? -1 : 1) || a.id.localeCompare(b.id);
  });
}
