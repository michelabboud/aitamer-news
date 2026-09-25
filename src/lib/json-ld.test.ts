import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toJsonLd } from './json-ld.ts';

const hostile = 'Why </script><script>alert(1)</script> still matters <!-- & more \u2028';

test('nothing in the output can close the script block or open a comment', () => {
  const out = toJsonLd({ headline: hostile });
  assert.doesNotMatch(out, /<\/script/i);
  assert.doesNotMatch(out, /<!--/);
  assert.doesNotMatch(out, /[<>&\u2028\u2029]/);
});

test('the escaped output still parses back to the original data', () => {
  const data = { headline: hostile, nested: { tags: ['a<b', 'c>d'] } };
  assert.deepEqual(JSON.parse(toJsonLd(data)), data);
});
