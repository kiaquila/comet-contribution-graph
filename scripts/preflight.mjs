#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { findRepoRoot, parseArgs } from "./shared.mjs";

const args = parseArgs();
const root = findRepoRoot();

function run(command, commandArgs, label) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.error(`${label} failed.`);
    process.exit(result.status || 1);
  }
}

run(
  process.execPath,
  ["scripts/check-feature-memory.mjs", "--worktree"],
  "Feature memory check",
);

if (args["feature-memory-only"]) {
  console.log("Preflight feature-memory check passed.");
  process.exit(0);
}

run("pnpm", ["run", "ci"], "Repository CI");

console.log("Preflight passed.");
