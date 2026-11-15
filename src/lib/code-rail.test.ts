import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { satteri } from '@astrojs/markdown-satteri';
import { decorateCodeBoxes } from './code-box-html.ts';
import { codeRailPlugin } from './code-rail-plugin.ts';
import { parseCodeRails, RAIL_REGISTRY, sourceHasCodeRail } from './code-rail.ts';

const sample = `---
title: x
---

\`\`\`bash rail=get-nodes
kubectl get nodes -o wide
\`\`\`

\`\`\`text
not a command
\`\`\`

\`\`\`rail
id: get-nodes
items:
  - kind: explain
    label: Explain this command
    lines:
      - token: kubectl
        text: The Kubernetes command-line client.
      - token: "-o"
        text: Short form of --output.
      - token: "2>&1"
        text: Shell redirect.
  - kind: link
    label: kubectl get reference
    href: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_get/
  - kind: calc
    label: Open the replica calculator
    calc: replica-count
\`\`\`
`;

test('the rail registry keeps explain and link active and calc as a stub', () => {
  assert.deepEqual(RAIL_REGISTRY.map((spec) => [spec.kind, spec.status]), [
    ['explain', 'active'],
    ['link', 'active'],
    ['calc', 'stub'],
  ]);
});

test('a rail sidecar is parsed and a bad href is refused', () => {
  const parsed = parseCodeRails(sample);
  assert.equal(parsed.rails.length, 1);
  assert.equal(parsed.fences.filter((fence) => fence.railId).length, 1);
  assert.equal(parsed.fences[1].railId, undefined);
  assert.throws(() => parseCodeRails(sample.replace('https://kubernetes.io', 'javascript:alert(1)')), /https URL or a site path/);
});

test('the markdown plugin drops the sidecar and the rail token, and the page wraps the block', async () => {
  const engine = satteri({ mdastPlugins: [codeRailPlugin] });
  const rendered = await engine.createRenderer({ syntaxHighlight: 'shiki', shikiConfig: { theme: 'github-dark' } }).then((renderer) => renderer.render(sample));
  assert.doesNotMatch(rendered.code, /Explain this command|rail fence|replica-count/);
  assert.match(rendered.code, /data-language="bash"/);
  assert.match(rendered.code, /data-language="text"/);
  const parsed = parseCodeRails(sample);
  const html = decorateCodeBoxes(rendered.code, parsed.fences, parsed.rails);
  assert.match(html, /<button type="button" class="codebox__copy"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /aria-labelledby="codebox-0-title-0"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /<details class="codebox__fallback">/);
  assert.match(html, /href="https:\/\/kubernetes\.io\/docs\/reference\/kubectl\/generated\/kubectl_get\/"/);
  assert.match(html, /not available on this page yet/);
  assert.match(html, /2&gt;&amp;1/);
  assert.ok(html.includes(rendered.code.match(/<pre[\s\S]*?<\/pre>/)[0]));
});

test('lesson 2 gives every kubectl command fence a rail', () => {
  const text = readFileSync('src/content/posts/k8s-from-zero-02-architecture-tour.md', 'utf8');
  const parsed = parseCodeRails(text);
  const commands = parsed.fences.filter((fence) => fence.lang === 'bash' && /^\s*kubectl\b/m.test(fence.code));
  assert.ok(commands.length >= 10);
  for (const fence of commands) assert.ok(fence.railId, fence.code.slice(0, 40));
});

async function render(source: string, withRails = true): Promise<string> {
  const engine = satteri({ mdastPlugins: withRails ? [codeRailPlugin] : [] });
  const renderer = await engine.createRenderer({ syntaxHighlight: false });
  return (await renderer.render(source)).code;
}

test('indented and nested ordinary code keeps a top-level rail attached to its command', async () => {
  const source = '    indented example\n\n> ```text\n> quoted example\n> ```\n\n- ```text\n  listed example\n  ```\n\n' + sample.slice(sample.indexOf('```bash'));
  const parsed = parseCodeRails(source);
  const html = decorateCodeBoxes(await render(source), parsed.fences, parsed.rails);
  assert.equal(parsed.fences.length, 5);
  assert.equal((html.match(/class="codebox"/g) ?? []).length, 1);
  assert.match(html, /<figure class="codebox"[\s\S]*?<pre[^>]*><code[^>]*>kubectl get nodes/);
  assert.doesNotMatch(html, /class="codebox"[^]*?indented example/);
});

