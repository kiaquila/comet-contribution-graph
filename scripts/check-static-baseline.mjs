#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());

const requiredFiles = [
  "AGENTS.md",
  "CLAUDE.md",
  ".specify/memory/constitution.md",
  "package.json",
  "vercel.json",
  ".gemini/config.yaml",
  ".gemini/styleguide.md",
  "docs_comet/README.md",
  "docs_comet/adr/README.md",
  "docs_comet/project-idea.md",
  "docs_comet/project/frontend/frontend-docs.md",
  "docs_comet/project/devops/ai-orchestration-protocol.md",
  "docs_comet/project/devops/ai-pr-workflow.md",
  "docs_comet/project/devops/review-contract.md",
  "docs_comet/project/devops/review-trigger-automation.md",
  "docs_comet/project/devops/vercel-cd.md",
  "docs_comet/project/devops/delivery-playbook.md",
  "docs_comet/project/devops/github-action-target.md",
  "prototypes/variant-d-grid-peaks.html",
  "scripts/check-feature-memory.mjs",
  "scripts/set-implementation-agent.mjs",
  "scripts/new-worktree.mjs",
  "scripts/start-implementation-worker.mjs",
  "scripts/publish-branch.mjs",
  ".github/workflows/ci.yml",
  ".github/workflows/pr-guard.yml",
  ".github/workflows/ai-review.yml",
  ".github/workflows/ai-command-policy.yml",
  ".github/workflows/osv-scan.yml",
  ".github/workflows/comet-graph.yml",
  ".github/dependabot.yml",
  "action.yml",
  ".gitattributes",
  "dist-action/index.js",
];

const requiredDirs = ["specs"];

const missing = requiredFiles.filter(
  (file) => !existsSync(resolve(root, file)),
);

const missingDirs = requiredDirs.filter(
  (dir) => !existsSync(resolve(root, dir)),
);

if (missing.length > 0 || missingDirs.length > 0) {
  console.error("Missing required baseline files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  for (const dir of missingDirs) {
    console.error(`- ${dir}/`);
  }
  process.exit(1);
}

const prototypeHtml = readFileSync(
  resolve(root, "prototypes/variant-d-grid-peaks.html"),
  "utf8",
);

const htmlAssertions = [
  {
    test: (h) => /<meta[^>]+charset=["']?UTF-8["']?[^>]*>/i.test(h),
    message: "prototype must declare UTF-8 charset.",
  },
  {
    test: (h) => /<title>/i.test(h),
    message: "prototype must include a <title> element.",
  },
];

const failures = htmlAssertions
  .filter(({ test }) => !test(prototypeHtml))
  .map(({ message }) => message);

if (failures.length > 0) {
  for (const msg of failures) {
    console.error(msg);
  }
  process.exit(1);
}

console.log("Repository baseline OK.");
