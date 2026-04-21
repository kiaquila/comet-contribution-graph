#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const rendererPath = resolve(root, "dist-renderer/renderer.js");
const themesPath = resolve(root, "dist-renderer/themes.js");
const fixturesDir = resolve(root, "tests/fixtures");
const outDir = resolve(root, "sample-out");

const FIXTURES = [
  "empty-year",
  "single-day",
  "sparse-user",
  "normal-user",
  "heavy-user",
];

const requested = process.argv[2];
const selected = requested ? [requested] : FIXTURES;
for (const name of selected) {
  if (!FIXTURES.includes(name)) {
    console.error(`unknown fixture: ${name}`);
    console.error(`available: ${FIXTURES.join(", ")}`);
    process.exit(1);
  }
}

const build = spawnSync("pnpm", ["run", "build:renderer"], {
  cwd: root,
  stdio: "inherit",
});
if (build.status !== 0) {
  console.error("render-sample: build:renderer failed; cannot import dist.");
  process.exit(1);
}

const { renderCometSVG } = await import(rendererPath);
const { DARK_THEME } = await import(themesPath);

mkdirSync(outDir, { recursive: true });

for (const name of selected) {
  const days = JSON.parse(
    readFileSync(resolve(fixturesDir, `${name}.json`), "utf8"),
  );
  for (const animated of [true, false]) {
    const variant = animated ? "animated" : "reduced";
    const svg = renderCometSVG(days, {
      theme: DARK_THEME,
      animated,
      seed: 42,
    });
    const path = resolve(outDir, `${name}.${variant}.svg`);
    writeFileSync(path, svg, "utf8");
    console.log(`wrote ${path}`);
  }
}
