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
  "kiaquila",
  "staks-sor",
  "yeachan-heo",
  "bcherny",
];

// Default layout (orbit) keeps the historical `<fixture>.<variant>` labels;
// the classic grid is snapshotted alongside as `<fixture>.grid.<variant>`.
const LAYOUTS = [
  ["orbit", ""],
  ["grid", "grid."],
];

for (const fixture of FIXTURES) {
  const days = loadFixture(fixture);
  for (const [layout, prefix] of LAYOUTS) {
    for (const animated of [true, false]) {
      const variant = animated ? "animated" : "reduced";
      const label = `${fixture}.${prefix}${variant}`;
      test(`snapshot: ${label}`, () => {
        const svg = renderCometSVG(days, {
          theme: DARK_THEME,
          animated,
          seed: 42,
          layout,
          username: fixture,
        });
        assert.match(svg, /^<svg /);
        assert.match(svg, /<\/svg>$/);
        checkSnapshot(label, svg);
      });
    }
  }
}

test("layout defaults to orbit", () => {
  const days = loadFixture("normal-user");
  const base = { theme: DARK_THEME, animated: true, seed: 42 };
  const implicit = renderCometSVG(days, base);
  const explicit = renderCometSVG(days, { ...base, layout: "orbit" });
  assert.equal(implicit, explicit);
  assert.match(implicit, /viewBox="0 0 896 300"/);
  assert.match(
    renderCometSVG(days, { ...base, layout: "grid" }),
    /viewBox="0 0 896 150"/,
  );
});

test("orbit panel: username title is optional, stats are present", () => {
  const days = loadFixture("staks-sor");
  const base = { theme: DARK_THEME, animated: false, seed: 42 };
  const anonymous = renderCometSVG(days, base);
  const named = renderCometSVG(days, { ...base, username: "staks-sor" });
  assert.ok(!anonymous.includes(">STAKS-SOR<"));
  assert.ok(named.includes(">STAKS-SOR<"));
  const total = days.reduce((s, d) => s + d.count, 0);
  assert.ok(named.includes(`>${total}<`), "sun carries the total");
  assert.ok(named.includes(">ACTIVE DAYS<"));
  assert.ok(named.includes(">LONGEST STREAK<"));
  assert.ok(named.includes(">WEEKLY VOLUME<"));
});

test("orbit: 39-char username is squeezed into the panel, short one is not", () => {
  const days = loadFixture("normal-user");
  const base = { theme: DARK_THEME, animated: false, seed: 42 };
  const long = "a".repeat(39);
  const squeezed = renderCometSVG(days, { ...base, username: long });
  const re = new RegExp(
    `<text[^>]*textLength="532\\.00" lengthAdjust="spacingAndGlyphs">${long.toUpperCase()}</text>`,
  );
  assert.match(squeezed, re);
  const plain = renderCometSVG(days, { ...base, username: "kiaquila" });
  assert.ok(!plain.includes("textLength"));
});

test("orbit: unparsable dates keep totals but yield no busiest weekday", () => {
  const days = [
    { date: "not-a-date", count: 7 },
    { date: "also-bad", count: 3 },
  ];
  const svg = renderCometSVG(days, { theme: DARK_THEME, animated: false });
  assert.ok(svg.includes(">10<"), "sun total still counts the days");
  assert.ok(svg.includes(">2d<"), "streak still counts the days");
  assert.ok(!svg.includes(">Sun<"), "must not default to Sunday");
  assert.ok(!svg.includes("NaN"));
});

test("orbit: empty year renders zero stats and no comet", () => {
  const days = loadFixture("empty-year");
  const svg = renderCometSVG(days, {
    theme: DARK_THEME,
    animated: true,
    seed: 42,
  });
  assert.ok(!svg.includes("<animateMotion"));
  assert.ok(svg.includes(">0<"), "sun shows 0");
  assert.ok(svg.includes(">0d<"), "longest streak 0d");
  assert.ok(!svg.includes("NaN"));
});

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
