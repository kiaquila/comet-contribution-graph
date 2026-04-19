#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const validImplementationAgents = new Set(["codex", "claude"]);
const validReviewAgents = new Set(["codex", "claude", "gemini"]);

const args = process.argv.slice(2);
const options = {
  implementation: "",
  review: "",
  localOnly: false,
  syncReview: false,
  repo: "",
};

for (let index = 0; index < args.length; index += 1) {
  const current = args[index];

  switch (current) {
    case "--implementation":
      options.implementation = (args[index + 1] || "").trim().toLowerCase();
      index += 1;
      break;
    case "--review":
      options.review = (args[index + 1] || "").trim().toLowerCase();
      index += 1;
      break;
    case "--repo":
      options.repo = (args[index + 1] || "").trim();
      index += 1;
      break;
    case "--local-only":
      options.localOnly = true;
      break;
    case "--sync-review":
      options.syncReview = true;
      break;
    default:
      throw new Error(`Unknown argument: ${current}`);
  }
}

if (!validImplementationAgents.has(options.implementation)) {
  throw new Error("--implementation must be one of: codex, claude");
}

if (!options.review && options.syncReview) {
  options.review = options.implementation;
}

if (options.review && !validReviewAgents.has(options.review)) {
  throw new Error("--review must be one of: codex, claude, gemini");
}

const run = (command, commandArgs, { cwd, input } = {}) =>
  execFileSync(command, commandArgs, {
    cwd,
    stdio: input ? ["pipe", "pipe", "pipe"] : ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    input,
  }).trim();

// Store agent policy at the primary repo root so every linked worktree
// observes the same selection. The GitHub repo variables updated below
// are the canonical source of truth; this local file is a shared cache.
const gitCommonDir = run("git", [
  "rev-parse",
  "--path-format=absolute",
  "--git-common-dir",
]);
const repoRoot = dirname(gitCommonDir);
const claudeDir = resolve(repoRoot, ".claude");

if (!existsSync(claudeDir)) {
  mkdirSync(claudeDir, { recursive: true });
}

writeFileSync(
  resolve(claudeDir, "implementation-agent"),
  `${options.implementation}\n`,
  "utf8",
);

if (options.review) {
  writeFileSync(
    resolve(claudeDir, "review-agent"),
    `${options.review}\n`,
    "utf8",
  );
}

console.log(`Local implementation agent set to ${options.implementation}.`);
if (options.review) {
  console.log(`Local review agent set to ${options.review}.`);
}

if (options.localOnly) {
  console.log("Skipped GitHub variable updates because --local-only was used.");
  process.exit(0);
}

const baseArgs = options.repo ? ["--repo", options.repo] : [];
run(
  "gh",
  [
    "variable",
    "set",
    "AI_IMPLEMENTATION_AGENT",
    "--body",
    options.implementation,
    ...baseArgs,
  ],
  { cwd: repoRoot },
);
console.log(
  `Repository variable AI_IMPLEMENTATION_AGENT set to ${options.implementation}.`,
);

if (options.review) {
  run(
    "gh",
    [
      "variable",
      "set",
      "AI_REVIEW_AGENT",
      "--body",
      options.review,
      ...baseArgs,
    ],
    { cwd: repoRoot },
  );
  console.log(`Repository variable AI_REVIEW_AGENT set to ${options.review}.`);
}
