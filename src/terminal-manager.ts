import { ChildProcess, spawn } from "node:child_process";

export interface TerminalCreateParams {
  command: string; // single shell-quoted string per ACP
  env?: Array<{ name: string; value: string }>;
  cwd?: string;
  outputByteLimit?: number;
}

export interface TerminalOutputResult {
  output: string;
  exitStatus: { exitCode: number } | null;
  truncated: boolean;
}

interface TerminalEntry {
  proc: ChildProcess;
  buf: string;
  byteLen: number;
  truncated: boolean;
  exitCode: number | null;
  exitListeners: Array<(code: number) => void>;
  byteLimit: number;
}

const DEFAULT_BYTE_LIMIT = 40_000;

/**
 * Manages background processes spawned on behalf of the agent's `terminal/*`
 * ACP requests. Each terminal is a headless shell child process (cmd.exe on
 * Windows, /bin/sh elsewhere — picked by Node when `shell: true`) whose
 * stdout+stderr is captured into a single rolling buffer respecting
 * `outputByteLimit`.
 */
export class TerminalManager {
  private terminals = new Map<string, TerminalEntry>();
  private nextId = 1;

  create(params: TerminalCreateParams): { terminalId: string } {
    const env = this.envFromParams(params.env);
    const cwd = params.cwd || process.cwd();
    const byteLimit = params.outputByteLimit ?? DEFAULT_BYTE_LIMIT;
    const proc = spawn(params.command, { cwd, env, shell: true });

    const entry: TerminalEntry = {
      proc,
      buf: "",
      byteLen: 0,
      truncated: false,
      exitCode: null,
      exitListeners: [],
      byteLimit,
    };

    const onChunk = (d: Buffer) => {
      if (entry.byteLen >= entry.byteLimit) {
        entry.truncated = true;
        return;
      }
      const remaining = entry.byteLimit - entry.byteLen;
      const text = d.length > remaining ? d.subarray(0, remaining).toString() : d.toString();
      entry.buf += text;
      entry.byteLen += Buffer.byteLength(text);
      if (d.length > remaining) entry.truncated = true;
    };
    proc.stdout?.on("data", onChunk);
    proc.stderr?.on("data", onChunk);
    proc.on("error", (err) => {
      entry.buf += `\n[spawn error] ${err.message}`;
      entry.exitCode = -1;
      for (const l of entry.exitListeners) l(-1);
      entry.exitListeners = [];
    });
    proc.on("exit", (code) => {
      entry.exitCode = code ?? 0;
      for (const l of entry.exitListeners) l(entry.exitCode!);
      entry.exitListeners = [];
    });

    const terminalId = `t-${this.nextId++}`;
    this.terminals.set(terminalId, entry);
    return { terminalId };
  }

  output(terminalId: string): TerminalOutputResult {
    const t = this.required(terminalId);
    return {
      output: t.buf,
      exitStatus: t.exitCode != null ? { exitCode: t.exitCode } : null,
      truncated: t.truncated,
    };
  }

  waitForExit(terminalId: string): Promise<{ exitCode: number }> {
    const t = this.required(terminalId);
    if (t.exitCode != null) return Promise.resolve({ exitCode: t.exitCode });
    return new Promise((resolve) => {
      t.exitListeners.push((code) => resolve({ exitCode: code }));
    });
  }

  kill(terminalId: string): void {
    const t = this.terminals.get(terminalId);
    if (!t) return;
    try {
      t.proc.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }

  release(terminalId: string): void {
    this.kill(terminalId);
    this.terminals.delete(terminalId);
  }

  disposeAll(): void {
    for (const id of Array.from(this.terminals.keys())) this.release(id);
  }

  private required(terminalId: string): TerminalEntry {
    const t = this.terminals.get(terminalId);
    if (!t) throw new Error(`unknown terminalId: ${terminalId}`);
    return t;
  }

  private envFromParams(envParam: TerminalCreateParams["env"]): NodeJS.ProcessEnv {
    const env = { ...process.env };
    if (Array.isArray(envParam)) {
      for (const e of envParam) env[e.name] = e.value;
    }
    return env;
  }
}
