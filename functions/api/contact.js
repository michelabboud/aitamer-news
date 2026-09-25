import { handleContactRequest } from '../contact-handler.mjs';

export function onRequest(context) {
  return handleContactRequest(context.request, context.env);
}
