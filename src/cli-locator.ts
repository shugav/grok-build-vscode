import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { homedir } from "node:os";
import * as path from "node:path";

const IS_WIN = process.platform === "win32";

function candidateNames(): string[] {
  return IS_WIN ? ["grok.cmd", "grok.exe", "grok.bat", "grok"] : ["grok"];
}

export function locateGrokCli(configuredPath: string): string | undefined {
  if (configuredPath) {
    return existsSync(configuredPath) ? configuredPath : undefined;
  }
  const homeBin = path.join(homedir(), ".grok", "bin");
  for (const name of candidateNames()) {
    const candidate = path.join(homeBin, name);
    if (existsSync(candidate)) return candidate;
  }
  try {
    const cmd = IS_WIN ? "where grok" : "command -v grok";
    const out = execSync(cmd, { encoding: "utf8" }).trim();
    const first = out.split(/\r?\n/)[0]?.trim();
    if (first && existsSync(first)) return first;
  } catch {
    // ignore — not on PATH
  }
  return undefined;
}
