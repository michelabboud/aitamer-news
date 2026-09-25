/** Limits for the About page contact form. The Pages Function is the authority. */
export const NAME_MAX = 80;
export const EMAIL_MAX = 254;
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 4000;

/** Sender on aitamer.news. The domain has to be onboarded to Cloudflare Email before a send succeeds. */
export const DESK_FROM = 'desk@aitamer.news';
export const DESK_FROM_NAME = 'AI Tamer';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {FormData} fields
 * @returns {{ ok: true, value: { name: string, email: string, message: string } } | { ok: false, error: string } | { ok: true, ignore: true }}
 */
export function parseContactFields(fields) {
  const honeypot = String(fields.get('company') ?? '').trim();
  if (honeypot) return { ok: true, ignore: true };

  const name = oneLine(fields.get('name'));
  const email = oneLine(fields.get('email')).toLowerCase();
  const message = String(fields.get('message') ?? '').replace(/\0/g, '').trim();

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
  return {
    to,
    from: { email: DESK_FROM, name: DESK_FROM_NAME },
    replyTo: { email: value.email, name: value.name },
    subject: `Note from ${value.name}`.slice(0, 120),
    text: [`Name: ${value.name}`, `Email: ${value.email}`, '', value.message].join('\n'),
  };
}

function oneLine(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}
