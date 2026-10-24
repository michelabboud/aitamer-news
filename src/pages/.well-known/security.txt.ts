import type { APIContext } from 'astro';
import { securityTxt } from '../../lib/security-txt.ts';
import { CONTACT_FORM_LIVE } from '../../lib/site';

export function GET(_context: APIContext) {
  return new Response(securityTxt(new Date(), { contactFormLive: CONTACT_FORM_LIVE }), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
