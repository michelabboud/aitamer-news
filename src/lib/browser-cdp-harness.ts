/** Test-only Chromium pipe transport: every command and shutdown has a deadline. */
import type { ChildProcess } from 'node:child_process';
import type { Readable, Writable } from 'node:stream';

export const CDP_COMMAND_TIMEOUT_MS = 10_000;
const CHROME_SHUTDOWN_TIMEOUT_MS = 2000;
interface PendingCommand {
  method: string;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class ChromePipeHarness {
  onEvent: (message: any) => void = () => {};
  stderr = '';
  private readonly chrome: ChildProcess;
  private readonly input: Writable;
  private readonly commandTimeoutMs: number;
  private readonly shutdownTimeoutMs: number;
  private readonly pending = new Map<number, PendingCommand>();
  private readonly shutdownFailures: string[] = [];
  private id = 0;
  private buffer = '';
  private terminalReason?: string;
  private closed = false;
  private shutdownTask?: Promise<void>;

  constructor(chrome: ChildProcess, options: { commandTimeoutMs?: number; shutdownTimeoutMs?: number } = {}) {
    this.chrome = chrome;
    this.commandTimeoutMs = options.commandTimeoutMs ?? CDP_COMMAND_TIMEOUT_MS;
    this.shutdownTimeoutMs = options.shutdownTimeoutMs ?? CHROME_SHUTDOWN_TIMEOUT_MS;
    this.input = chrome.stdio[3] as Writable;
    const output = chrome.stdio[4] as Readable;
    chrome.stderr?.on('data', (bytes) => { this.stderr += bytes.toString(); });
    chrome.on('error', (error) => this.abort(`Chrome launch/process error: ${error.message}`));
    chrome.on('exit', (code, signal) => this.abort(`Chrome exited with code ${code}, signal ${signal ?? 'none'}`));
    chrome.on('close', (code, signal) => {
      this.closed = true;
      this.abort(`Chrome closed with code ${code}, signal ${signal ?? 'none'}`);
    });
    this.input.on('error', (error) => this.abort(`Chrome CDP input error: ${error.message}`));
    this.input.on('close', () => this.abort('Chrome CDP input closed'));
    output.on('error', (error) => this.abort(`Chrome CDP output error: ${error.message}`));
    output.on('end', () => this.abort('Chrome CDP output ended (EOF)'));
    output.on('close', () => this.abort('Chrome CDP output closed'));
    output.on('data', (bytes) => {
      this.buffer += bytes.toString();
      let end: number;
      while ((end = this.buffer.indexOf('\0')) >= 0) {
        const frame = this.buffer.slice(0, end);
        this.buffer = this.buffer.slice(end + 1);
        try {
          const message = JSON.parse(frame);
          if (message.id) {
            const waiter = this.pending.get(message.id);
            if (!waiter) continue;
            this.pending.delete(message.id);
            clearTimeout(waiter.timer);
            if (message.error) waiter.reject(new Error(`CDP ${waiter.method} failed: ${JSON.stringify(message.error)}\n${this.diagnostics()}`));
            else waiter.resolve(message.result);
          } else this.onEvent(message);
        } catch (error) {
          this.abort(`Invalid CDP frame/event: ${String(error)}`);
        }
      }
    });
  }

  diagnostics(): string {
    return [`Chrome exit code ${this.chrome.exitCode ?? 'pending'}, signal ${this.chrome.signalCode ?? 'none'}`,
      this.terminalReason, ...this.shutdownFailures, `Chrome stderr:\n${this.stderr || '(empty)'}`].filter(Boolean).join('\n');
  }

  abort(reason: string): void {
    this.terminalReason ??= reason;
    for (const waiter of this.pending.values()) {
      clearTimeout(waiter.timer);
      waiter.reject(new Error(`${reason}; pending CDP command ${waiter.method}\n${this.diagnostics()}`));
    }
    this.pending.clear();
  }

  call(method: string, params: object = {}, sessionId?: string, timeoutMs = this.commandTimeoutMs): Promise<any> {
    if (this.terminalReason) return Promise.reject(new Error(`${this.terminalReason}\n${this.diagnostics()}`));
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      const timer = setTimeout(() => this.abort(`CDP command ${method} timed out after ${timeoutMs}ms`), timeoutMs);
      this.pending.set(id, { method, resolve, reject, timer });
      try {
        this.input.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0', (error) => {
          if (error) this.abort(`Chrome CDP write error: ${error.message}`);
        });
      } catch (error) {
        this.abort(`Chrome CDP write failed: ${String(error)}`);
      }
    });
  }

  private waitForClose(): Promise<boolean> {
    if (this.closed) return Promise.resolve(true);
    return new Promise((resolve) => {
      const closed = () => { clearTimeout(timer); resolve(true); };
      const timer = setTimeout(() => { this.chrome.removeListener('close', closed); resolve(false); }, this.shutdownTimeoutMs);
      this.chrome.once('close', closed);
    });
  }

  shutdown(): Promise<void> {
    return this.shutdownTask ??= (async () => {
      try {
        if (!this.closed && !this.terminalReason) await this.call('Browser.close', {}, undefined, this.shutdownTimeoutMs);
      } catch (error) {
        this.shutdownFailures.push(`Chrome shutdown: ${String(error)}`);
      } finally {
        if (!this.closed) this.chrome.kill('SIGTERM');
        if (!await this.waitForClose()) {
          this.chrome.kill('SIGKILL');
          if (!await this.waitForClose()) this.shutdownFailures.push('Chrome did not close after bounded SIGTERM/SIGKILL shutdown');
        }
        this.abort('Chrome harness shut down');
      }
    })();
  }
}
