#!/usr/bin/env node
// One-off analysis helper for 008-adaptive-star-rendering.
// Fetches contribution data for the 3 reference accounts in parallel
// and writes both raw JSON and per-user distribution stats.
import { mkdirSync, writeFileSync } from "node:fs";
import { fetchContributions } from "../dist-renderer/data.js";

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("GITHUB_TOKEN env var required");
  process.exit(1);
}

const users = ["kiaquila", "Staks-sor", "Yeachan-Heo"];
mkdirSync("sample-out", { recursive: true });

const results = await Promise.all(
  users.map(async (u) => {
    const days = await fetchContributions(u, token);
    writeFileSync(
      `sample-out/contributions-${u}.json`,
      `${JSON.stringify(days, null, 2)}\n`,
      "utf8",
    );
    return { user: u, days };
  }),
);

function quantile(sorted, q) {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

const summary = results.map(({ user, days }) => {
  const total = days.length;
  const active = days.filter((d) => d.count > 0);
  const counts = active.map((d) => d.count).sort((a, b) => a - b);
  const sum = counts.reduce((a, b) => a + b, 0);
  const max = counts.at(-1) ?? 0;
  const mean = counts.length ? sum / counts.length : 0;
  const activeFrac = active.length / total;
  // Histogram buckets
  const buckets = {
    "1": counts.filter((c) => c === 1).length,
    "2-4": counts.filter((c) => c >= 2 && c <= 4).length,
    "5-9": counts.filter((c) => c >= 5 && c <= 9).length,
    "10-19": counts.filter((c) => c >= 10 && c <= 19).length,
    "20-49": counts.filter((c) => c >= 20 && c <= 49).length,
    "50+": counts.filter((c) => c >= 50).length,
  };
  return {
    user,
    totalDays: total,
    activeDays: active.length,
    activeFrac: +activeFrac.toFixed(4),
    oneThirdThreshold: Math.round(total / 3),
    exceedsOneThird: active.length > total / 3,
    sum,
    max,
    mean: +mean.toFixed(2),
    median: +quantile(counts, 0.5).toFixed(1),
    p75: +quantile(counts, 0.75).toFixed(1),
    p90: +quantile(counts, 0.9).toFixed(1),
    p95: +quantile(counts, 0.95).toFixed(1),
    p99: +quantile(counts, 0.99).toFixed(1),
    histogram: buckets,
  };
});

writeFileSync(
  "sample-out/distribution-stats.json",
  `${JSON.stringify(summary, null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify(summary, null, 2));
