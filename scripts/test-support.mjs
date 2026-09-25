/**
 * Helpers shared by the stamper tests (not a test file: the test glob is `scripts/*.test.mjs`).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Run `fn` with console output captured instead of printed.
 * @template T @param {() => T} fn @returns {{ result: T, output: string }}
 */
export function quietly(fn) {
  const saved = { log: console.log, error: console.error, warn: console.warn };
  const lines = [];
  console.log = console.error = console.warn = (...args) => lines.push(args.join(' '));
  try {
    return { result: fn(), output: lines.join('\n') };
  } finally {
    Object.assign(console, saved);
  }
}

/** @param {string} prefix @returns {string} a fresh temporary directory */
export function tempDir(prefix) {
  return mkdtempSync(join(tmpdir(), prefix));
}

/**
 * A throwaway git repository with a fixed identity, independent of the user's git config.
 * @param {string} dir
 * @returns {(args: string[], env?: Record<string, string>) => string} runs git in `dir`
 */
export function gitIn(dir) {
  const run = (args, env = {}) =>
    execFileSync(
      'git',
      ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', '-c', 'init.defaultBranch=main', ...args],
      { cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', ...env } },
    );
  run(['init', '-q']);
  return run;
}
