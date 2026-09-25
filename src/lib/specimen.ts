/** Specimen numbers are shown with at least four digits, so early and late numbers line up. */
export const SPECIMEN_DIGITS = 4;

/** e.g. 12 → "0012", 12345 → "12345". */
export function formatSpecimen(n: number): string {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`specimen must be a positive integer, got ${n}`);
  return String(n).padStart(SPECIMEN_DIGITS, '0');
}
