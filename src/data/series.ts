/**
 * Series a post can join. The slug is what frontmatter `series` names; the title and description
 * are what `/series/` and the part badge show. Add a row here before a post uses the slug.
 * Ordering of this list is the order of the index.
 */
export interface SeriesMeta {
  slug: string;
  title: string;
  description: string;
}

export const SERIES: readonly SeriesMeta[] = [
  {
    slug: 'grok-bot',
    title: 'Grok Bot tutorial',
    description: 'Numbered tutorials on Grok Bot, from the desktop app and the shared computer through the phone.',
  },
  {
    slug: 'ai-image-models',
    title: 'AI image models',
    description: 'Image models, one or two per part, answered on the same questions from each vendor\'s own pages.',
  },
  {
    slug: 'ai-movie-models',
    title: 'AI movie models',
    description: 'Video models, one or two per part, answered on the same questions from each vendor\'s own pages.',
  },
  {
    slug: 'ai-voice-models',
    title: 'AI voice models',
    description: 'Voice models, one or two per part, answered on the same questions from each vendor\'s own pages.',
  },
  {
    slug: 'vectors-plainly',
    title: 'Vectors, Plainly',
    description: 'What a vector database does, in six parts: the idea, the index, tenancy, retrieval quality, RAG, and production.',
  },
];

export function seriesMeta(slug: string): SeriesMeta | undefined {
  return SERIES.find((series) => series.slug === slug);
}
