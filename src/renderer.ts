import {
  GLYPH_DEFS,
  HALO_DURATION_S,
  HALO_STAGGER_S,
  attrs,
  coreFill,
  lerp,
  renderCometStack,
  renderPeak,
  COMET_TAIL_RX,
} from "./glyphs.js";
import { makePRNG } from "./prng.js";
import { normalize } from "./normalize.js";
import { renderOrbitSVG } from "./orbit.js";
import type {
  ContributionDay,
  NormalizedDay,
  RenderOptions,
  Theme,
} from "./types.js";

const GRID_COLS = 53;
const GRID_ROWS = 7;
const CELL_SIZE = 16;
const PADDING = 10;
const LABEL_BAND = 18;
const DAY_LABEL_WIDTH = 28;
const GRID_WIDTH = GRID_COLS * CELL_SIZE;
const GRID_HEIGHT = GRID_ROWS * CELL_SIZE;
const GRID_X0 = DAY_LABEL_WIDTH + PADDING;
const SVG_WIDTH = GRID_WIDTH + 2 * PADDING + DAY_LABEL_WIDTH;
const SVG_HEIGHT = GRID_HEIGHT + 2 * PADDING + LABEL_BAND;

const DAY_LABELS: ReadonlyArray<readonly [number, string]> = [
  [1, "Mon"],
  [3, "Wed"],
  [5, "Fri"],
];

const COMET_TRAVERSAL_MS = 4800;
const COMET_HOLD_MS = 3500;
const COMET_CYCLE_MS = COMET_TRAVERSAL_MS + COMET_HOLD_MS;
const TWINKLE_DURATION_S = 7;

const DEFAULT_SEED = 0x5eed;

// 5-bucket cell placement: 4 corners + center (weights 0.22/0.22/0.22/0.22/0.12).
// Replaces the old continuous ±0.32 * CELL_SIZE jitter.
const CORNER_OFFSET_PX = 4.0;
const CORNER_DITHER_PX = 1.2;
const BUCKET_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-CORNER_OFFSET_PX, -CORNER_OFFSET_PX],
  [+CORNER_OFFSET_PX, -CORNER_OFFSET_PX],
  [-CORNER_OFFSET_PX, +CORNER_OFFSET_PX],
  [+CORNER_OFFSET_PX, +CORNER_OFFSET_PX],
  [0, 0],
];
const BUCKET_WEIGHTS: readonly number[] = [0.22, 0.22, 0.22, 0.22, 0.12];

