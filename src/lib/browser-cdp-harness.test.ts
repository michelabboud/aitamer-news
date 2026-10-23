import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import { ChromePipeHarness } from './browser-cdp-harness.ts';

function browser(source: string) {
  return spawn(process.execPath, ['-e', source], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
}

test('Chrome exit rejects every pending command and retains stderr and exit diagnostics', { timeout: 5000 }, async (t) => {
  const chrome = browser('process.stderr.write("fixture launch failed\\n"); process.exit(7);');
  const harness = new ChromePipeHarness(chrome, { commandTimeoutMs: 1000, shutdownTimeoutMs: 100 });
  t.after(() => harness.shutdown());
  const commands = await Promise.allSettled([harness.call('Target.createTarget'), harness.call('Runtime.enable')]);
  await harness.shutdown();
  assert.ok(commands.every((result) => result.status === 'rejected'));
  assert.match(harness.diagnostics(), /code 7/);
  assert.match(harness.diagnostics(), /fixture launch failed/);
  await assert.rejects(harness.call('Browser.close'), /Chrome|CDP/);
});

test('an unanswered CDP command has a deadline and shutdown terminates a hung process', { timeout: 5000 }, async (t) => {
  const chrome = browser('setInterval(() => {}, 1000);');
  const harness = new ChromePipeHarness(chrome, { commandTimeoutMs: 40, shutdownTimeoutMs: 100 });
  t.after(() => harness.shutdown());
  await assert.rejects(harness.call('Runtime.evaluate'), /Runtime\.evaluate.*timed out.*40/);
  await harness.shutdown();
  assert.ok(chrome.exitCode !== null || chrome.signalCode !== null);
});

test('CDP pipe EOF rejects commands even while Chrome stays alive', { timeout: 5000 }, async (t) => {
  const chrome = browser('require("node:fs").closeSync(4); setInterval(() => {}, 1000);');
  const harness = new ChromePipeHarness(chrome, { commandTimeoutMs: 1000, shutdownTimeoutMs: 100 });
  t.after(() => harness.shutdown());
  await assert.rejects(harness.call('Target.createTarget'), /CDP.*(ended|closed|EOF)/);
  await harness.shutdown();
  assert.ok(chrome.exitCode !== null || chrome.signalCode !== null);
});

test('launch errors reject commands instead of leaving pending promises', { timeout: 5000 }, async (t) => {
  const chrome = spawn('aitamer-intentionally-absent-chrome', [], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
  const harness = new ChromePipeHarness(chrome, { commandTimeoutMs: 1000, shutdownTimeoutMs: 100 });
  t.after(() => harness.shutdown());
  await assert.rejects(harness.call('Target.createTarget'), /ENOENT|launch|CDP/);
  await harness.shutdown();
});

test('malformed CDP frames reject commands with a protocol diagnostic', { timeout: 5000 }, async (t) => {
  const chrome = browser('require("node:fs").writeSync(4, "invalid-json\\0"); setInterval(() => {}, 1000);');
  const harness = new ChromePipeHarness(chrome, { commandTimeoutMs: 1000, shutdownTimeoutMs: 100 });
  t.after(() => harness.shutdown());
  await assert.rejects(harness.call('Target.createTarget'), /Invalid CDP/);
  await harness.shutdown();
});

test('Browser.close cannot hold shutdown open when an otherwise live Chrome stops answering', { timeout: 5000 }, async (t) => {
  const chrome = browser('setInterval(() => {}, 1000);');
  const harness = new ChromePipeHarness(chrome, { shutdownTimeoutMs: 100 });
  t.after(() => harness.shutdown());
  await harness.shutdown();
  assert.match(harness.diagnostics(), /Browser\.close.*timed out/);
  assert.ok(chrome.exitCode !== null || chrome.signalCode !== null);
});
