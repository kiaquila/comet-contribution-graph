#!/usr/bin/env node
// Verifies that the committed bundle in <dir> matches a fresh build.
// Detects both tracked modifications AND new untracked files (the raw
// `git diff --exit-code <dir>` misses the untracked case, so a future
// ncc upgrade that emits an additional artifact would slip through).
// `.gitignore` is respected: deliberately-ignored files do not trigger.

import { spawnSync } from "node:child_process";
import process from "node:process";

const target = process.argv[2];
if (!target) {
  console.error("usage: check-dist.mjs <dir>");
  process.exit(2);
}

function git(args) {
  const r = spawnSync("git", args, { encoding: "utf8" });
  if (r.status !== 0 && r.status !== 1) {
    console.error(r.stderr || r.stdout);
    process.exit(r.status ?? 2);
  }
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

const diff = git(["diff", "--exit-code", "--", target]);
if (diff.code !== 0) {
  process.stdout.write(diff.stdout);
  console.error(
    `check-dist: tracked files in ${target} differ from build output`,
  );
  process.exit(1);
}

const untracked = git([
  "ls-files",
  "--others",
  "--exclude-standard",
  "--",
  target,
]).stdout.trim();
if (untracked) {
  console.error(
    `check-dist: ${target} has untracked build artifacts (commit them or .gitignore):\n${untracked}`,
  );
  process.exit(1);
}
