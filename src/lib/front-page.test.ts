import assert from 'node:assert/strict';
import { test } from 'node:test';
import { orderHomeAuthors } from './front-page.ts';

test('homepage author order follows the editorial roster and keeps unknown authors visible', () => {
  const input = ['foxy', 'other', 'ari', 'wiz-cat', 'quill', 'desk-bot', 'aviram', 'mai']
    .map((id) => ({ id }));
  assert.deepEqual(orderHomeAuthors(input).map((author) => author.id),
    ['wiz-cat', 'mai', 'aviram', 'ari', 'desk-bot', 'quill', 'foxy', 'other']);
  assert.equal(input[0].id, 'foxy');
  assert.deepEqual(orderHomeAuthors([]), []);
});
