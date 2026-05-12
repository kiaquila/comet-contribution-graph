#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { findRepoRoot, parseArgs, readConfig } from "./shared.mjs";

const args = parseArgs();
const root = resolve(args.target || findRepoRoot());
const config = readConfig(root);
const missing = [];

function requirePath(path) {
  if (!existsSync(join(root, path))) {
    missing.push(path);
  }
}

for (const path of config.baselineRequiredFiles || [
  "README.md",
  "package.json",
]) {
  requirePath(path);
}

for (const path of config.baselineRequiredDirs || []) {
  requirePath(path);
}

if (missing.length > 0) {
  console.error("Missing required baseline files:");
  for (const path of missing) {
    console.error(`- ${path}`);
  }
  process.exit(1);
}

const packageJson = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
);
if (!packageJson.packageManager?.startsWith("pnpm@")) {
  console.error("package.json must pin packageManager to pnpm@<version>.");
  process.exit(1);
}

for (const scriptName of [
  "check:repo",
  "check:feature-memory",
  "ci",
  "preflight",
]) {
  if (!packageJson.scripts?.[scriptName]) {
    console.error(`package.json must define scripts.${scriptName}.`);
    process.exit(1);
  }
}

const pnpmWorkspacePath = join(root, "pnpm-workspace.yaml");
if (existsSync(pnpmWorkspacePath)) {
  const workspace = readFileSync(pnpmWorkspacePath, "utf8");
  if (!/^minimumReleaseAge:\s*10080\s*$/m.test(workspace)) {
    console.error("pnpm-workspace.yaml must set minimumReleaseAge: 10080.");
    process.exit(1);
  }
}

const prototypePath = join(root, "prototypes/variant-d-grid-peaks.html");
if (existsSync(prototypePath)) {
  const prototypeHtml = readFileSync(prototypePath, "utf8");
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
    for (const message of failures) {
      console.error(message);
    }
    process.exit(1);
  }
}

console.log("Repository baseline check passed.");
