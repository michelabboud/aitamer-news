import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyObservation, gate, observePaths } from './specimen-admission.mjs';
import { CandidateAdmissionError } from './specimen-admission-data.mjs';

const BASE = 'a'.repeat(40), HEAD = 'b'.repeat(40), STALE = 'c'.repeat(40);
const outside = () => { throw new CandidateAdmissionError('outside admission lane: public/authors/example.webp'); };

test('image observations inspect data without querying or writing any approval proof', async () => {
  const inspected = [];
  const deps = { readGit: () => BASE, fetchCommits: () => {}, collect: outside,
    inspectImages: (base, head) => { inspected.push([base, head]); } };
  const api = new Proxy({}, { get() { throw new Error('image observation must not use GitHub authority'); } });
  observePaths({ BASE_SHA: STALE, HEAD_SHA: HEAD }, deps);
  await gate(api, { BASE_SHA: STALE, HEAD_SHA: HEAD, ADMISSION_OBSERVATION: 'true' }, deps);
  assert.deepEqual(inspected, [[BASE, HEAD], [BASE, HEAD]]);
});

test('article classification retains precedence over image approval', () => {
  assert.equal(classifyObservation(BASE, HEAD, { collect: () => ({}),
    inspectImages: () => { throw new Error('articles must retain their existing admission'); } }), 'article');
});

test('only data-lane rejection can invoke the strict image inspector', () => {
  assert.throws(() => classifyObservation(BASE, HEAD, { collect: () => { throw new Error('transport or policy failure'); },
    inspectImages: () => { throw new Error('must not be called'); } }), /transport or policy failure/);
  assert.throws(() => classifyObservation(BASE, HEAD, { collect: outside,
    inspectImages: () => { throw new Error('forbidden metadata or image payload'); } }), /forbidden metadata or image payload/);
});

test('ordinary required numbering gate never falls back to the image policy', async () => {
  let inspected = false;
  await gate({}, { BASE_SHA: BASE, HEAD_SHA: HEAD }, {
    fetchCommits: () => {}, inspectSpecimens: async () => ({ requiresAdmission: false, problems: [] }),
    inspectImages: () => { inspected = true; throw new Error('not an observation'); },
  });
  assert.equal(inspected, false);
});
