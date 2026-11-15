/**
 * Code-rail authoring. A fenced block may name a rail in its info string (`bash rail=get-nodes`).
 * A sidecar fence with the language `rail` holds the icons and the popup copy for that id.
 * The markdown plugin strips both so the rendered body stays an ordinary highlighted block.
 * The story page reads this same parse and draws the chrome around that block.
 *
 * Kinds live in `RAIL_REGISTRY`. `explain` and `link` render today. `calc` is a reserved stub:
 * the button opens a dialog that names the calculator id, and a later change can replace that
 * dialog with a real calculator without a new authoring syntax.
 */
import { JSON_SCHEMA, load } from 'js-yaml';
import { markdownToMdast, type MdastNode } from 'satteri';

export const RAIL_KINDS = ['explain', 'link', 'calc'] as const;
export type RailKind = (typeof RAIL_KINDS)[number];

export interface RailKindSpec {
  kind: RailKind;
  /** `active` renders a finished control. `stub` reserves the kind for a later renderer. */
  status: 'active' | 'stub';
  summary: string;
}

export const RAIL_REGISTRY: readonly RailKindSpec[] = Object.freeze([
  Object.freeze({
    kind: 'explain',
    status: 'active',
    summary: 'A button that opens a dialog with the fenced command and one line per flag or parameter.',
  }),
  Object.freeze({
    kind: 'link',
    status: 'active',
    summary: 'An anchor in the rail. The href is an https URL or a site path starting with /.',
  }),
  Object.freeze({
    kind: 'calc',
    status: 'stub',
    summary: 'Reserved for a small calculator. The button opens a dialog that names the calc id until a renderer is registered for it.',
  }),
]);

const RAIL_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NOT_PLAIN = /[\u0000-\u001f\u007f-\u009f<>\u00ad\u061c\u180e\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff\ufff9-\ufffb]/;
/** Tokens may contain `<` and `>` (`2>&1`). Explanations may not, so they cannot carry markup. */
const NOT_PLAIN_TOKEN = /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u180e\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff\ufff9-\ufffb]/;

export class CodeRailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodeRailError';
  }
}

export interface ExplainLine {
  token: string;
  text: string;
}

export interface ExplainRailItem {
  kind: 'explain';
  label: string;
  lines: ExplainLine[];
}

export interface LinkRailItem {
  kind: 'link';
  label: string;
  href: string;
}

export interface CalcRailItem {
  kind: 'calc';
  label: string;
  /** Id a later calculator renderer will look up. */
  calc: string;
}

export type RailItem = ExplainRailItem | LinkRailItem | CalcRailItem;

export interface CodeRail {
  id: string;
  items: RailItem[];
}

export interface CodeFence {
  lang: string;
  meta: string;
  /** Code value from the Markdown parser, with container indentation removed. */
  code: string;
  railId?: string;
}

export interface ParsedCodeRails {
  /** All displayed Markdown code blocks in source order, including nested and indented code. */
  fences: CodeFence[];
  rails: CodeRail[];
}

export function railKind(kind: string): RailKindSpec | undefined {
  return RAIL_REGISTRY.find((spec) => spec.kind === kind);
}

/** The `rail=<id>` token in a fence info string, if it is the only such token. */
export function railIdFromMeta(meta: string | null | undefined): string | undefined {
  if (!meta) return undefined;
  const found = [...meta.matchAll(/(?:^|\s)rail=([a-z0-9]+(?:-[a-z0-9]+)*)(?=\s|$)/g)].map((match) => match[1]);
  return found.length === 1 ? found[0] : undefined;
}

