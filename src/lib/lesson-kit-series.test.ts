import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seriesLine } from '../../scripts/lessonkit/series.mjs';
import { seriesLabel } from './series.ts';

test('the kit series line matches seriesLabel for Kubernetes from Zero lesson 2', () => {
  const catalog = JSON.parse(readFileSync('src/data/series.json', 'utf8'));
  const line = seriesLine(catalog, 'k8s-from-zero', 2);
  const meta = catalog.find((row: { slug: string }) => row.slug === 'k8s-from-zero');
  assert.equal(line.label, seriesLabel(meta.title, 1, 1, meta.arcs, 2));
  assert.equal(line.label, 'Kubernetes from Zero · Foundations 2 of 12 · Lesson 2');
});
