#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const inspectWorktree = args.includes("--worktree");
const filteredArgs = args.filter((arg) => arg !== "--worktree");
const repoRoot = resolve(process.cwd());

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
  baseRefInput = process.env.GITHUB_BASE_REF || "origin/main",
  headRef = "HEAD",
] = filteredArgs;

const preferredBaseRef = process.env.GITHUB_BASE_REF
  ? `origin/${process.env.GITHUB_BASE_REF}`
  : "origin/main";
const baseRef = hasRef(baseRefInput)
  ? baseRefInput
  : hasRef(preferredBaseRef)
    ? preferredBaseRef
    : hasRef("origin/main")
      ? "origin/main"
      : "HEAD~1";

const diffArgs = inspectWorktree
  ? ["diff", "--name-only", "HEAD"]
  : ["diff", "--name-only", `${baseRef}...${headRef}`];

const changedFiles = git(diffArgs)
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean);

// Build-contract and repository-owned orchestration changes should participate
// in the same feature-memory rule as UI code.
const isProductPath = (file) =>
  file === "package.json" ||
  file === "pnpm-lock.yaml" ||
  file === "pnpm-workspace.yaml" ||
  file === "vercel.json" ||
  file === ".htmlvalidate.json" ||
  file === "action.yml" ||
  file.startsWith(".github/workflows/") ||
  file.startsWith("scripts/") ||
  file.startsWith("prototypes/") ||
  file.startsWith("src/") ||
  file.startsWith("app/") ||
  file.startsWith("public/") ||
  file.startsWith("assets/");

if (!changedFiles.some(isProductPath)) {
  console.log("No product paths changed; feature-memory gate passes.");
  process.exit(0);
}

const featureIds = new Set();

for (const file of changedFiles) {
  const match = file.match(/^specs\/([^/]+)\//);
  if (!match) {
    continue;
  }

  featureIds.add(match[1]);
}

const hasCompleteFeatureMemory = (featureId) =>
  existsSync(resolve(repoRoot, "specs", featureId, "spec.md")) &&
  existsSync(resolve(repoRoot, "specs", featureId, "plan.md")) &&
  existsSync(resolve(repoRoot, "specs", featureId, "tasks.md"));

const validFeature = [...featureIds].find(hasCompleteFeatureMemory);

if (validFeature) {
  console.log(
    `Feature-memory gate passed via specs/${validFeature}/{spec,plan,tasks}.md`,
  );
  process.exit(0);
}

console.error(
  "Product paths changed without a complete feature-memory update.",
);
console.error(
  "Touch one specs/<feature-id>/ folder with spec.md, plan.md, and tasks.md in the same PR.",
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
