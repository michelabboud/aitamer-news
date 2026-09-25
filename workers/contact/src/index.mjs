import { handleContactRequest } from './handler.mjs';

/**
 * The Worker serves exactly one path; everything else is a 404, so the hostname exposes nothing else.
 * Not exported: every named export of a Worker's entry module is treated as an entrypoint, and a
 * non-handler export makes the runtime refuse to start the Worker.
 */
const CONTACT_PATH = '/';

export default {
  /**
   * @param {Request} request
   * @param {import('./handler.mjs').ContactEnv} env
   */
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname !== CONTACT_PATH) {
      return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    return handleContactRequest(request, env);
  },
};
