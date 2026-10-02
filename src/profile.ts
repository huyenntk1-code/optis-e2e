import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

const SKIP = new Set([
  "Cache", "Code Cache", "GPUCache", "DawnCache", "DawnGraphiteCache", "DawnWebGPUCache",
  "ShaderCache", "GrShaderCache", "Shared Dictionary", "CacheStorage", "Service Worker",
  "SingletonLock", "SingletonCookie", "SingletonSocket",
]);

export function copyProfile(source: string, dest?: string): string {
  if (!existsSync(source)) throw new Error(`Chrome profile not found: ${source}. Run \`pnpm e2e:login <target>\` first.`);
  const target = dest ?? mkdtempSync(join(tmpdir(), "e2e-profile-"));
  if (dest && existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  cpSync(source, target, {
    recursive: true,
    filter: (src) => {
      const rel = relative(source, src);
      if (!rel) return true;
      return !rel.split(/[\\/]/).some((segment) => SKIP.has(segment));
    },
  });
  return target;
}

export function removeProfile(dir: string): void {
  // Chrome can hold a file lock for a brief moment after the context is closed — abnormal
  // shutdown (e.g. the window is closed by hand mid-test, or a Playwright Inspector session is
  // torn down) makes this worse. rmSync's own retry only covers ENOENT/EBUSY on individual
  // unlinks, not "the directory listing changed under us" — so give it one short, real retry.
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code !== "ENOTEMPTY" && code !== "EBUSY") throw e;
    setTimeoutSync(300);
    rmSync(dir, { recursive: true, force: true });
  }
}

function setTimeoutSync(ms: number): void {
  const end = Date.now() + ms;
  while (Date.now() < end) { /* busy-wait: this path is rare, keeping it dependency-free is fine */ }
}
