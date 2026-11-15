// A tiny logic-light template engine for the lesson-kit HTML templates (no dependency).
//   {{path}}            HTML-escaped value
//   {{{path}}}          raw HTML
//   {{md path}}         escaped, then `code` and **bold** become <code> and <strong>
//   {{#each path}}…{{/each}}        loop; inside, `.` is the item, `@number` its 1-based position
//                                   (no `../`: unknown names fall through to outer scopes)
//   {{#if path}}…{{else}}…{{/if}}   truthy test (empty arrays are false)
//   {{> name}}          a partial passed to render()
// Paths are dotted (`lesson.title`). A name not found on the current item is looked up
// in the outer scopes, so loop bodies can still read top-level fields.

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function inlineMd(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function lookup(scopes, path) {
  if (path === '.') { const top = scopes[scopes.length - 1]; return top && '.' in top ? top['.'] : top; }
  const [head, ...rest] = path.split('.');
  for (let j = scopes.length - 1; j >= 0; j--) {
    const s = scopes[j];
    if (s !== null && typeof s === 'object' && head in s) {
      return rest.reduce((v, k) => (v == null ? v : v[k]), s[head]);
    }
  }
  return undefined;
}

function parse(tpl) {
  const re = /\{\{\{\s*([^}]+?)\s*\}\}\}|\{\{\s*([#/>]?)\s*([^}]*?)\s*\}\}/g;
  const root = { children: [] };
  const stack = [root];
  const target = () => { const top = stack[stack.length - 1]; return top.alt ?? top.children; };
  let last = 0, m;
  while ((m = re.exec(tpl))) {
    if (m.index > last) target().push({ t: 'text', v: tpl.slice(last, m.index) });
    last = re.lastIndex;
    if (m[1]) { target().push({ t: 'raw', v: m[1] }); continue; }
    const [, , sigil, body] = m;
    if (sigil === '#') {
      const [kind, ...arg] = body.split(/\s+/);
      const node = { t: kind, v: arg.join(' '), children: [] };
      target().push(node); stack.push(node);
    } else if (sigil === '/') {
      if (stack.length === 1) throw new Error(`Unmatched {{/${body}}}`);
      stack.pop();
    } else if (sigil === '>') {
      target().push({ t: 'partial', v: body });
    } else if (body === 'else') {
      stack[stack.length - 1].alt = [];
    } else if (body.startsWith('md ')) {
      target().push({ t: 'md', v: body.slice(3).trim() });
    } else {
      target().push({ t: 'var', v: body });
    }
  }
  if (stack.length !== 1) throw new Error(`Unclosed {{#${stack[stack.length - 1].t}}}`);
  root.children.push({ t: 'text', v: tpl.slice(last) });
  return root;
}

function run(nodes, scopes, partials) {
  let out = '';
  for (const n of nodes) {
    switch (n.t) {
      case 'text': out += n.v; break;
      case 'raw': out += String(lookup(scopes, n.v) ?? ''); break;
      case 'var': out += esc(lookup(scopes, n.v)); break;
      case 'md': out += inlineMd(lookup(scopes, n.v)); break;
      case 'partial':
        if (!(n.v in partials)) throw new Error(`Unknown partial ${n.v}`);
        out += run(parse(partials[n.v]).children, scopes, partials); break;
      case 'if': {
        const v = lookup(scopes, n.v);
        const ok = Array.isArray(v) ? v.length > 0 : Boolean(v);
        out += run(ok ? n.children : (n.alt ?? []), scopes, partials);
        break;
      }
      case 'each': {
        const list = lookup(scopes, n.v) ?? [];
        list.forEach((item, i) => {
          const frame = (item !== null && typeof item === 'object') ? { ...item } : {};
          frame['.'] = item; frame['@number'] = i + 1;
          out += run(n.children, [...scopes, frame], partials);
        });
        break;
      }
      default: throw new Error(`Unknown block {{#${n.t}}}`);
    }
  }
  return out;
}

export function render(tpl, data, partials = {}) {
  return run(parse(tpl).children, [data], partials);
}
