import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const rendererPath = resolve(here, "../dist-renderer/renderer.js");
const themesPath = resolve(here, "../dist-renderer/themes.js");
const fixturesDir = resolve(here, "fixtures");
const snapshotsDir = resolve(here, "__snapshots__");
const updateSnapshots = process.env["UPDATE_SNAPSHOTS"] === "1";

mkdirSync(snapshotsDir, { recursive: true });

const { renderCometSVG } = await import(rendererPath);
const { DARK_THEME } = await import(themesPath);

function loadFixture(name) {
  const path = resolve(fixturesDir, `${name}.json`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function checkSnapshot(label, actual) {
  const snapPath = resolve(snapshotsDir, `${label}.svg`);
  if (!existsSync(snapPath) || updateSnapshots) {
    writeFileSync(snapPath, actual, "utf8");
  }
  const expected = readFileSync(snapPath, "utf8");
  assert.equal(
    actual,
    expected,
    `snapshot mismatch for ${label} (run with UPDATE_SNAPSHOTS=1 to update)`,
  );
}

const FIXTURES = [
  "empty-year",
  "single-day",
  "sparse-user",
  "normal-user",
  "heavy-user",
];

for (const fixture of FIXTURES) {
  const days = loadFixture(fixture);
  for (const animated of [true, false]) {
    const variant = animated ? "animated" : "reduced";
    const label = `${fixture}.${variant}`;
    test(`snapshot: ${label}`, () => {
      const svg = renderCometSVG(days, {
        theme: DARK_THEME,
        animated,
        seed: 42,
      });
      assert.match(svg, /^<svg /);
      assert.match(svg, /<\/svg>$/);
      checkSnapshot(label, svg);
    });
  }
}

test("snapshot output is deterministic across two renders", () => {
  const days = loadFixture("normal-user");
  const opts = { theme: DARK_THEME, animated: true, seed: 42 };
  const a = renderCometSVG(days, opts);
  const b = renderCometSVG(days, opts);
  assert.equal(a, b);
});

test("different seeds produce different output on same data", () => {
  const days = loadFixture("normal-user");
  const base = { theme: DARK_THEME, animated: true };
  const a = renderCometSVG(days, { ...base, seed: 1 });
  const b = renderCometSVG(days, { ...base, seed: 2 });
  assert.notEqual(a, b, "seed variation must change output");
});

test("animated vs reduced differ for active year", () => {
  const days = loadFixture("normal-user");
  const base = { theme: DARK_THEME, seed: 42 };
  const animated = renderCometSVG(days, { ...base, animated: true });
  const reduced = renderCometSVG(days, { ...base, animated: false });
  assert.notEqual(animated, reduced);
  assert.ok(animated.includes("<animateMotion"));
  assert.ok(!reduced.includes("<animate"));
});
