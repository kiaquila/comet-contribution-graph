import type {
  ContributionDay,
  Normalization,
  NormalizedDay,
} from "./types.js";

const MIN_PEAKS = 2;
const MAX_PEAKS = 7;
const MIN_PEAK_FLOOR = 5;

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

export function normalize(days: readonly ContributionDay[]): Normalization {
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
  const peakSet = new Set(
    candidates.slice(0, peakCount).map((d) => d.index),
  );

  const peakValues: number[] = [];
  for (const i of peakSet) {
    const d = indexed[i];
    if (d) peakValues.push(d.count);
  }
  const peakMin = peakValues.length > 0 ? Math.min(...peakValues) : 0;
  const peakMax = peakValues.length > 0 ? Math.max(...peakValues) : 0;
  const maxActive = sorted.at(-1) ?? 0;

  const normalizedDays: NormalizedDay[] = indexed.map((d) => {
    const isActive = d.count > 0;
    const isPeak = peakSet.has(d.index);
    const aboveMedian = d.count > median;
    const intensity =
      isActive && !isPeak && maxActive > 0
        ? Math.min(d.count / maxActive, 1)
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

  return { days: normalizedDays, peaks, median, peakFloor };
}
