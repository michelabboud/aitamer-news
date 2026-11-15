import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decorateCodeBoxes } from './code-box-html.ts';
import { parseCodeRails, RAIL_REGISTRY, type CodeRailPlan } from './code-rail.ts';
import { plainBodyMarkdown } from './plain-body-markdown.ts';

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

const highlight = { syntaxHighlight: 'shiki' as const, shikiConfig: { theme: 'github-dark' } };

async function renderPlanned(markdown: string): Promise<{ code: string; plan: CodeRailPlan }> {
  const renderer = await plainBodyMarkdown().createRenderer(highlight);
  const rendered = await renderer.render(markdown);
  const plan = (rendered.metadata as { codeRailPlan?: CodeRailPlan }).codeRailPlan;
  assert.ok(plan, 'the renderer records a rail plan from the Markdown AST');
  return { code: rendered.code, plan };
}

test('the markdown plugin drops the sidecar and the rail token, and the page wraps the block', async () => {
  const { code, plan } = await renderPlanned(sample);
  assert.doesNotMatch(code, /Explain this command|replica-count/);
  assert.match(code, /data-language="bash"/);
  assert.match(code, /data-language="text"/);
  assert.equal(plan.blocks.filter((block) => block.railId).length, 1);
  const html = decorateCodeBoxes(code, plan);
  assert.match(html, /<button type="button" class="codebox__copy"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /aria-labelledby="codebox-0-title-0"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /<details class="codebox__fallback">/);
  assert.match(html, /href="https:\/\/kubernetes\.io\/docs\/reference\/kubectl\/generated\/kubectl_get\/"/);
  assert.match(html, /not available on this page yet/);
  assert.match(html, /2&gt;&amp;1/);
  assert.ok(html.includes(code.match(/<pre[\s\S]*?<\/pre>/)![0]));
});

const sidecar = `\`\`\`rail
id: demo
items:
  - kind: explain
    label: Explain this command
    lines:
      - token: echo
        text: Prints its arguments.
\`\`\``;

test('an indented code block before a rail fence does not shift the wrapped pre', async () => {
  const markdown = `    echo earlier\n\n\`\`\`sh rail=demo\necho hi\n\`\`\`\n\n${sidecar}\n`;
  const { code, plan } = await renderPlanned(markdown);
  assert.equal(plan.blocks.length, 2);
  assert.equal(plan.blocks[0].railId, undefined);
  assert.equal(plan.blocks[1].railId, 'demo');
  const html = decorateCodeBoxes(code, plan);
  assert.equal(html.match(/class="codebox"/g)?.length, 1);
  assert.match(html, /echo earlier/);
  assert.ok(html.indexOf('echo earlier') < html.indexOf('class="codebox"'));
  assert.match(html, /Prints its arguments/);
});

test('a rail fence inside a blockquote is read from the Markdown tree and wrapped', async () => {
  const markdown = ['> ```sh rail=demo', '> echo hi', '> ```', '>', ...sidecar.split('\n').map((line) => `> ${line}`)].join('\n');
  const { code, plan } = await renderPlanned(markdown);
  assert.equal(plan.blocks.length, 1);
  assert.equal(plan.blocks[0].railId, 'demo');
  assert.doesNotMatch(code, /Prints its arguments/);
  const html = decorateCodeBoxes(code, plan);
  assert.match(html, /class="codebox"/);
  assert.match(html, /Prints its arguments/);
});

test('a fence without its sidecar fails while the Markdown tree is read', async () => {
  await assert.rejects(() => renderPlanned('```sh rail=demo\necho hi\n```\n'), /has no rail sidecar/);
});

test('lesson 2 gives every kubectl command fence a rail', () => {
  const text = readFileSync('src/content/posts/k8s-from-zero-02-architecture-tour.md', 'utf8');
  const parsed = parseCodeRails(text);
  const commands = parsed.fences.filter((fence) => fence.lang === 'bash' && /^\s*kubectl\b/m.test(fence.code));
  assert.ok(commands.length >= 10);
  for (const fence of commands) assert.ok(fence.railId, fence.code.slice(0, 40));
});
