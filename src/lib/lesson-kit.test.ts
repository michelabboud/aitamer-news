import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lessonKitLinks } from './lesson-kit.ts';
import { withUtm } from '../../scripts/lessonkit/utm.mjs';

test('withUtm stamps source, medium, campaign and content', () => {
  const url = withUtm('https://aitamer.news/posts/k8s-from-zero-02-architecture-tour/', {
    campaign: 'k8s-02',
    content: 'cheatsheet',
  });
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('utm_source'), 'lessonkit');
  assert.equal(parsed.searchParams.get('utm_medium'), 'pdf');
  assert.equal(parsed.searchParams.get('utm_campaign'), 'k8s-02');
  assert.equal(parsed.searchParams.get('utm_content'), 'cheatsheet');
  assert.equal(parsed.pathname, '/posts/k8s-from-zero-02-architecture-tour/');
});

test('withUtm rejects a value that is not a URL', () => {
  assert.throws(() => withUtm('not a url', { campaign: 'k8s-02' }), TypeError);
});

test('a lesson kit lists only the files that exist, and an empty directory lists nothing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lesson-kit-'));
  try {
    assert.deepEqual(lessonKitLinks('k8s-02', dir), []);
    writeFileSync(join(dir, 'aitamer-k8s-02-cheatsheet.pdf'), 'preview');
    writeFileSync(join(dir, 'aitamer-k8s-02-lab.zip'), 'zip');
    assert.deepEqual(lessonKitLinks('k8s-02', dir).map((file) => file.filename), [
      'aitamer-k8s-02-cheatsheet.pdf',
      'aitamer-k8s-02-lab.zip',
    ]);
    assert.equal(lessonKitLinks('k8s-02', dir)[0].href, '/lessonkits/aitamer-k8s-02-cheatsheet.pdf');
    assert.equal(lessonKitLinks('k8s-02', dir).some((file) => file.key === 'homework'), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
