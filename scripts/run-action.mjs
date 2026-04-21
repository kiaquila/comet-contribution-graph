#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const username = process.argv[2];

if (!username || username === "--help") {
  console.error(
    "Usage: GITHUB_TOKEN=<token> node scripts/run-action.mjs <username>",
  );
  process.exit(1);
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error(
    "GITHUB_TOKEN env var required. Export it before running this script.",
  );
  process.exit(1);
}

// Populate env so @actions/core.getInput() resolves correctly.
process.env.INPUT_USERNAME = username;
process.env.INPUT_TOKEN = token;
process.env.INPUT_REDUCED = process.env.INPUT_REDUCED ?? "true";
process.env.INPUT_BRANCH = process.env.INPUT_BRANCH ?? "comet-graph";
process.env.GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY ?? "local/smoke";
// Signal action to skip the real git push and log the command sequence instead.
process.env.COMET_DRY_RUN = "1";

// Compile TS → dist-renderer/ so we can import action.js without ncc.
const build = spawnSync("pnpm", ["run", "build:renderer"], {
  cwd: root,
  stdio: "inherit",
});
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const actionPath = resolve(root, "dist-renderer/action.js");
const { run } = await import(actionPath);
await run();

console.log(
  "\ndry-run complete. SVGs were written to an ephemeral temp dir; the git plan above shows what would be pushed.",
);
