// Wrap a shell command for print so that copying it from the PDF still gives a valid command.
// Breaks only at spaces outside quotes, and ends every broken line with ` \` (a shell line
// continuation). Existing ` \` + newline breaks in the source are kept. A single word longer
// than the width is never split; the caller shrinks the font for that command instead.

/** Split one physical line into words at spaces that are not inside '…' or "…". */
export function shellWords(line) {
  const words = [];
  let cur = '', quote = null;
  for (const ch of line) {
    if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"') { quote = ch; cur += ch; continue; }
    if (ch === ' ') { if (cur) words.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (quote) throw new Error(`Unbalanced quote in command: ${line}`);
  if (cur) words.push(cur);
  return words;
}

/**
 * @param {string} cmd   command, possibly already multi-line with ` \` continuations
 * @param {number} width max characters per printed line
 * @returns {{ text: string, longest: number }} wrapped text and its longest line length
 */
export function wrapCommand(cmd, width) {
  const out = [];
  const sourceLines = cmd.split('\n');
  sourceLines.forEach((raw, i) => {
    const indent = raw.match(/^ */)[0] || (i > 0 ? '  ' : '');
    const cont = raw.trimEnd().endsWith(' \\');
    const body = raw.trim().replace(/ \\$/, '');
    const words = shellWords(body);
    let line = indent;
    const lines = [];
    for (const w of words) {
      const candidate = line.trim() ? `${line} ${w}` : `${line}${w}`;
      // room for the trailing " \" on any line that is not the last
      if (line.trim() && candidate.length + 2 > width) { lines.push(line); line = `${indent || '  '}${w}`; }
      else line = candidate;
    }
    lines.push(line);
    lines.forEach((l, j) => {
      const last = j === lines.length - 1;
      out.push(last ? (cont ? `${l} \\` : l) : `${l} \\`);
    });
  });
  return { text: out.join('\n'), longest: Math.max(...out.map((l) => l.length)) };
}
