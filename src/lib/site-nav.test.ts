import assert from 'node:assert/strict';
import test from 'node:test';
import { MORE_LINKS, PHONE_MENU_LINKS, SECTION_LINKS, UTILITY_LINKS, navCurrent } from './site-nav.ts';

const labels = (links: readonly { label: string }[]) => links.map((l) => l.label);
const byKey = (key: string) => [...SECTION_LINKS, ...MORE_LINKS, ...PHONE_MENU_LINKS].find((l) => l.key === key)!;

test('the top bar sections are the plan’s seven, in order', () => {
  assert.deepEqual(labels(SECTION_LINKS), ['News', 'Models', 'Dev', 'Tools', 'DevOps & IT', 'Rust', 'Voices']);
});

test('More holds Columns, General, Extinction Watch, Archive and All habitats', () => {
  assert.deepEqual(labels(MORE_LINKS), ['Columns', 'General', 'Extinction Watch', 'Archive', 'All habitats']);
});

test('no link appears twice across the sections, More and the utility links', () => {
  const hrefs = [...SECTION_LINKS, ...MORE_LINKS, ...UTILITY_LINKS].map((l) => l.href);
  assert.equal(new Set(hrefs).size, hrefs.length);
});

test('no author or writer page leads the navigation any more', () => {
  for (const link of [...SECTION_LINKS, ...MORE_LINKS, ...UTILITY_LINKS]) {
    assert.doesNotMatch(link.href, /^\/(authors\/[^/]|mai|quill|foxy|ari|aviram|michel)/);
  }
});

test('the phone menu carries everything the hidden top bar and More menu do', () => {
  const phone = new Set(PHONE_MENU_LINKS.map((l) => l.href));
  for (const link of [...UTILITY_LINKS, ...MORE_LINKS]) assert.ok(phone.has(link.href), link.label);
});

test('a link is the current page on its own path, with or without the trailing slash', () => {
  assert.equal(navCurrent(byKey('dev'), { path: '/section/dev/' }), 'page');
  assert.equal(navCurrent(byKey('dev'), { path: '/section/dev' }), 'page');
  assert.equal(navCurrent(byKey('models'), { path: '/section/dev/' }), undefined);
});

test('a page inside a section marks it as current without claiming to be it', () => {
  assert.equal(navCurrent(byKey('news'), { path: '/news/2/', nav: 'news' }), 'true');
  assert.equal(navCurrent(byKey('rust'), { path: '/posts/a-story/', habitat: 'rust' }), 'true');
  assert.equal(navCurrent(byKey('voices'), { path: '/posts/b/', habitat: 'voices' }), 'true');
});

test('anchored and query links are never current', () => {
  assert.equal(navCurrent(byKey('contact'), { path: '/about/' }), undefined);
  assert.equal(navCurrent(byKey('sighting'), { path: '/about/' }), undefined);
  assert.equal(navCurrent(byKey('about'), { path: '/about/' }), 'page');
});

test('pages in the More menu are marked inside it', () => {
  const more = (path: string, extra = {}) => MORE_LINKS.some((l) => navCurrent(l, { path, ...extra }) !== undefined);
  assert.equal(more('/columns/2/', { nav: 'columns' }), true);
  assert.equal(more('/posts/x/', { habitat: 'general' }), true);
  assert.equal(more('/archive/'), true);
  assert.equal(more('/archive/2026/10/'), false);
  assert.equal(more('/section/dev/'), false);
  assert.equal(more('/'), false);
});
