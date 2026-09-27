import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { API_BASE, config, main } from './pages-api.mjs';
import { tempDir } from './test-support.mjs';

// Built at run time: a 32-hex literal next to an account key would trip no-account-details.test.mjs.
const ACCOUNT = 'ab'.repeat(16);
const LIVE = '0f1e2d3c-4b5a-6978-8a9b-acbdcedf0f1e';
const ENV = { CLOUDFLARE_API_TOKEN: 'tok', CLOUDFLARE_ACCOUNT_ID: ACCOUNT, PAGES_PROJECT: 'aitamer-news' };

/** A fake fetch that answers from `routes` ("METHOD path" → [status, body]) and records the calls. */
function fakeApi(routes) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const path = url.slice(API_BASE.length);
    calls.push({ method: init.method, path, auth: init.headers.authorization });
    const [status, body] = routes[`${init.method} ${path}`] ?? [404, { success: false, errors: [{ code: 7003, message: 'no route' }] }];
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  };
  return { fetchImpl, calls };
}

function io() {
  const lines = [];
  return { lines, log: (s) => lines.push(s), error: (s) => lines.push(s) };
}

const PROJECT_PATH = `/accounts/${ACCOUNT}/pages/projects/aitamer-news`;

test('live: names the production deployment serving now, as the step output', async () => {
  const api = fakeApi({ [`GET ${PROJECT_PATH}`]: [200, { success: true, result: { canonical_deployment: { id: LIVE, latest_stage: { status: 'success' } } } }] });
  const out = join(tempDir('pages-api-'), 'output');
  const o = io();
  assert.equal(await main(['live'], { ...ENV, GITHUB_OUTPUT: out }, api.fetchImpl, o), 0);
  assert.equal(readFileSync(out, 'utf8'), `deployment-id=${LIVE}\n`);
  assert.deepEqual(api.calls, [{ method: 'GET', path: PROJECT_PATH, auth: 'Bearer tok' }]);
  assert.ok(!o.lines.join('\n').includes(ACCOUNT), 'the account id is never printed');
});

test('live: a project with no production deployment warns and gives an empty target', async () => {
  const api = fakeApi({ [`GET ${PROJECT_PATH}`]: [200, { success: true, result: { canonical_deployment: null } }] });
  const out = join(tempDir('pages-api-'), 'output');
  const o = io();
  assert.equal(await main(['live'], { ...ENV, GITHUB_OUTPUT: out }, api.fetchImpl, o), 0);
  assert.equal(readFileSync(out, 'utf8'), 'deployment-id=\n');
  assert.match(o.lines.join('\n'), /cannot be rolled back/);
});

test('rollback: posts to the deployment\'s rollback endpoint', async () => {
  const api = fakeApi({ [`POST ${PROJECT_PATH}/deployments/${LIVE}/rollback`]: [200, { success: true, result: { id: LIVE } }] });
  const o = io();
  assert.equal(await main(['rollback', LIVE], ENV, api.fetchImpl, o), 0);
  assert.equal(api.calls.length, 1);
  assert.match(o.lines.join('\n'), new RegExp(`rolled production back to ${LIVE}`));
});

test('an API refusal fails with Cloudflare\'s reason, and the account id hidden', async () => {
  const api = fakeApi({ [`POST ${PROJECT_PATH}/deployments/${LIVE}/rollback`]: [400, { success: false, errors: [{ code: 8000000, message: `account ${ACCOUNT}: not a production deployment` }] }] });
  const o = io();
  assert.equal(await main(['rollback', LIVE], ENV, api.fetchImpl, o), 1);
  const text = o.lines.join('\n');
  assert.match(text, /answered 400: 8000000: account <account>: not a production deployment/);
  assert.ok(!text.includes(ACCOUNT));
});

test('a body that is not JSON, an unreachable API, or success:false with 200 all fail', async () => {
  const notJson = fakeApi({ [`GET ${PROJECT_PATH}`]: [502, '<html>bad gateway</html>'] });
  assert.equal(await main(['live'], ENV, notJson.fetchImpl, io()), 1);
  const down = async () => {
    throw new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } });
  };
  const o = io();
  assert.equal(await main(['live'], ENV, down, o), 1);
  assert.match(o.lines.join('\n'), /could not be reached: ENOTFOUND/);
  const quietRefusal = fakeApi({ [`GET ${PROJECT_PATH}`]: [200, { success: false, errors: [] }] });
  assert.equal(await main(['live'], ENV, quietRefusal.fetchImpl, io()), 1);
});

test('refuses what should never reach a URL: a bad id, a bad live id, missing or malformed settings', async () => {
  const api = fakeApi({});
  assert.equal(await main(['rollback', '../../evil'], ENV, api.fetchImpl, io()), 1);
  assert.equal(api.calls.length, 0);
  const weird = fakeApi({ [`GET ${PROJECT_PATH}`]: [200, { success: true, result: { canonical_deployment: { id: '../x' } } }] });
  assert.equal(await main(['live'], ENV, weird.fetchImpl, io()), 1);
  assert.throws(() => config({ ...ENV, CLOUDFLARE_API_TOKEN: ' ' }), /TOKEN is not set/);
  assert.throws(() => config({ ...ENV, CLOUDFLARE_ACCOUNT_ID: 'nope' }), /not an account id/);
  assert.throws(() => config({ ...ENV, PAGES_PROJECT: 'Bad/Name' }), /not a Pages project name/);
  for (const args of [[], ['live', 'extra'], ['rollback'], ['deploy']]) assert.equal(await main(args, ENV, api.fetchImpl, io()), 2, args.join(' '));
});
