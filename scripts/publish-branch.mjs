#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const options = {
  feature: "",
  title: "",
  body: "",
  base: "main",
  repo: "",
  draft: false,
};

for (let index = 0; index < args.length; index += 1) {
  const current = args[index];

  switch (current) {
    case "--feature":
      options.feature = (args[index + 1] || "").trim();
      index += 1;
      break;
    case "--title":
      options.title = (args[index + 1] || "").trim();
      index += 1;
      break;
    case "--body":
      options.body = (args[index + 1] || "").trim();
      index += 1;
      break;
    case "--base":
      options.base = (args[index + 1] || "").trim() || "main";
      index += 1;
      break;
    case "--repo":
      options.repo = (args[index + 1] || "").trim();
      index += 1;
      break;
    case "--draft":
      options.draft = true;
      break;
    default:
      throw new Error(`Unknown argument: ${current}`);
  }
}

const run = (command, commandArgs, cwd) =>
  execFileSync(command, commandArgs, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  }).trim();

const repoRoot = run("git", ["rev-parse", "--show-toplevel"], process.cwd());
const branch = run("git", ["branch", "--show-current"], repoRoot);
const repoArgs = options.repo ? ["--repo", options.repo] : [];

run("git", ["push", "-u", "origin", branch], repoRoot);
console.log(`Pushed branch ${branch}.`);

try {
  const existing = run(
    "gh",
    ["pr", "view", "--json", "url,number", ...repoArgs],
    repoRoot,
  );
  const parsed = JSON.parse(existing);
  console.log(`Existing PR: ${parsed.url}`);
  process.exit(0);
} catch {}

const title =
  options.title ||
  (options.feature
    ? `chore: ${options.feature.replace(/^\d+-/, "").replace(/-/g, " ")}`
    : `chore: update ${branch}`);

const body =
  options.body ||
  [
    "## Summary",
    `- ${title}`,
    options.feature ? `- Feature memory: \`specs/${options.feature}/\`` : "",
    "",
    "## Validation",
    "- pnpm run ci",
  ]
    .filter(Boolean)
    .join("\n");

const url = run(
  "gh",
  [
    "pr",
    "create",
    ...(options.draft ? ["--draft"] : []),
    "--base",
    options.base,
    "--head",
    branch,
    "--title",
    title,
    "--body",
    body,
    ...repoArgs,
  ],
  repoRoot,
);

console.log(`Created PR: ${url}`);
