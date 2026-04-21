#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const username = process.argv[2];
if (!username) {
  console.error("Usage: node scripts/fetch-contributions.mjs <username>");
  process.exit(1);
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("GITHUB_TOKEN env var required");
  process.exit(1);
}

const build = spawnSync("pnpm", ["run", "build:renderer"], {
  stdio: "inherit",
});
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const { fetchContributions } = await import("../dist-renderer/data.js");
const days = await fetchContributions(username, token);

mkdirSync("sample-out", { recursive: true });
const outPath = `sample-out/contributions-${username}.json`;
writeFileSync(outPath, `${JSON.stringify(days, null, 2)}\n`, "utf8");

const active = days.filter((d) => d.count > 0).length;
const max = days.reduce((m, d) => Math.max(m, d.count), 0);
const first = days[0]?.date ?? "(none)";
const last = days.at(-1)?.date ?? "(none)";
console.log(
  `wrote ${outPath} (active=${active} max=${max} first=${first} last=${last})`,
);