/** Fence info with every `rail=<id>` token removed. */
export function stripRailMeta(meta: string): string {
  return meta.replace(/(?:^|\s)rail=[a-z0-9]+(?:-[a-z0-9]+)*(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
}

export function sourceHasCodeRail(source: string): boolean {
  return codeNodes(source).some((node) => node.lang === 'rail' || /(?:^|\s)rail=/.test(node.meta ?? ''));
}

/** Use the renderer's parser so containers, frontmatter and literal examples agree everywhere. */
function codeNodes(source: string): Extract<MdastNode, { type: 'code' }>[] {
  const nodes: Extract<MdastNode, { type: 'code' }>[] = [];
  const visit = (node: MdastNode) => {
    if (node.type === 'code') nodes.push(node);
    if ('children' in node && node.children) node.children.forEach(visit);
  };
  visit(markdownToMdast(source));
  return nodes;
}

function plain(value: unknown, where: string, max: number, pattern = NOT_PLAIN): string {
  if (typeof value !== 'string') throw new CodeRailError(`${where} must be a string`);
  const text = value.trim();
  if (!text) throw new CodeRailError(`${where} is empty`);
  if (pattern.test(value)) throw new CodeRailError(`${where} must be plain text`);
  if ([...text].length > max) throw new CodeRailError(`${where} is longer than ${max} characters`);
  return text;
}

function linkHref(value: unknown, where: string): string {
  const href = plain(value, where, 400);
  if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/\\')) return href;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    throw new CodeRailError(`${where} must be an https URL or a site path`);
  }
  if (url.protocol !== 'https:' || href !== url.href) throw new CodeRailError(`${where} must be an https URL or a site path`);
  return href;
}

function parseItem(value: unknown, where: string): RailItem {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new CodeRailError(`${where} must be an object`);
  const record = value as Record<string, unknown>;
  const kind = record.kind;
  if (typeof kind !== 'string' || !railKind(kind)) throw new CodeRailError(`${where}.kind must be explain, link or calc`);
  const label = plain(record.label, `${where}.label`, 80);
  if (kind === 'explain') {
    if (!Array.isArray(record.lines) || record.lines.length === 0) throw new CodeRailError(`${where}.lines must list at least one line`);
    if (record.lines.length > 40) throw new CodeRailError(`${where}.lines lists more than 40 lines`);
    const lines = record.lines.map((line, index) => {
      if (line === null || typeof line !== 'object' || Array.isArray(line)) throw new CodeRailError(`${where}.lines[${index + 1}] must be an object`);
      const row = line as Record<string, unknown>;
      return {
        token: plain(row.token, `${where}.lines[${index + 1}].token`, 300, NOT_PLAIN_TOKEN),
        text: plain(row.text, `${where}.lines[${index + 1}].text`, 500),
      };
    });
    return { kind, label, lines };
  }
  if (kind === 'link') return { kind, label, href: linkHref(record.href, `${where}.href`) };
  const calc = plain(record.calc, `${where}.calc`, 80);
  if (!RAIL_ID.test(calc)) throw new CodeRailError(`${where}.calc must be a lowercase slug`);
  return { kind, label, calc };
}

function parseRailDocument(body: string, where: string): CodeRail {
  let data: unknown;
  try {
    data = load(body, { schema: JSON_SCHEMA });
  } catch (error) {
    throw new CodeRailError(`${where} is not valid YAML (${error instanceof Error ? error.message : String(error)})`);
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) throw new CodeRailError(`${where} must be a YAML object`);
  const record = data as Record<string, unknown>;
  const id = plain(record.id, `${where} id`, 80);
  if (!RAIL_ID.test(id)) throw new CodeRailError(`${where} id must be a lowercase slug`);
  if (!Array.isArray(record.items) || record.items.length === 0) throw new CodeRailError(`${where} items must list at least one rail item`);
  if (record.items.length > 8) throw new CodeRailError(`${where} items lists more than 8 items`);
  return { id, items: record.items.map((item, index) => parseItem(item, `${where} items[${index + 1}]`)) };
}

/**
 * Read rail sidecars and all displayed code blocks from one Markdown file. Frontmatter and
 * literal fence examples are interpreted by Sätteri. Throws a `CodeRailError` for invalid rails.
 */
export function parseCodeRails(markdown: string): ParsedCodeRails {
  const fences: CodeFence[] = [];
  const rails: CodeRail[] = [];
  for (const node of codeNodes(markdown)) {
    const lang = node.lang ?? '';
    const meta = node.meta ?? '';
    const code = node.value;
    const line = node.position?.start.line;
    if (lang === 'rail') {
      rails.push(parseRailDocument(code, `rail fence on line ${line}`));
    } else {
      const railId = railIdFromMeta(meta);
      if (/(?:^|\s)rail=/.test(meta) && !railId) throw new CodeRailError(`code fence on line ${line} has a rail= token that is not a single lowercase id`);
      fences.push({ lang, meta: stripRailMeta(meta), code, ...(railId ? { railId } : {}) });
    }
  }

  const byId = new Map<string, CodeRail>();
  for (const rail of rails) {
    if (byId.has(rail.id)) throw new CodeRailError(`rail id "${rail.id}" is used twice`);
    byId.set(rail.id, rail);
  }
  const used = new Set<string>();
  for (const fence of fences) {
    if (!fence.railId) continue;
    if (!byId.has(fence.railId)) throw new CodeRailError(`code fence rail=${fence.railId} has no rail sidecar`);
    used.add(fence.railId);
  }
  for (const rail of rails) {
    if (!used.has(rail.id)) throw new CodeRailError(`rail sidecar "${rail.id}" is not referenced by a code fence`);
  }
  return { fences, rails };
}