// Background star scaling by density regime d ∈ [0.05, 1]
const BG_TIER_COUNTS: ReadonlyArray<readonly [number, number, number]> = [
  // [dMax, count, staticOpacity]
  [0.15, 50, 0.12],
  [0.45, 65, 0.15],
  [Infinity, 80, 0.18],
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

interface PlacedDay extends NormalizedDay {
  readonly cx: number;
  readonly cy: number;
  readonly angle: number;
}

// Core + halo geometry for non-peak stars.
// Both ceilings grow with density regime d so large accounts look richer
// at the top end. Floors are density-independent to guarantee small-account
// visibility (invariants 1 and 6 in specs/008-adaptive-star-rendering/spec.md).
const CORE_R_FLOOR = 0.8;
const HALO_R_FLOOR = 1.5;
const CORE_OP_FLOOR = 0.5;
const HALO_OP_FLOOR = 0.12;

function coreRadius(t: number, d: number): number {
  const ceil = lerp(1.8, 2.4, d);
  return CORE_R_FLOOR + Math.sqrt(t) * (ceil - CORE_R_FLOOR);
}

function coreOpacity(t: number, d: number): number {
  const ceil = lerp(0.82, 0.92, d);
  return CORE_OP_FLOOR + Math.sqrt(t) * (ceil - CORE_OP_FLOOR);
}

function haloRadius(t: number, d: number): number {
  const ceil = lerp(2.8, 3.6, d);
  return HALO_R_FLOOR + Math.sqrt(t) * (ceil - HALO_R_FLOOR);
}

function haloOpacity(t: number, d: number): number {
  const ceil = lerp(0.22, 0.3, d);
  return HALO_OP_FLOOR + Math.sqrt(t) * (ceil - HALO_OP_FLOOR);
}

function haloFill(t: number, hue: number): string {
  const s = lerp(30, 55, t);
  const l = lerp(40, 70, t);
  return `hsl(${hue.toFixed(0)},${s.toFixed(0)}%,${l.toFixed(0)}%)`;
}

function pickTint(tints: readonly string[], roll: number): string {
  const fallback = tints[0] ?? "#ffffff";
  if (tints.length === 0) return fallback;
  if (roll < 0.72) return tints[0] ?? fallback;
  if (roll < 0.81) return tints[1] ?? fallback;
  if (roll < 0.88) return tints[2] ?? fallback;
  if (roll < 0.94) return tints[3] ?? fallback;
  return tints[4] ?? fallback;
}

function pickBucket(roll: number): readonly [number, number] {
  let acc = 0;
  for (let i = 0; i < BUCKET_WEIGHTS.length; i++) {
    acc += BUCKET_WEIGHTS[i] ?? 0;
    if (roll < acc) {
      return BUCKET_OFFSETS[i] ?? [0, 0];
    }
  }
  return BUCKET_OFFSETS[BUCKET_OFFSETS.length - 1] ?? [0, 0];
}

function bgTier(d: number): { count: number; staticOpacity: number } {
  for (const [dMax, count, staticOpacity] of BG_TIER_COUNTS) {
    if (d < dMax) return { count, staticOpacity };
  }
  return { count: 80, staticOpacity: 0.18 };
}

function layout(
  days: readonly NormalizedDay[],
  seed: number,
): readonly PlacedDay[] {
  const rng = makePRNG(seed);
  const placed: PlacedDay[] = [];

  for (const d of days) {
    // 3 PRNG calls per day: bucket selection + x dither + y dither.
    const [bx, by] = pickBucket(rng());
    const dx = (rng() * 2 - 1) * CORNER_DITHER_PX;
    const dy = (rng() * 2 - 1) * CORNER_DITHER_PX;

    const col = Math.floor(d.index / GRID_ROWS);
    const row = d.index % GRID_ROWS;
    const cx = GRID_X0 + col * CELL_SIZE + CELL_SIZE / 2 + bx + dx;
    const cy = LABEL_BAND + row * CELL_SIZE + CELL_SIZE / 2 + PADDING + by + dy;

    // Peaks still carry a rotation angle for the ray cross; derive it deterministically
    // from (cx, cy) without consuming extra PRNG calls.
    const angle = d.isPeak ? ((cx + cy) % 90) - 45 : 0;

    placed.push({ ...d, cx, cy, angle });
  }

  return placed;
}

function renderBgStars(
  seed: number,
  theme: Theme,
  animated: boolean,
  d: number,
): string {
  const { count, staticOpacity } = bgTier(d);
  const rng = makePRNG(seed ^ 0xdeadbeef);
  let out = "";
  for (let i = 0; i < count; i++) {
    const cx = rng() * GRID_WIDTH + GRID_X0;
    const cy = rng() * GRID_HEIGHT + PADDING + LABEL_BAND;
    const r = rng() * 1.5;
    const delay = rng() * TWINKLE_DURATION_S;
    const fill = pickTint(theme.bgStarTints, rng());
    const body = `<circle${attrs([
      ["cx", cx],
      ["cy", cy],
      ["r", r],
      ["fill", fill],
      ["opacity", animated ? 0.05 : staticOpacity],
    ])}`;
    if (animated) {
      out +=
        body +
        `><animate attributeName="opacity" values="0.05;0.3;0.05" dur="${TWINKLE_DURATION_S}s" begin="-${delay.toFixed(2)}s" repeatCount="indefinite" /></circle>`;
    } else {
      out += body + " />";
    }
  }
  return out;
}

function renderStar(d: PlacedDay, theme: Theme, regime: number): string {
  const t = d.intensity;
  const haloR = haloRadius(t, regime);
  const haloOp = haloOpacity(t, regime);
  const coreR = coreRadius(t, regime);
  const coreOp = coreOpacity(t, regime);
  const hue = theme.dataStarHue;

  let out = `<circle${attrs([
    ["cx", d.cx],
    ["cy", d.cy],
    ["r", haloR],
    ["fill", haloFill(t, hue)],
    ["opacity", haloOp],
  ])} />`;
  out += `<circle${attrs([
    ["cx", d.cx],
    ["cy", d.cy],
    ["r", coreR],
    ["fill", coreFill(t, hue)],
    ["opacity", coreOp],
  ])} />`;
  return out;
}

function renderDayLabels(theme: Theme): string {
  let out = "";
  for (const [row, label] of DAY_LABELS) {
    const y = LABEL_BAND + PADDING + row * CELL_SIZE + CELL_SIZE / 2 + 3;
    out += `<text${attrs([
      ["x", DAY_LABEL_WIDTH - 6],
      ["y", y],
      ["font-family", "monospace"],
      ["font-size", 10],
      ["fill", theme.label],
      ["text-anchor", "end"],
    ])}>${label}</text>`;
  }
  return out;
}

function renderMonthLabels(
  days: readonly ContributionDay[],
  theme: Theme,
): string {
  if (days.length === 0) return "";
  let out = "";
  let lastMonth = -1;
  let lastLabelX = -Infinity;
  for (let col = 0; col < GRID_COLS; col++) {
    let newMonth = -1;
    for (let row = 0; row < GRID_ROWS; row++) {
      const d = days[col * GRID_ROWS + row];
      if (!d) continue;
      const parsed = new Date(`${d.date}T00:00:00Z`);
      if (Number.isNaN(parsed.getTime())) continue;
      const m = parsed.getUTCMonth();
      if (m !== lastMonth) {
        newMonth = m;
        break;
      }
    }
    if (newMonth === -1) continue;
    const x = GRID_X0 + col * CELL_SIZE;
    if (x - lastLabelX < 28) continue;
    lastMonth = newMonth;
    lastLabelX = x;
    const label = MONTHS[newMonth] ?? "";
    out += `<text${attrs([
      ["x", x],
      ["y", 12],
      ["font-family", "monospace"],
      ["font-size", 10],
      ["fill", theme.label],
    ])}>${label}</text>`;
  }
  return out;
}

function renderComet(
  peaks: readonly PlacedDay[],
  theme: Theme,
  animated: boolean,
): string {
  if (peaks.length < 2) return "";
  const pathD =
    "M " +
    peaks.map((p) => `${p.cx.toFixed(2)},${p.cy.toFixed(2)}`).join(" L ");
  const start = peaks[0];
  if (!start) return "";

  let out = `<path${attrs([
    ["d", pathD],
    ["fill", "none"],
    ["stroke", theme.constellation],
    ["stroke-width", 1],
    ["stroke-linejoin", "round"],
  ])} />`;

  if (!animated) return out;

  out += renderCometStack(pathD, theme, {
    cycleS: COMET_CYCLE_MS / 1000,
    travFrac: COMET_TRAVERSAL_MS / COMET_CYCLE_MS,
    tailRx: COMET_TAIL_RX,
  });
  return out;
}

function renderGridSVG(
  days: readonly ContributionDay[],
  options: RenderOptions,
): string {
  const { theme, animated } = options;
  const seed = options.seed ?? DEFAULT_SEED;

  const { days: normDays, peaks, densityRegime } = normalize(days);
  const placed = layout(normDays, seed);
  const placedPeaks = placed.filter((d) => d.isPeak);
  const hasPeaks = peaks.length > 0;

  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" role="img" aria-label="Cinematic comet contribution graph">`;
  out += `<rect${attrs([
    ["x", 0],
    ["y", 0],
    ["width", SVG_WIDTH],
    ["height", SVG_HEIGHT],
    ["fill", theme.background],
  ])} />`;
  out += `<defs>${GLYPH_DEFS}</defs>`;
  out += renderDayLabels(theme);
  out += renderMonthLabels(days, theme);
  out += renderBgStars(seed, theme, animated, densityRegime);

  for (const d of placed) {
    if (!d.isActive) continue;
    if (d.isPeak) continue;
    out += renderStar(d, theme, densityRegime);
  }

  if (hasPeaks && placedPeaks.length >= 2) {
    out += renderComet(placedPeaks, theme, animated);
  }

  placedPeaks.forEach((d, idx) => {
    out += renderPeak(d, idx, theme, animated);
  });

  out += "</svg>";
  return out;
}

export function renderCometSVG(
  days: readonly ContributionDay[],
  options: RenderOptions,
): string {
  const layout = options.layout ?? "orbit";
  return layout === "grid"
    ? renderGridSVG(days, options)
    : renderOrbitSVG(days, options);
}
