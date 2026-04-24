import { makePRNG } from "./prng.js";
import { normalize } from "./normalize.js";
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
const HALO_DURATION_S = 3;
const HALO_STAGGER_S = 0.6;

const DEFAULT_SEED = 0x5eed;
const COMET_NUCLEUS_R = 1.85;
const COMET_COMA_INNER_R = 3.29;
const COMET_COMA_OUTER_R = 5.36;
const COMET_COMA_INNER_OPACITY = 0.55;
const COMET_COMA_OUTER_OPACITY = 0.28;
const COMET_TAIL_RX = 56;
const COMET_TAIL_RY = 3.0;

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

type AttrValue = string | number;

function fmt(value: AttrValue): string {
  return typeof value === "number" ? value.toFixed(2) : value;
}

function attrs(
  pairs: readonly (readonly [string, AttrValue | undefined])[],
): string {
  let out = "";
  for (const [key, value] of pairs) {
    if (value === undefined || value === "") continue;
    out += ` ${key}="${fmt(value)}"`;
  }
  return out;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
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

function coreFill(t: number, hue: number): string {
  const hueAdj = t >= 0.7 ? hue - ((t - 0.7) / 0.3) * 14 : hue;
  const s = lerp(50, 82, t);
  const l = lerp(38, 88, t);
  return `hsl(${hueAdj.toFixed(1)},${s.toFixed(0)}%,${l.toFixed(0)}%)`;
}

function haloFill(t: number, hue: number): string {
  const s = lerp(30, 55, t);
  const l = lerp(40, 70, t);
  return `hsl(${hue.toFixed(0)},${s.toFixed(0)}%,${l.toFixed(0)}%)`;
}

function peakFill(count: number): string {
  if (count > 19) return "hsl(48,100%,92%)";
  const lightness = lerp(68, 86, Math.max(0, (count - 15) / 4));
  return `hsl(48,100%,${lightness.toFixed(1)}%)`;
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

function renderPeak(
  d: PlacedDay,
  peakIdx: number,
  theme: Theme,
  animated: boolean,
): string {
  const effective = Math.max(15, Math.min(d.count, 19));
  const haloR = 3.5 + (effective - 15) * 0.6;
  const coreR = 0.9 + (effective - 15) * 0.12;
  const rayLen = 5.0 + (effective - 15) * 1.0;
  const diagLen = rayLen * 0.45;
  const diagOff = diagLen * 0.707;
  const sphereR = haloR * 0.6;
  const rayFill = peakFill(d.count);

  let out = `<g transform="rotate(${d.angle.toFixed(1)} ${d.cx.toFixed(2)} ${d.cy.toFixed(2)})">`;
  const haloOpen = `<circle${attrs([
    ["cx", d.cx],
    ["cy", d.cy],
    ["r", haloR],
    ["fill", theme.peakHalo],
    ["fill-opacity", 0.35],
  ])}`;
  if (animated) {
    out +=
      haloOpen +
      `><animate attributeName="fill-opacity" values="0.25;0.45;0.25" dur="${HALO_DURATION_S}s" begin="-${(peakIdx * HALO_STAGGER_S).toFixed(2)}s" repeatCount="indefinite" /></circle>`;
  } else {
    out += haloOpen + " />";
  }
  out += `<circle${attrs([
    ["cx", d.cx],
    ["cy", d.cy],
    ["r", sphereR],
    ["fill", "hsla(50,100%,99%,0.75)"],
    ["filter", "url(#organic-sphere)"],
  ])} />`;

  out += `<line${attrs([
    ["x1", d.cx - diagOff],
    ["y1", d.cy - diagOff],
    ["x2", d.cx + diagOff],
    ["y2", d.cy + diagOff],
    ["stroke", rayFill],
    ["stroke-width", 0.4],
    ["stroke-opacity", 0.42],
    ["stroke-linecap", "round"],
  ])} />`;
  out += `<line${attrs([
    ["x1", d.cx - diagOff],
    ["y1", d.cy + diagOff],
    ["x2", d.cx + diagOff],
    ["y2", d.cy - diagOff],
    ["stroke", rayFill],
    ["stroke-width", 0.4],
    ["stroke-opacity", 0.42],
    ["stroke-linecap", "round"],
  ])} />`;
  out += `<line${attrs([
    ["x1", d.cx - rayLen],
    ["y1", d.cy],
    ["x2", d.cx + rayLen],
    ["y2", d.cy],
    ["stroke", rayFill],
    ["stroke-width", 0.5],
    ["stroke-linecap", "round"],
  ])} />`;
  out += `<line${attrs([
    ["x1", d.cx],
    ["y1", d.cy - rayLen],
    ["x2", d.cx],
    ["y2", d.cy + rayLen],
    ["stroke", rayFill],
    ["stroke-width", 0.5],
    ["stroke-linecap", "round"],
  ])} />`;
  out += `<circle${attrs([
    ["cx", d.cx],
    ["cy", d.cy],
    ["r", coreR],
    ["fill", rayFill],
  ])} />`;
  out += "</g>";
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

  const cycleS = COMET_CYCLE_MS / 1000;
  const travFrac = COMET_TRAVERSAL_MS / COMET_CYCLE_MS;
  const motionKeyTimes = `0;${travFrac.toFixed(4)};1`;
  const motionKeyPoints = "0;1;1";
  const opacityKeyTimes = `0;${travFrac.toFixed(4)};${(travFrac + 0.001).toFixed(4)};1`;

  const emitCometLayer = (
    radius: number,
    fill: string,
    baseOpacity: number,
    beginOffsetS: number,
  ): string => {
    const begin = beginOffsetS > 0 ? `-${beginOffsetS.toFixed(2)}s` : "0s";
    const opacityVals = `${baseOpacity};${baseOpacity};0;0`;
    return (
      `<circle${attrs([
        ["cx", 0],
        ["cy", 0],
        ["r", radius],
        ["fill", fill],
        ["opacity", baseOpacity],
      ])}>` +
      `<animateMotion dur="${cycleS.toFixed(2)}s" begin="${begin}" repeatCount="indefinite" keyTimes="${motionKeyTimes}" keyPoints="${motionKeyPoints}" calcMode="linear" path="${pathD}" />` +
      `<animate attributeName="opacity" dur="${cycleS.toFixed(2)}s" begin="${begin}" repeatCount="indefinite" keyTimes="${opacityKeyTimes}" values="${opacityVals}" />` +
      "</circle>"
    );
  };

  // Tail: single gradient ellipse with rotate="auto" so the gradient tracks
  // the path tangent. Rendered first so head/coma paint over it.
  const tailDur = `dur="${cycleS.toFixed(2)}s"`;
  out +=
    `<ellipse cx="-${COMET_TAIL_RX}" cy="0" rx="${COMET_TAIL_RX}" ry="${COMET_TAIL_RY.toFixed(2)}" fill="url(#tail-grad)" filter="url(#tail-blur)">` +
    `<animateMotion ${tailDur} begin="0s" repeatCount="indefinite" keyTimes="${motionKeyTimes}" keyPoints="${motionKeyPoints}" calcMode="linear" rotate="auto" path="${pathD}" />` +
    `<animate attributeName="opacity" ${tailDur} begin="0s" repeatCount="indefinite" keyTimes="${opacityKeyTimes}" values="1;1;0;0" />` +
    `</ellipse>`;

  // Coma (outer halo then inner halo)
  out += emitCometLayer(
    COMET_COMA_OUTER_R,
    theme.cometComaOuter,
    COMET_COMA_OUTER_OPACITY,
    0,
  );
  out += emitCometLayer(
    COMET_COMA_INNER_R,
    theme.cometComaInner,
    COMET_COMA_INNER_OPACITY,
    0,
  );

  // Nucleus (head)
  out += emitCometLayer(COMET_NUCLEUS_R, theme.cometHead, 1, 0);

  return out;
}

export function renderCometSVG(
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
  out += `<defs><linearGradient id="tail-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#c8e0ff" stop-opacity="0"/><stop offset="40%" stop-color="#c8e0ff" stop-opacity="0.1"/><stop offset="70%" stop-color="#d8ecff" stop-opacity="0.5"/><stop offset="90%" stop-color="#ffffff" stop-opacity="0.85"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></linearGradient><filter id="tail-blur" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="1.2"/></filter><filter id="organic-sphere" x="-80%" y="-80%" width="260%" height="260%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" /><feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" result="displaced" /><feGaussianBlur in="displaced" stdDeviation="1.4" /></filter></defs>`;
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
