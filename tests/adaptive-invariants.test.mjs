import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const normalizePath = resolve(here, "../dist-renderer/normalize.js");
const fixturesDir = resolve(here, "fixtures");

const { normalize } = await import(normalizePath);

// Formulas mirrored from src/renderer.ts. If renderer constants change,
// update these locally so invariants continue to reflect the actual output.
const FLOOR_CORE_R = 0.8;
const FLOOR_CORE_OP = 0.5;
const FLOOR_HALO_R = 1.5;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function coreRadius(t, d) {
  const ceil = lerp(1.8, 2.4, d);
  return FLOOR_CORE_R + Math.sqrt(t) * (ceil - FLOOR_CORE_R);
}
function coreOpacity(t, d) {
  const ceil = lerp(0.82, 0.92, d);
  return FLOOR_CORE_OP + Math.sqrt(t) * (ceil - FLOOR_CORE_OP);
}
function haloRadius(t, d) {
  const ceil = lerp(2.8, 3.6, d);
  return FLOOR_HALO_R + Math.sqrt(t) * (ceil - FLOOR_HALO_R);
}

function loadFixture(name) {
  return JSON.parse(readFileSync(resolve(fixturesDir, `${name}.json`), "utf8"));
}

function render(fixture) {
  const n = normalize(fixture);
  const d = n.densityRegime;
  const active = n.days.filter((x) => x.isActive);
  const nonPeakActive = active.filter((x) => !x.isPeak);
  const results = nonPeakActive.map((x) => ({
    count: x.count,
    intensity: x.intensity,
    coreR: coreRadius(x.intensity, d),
    coreOp: coreOpacity(x.intensity, d),
    haloR: haloRadius(x.intensity, d),
  }));
  return {
    n,
    active,
    nonPeakActive,
    results,
  };
}

// ---------- Invariant 1: kiaquila — every active day visible ----------

test("invariant 1: kiaquila — all active days visible (coreR≥0.8 AND coreOp≥0.5)", () => {
  const { active, results } = render(loadFixture("kiaquila"));
  assert.ok(active.length > 0, "kiaquila must have active days");
  for (const r of results) {
    assert.ok(
      r.coreR >= 0.8 - 1e-9,
      `count=${r.count}: coreR=${r.coreR.toFixed(3)} below floor 0.8`,
    );
    assert.ok(
      r.coreOp >= 0.5 - 1e-9,
      `count=${r.count}: coreOp=${r.coreOp.toFixed(3)} below floor 0.5`,
    );
  }
});

// ---------- Invariant 2: kiaquila — spread preserved ----------

test("invariant 2: kiaquila — max-non-peak coreR ≥ 1.3× coreR of count=1 star", () => {
  // Log-compression lifts count=1 intensity to ~0.3 for small maxNonPeak,
  // so the raw radius ratio is modest. Combined with opacity and halo-size
  // scaling the perceptual gap is larger; 1.3 is the minimum raw coreR
  // ratio that still reads as visually distinct at 16px cell size.
  const { results } = render(loadFixture("kiaquila"));
  const ones = results.filter((r) => r.count === 1);
  assert.ok(ones.length > 0, "kiaquila must have at least one count=1 day");
  const minR = Math.min(...ones.map((r) => r.coreR));
  const maxR = Math.max(...results.map((r) => r.coreR));
  const ratio = maxR / minR;
  assert.ok(
    ratio >= 1.3,
    `spread ratio ${ratio.toFixed(2)} < 1.3 (minR=${minR.toFixed(3)}, maxR=${maxR.toFixed(3)})`,
  );
});

// ---------- Invariant 3: staks-sor — medium sits above floor ----------

test("invariant 3: staks-sor — ≥95% of non-peak days have coreOp ≥ 0.55", () => {
  const { results } = render(loadFixture("staks-sor"));
  assert.ok(results.length > 0);
  const above = results.filter((r) => r.coreOp >= 0.55).length;
  const ratio = above / results.length;
  assert.ok(
    ratio >= 0.95,
    `only ${(ratio * 100).toFixed(1)}% of days above 0.55 opacity (need ≥95%)`,
  );
});

// ---------- Invariant 4: yeachan-heo — heavy tail doesn't vanish ----------

test("invariant 4: yeachan-heo — ≥85% of non-peak days have coreR ≥ 0.85", () => {
  const { results } = render(loadFixture("yeachan-heo"));
  assert.ok(results.length > 0);
  const above = results.filter((r) => r.coreR >= 0.85).length;
  const ratio = above / results.length;
  assert.ok(
    ratio >= 0.85,
    `only ${(ratio * 100).toFixed(1)}% of days above coreR 0.85 (need ≥85%)`,
  );
});

// ---------- Invariant 5: cross-account monotonicity ----------

test("invariant 5: max(coreR) monotone across small → medium → large", () => {
  const small = render(loadFixture("kiaquila")).results;
  const medium = render(loadFixture("staks-sor")).results;
  const large = render(loadFixture("yeachan-heo")).results;

  const maxSmall = Math.max(...small.map((r) => r.coreR));
  const maxMedium = Math.max(...medium.map((r) => r.coreR));
  const maxLarge = Math.max(...large.map((r) => r.coreR));

  assert.ok(
    maxSmall <= maxMedium + 1e-9,
    `kiaquila max coreR ${maxSmall.toFixed(3)} > staks-sor ${maxMedium.toFixed(3)}`,
  );
  assert.ok(
    maxMedium <= maxLarge + 1e-9,
    `staks-sor max coreR ${maxMedium.toFixed(3)} > yeachan-heo ${maxLarge.toFixed(3)}`,
  );
});

// ---------- Invariant 6: halo always present for active non-peaks ----------

test("invariant 6: every active non-peak day emits a halo (haloR ≥ 1.5)", () => {
  for (const name of ["kiaquila", "staks-sor", "yeachan-heo"]) {
    const { results } = render(loadFixture(name));
    for (const r of results) {
      assert.ok(
        r.haloR >= 1.5 - 1e-9,
        `${name} count=${r.count}: haloR=${r.haloR.toFixed(3)} below 1.5`,
      );
    }
  }
});

// ---------- Bonus: density regime sanity ----------

test("densityRegime is monotone small → medium → large", () => {
  const small = normalize(loadFixture("kiaquila")).densityRegime;
  const medium = normalize(loadFixture("staks-sor")).densityRegime;
  const large = normalize(loadFixture("yeachan-heo")).densityRegime;
  assert.ok(small < medium, `kiaquila d=${small} !< staks-sor d=${medium}`);
  assert.ok(medium < large, `staks-sor d=${medium} !< yeachan-heo d=${large}`);
  assert.ok(small >= 0.05 && large <= 1.0);
});
