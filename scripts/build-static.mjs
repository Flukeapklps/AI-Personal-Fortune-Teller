// Builds the static site for GitHub Pages into ./out
//
//   PAGES_BASE_PATH=/AI-Personal-Fortune-Teller node scripts/build-static.mjs
//
// Static export cannot include server-only routes (API route handlers, the auth
// callback, the login page) or the proxy, so they are moved aside for the build and
// always restored afterwards.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stash = join(root, ".static-build-stash");
const SERVER_ONLY = ["src/app/api", "src/app/auth", "src/app/login", "src/proxy.ts"];

function restore() {
  for (const rel of SERVER_ONLY) {
    const from = join(stash, rel);
    if (existsSync(from)) {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      renameSync(from, join(root, rel));
    }
  }
  rmSync(stash, { recursive: true, force: true });
}

restore(); // recover from an interrupted previous run
let status = 1;
try {
  for (const rel of SERVER_ONLY) {
    if (!existsSync(join(root, rel))) continue;
    mkdirSync(dirname(join(stash, rel)), { recursive: true });
    renameSync(join(root, rel), join(stash, rel));
  }
  rmSync(join(root, ".next"), { recursive: true, force: true });
  const res = spawnSync("npx", ["next", "build"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, STATIC_EXPORT: "1" },
  });
  status = res.status ?? 1;
  if (status === 0) {
    // Tell GitHub Pages not to run Jekyll (it would hide the _next folder).
    writeFileSync(join(root, "out", ".nojekyll"), "");
  }
} finally {
  restore();
  // The static build leaves export-mode artifacts in .next; clear them for normal dev/builds.
  rmSync(join(root, ".next"), { recursive: true, force: true });
}
process.exit(status);
