#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const options = {
  feature: "",
  copy: false,
};

for (let index = 0; index < args.length; index += 1) {
  const current = args[index];

  switch (current) {
    case "--feature":
      options.feature = (args[index + 1] || "").trim();
      index += 1;
      break;
    case "--copy":
      options.copy = true;
      break;
    default:
      throw new Error(`Unknown argument: ${current}`);
  }
}

if (!options.feature) {
  throw new Error("--feature is required.");
}

const run = (command, commandArgs, cwd) =>
  execFileSync(command, commandArgs, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  }).trim();

// Split repo roots by data semantics:
// - `primaryRoot` for shared state under `.claude/` (agent selection,
//   prompts, legacy `.codex/` fallback) so every linked worktree reads
//   the same selection written by scripts/set-implementation-agent.mjs.
// - `workingRoot` for per-branch files like `specs/<feature>/` that live
//   in the checkout of the current worktree's branch.
const workingRoot = run("git", ["rev-parse", "--show-toplevel"], process.cwd());
const gitCommonDir = run(
  "git",
  ["rev-parse", "--path-format=absolute", "--git-common-dir"],
  process.cwd(),
);
const primaryRoot = dirname(gitCommonDir);
const branch = run("git", ["branch", "--show-current"], workingRoot);
const claudeDir = resolve(primaryRoot, ".claude");
const legacyCodexDir = resolve(primaryRoot, ".codex");
const promptsDir = resolve(claudeDir, "prompts");
const featureDir = resolve(workingRoot, "specs", options.feature);

if (!existsSync(resolve(featureDir, "spec.md"))) {
  throw new Error(`Missing feature spec folder: ${featureDir}`);
}

mkdirSync(promptsDir, { recursive: true });

const readLocalState = (name, fallback) => {
  const file = resolve(claudeDir, name);
  if (existsSync(file)) {
    return readFileSync(file, "utf8").trim() || fallback;
  }
  const legacyFile = resolve(legacyCodexDir, name);
  if (existsSync(legacyFile)) {
    console.warn(
      `warning: reading legacy ${legacyFile}; run scripts/set-implementation-agent.mjs to migrate to .claude/`,
    );
    return readFileSync(legacyFile, "utf8").trim() || fallback;
  }
  return fallback;
};

const implementationAgent = readLocalState("implementation-agent", "claude");
const reviewAgent = readLocalState("review-agent", "codex");

const prompt = `# comet-contribution-graph implementation prompt

Selected implementation agent: ${implementationAgent}
Selected review backend: ${reviewAgent}
Current branch: ${branch}
Active feature folder: specs/${options.feature}/

Read in this order:
1. .specify/memory/constitution.md
2. docs_comet/README.md
3. docs_comet/project/frontend/frontend-docs.md
4. docs_comet/project/devops/ai-pr-workflow.md
5. docs_comet/project/devops/delivery-playbook.md
6. specs/${options.feature}/spec.md
7. specs/${options.feature}/plan.md
8. specs/${options.feature}/tasks.md

Execution rules:
- implement only the scoped task on this branch
- keep the static site deployable with pnpm run build
- update tasks.md as work completes
- update durable docs when behavior, architecture, or workflow changes
- do not bypass the PR loop or switch branches
- prepare the PR for baseline-checks, guard, AI Review, and Vercel preview

Expected handoff:
- code and docs committed on the same branch
- concise summary of what changed
- validation notes with commands run
- residual risks or follow-ups called out explicitly
`;

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const promptPath = resolve(promptsDir, `${options.feature}-${timestamp}.md`);
writeFileSync(promptPath, prompt, "utf8");

if (options.copy && process.platform === "darwin") {
  spawnSync("pbcopy", { input: prompt });
}

console.log(`Prepared prompt: ${promptPath}`);
if (options.copy && process.platform === "darwin") {
  console.log("Prompt copied to the macOS clipboard.");
}
