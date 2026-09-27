#!/usr/bin/env node
/**
 * The two Cloudflare Pages API calls the deploy makes (docs/adr/0014-verified-deploys.md).
 *
 *   node scripts/pages-api.mjs live               the production deployment serving now: its id, as the
 *                                                 step output `deployment-id` (the rollback target)
 *   node scripts/pages-api.mjs rollback <id>      make that production deployment live again
 *
 * Environment: CLOUDFLARE_API_TOKEN (needs Pages Edit, which deploying already needs),
 * CLOUDFLARE_ACCOUNT_ID, PAGES_PROJECT. Exit 0 on success, 1 when the API refuses or fails, 2 on a
 * usage error.
 *
 * **The account id is never printed.** This is a public repository and its logs are public
 * (no-account-details.test.mjs): Cloudflare's own messages are shown with the id replaced, and URLs
 * are never logged. GitHub masks the secret too; this does not rely on it.
 *
 * API: GET  /accounts/{account}/pages/projects/{project}   → result.canonical_deployment
 *      POST /accounts/{account}/pages/projects/{project}/deployments/{id}/rollback
 * Cloudflare's rules for a rollback target: a production deployment that built successfully
 * (developers.cloudflare.com/pages/configuration/rollbacks/).
 */
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const API_BASE = 'https://api.cloudflare.com/client/v4';
/** How long one API call may take before the deploy gives up on it. */
export const API_TIMEOUT_MS = 30_000;
/** A Pages deployment id: a UUID. Anything else is refused before it reaches a URL. */
export const DEPLOYMENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Cloudflare's account ids are 32 hex characters; a project name is a DNS label. */
const ACCOUNT_ID = /^[0-9a-f]{32}$/;
const PROJECT = /^[a-z0-9](?:[a-z0-9-]{0,56}[a-z0-9])?$/;

export class PagesApiError extends Error {}

/**
 * @param {Record<string, string | undefined>} env
 * @returns {{ token: string, account: string, project: string }}
 */
export function config(env) {
  const token = env.CLOUDFLARE_API_TOKEN?.trim();
  const account = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const project = env.PAGES_PROJECT?.trim();
  if (!token) throw new PagesApiError('CLOUDFLARE_API_TOKEN is not set');
  if (!account || !ACCOUNT_ID.test(account)) throw new PagesApiError('CLOUDFLARE_ACCOUNT_ID is not set, or is not an account id');
  if (!project || !PROJECT.test(project)) throw new PagesApiError('PAGES_PROJECT is not set, or is not a Pages project name');
  return { token, account, project };
}

/** @param {string} text @param {string} account @returns {string} text with the account id hidden */
export const redact = (text, account) => String(text).split(account).join('<account>');

/**
 * One API call; returns `result`, or throws with Cloudflare's own reasons (account id hidden).
 * @param {{ token: string, account: string }} cfg @param {'GET' | 'POST'} method @param {string} path
 * @param {typeof fetch} fetchImpl
 */
export async function call(cfg, method, path, fetchImpl = fetch) {
  let res;
  try {
    res = await fetchImpl(`${API_BASE}/accounts/${cfg.account}${path}`, {
      method,
      headers: { authorization: `Bearer ${cfg.token}`, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
  } catch (err) {
    throw new PagesApiError(redact(`the Cloudflare API could not be reached: ${err.cause?.code ?? err.name}`, cfg.account));
  }
  let body;
  try {
    body = await res.json();
  } catch {
    throw new PagesApiError(`the Cloudflare API answered ${res.status} with a body that is not JSON`);
  }
  if (!res.ok || body?.success !== true) {
    const reasons = (body?.errors ?? []).map((e) => `${e.code ?? '?'}: ${e.message ?? ''}`).join('; ') || 'no reason given';
    throw new PagesApiError(redact(`the Cloudflare API answered ${res.status}: ${reasons}`, cfg.account));
  }
  return body.result;
}

/**
 * The production deployment serving now, or null when the project has none yet.
 * @returns {Promise<{ id: string, status: string } | null>}
 */
export async function liveDeployment(cfg, fetchImpl = fetch) {
  const project = await call(cfg, 'GET', `/pages/projects/${cfg.project}`, fetchImpl);
  const live = project?.canonical_deployment;
  if (!live) return null;
  if (!DEPLOYMENT_ID.test(live.id ?? '')) throw new PagesApiError('the live deployment has an id this script does not recognise');
  return { id: live.id, status: live.latest_stage?.status ?? 'unknown' };
}

/** Make production deployment `id` live again; returns the id Cloudflare reports as rolled back to. */
export async function rollback(cfg, id, fetchImpl = fetch) {
  if (!DEPLOYMENT_ID.test(id ?? '')) throw new PagesApiError(`${JSON.stringify(id)} is not a deployment id`);
  const result = await call(cfg, 'POST', `/pages/projects/${cfg.project}/deployments/${id}/rollback`, fetchImpl);
  return result?.id ?? null;
}

/** Append `name=value` to the step's outputs, when running as a GitHub Actions step. */
function output(name, value, env) {
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

/**
 * @param {string[]} args @param {Record<string, string | undefined>} env @param {typeof fetch} fetchImpl
 * @param {{ log: (s: string) => void, error: (s: string) => void }} io
 * @returns {Promise<number>} exit code
 */
export async function main(args, env = process.env, fetchImpl = fetch, io = console) {
  const [command, id] = args;
  if (!(command === 'live' && args.length === 1) && !(command === 'rollback' && args.length === 2)) {
    io.error('usage: node scripts/pages-api.mjs live | rollback <deployment-id>');
    return 2;
  }
  try {
    const cfg = config(env);
    if (command === 'live') {
      const live = await liveDeployment(cfg, fetchImpl);
      if (!live) {
        io.log('::warning::the project has no production deployment yet, so a failed deploy cannot be rolled back');
        output('deployment-id', '', env);
        return 0;
      }
      if (live.status !== 'success') io.log(`::warning::the live deployment ${live.id} reports status ${live.status}; it is still the rollback target`);
      io.log(`live production deployment: ${live.id}`);
      output('deployment-id', live.id, env);
      return 0;
    }
    const restored = await rollback(cfg, id, fetchImpl);
    io.log(`rolled production back to ${restored ?? id}`);
    return 0;
  } catch (err) {
    if (!(err instanceof PagesApiError)) throw err;
    io.error(`::error::pages-api ${command}: ${err.message}`);
    return 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
