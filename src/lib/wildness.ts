/**
 * Wildness: how tamed a sighting's claims are, from 1 (independently verified) to 5 (vendor claim only).
 * The scale and its colours come from the Bestiary design (docs/bestiary.md).
 */
export const WILDNESS_MIN = 1;
export const WILDNESS_MAX = 5;

export type WildnessRating = 1 | 2 | 3 | 4 | 5;

export const WILDNESS_LABELS: Record<WildnessRating, string> = {
  1: 'Tamed',
  2: 'Mostly tamed',
  3: 'Partly tamed',
  4: 'Still wild',
  5: 'Wild',
};

/** Fill colour per rating: green (tamed) through ember red (wild). */
export const WILDNESS_COLORS: Record<WildnessRating, string> = {
  1: '#8fd4a0',
  2: '#c9d27a',
  3: '#f2c46b',
  4: '#ff9a5c',
  5: '#ff5f3d',
};

/** Colour of an unfilled segment (the design's line colour). */
export const WILDNESS_EMPTY = '#2c3530';

export function isWildnessRating(value: number): value is WildnessRating {
  return Number.isInteger(value) && value >= WILDNESS_MIN && value <= WILDNESS_MAX;
}

/**
 * The meter's five segments: the first `rating` take the rating's colour, the rest stay empty.
 * One colour for all filled segments makes the meter read as a single level, not a gradient.
 */
export function wildnessSegments(rating: WildnessRating): string[] {
  return Array.from({ length: WILDNESS_MAX }, (_, i) =>
    i < rating ? WILDNESS_COLORS[rating] : WILDNESS_EMPTY,
  );
}

/** e.g. "3 / 5 · Partly tamed" */
export function wildnessLabel(rating: WildnessRating): string {
  return `${rating} / ${WILDNESS_MAX} · ${WILDNESS_LABELS[rating]}`;
}
