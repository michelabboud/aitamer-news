import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { satteri } from '@astrojs/markdown-satteri';
import { decorateCodeBoxes } from './code-box-html.ts';
import { codeRailPlugin } from './code-rail-plugin.ts';
import { parseCodeRails, RAIL_REGISTRY } from './code-rail.ts';

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
