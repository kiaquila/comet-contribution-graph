import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const normalizePath = resolve(here, "../dist-renderer/normalize.js");
const fixturesDir = resolve(here, "fixtures");

const { normalize } = await import(normalizePath);

function loadFixture(name) {
  return JSON.parse(readFileSync(resolve(fixturesDir, `${name}.json`), "utf8"));
}

test("empty year has zero peaks and median 0", () => {
  const result = normalize(loadFixture("empty-year"));
  assert.equal(result.peaks.length, 0);
  assert.equal(result.median, 0);
  assert.equal(result.days.length, 371);
  assert.ok(result.days.every((d) => !d.isPeak && !d.isActive));
});

test("single-day fixture yields exactly 1 peak (cannot clamp to min 2)", () => {
  const result = normalize(loadFixture("single-day"));
  assert.equal(result.peaks.length, 1);
  assert.equal(result.peaks[0].count, 16);
});

test("peak count is clamped to max 7 on heavy-user", () => {
  const result = normalize(loadFixture("heavy-user"));
  assert.ok(result.peaks.length <= 7, `got ${result.peaks.length} peaks`);
  assert.ok(result.peaks.length >= 2);
});

test("normal-user hits the 7-peak upper bound", () => {
  const result = normalize(loadFixture("normal-user"));
  assert.equal(result.peaks.length, 7);
});

test("sparse-user returns 3 peaks (forced by fixture)", () => {
  const result = normalize(loadFixture("sparse-user"));
  assert.equal(result.peaks.length, 3);
});

test("peaks are returned in date-index order", () => {
  const result = normalize(loadFixture("normal-user"));
  const indices = result.peaks.map((p) => p.index);
  const sorted = [...indices].sort((a, b) => a - b);
  assert.deepEqual(indices, sorted);
});

test("aboveMedian flag separates top half of active days", () => {
  const result = normalize(loadFixture("normal-user"));
  const active = result.days.filter((d) => d.isActive);
  const above = active.filter((d) => d.aboveMedian);
  assert.ok(above.length > 0);
  assert.ok(above.length < active.length);
  for (const d of above) {
    assert.ok(d.count > result.median);
  }
});

test("intensity is 0 for peaks and in [0,1] for non-peak actives", () => {
  const result = normalize(loadFixture("normal-user"));
  for (const d of result.days) {
    if (d.isPeak) {
      assert.equal(d.intensity, 0, `peak ${d.date} should have intensity 0`);
    } else if (d.isActive) {
      assert.ok(d.intensity >= 0 && d.intensity <= 1);
    } else {
      assert.equal(d.intensity, 0);
    }
  }
});

test("peakIntensity normalizes top peaks to [0, 1]", () => {
  const result = normalize(loadFixture("heavy-user"));
  const peakValues = result.peaks.map((p) => p.peakIntensity);
  assert.ok(peakValues.every((v) => v >= 0 && v <= 1));
  assert.equal(Math.max(...peakValues), 1);
});
