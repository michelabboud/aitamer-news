// The production deploy's safety net (docs/adr/0014-verified-deploys.md), held in place: a later
// edit that drops the preview, a smoke test or the rollback, or reorders them, fails here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';

const workflow = yaml.load(readFileSync(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8'));
const { settle, deploy } = workflow.jobs;
const steps = deploy.steps;
const index = (predicate, what) => {
  const i = steps.findIndex(predicate);
  assert.ok(i >= 0, `deploy-pages.yml has ${what}`);
  return i;
};
const runs = (pattern) => (step) => typeof step.run === 'string' && pattern.test(step.run);
const deploysTo = (branch) => (step) => typeof step.with?.command === 'string' && step.with.command.includes('pages deploy') && step.with.command.endsWith(`--branch=${branch}`);

test('a burst of merges becomes one deploy, and a started deploy is never cut short', () => {
  assert.deepEqual(settle.concurrency, { group: 'pages-settle', 'cancel-in-progress': true });
  assert.deepEqual(deploy.concurrency, { group: 'pages-production', 'cancel-in-progress': false });
  assert.equal(deploy.needs, 'settle');
  assert.equal(workflow.concurrency, undefined, 'a workflow-level group would cancel a deploy mid-flight');
  assert.ok(settle.steps.every((step) => !step.uses), 'the settle job only waits: cancelling it can interrupt nothing');
});

test('checks, then a preview and its smoke test, then production and its smoke test, then the rollback', () => {
  index(runs(/npm run check:links\b/), 'the link check');
  index(runs(/npm run check:diagrams:dist\b/), 'the shipped-diagram check');
  const lastCheck = index(runs(/^npm run check:media$/), 'the media check (every live post\'s hero is uploaded, ADR 0020)');
  const live = index(runs(/pages-api\.mjs live\b/), 'the rollback target recorded');
  const preview = index(deploysTo('deploy-candidate'), 'a preview deploy');
  const smokePreview = index(runs(/smoke-site\.mjs .*--expect preview\b/), 'a preview smoke test');
  const production = index(deploysTo('main'), 'the production deploy');
  const smokeProduction = index(runs(/smoke-site\.mjs --base "\$SITE_URL" --expect production\b/), 'a production smoke test');
  const rollback = index(runs(/pages-api\.mjs rollback "\$TARGET"/), 'the rollback');
  const order = [lastCheck, live, preview, smokePreview, production, smokeProduction, rollback];
  assert.deepEqual([...order].sort((a, b) => a - b), order, `steps out of order: ${order.join(', ')}`);
  const uploads = steps.filter((step) => String(step.with?.command ?? '').includes('pages deploy'));
  assert.equal(uploads.length, 2, 'exactly two uploads: the preview and production');
});

test('the rollback runs only when this run put production live and its check then failed', () => {
  const rollback = steps.find(runs(/pages-api\.mjs rollback/));
  assert.equal(rollback.if, "failure() && steps.production.outcome == 'success' && steps.live.outputs.deployment-id != ''");
  assert.equal(steps.find(deploysTo('main')).id, 'production');
  assert.equal(steps.find(runs(/pages-api\.mjs live\b/)).id, 'live');
  assert.equal(rollback.env.TARGET, '${{ steps.live.outputs.deployment-id }}');
});

test('the smoke tests read their addresses from the environment, and production is the real domain', () => {
  const smokePreview = steps.find(runs(/--expect preview\b/));
  assert.equal(smokePreview.env.PREVIEW_URL, '${{ steps.preview.outputs.deployment-url }}');
  assert.ok(!/\$\{\{/.test(smokePreview.run), 'no expression is pasted into the shell');
  const config = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8');
  const site = /process\.env\.ASTRO_SITE \?\? '([^']+)'/.exec(config)?.[1];
  assert.equal(deploy.env.SITE_URL, site, 'the production check targets the site the build is for');
  assert.equal(deploy.env.PAGES_PROJECT, 'aitamer-news');
  for (const step of steps.filter((s) => String(s.with?.command ?? '').includes('pages deploy'))) {
    assert.match(step.with.command, /--project-name=aitamer-news /);
  }
});

test('the media check runs with no argument (live posts only, never a --local comparison) and is never skipped', () => {
  const media = steps.find(runs(/check:media/));
  assert.equal(media.run, 'npm run check:media');
  assert.equal(media.if, undefined, 'a condition could skip it');
  assert.equal(media['continue-on-error'], undefined, 'a failure must stop the deploy');
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts['check:media'], 'node scripts/check-media.mjs');
});

test('production deploys build the repository without reviewed publication admission', () => {
  const build = steps.find(runs(/^npm run build$/));
  assert.ok(build, 'the repository build is present');
  assert.equal(build.if, undefined, 'a publication decision cannot suppress the build');
  assert.equal(build['working-directory'], undefined, 'the normal repository is built');
  assert.deepEqual(Object.keys(workflow.on.workflow_dispatch.inputs), ['wait']);
  for (const step of steps) {
    assert.doesNotMatch(JSON.stringify(step), /publication-cli|steps\.publication|PUBLICATION_/, 'inactive admission is absent from production steps');
    assert.equal(step['working-directory'], undefined, 'checks use the repository build');
  }
  for (const branch of ['deploy-candidate', 'main']) {
    const upload = steps.find(deploysTo(branch));
    assert.equal(upload.with.command, `pages deploy dist --project-name=aitamer-news --branch=${branch}`);
    assert.equal(upload.if, undefined, 'every checked build is uploaded');
  }
});

test('the secondary schedule checks recently due posts before dispatching the normal deploy', () => {
  const schedule = yaml.load(readFileSync(new URL('../.github/workflows/scheduled-publish.yml', import.meta.url), 'utf8'));
  const scheduledSteps = schedule.jobs['check-due'].steps;
  const install = scheduledSteps.findIndex((step) => step.run === 'npm ci --omit=dev --ignore-scripts');
  const due = scheduledSteps.findIndex((step) => step.id === 'due');
  const trigger = scheduledSteps.findIndex((step) => String(step.run ?? '').startsWith('gh workflow run'));
  assert.ok(install >= 0 && install < due && due < trigger, 'dependencies and due detection precede dispatch');
  assert.equal(scheduledSteps[due].run, 'node scripts/due-posts.mjs --window-minutes 65');
  assert.equal(scheduledSteps[trigger].if, "steps.due.outputs.due == 'true'", 'empty due windows cause no deployment');
  assert.equal(scheduledSteps[trigger].run, 'gh workflow run deploy-pages.yml -R michelabboud/aitamer-news --ref main');
  assert.equal(scheduledSteps[trigger].env.GH_TOKEN, '${{ secrets.GITHUB_TOKEN }}');
  assert.deepEqual(schedule.on.schedule, [{ cron: '7,37 * * * *' }]);
});
