/**
 * Wrap highlighted `<pre>` blocks with the code-box chrome. The original `<pre>` bytes stay
 * as the highlighter wrote them. Rail text is escaped. This runs in the story page, after the
 * markdown pipeline, so the rendered-body allowlist still judges the plain highlighted HTML.
 */
import { parseFragment } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';
import type { CodeRailPlan, RailItem } from './code-rail.ts';

type Element = DefaultTreeAdapterMap['element'];

export class CodeBoxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodeBoxError';
  }
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ICONS = {
  explain: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M6 5.5h12v13H6zM8.5 9h7M8.5 12h7M8.5 15h4"/></svg>',
  link: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M8 16l8-8M10 7h7v7"/></svg>',
  calc: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M7 4.5h10v15H7zM9 8h6M9.5 12h.1M12 12h.1M14.5 12h.1M9.5 15h.1M12 15h.1M14.5 15h.1"/></svg>',
} as const;

function preSpans(html: string): { start: number; end: number }[] {
  const fragment = parseFragment(html, { sourceCodeLocationInfo: true });
  const spans: { start: number; end: number }[] = [];
  const walk = (node: { childNodes?: unknown[] }) => {
    for (const child of node.childNodes ?? []) {
      const element = child as Element;
      if (element.tagName === 'pre') {
        const loc = element.sourceCodeLocation;
        if (!loc) throw new CodeBoxError('a rendered <pre> has no source location');
        spans.push({ start: loc.startOffset, end: loc.endOffset });
      }
      if ('childNodes' in element && element.childNodes) walk(element);
    }
  };
  walk(fragment);
  return spans;
}

function commandText(code: string): string {
  return esc(code.replace(/\n$/, ''));
}

function explainBody(item: Extract<RailItem, { kind: 'explain' }>, code: string, titleId: string): string {
  const lines = item.lines
    .map((line) => `<li><code>${esc(line.token)}</code> <span>${esc(line.text)}</span></li>`)
    .join('');
  return `<h2 id="${titleId}" class="codebox__dialog-title">${esc(item.label)}</h2><pre class="codebox__command"><code>${commandText(code)}</code></pre><ol class="codebox__lines">${lines}</ol>`;
}

function itemControl(item: RailItem, code: string, box: number, itemIndex: number): { rail: string; extra: string } {
  const dialogId = `codebox-${box}-dialog-${itemIndex}`;
  const titleId = `codebox-${box}-title-${itemIndex}`;
  if (item.kind === 'link') {
    const external = item.href.startsWith('https://');
    const blank = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const extra = external ? '<span class="sr-only"> (opens in a new tab)</span>' : '';
    return {
      rail: `<a class="codebox__rail-btn" href="${esc(item.href)}"${blank}>${ICONS.link}<span class="sr-only">${esc(item.label)}${extra}</span></a>`,
      extra: '',
    };
  }
  const icon = item.kind === 'explain' ? ICONS.explain : ICONS.calc;
  const lines = item.kind === 'explain'
    ? item.lines.map((line) => `<li><code>${esc(line.token)}</code> <span>${esc(line.text)}</span></li>`).join('')
    : '';
  const body = item.kind === 'explain'
    ? explainBody(item, code, titleId)
    : `<h2 id="${titleId}" class="codebox__dialog-title">${esc(item.label)}</h2><p>The calculator <code>${esc(item.calc)}</code> is not available on this page yet.</p>`;
  const fallback = item.kind === 'explain'
    ? `<details class="codebox__fallback"><summary>${esc(item.label)}</summary><pre class="codebox__command"><code>${commandText(code)}</code></pre><ol class="codebox__lines">${lines}</ol></details>`
    : `<details class="codebox__fallback"><summary>${esc(item.label)}</summary><p>The calculator <code>${esc(item.calc)}</code> is not available on this page yet.</p></details>`;
  return {
    rail: `<button type="button" class="codebox__rail-btn" data-codebox-open aria-haspopup="dialog" aria-controls="${dialogId}" aria-label="${esc(item.label)}">${icon}</button>`,
    extra: `<dialog class="codebox__dialog" id="${dialogId}" aria-labelledby="${titleId}" aria-modal="true" tabindex="-1"><div class="codebox__dialog-bar"><button type="button" class="codebox__close" data-codebox-close>Close</button></div>${body}</dialog>${fallback}`,
  };
}

function renderBox(pre: string, lang: string, code: string, rail: CodeRailPlan['rails'][number], index: number): string {
  const parts = rail.items.map((item, itemIndex) => itemControl(item, code, index, itemIndex));
  const label = lang ? `<span class="codebox__lang">${esc(lang)}</span>` : '';
  return `<figure class="codebox"><div class="codebox__rail" role="group" aria-label="Code tools">${parts.map((part) => part.rail).join('')}</div><div class="codebox__main"><div class="codebox__bar">${label}<button type="button" class="codebox__copy" data-codebox-copy>Copy</button><span class="codebox__status" role="status"></span></div>${pre}</div>${parts.map((part) => part.extra).join('')}</figure>`;
}

/**
 * Wrap the `<pre>` elements whose code nodes named a rail. `plan.blocks` is that post's code
 * nodes in renderer visit order, including indented code and fences inside blockquotes, and
 * excluding `rail` sidecars. One block lines up with one rendered `<pre>`.
 */
export function decorateCodeBoxes(html: string, plan: CodeRailPlan): string {
  if (!plan.blocks.some((block) => block.railId)) return html;
  const byId = new Map(plan.rails.map((rail) => [rail.id, rail]));
  const spans = preSpans(html);
  if (spans.length !== plan.blocks.length) {
    throw new CodeBoxError(`rendered <pre> count is ${spans.length} and Markdown code-node count is ${plan.blocks.length}`);
  }
  let out = html;
  for (let i = spans.length - 1; i >= 0; i--) {
    const block = plan.blocks[i];
    if (!block.railId) continue;
    const rail = byId.get(block.railId);
    if (!rail) throw new CodeBoxError(`code fence rail=${block.railId} has no sidecar`);
    const pre = out.slice(spans[i].start, spans[i].end);
    out = out.slice(0, spans[i].start) + renderBox(pre, block.lang, block.code, rail, i) + out.slice(spans[i].end);
  }
  return out;
}
