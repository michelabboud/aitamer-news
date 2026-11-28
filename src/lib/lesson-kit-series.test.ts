import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { answerKeyIntro } from '../../scripts/lessonkit/build.mjs';
import { kitPhrase, render } from '../../scripts/lessonkit/render.mjs';
import { seriesLine } from '../../scripts/lessonkit/series.mjs';
import { seriesLabel } from './series.ts';

const catalog = () => JSON.parse(readFileSync('src/data/series.json', 'utf8'));

test('the kit series line matches seriesLabel for Kubernetes from Zero lesson 2', () => {
  const file = catalog();
  const line = seriesLine(file, 'k8s-from-zero', 2);
  const meta = file.find((row: { slug: string }) => row.slug === 'k8s-from-zero');
  assert.equal(line.label, seriesLabel(meta.title, 1, 1, meta.arcs, 2));
  assert.equal(line.label, 'Kubernetes from Zero · Foundations 2 of 12 · Lesson 2');
  assert.equal(line.place, 'cluster');
  assert.equal(line.placeLabel, 'Cluster');
});

test('Containers from Zero kits name a host, and lesson 1 sits in The pieces', () => {
  const line = seriesLine(catalog(), 'containers-from-zero', 1);
  assert.equal(line.label, 'Containers from Zero · The pieces 1 of 6 · Lesson 1');
  assert.equal(line.place, 'host');
  assert.equal(line.placeLabel, 'Host');
  assert.equal(line.headings, null);
  assert.equal(seriesLine(catalog(), 'containers-from-zero', 10).label, 'Containers from Zero · Change, failure, and cleanup 3 of 3 · Lesson 10');
});

test('the cover and the answer key take their place word from the series', () => {
  const cover = '{{lesson.tested}}. {{kit.placeLabel}}: {{lesson.cluster}}.';
  const k8s = seriesLine(catalog(), 'k8s-from-zero', 1);
  const containers = seriesLine(catalog(), 'containers-from-zero', 1);
  assert.equal(
    render(cover, { lesson: { tested: 'Ran every command', cluster: 'k8s-from-zero' }, kit: { placeLabel: k8s.placeLabel } }),
    'Ran every command. Cluster: k8s-from-zero.',
  );
  assert.equal(
    render(cover, { lesson: { tested: 'Installed Docker Engine', cluster: 'none, one Docker Engine host' }, kit: { placeLabel: containers.placeLabel } }),
    'Installed Docker Engine. Host: none, one Docker Engine host.',
  );
  assert.equal(
    answerKeyIntro(k8s.place),
    'The answers to the homework sheet, matched by exercise number. Every answer comes from the lesson. Names with random suffixes will differ on your cluster.',
  );
  assert.equal(
    answerKeyIntro(containers.place),
    'The answers to the homework sheet, matched by exercise number. Every answer comes from the lesson. Names with random suffixes will differ on your host.',
  );
  assert.equal(kitPhrase(k8s.headings.controlPlaneTitle), 'Control plane');
  assert.equal(kitPhrase(k8s.headings.controlPlaneHint), "the cluster's brain: global decisions, reacting to events");
  assert.equal(kitPhrase(k8s.headings.nodesTitle), 'Nodes');
  assert.equal(kitPhrase(k8s.headings.nodesHint), 'where your containers run');
  assert.equal(kitPhrase(k8s.headings.applyLead), 'Life of one <code>kubectl apply</code>');
  assert.equal(kitPhrase(k8s.headings.applyHint), 'Deployment <code>web</code>, 2 replicas. Every arrow goes through the API server.');
  const heading = '<h2 class="sec keep-next break-before">{{phrase kit.applyLead}} <span class="sec__hint">{{phrase kit.applyHint}}</span></h2>';
  assert.equal(
    render(heading, { kit: k8s.headings }),
    '<h2 class="sec keep-next break-before">Life of one <code>kubectl apply</code> <span class="sec__hint">Deployment <code>web</code>, 2 replicas. Every arrow goes through the API server.</span></h2>',
  );
});

test('the kit templates do not hard-code a Kubernetes place or a kubectl heading', () => {
  const base = readFileSync('scripts/lessonkit/templates/base.html', 'utf8');
  const cheatsheet = readFileSync('scripts/lessonkit/templates/cheatsheet.html', 'utf8');
  const build = readFileSync('scripts/lessonkit/build.mjs', 'utf8');
  assert.doesNotMatch(base, /Cluster:/);
  assert.doesNotMatch(cheatsheet, /kubectl|Kubernetes|cluster's brain/);
  assert.doesNotMatch(build, /differ on your cluster/);
});