for (const container of ['blockquote', 'list'] as const) {
  test(`${container} rails use the same Markdown semantics for detection, parsing and rendering`, async () => {
    const body = sample.slice(sample.indexOf('```bash'));
    const source = body.split('\n').map((line, index) => container === 'blockquote'
      ? `> ${line}`
      : `${index === 0 ? '- ' : '  '}${line}`).join('\n');
    assert.equal(sourceHasCodeRail(source), true);
    const parsed = parseCodeRails(source);
    assert.equal(parsed.rails.length, 1);
    assert.equal(parsed.fences.length, 2);
    assert.equal(parsed.fences[0].railId, 'get-nodes');
    const rendered = await render(source);
    assert.doesNotMatch(rendered, /replica-count|Explain this command|rail=get-nodes/);
    const html = decorateCodeBoxes(rendered, parsed.fences, parsed.rails);
    assert.match(html, /class="codebox"/);
    assert.match(html, /kubectl get nodes/);
  });
}

test('literal rail examples inside code are retained without activating the rail plugin', async () => {
  for (const source of [
    '````markdown\n```bash rail=example\necho example\n```\n```rail\nid: example\n```\n````',
    '    ```rail\n    id: example\n    ```',
  ]) {
    assert.equal(sourceHasCodeRail(source), false);
    const parsed = parseCodeRails(source);
    assert.equal(parsed.fences.length, 1);
    assert.deepEqual(parsed.rails, []);
    assert.equal(await render(source), await render(source, false));
    assert.match(await render(source), /```rail/);
  }
});

test('frontmatter code examples are not rail sidecars or displayed code', async () => {
  const source = '---\ndescription: |\n  ```rail\n  id: example\n  ```\n---\n\n' + sample.slice(sample.indexOf('```bash'));
  const parsed = parseCodeRails(source);
  assert.equal(parsed.fences.length, 2);
  assert.equal(parsed.rails.length, 1);
  assert.doesNotThrow(() => decorateCodeBoxes('<pre><code>kubectl get nodes -o wide</code></pre><pre><code>not a command</code></pre>', parsed.fences, parsed.rails));
  assert.equal(sourceHasCodeRail(source.slice(0, source.indexOf('```bash'))), false);
});

test('rail rendering preserves the exact plain highlighted HTML used by admission', async () => {
  const plain = sample.slice(0, sample.indexOf('```rail')).replace(' rail=get-nodes', '');
  assert.equal(await render(sample), await render(plain, false));
  const literal = '````markdown\n```rail\nid: literal-example\n```\n````\n\n';
  assert.equal(await render(literal + sample), await render(literal + plain, false));
});

test('nested rails still reject missing, orphaned, duplicate and invalid sidecars', () => {
  const quote = (source: string) => source.split('\n').map((line) => `> ${line}`).join('\n');
  const body = sample.slice(sample.indexOf('```bash'));
  assert.throws(() => parseCodeRails(quote(body.slice(0, body.indexOf('```rail')))), /has no rail sidecar/);
  assert.throws(() => parseCodeRails(quote(body.slice(body.indexOf('```rail')))), /not referenced/);
  assert.throws(() => parseCodeRails(quote(body + body.slice(body.indexOf('```rail')))), /used twice/);
  assert.throws(() => parseCodeRails(quote(body.replace('rail=get-nodes', 'rail=INVALID'))), /single lowercase id/);
  assert.throws(() => parseCodeRails(quote(body.replace('https://kubernetes.io', 'javascript:alert(1)'))), /https URL or a site path/);
});

test('an extra raw HTML pre fails closed instead of attaching a rail to the wrong block', async () => {
  const source = '<pre>unrelated raw HTML example</pre>\n\n' + sample.slice(sample.indexOf('```bash'));
  const parsed = parseCodeRails(source);
  const html = await render(source);
  assert.throws(() => decorateCodeBoxes(html, parsed.fences, parsed.rails), /rendered <pre> count is 3 and code fence count is 2/);
});
