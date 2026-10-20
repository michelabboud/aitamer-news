import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';

const files = ['check-posts.yml', 'check-publisher-pr.yml', 'check-specimen-pr.yml'];
const imageRoute = /startsWith\([^)]*, 'images\/'\)/;

test('image branches receive observations, never ordinary required-check identities', () => {
  for (const name of files) {
    const workflow = yaml.load(readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8'));
    const job = Object.values(workflow.jobs)[0];
    assert.match(job.name, imageRoute, `${name}: images/ must use an observation name`);
    assert.match(job.name, /-observation/);
    for (const step of job.steps) {
      if (step.env?.ADMISSION_OBSERVATION) {
        assert.match(step.env.ADMISSION_OBSERVATION, imageRoute, `${name}: image policy cannot run article admission`);
      }
    }
  }
});
