/** Limits for the About page contact form. The contact Worker is the authority; the form mirrors them. */
export const NAME_MAX = 80;
export const EMAIL_MAX = 254;
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 4000;

/** Sender on aitamer.news. It must be on a domain onboarded to Cloudflare Email Routing, and it is the only
 * sender the Worker's send_email binding allows (workers/contact/wrangler.toml). */
export const DESK_FROM = 'desk@aitamer.news';
export const DESK_FROM_NAME = 'AI Tamer';

/**
 * Hidden anti-bot field. The name must not be one browser autofill recognises
 * (company, organization, address…), or a real visitor's note would be dropped.
 */
export const HONEYPOT_FIELD = 'desk_extra';

/**
 * A plain address: no spaces, quotes, angle brackets, or separators that could turn one address into
 * a display name or a list. Stricter than RFC 5322 on purpose; real contact addresses pass.
 */
const EMAIL_PATTERN = /^[^\s@"<>(),;:\\[\]]+@[^\s@"<>(),;:\\[\]]+\.[^\s@"<>(),;:\\[\]]+$/;

/** Control characters and Unicode line/paragraph separators; none belong in a one-line field. */
const LINE_BREAKERS = /[\p{Cc}\u2028\u2029]+/gu;

/** Control characters that are not ordinary text layout (tab and newline stay in a note). */
const NOTE_CONTROLS = /[\p{Cc}\u2028\u2029]/gu;

/**
 * @param {FormData} fields
 * @returns {{ ok: true, value: { name: string, email: string, message: string } } | { ok: false, error: string } | { ok: true, ignore: true }}
 */
export function parseContactFields(fields) {
  const honeypot = String(fields.get(HONEYPOT_FIELD) ?? '').trim();
  if (honeypot) return { ok: true, ignore: true };

  const name = oneLine(fields.get('name'));
  const email = oneLine(fields.get('email')).toLowerCase();
  const message = String(fields.get('message') ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(NOTE_CONTROLS, (c) => (c === '\n' || c === '\t' ? c : ''))
    .trim();

  if (!name) return { ok: false, error: 'Add your name.' };
  if (name.length > NAME_MAX) return { ok: false, error: 'That name is too long.' };
  if (!email || email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: 'That email address does not look right.' };
  }
  if (message.length < MESSAGE_MIN) {
    return { ok: false, error: 'Write a short note. Ten characters is enough.' };
  }
  if (message.length > MESSAGE_MAX) return { ok: false, error: 'That note is too long.' };

  return { ok: true, value: { name, email, message } };
}

/**
 * @param {{ name: string, email: string, message: string }} value
 * @param {string} to
 */
export function contactLetter(value, to) {
  // Shape of the Workers send_email binding: named addresses use `email`, and `replyTo` is camelCase.
  return {
    to,
    from: { email: DESK_FROM, name: DESK_FROM_NAME },
    replyTo: { email: value.email, name: value.name },
    subject: `Note from ${value.name}`.slice(0, 120),
    text: [`Name: ${value.name}`, `Email: ${value.email}`, '', value.message].join('\n'),
  };
}

function oneLine(value) {
  return String(value ?? '').replace(LINE_BREAKERS, ' ').replace(/\s+/g, ' ').trim();
}
