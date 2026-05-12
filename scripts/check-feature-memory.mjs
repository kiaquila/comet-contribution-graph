#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { findRepoRoot, parseArgs, pathMatches, readConfig } from "./shared.mjs";

const args = parseArgs();
const inspectWorktree = Boolean(args.worktree);
const repoRoot = resolve(args.target || findRepoRoot());
const config = readConfig(repoRoot);
const positional = args._ || [];
const specsDir = config.specsDir || "specs";

const git = (args) =>
  execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();

const hasRef = (ref) => {
  try {
    execFileSync("git", ["rev-parse", "--verify", ref], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

const [
  baseRefInput = process.env.GITHUB_BASE_REF ||
    `origin/${config.defaultBaseBranch || "main"}`,
  headRef = "HEAD",
] = positional;

const preferredBaseRef = process.env.GITHUB_BASE_REF
  ? `origin/${process.env.GITHUB_BASE_REF}`
  : `origin/${config.defaultBaseBranch || "main"}`;
const baseRef = hasRef(baseRefInput)
  ? baseRefInput
  : hasRef(preferredBaseRef)
    ? preferredBaseRef
    : hasRef("origin/main")
      ? "origin/main"
      : "HEAD~1";

const splitFiles = (value) =>
  value
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);

const changedFiles = inspectWorktree
  ? [
      ...new Set([
        ...splitFiles(git(["diff", "--name-only", "HEAD"])),
        ...splitFiles(git(["ls-files", "--others", "--exclude-standard"])),
      ]),
    ]
  : splitFiles(git(["diff", "--name-only", `${baseRef}...${headRef}`]));

const defaultProductPaths = [
  ".github/workflows/",
  ".htmlvalidate.json",
  "action.yml",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "prototypes/",
  "scripts/",
  "src/",
  "app/",
  "public/",
  "assets/",
  "vercel.json",
];
const productPaths = config.productPaths || defaultProductPaths;
const isProductPath = (file) => pathMatches(file, productPaths);

if (!changedFiles.some(isProductPath)) {
  console.log("No product paths changed; feature-memory gate passes.");
  process.exit(0);
}

const escapedSpecsDir = specsDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const featureIds = new Set();

for (const file of changedFiles) {
  const match = file.match(new RegExp(`^${escapedSpecsDir}/([^/]+)/`));
  if (!match) {
    continue;
  }

  featureIds.add(match[1]);
}

// In CI / pre-push the script runs from a checkout of the trusted base
// branch (see specs/011-pipeline-gate-trusted-base), so filesystem
// probes would miss specs added in the PR head. The ref path uses
// git cat-file, which checks tree existence without executing PR code.
const hasFileAtRef = (ref, path) => {
  try {
    execFileSync("git", ["cat-file", "-e", `${ref}:${path}`], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

const hasCompleteFeatureMemory = (featureId) => {
  if (inspectWorktree) {
    return (
      existsSync(resolve(repoRoot, specsDir, featureId, "spec.md")) &&
      existsSync(resolve(repoRoot, specsDir, featureId, "plan.md")) &&
      existsSync(resolve(repoRoot, specsDir, featureId, "tasks.md"))
    );
  }

  return (
    hasFileAtRef(headRef, `${specsDir}/${featureId}/spec.md`) &&
    hasFileAtRef(headRef, `${specsDir}/${featureId}/plan.md`) &&
    hasFileAtRef(headRef, `${specsDir}/${featureId}/tasks.md`)
  );
};

const validFeature = [...featureIds].find(hasCompleteFeatureMemory);

if (validFeature) {
  console.log(
    `Feature-memory gate passed via ${specsDir}/${validFeature}/{spec,plan,tasks}.md`,
  );
  process.exit(0);
}

console.error(
  "Product paths changed without a complete feature-memory update.",
);
console.error(
  `Touch one ${specsDir}/<feature-id> folder with spec.md, plan.md, and tasks.md in the same PR.`,
);

if (featureIds.size > 0) {
  console.error("Observed feature-memory folders:");
  for (const featureId of featureIds) {
    console.error(
      `- ${featureId}: ${
        hasCompleteFeatureMemory(featureId)
          ? "complete feature memory present"
          : "missing one or more of spec.md, plan.md, tasks.md"
      }`,
    );
  }
}

process.exit(1);
