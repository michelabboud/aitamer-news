import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WILDNESS_COLORS,
  WILDNESS_EMPTY,
  isWildnessRating,
  wildnessLabel,
  wildnessSegments,
} from './wildness.ts';
import { formatSpecimen } from './specimen.ts';

test('a rating fills that many segments in its own colour', () => {
  assert.deepEqual(wildnessSegments(3), [
    WILDNESS_COLORS[3],
    WILDNESS_COLORS[3],
    WILDNESS_COLORS[3],
    WILDNESS_EMPTY,
    WILDNESS_EMPTY,
  ]);
  assert.deepEqual(wildnessSegments(5), Array(5).fill(WILDNESS_COLORS[5]));
  assert.equal(wildnessSegments(1).filter((c) => c === WILDNESS_EMPTY).length, 4);
});

test('only whole ratings 1–5 are ratings', () => {
  assert.equal(isWildnessRating(1), true);
  assert.equal(isWildnessRating(5), true);
  assert.equal(isWildnessRating(0), false);
  assert.equal(isWildnessRating(6), false);
  assert.equal(isWildnessRating(2.5), false);
});

test('label names the level', () => {
  assert.equal(wildnessLabel(3), '3 / 5 · Partly tamed');
});

test('specimen numbers pad to four digits and grow past them', () => {
  assert.equal(formatSpecimen(12), '0012');
  assert.equal(formatSpecimen(9999), '9999');
  assert.equal(formatSpecimen(12345), '12345');
  assert.throws(() => formatSpecimen(0), RangeError);
  assert.throws(() => formatSpecimen(1.5), RangeError);
});
