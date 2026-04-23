import type { ContributionDay, Normalization, NormalizedDay } from "./types.js";

const MIN_PEAKS = 2;
const MAX_PEAKS = 7;
const MIN_PEAK_FLOOR = 5;
const DENSITY_FLOOR = 0.05;
const DENSITY_CEIL = 1.0;
const CV_SATURATION = 4;

function medianOf(sorted: readonly number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const a = sorted[mid - 1] ?? 0;
    const b = sorted[mid] ?? 0;
    return (a + b) / 2;
  }
  return sorted[mid] ?? 0;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

export function normalize(days: readonly ContributionDay[]): Normalization {
  const totalDays = days.length;
  const indexed = days.map((d, index) => ({ ...d, index }));
  const active = indexed.filter((d) => d.count > 0);
  const sorted = active.map((d) => d.count).sort((a, b) => a - b);
  const median = medianOf(sorted);
  const peakFloor = Math.max(MIN_PEAK_FLOOR, median * 2);

  const candidates = [...indexed].sort(
    (a, b) => b.count - a.count || a.index - b.index,
  );
  const eligible = candidates.filter((d) => d.count >= peakFloor);
  const K = Math.min(MAX_PEAKS, Math.max(MIN_PEAKS, eligible.length));
  const peakCount = Math.min(K, active.length);
  const peakSet = new Set(candidates.slice(0, peakCount).map((d) => d.index));

  const peakValues: number[] = [];
  for (const i of peakSet) {
    const d = indexed[i];
    if (d) peakValues.push(d.count);
  }
  const peakMin = peakValues.length > 0 ? Math.min(...peakValues) : 0;
  const peakMax = peakValues.length > 0 ? Math.max(...peakValues) : 0;

  let maxNonPeak = 0;
  for (const d of active) {
    if (!peakSet.has(d.index) && d.count > maxNonPeak) {
      maxNonPeak = d.count;
    }
  }

  const activeSum = active.reduce((s, d) => s + d.count, 0);
  const meanActive = active.length > 0 ? activeSum / active.length : 0;
  let varianceSum = 0;
  for (const d of active) {
    const diff = d.count - meanActive;
    varianceSum += diff * diff;
  }
  const varianceActive = active.length > 0 ? varianceSum / active.length : 0;
  const stddevActive = Math.sqrt(varianceActive);
  const cvActive = meanActive > 0 ? stddevActive / meanActive : 0;

  const rawCoverage = totalDays > 0 ? active.length / totalDays : 0;
  const cvTerm = Math.min(cvActive / CV_SATURATION, 1);
  const densityRegime = clamp(
    0.6 * rawCoverage + 0.4 * cvTerm,
    DENSITY_FLOOR,
    DENSITY_CEIL,
  );

  const logMaxNonPeak = maxNonPeak > 0 ? Math.log(1 + maxNonPeak) : 0;

  const normalizedDays: NormalizedDay[] = indexed.map((d) => {
    const isActive = d.count > 0;
    const isPeak = peakSet.has(d.index);
    const aboveMedian = d.count > median;
    const intensity =
      isActive && !isPeak && logMaxNonPeak > 0
        ? Math.min(Math.log(1 + d.count) / logMaxNonPeak, 1)
        : 0;
    const peakIntensity = isPeak
      ? peakMax > peakMin
        ? (d.count - peakMin) / (peakMax - peakMin)
        : 1
      : 0;
    return {
      date: d.date,
      count: d.count,
      index: d.index,
      isActive,
      aboveMedian,
      isPeak,
      intensity,
      peakIntensity,
    };
  });

  const peaks = normalizedDays
    .filter((d) => d.isPeak)
    .sort((a, b) => a.index - b.index);

  return {
    days: normalizedDays,
    peaks,
    median,
    peakFloor,
    activeDays: active.length,
    maxNonPeak,
    meanActive,
    cvActive,
    densityRegime,
  };
}
