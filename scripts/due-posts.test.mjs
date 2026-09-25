import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_WINDOW_MINUTES, fullIsoPubDate, isDue, parseWindowMinutes } from './due-posts.mjs';

const post = (frontmatter) => `---\n${frontmatter}\n---\n\nBody.\n`;

test('a non-draft post with a full-ISO pubDate has a due-comparable date', () => {
  assert.deepEqual(
    fullIsoPubDate(post('title: A\npubDate: 2026-09-26T08:00:00Z')),
    new Date('2026-09-26T08:00:00Z'),
  );
});

test('a draft is never due, even with a full-ISO pubDate', () => {
  assert.equal(fullIsoPubDate(post('pubDate: 2026-09-26T08:00:00Z\ndraft: true')), null);
});

test('a date-only pubDate has no exact time, so it is never due here', () => {
  assert.equal(fullIsoPubDate(post('title: A\npubDate: 2026-09-26')), null);
});

test('frontmatter is read as YAML: True is a draft, a comment does not hide the time (B1)', () => {
  assert.equal(fullIsoPubDate(post('pubDate: 2026-09-26T08:00:00Z\ndraft: True')), null);
  assert.deepEqual(
    fullIsoPubDate(post('pubDate: 2026-09-26T08:00:00Z   # launch\ndraft: false  # live')),
    new Date('2026-09-26T08:00:00Z'),
  );
  assert.deepEqual(fullIsoPubDate(post('pubDate: "2026-09-26T08:00:00Z"')), new Date('2026-09-26T08:00:00Z'));
  assert.equal(fullIsoPubDate(post('pubDate: "2026-09-26"   # date only')), null);
  assert.equal(fullIsoPubDate(`\uFEFF${post('pubDate: 2026-09-26T08:00:00Z')}`).toISOString(), '2026-09-26T08:00:00.000Z');
  assert.throws(() => fullIsoPubDate(post('title: "unclosed\npubDate: 2026-09-26T08:00:00Z')), /not valid YAML/);
});

test('a post with no frontmatter is never due', () => {
  assert.equal(fullIsoPubDate('no frontmatter\npubDate: 2026-09-26T08:00:00Z\n'), null);
});

test('isDue: the window is open at the start and closed at the end', () => {
  const now = new Date('2026-09-26T10:00:00Z');
  // Exactly 120 minutes before now: excluded (open start).
  assert.equal(isDue(new Date('2026-09-26T08:00:00Z'), now, 120), false);
  // One second inside the window: included.
  assert.equal(isDue(new Date('2026-09-26T08:00:01Z'), now, 120), true);
  // Exactly now: included (closed end).
  assert.equal(isDue(now, now, 120), true);
  // One second after now: not due yet.
  assert.equal(isDue(new Date('2026-09-26T10:00:01Z'), now, 120), false);
});

test('isDue: well outside the window in either direction is never due', () => {
  const now = new Date('2026-09-26T10:00:00Z');
  assert.equal(isDue(new Date('2026-09-20T00:00:00Z'), now, 120), false);
  assert.equal(isDue(new Date('2026-10-01T00:00:00Z'), now, 120), false);
});

test('parseWindowMinutes: defaults to 120 when the flag is absent', () => {
  assert.equal(parseWindowMinutes([]), DEFAULT_WINDOW_MINUTES);
  assert.equal(DEFAULT_WINDOW_MINUTES, 120);
});

test('parseWindowMinutes: reads a valid --window-minutes value', () => {
  assert.equal(parseWindowMinutes(['--window-minutes', '180']), 180);
});

test('parseWindowMinutes: rejects a non-positive or non-numeric value', () => {
  assert.throws(() => parseWindowMinutes(['--window-minutes', '0']), /positive number/);
  assert.throws(() => parseWindowMinutes(['--window-minutes', '-5']), /positive number/);
  assert.throws(() => parseWindowMinutes(['--window-minutes', 'soon']), /positive number/);
});
