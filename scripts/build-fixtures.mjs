#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../tests/fixtures");
mkdirSync(outDir, { recursive: true });

function makePRNG(initSeed) {
  let s = initSeed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const YEAR_START = "2023-01-01";
const TOTAL_DAYS = 371;

function dateFor(index) {
  const start = new Date(`${YEAR_START}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() + index);
  return start.toISOString().slice(0, 10);
}

function makeDays({
  seed,
  activityProb,
  countRange,
  peakDayIndices,
  peakCountRange,
}) {
  const rng = makePRNG(seed);
  const days = [];
  for (let i = 0; i < TOTAL_DAYS; i++) {
    let count = 0;
    if (rng() < activityProb) {
      count =
        countRange[0] + Math.floor(rng() * (countRange[1] - countRange[0] + 1));
    }
    if (peakDayIndices.includes(i)) {
      count =
        peakCountRange[0] +
        Math.floor(rng() * (peakCountRange[1] - peakCountRange[0] + 1));
    }
    days.push({ date: dateFor(i), count });
  }
  return days;
}

function emptyYear() {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => ({
    date: dateFor(i),
    count: 0,
  }));
}

function singleDay() {
  const days = emptyYear();
  const target = days[180];
  if (target) target.count = 16;
  return days;
}

const fixtures = {
  "empty-year": emptyYear(),
  "single-day": singleDay(),
  "sparse-user": makeDays({
    seed: 303,
    activityProb: 0.08,
    countRange: [1, 3],
    peakDayIndices: [60, 180, 300],
    peakCountRange: [15, 18],
  }),
  "normal-user": makeDays({
    seed: 124,
    activityProb: 0.5,
    countRange: [1, 4],
    peakDayIndices: [24, 75, 140, 195, 250, 310, 345],
    peakCountRange: [15, 19],
  }),
  "heavy-user": makeDays({
    seed: 7,
    activityProb: 0.95,
    countRange: [1, 8],
    peakDayIndices: [30, 90, 150, 210, 270, 330],
    peakCountRange: [20, 30],
  }),
};

for (const [name, days] of Object.entries(fixtures)) {
  const path = resolve(outDir, `${name}.json`);
  writeFileSync(path, `${JSON.stringify(days, null, 2)}\n`, "utf8");
  const active = days.filter((d) => d.count > 0).length;
  const max = days.reduce((m, d) => Math.max(m, d.count), 0);
  console.log(`wrote ${path} (active=${active}, max=${max})`);
}
