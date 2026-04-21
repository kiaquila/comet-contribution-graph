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
const JITTER_AMP = 0.32;
const LABEL_BAND = 18;
const DAY_LABEL_WIDTH = 28;
const GRID_WIDTH = GRID_COLS * CELL_SIZE;
const GRID_HEIGHT = GRID_ROWS * CELL_SIZE;
const GRID_X0 = DAY_LABEL_WIDTH + PADDING;
const SVG_WIDTH = GRID_WIDTH + 2 * PADDING + DAY_LABEL_WIDTH;
const SVG_HEIGHT = GRID_HEIGHT + 2 * PADDING + LABEL_BAND;

const DAY_LABELS: ReadonlyArray<readonly [number, string]> = [
  [0, "Mon"],
  [2, "Wed"],
  [4, "Fri"],
];

const COMET_TRAVERSAL_MS = 4800;
const COMET_HOLD_MS = 3500;
const COMET_CYCLE_MS = COMET_TRAVERSAL_MS + COMET_HOLD_MS;
const TWINKLE_DURATION_S = 7;
const HALO_DURATION_S = 3;
const HALO_STAGGER_S = 0.6;

const DEFAULT_SEED = 0x5eed;
const BG_STAR_COUNT = 80;
const COMET_NUCLEUS_R = 2.2;
const COMET_COMA_INNER_R = 5.5;
const COMET_COMA_OUTER_R = 9;
const COMET_COMA_INNER_OPACITY = 0.55;
const COMET_COMA_OUTER_OPACITY = 0.28;

interface TrailParticle {
  readonly beginOffsetS: number;
  readonly radius: number;
  readonly opacity: number;
}

const COMET_TRAIL: readonly TrailParticle[] = [
  { beginOffsetS: 0.18, radius: 1.8, opacity: 0.45 },
  { beginOffsetS: 0.36, radius: 1.3, opacity: 0.28 },
  { beginOffsetS: 0.54, radius: 0.9, opacity: 0.16 },
  { beginOffsetS: 0.72, radius: 0.6, opacity: 0.08 },
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

type StarShape = "circle" | "spike";

interface PlacedDay extends NormalizedDay {
  readonly cx: number;
  readonly cy: number;
  readonly shape: StarShape;
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

function nonPeakRadius(intensity: number): number {
  return 0.8 + intensity * 2.2;
}

function nonPeakFill(intensity: number, hue: number): string {
  const s = lerp(42, 72, intensity);
  const l = lerp(28, 82, intensity);
  return `hsl(${hue},${s.toFixed(0)}%,${l.toFixed(0)}%)`;
}

function nonPeakOpacity(intensity: number): number {
  return 0.45 + intensity * 0.5;
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

function layout(
  days: readonly NormalizedDay[],
  seed: number,
): readonly PlacedDay[] {
  const rng = makePRNG(seed);
  const placed: PlacedDay[] = [];

  for (const d of days) {
    rng(); // reserve aesthetic slot to keep PRNG stream stable with prototype
    const jx = (rng() * 2 - 1) * JITTER_AMP * CELL_SIZE;
    const jy = (rng() * 2 - 1) * JITTER_AMP * CELL_SIZE;

    let shape: StarShape;
    let angle = 0;

    if (d.isPeak) {
      rng();
      shape = "spike";
    } else if (d.intensity >= 0.55) {
      shape = rng() < 0.3 ? "spike" : "circle";
    } else {
      rng();
      shape = "circle";
    }

    if (shape === "spike") {
      angle = (rng() * 2 - 1) * 45;
    } else {
      rng();
    }

    const col = Math.floor(d.index / GRID_ROWS);
    const row = d.index % GRID_ROWS;
    const cx = GRID_X0 + col * CELL_SIZE + CELL_SIZE / 2 + jx;
    const cy =
      LABEL_BAND + row * CELL_SIZE + CELL_SIZE / 2 + PADDING + jy;

    placed.push({ ...d, cx, cy, shape, angle });
  }

  return placed;
}

function renderBgStars(
  seed: number,
  theme: Theme,
  animated: boolean,
): string {
  const rng = makePRNG(seed ^ 0xdeadbeef);
  let out = "";
  for (let i = 0; i < BG_STAR_COUNT; i++) {
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
      ["opacity", animated ? 0.05 : 0.18],
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

function renderStar(d: PlacedDay, theme: Theme): string {
  const r = nonPeakRadius(d.intensity);
  const fill = nonPeakFill(d.intensity, theme.dataStarHue);
  const opacity = nonPeakOpacity(d.intensity);
  let out = `<circle${attrs([
    ["cx", d.cx],
    ["cy", d.cy],
    ["r", r],
    ["fill", fill],
    ["opacity", opacity],
  ])} />`;
  if (d.shape !== "spike") return out;

  const armLen = r * 2.8;
  const diagLen = armLen * 0.45;
  const diagOff = diagLen * 0.707;
  out += `<g transform="rotate(${d.angle.toFixed(1)} ${d.cx.toFixed(2)} ${d.cy.toFixed(2)})">`;
  out += `<line${attrs([
    ["x1", d.cx - armLen],
    ["y1", d.cy],
    ["x2", d.cx + armLen],
    ["y2", d.cy],
    ["stroke", fill],
    ["stroke-width", 0.6],
    ["opacity", opacity],
  ])} />`;
  out += `<line${attrs([
    ["x1", d.cx],
    ["y1", d.cy - armLen],
    ["x2", d.cx],
    ["y2", d.cy + armLen],
    ["stroke", fill],
    ["stroke-width", 0.6],
    ["opacity", opacity],
  ])} />`;
  out += `<line${attrs([
    ["x1", d.cx - diagOff],
    ["y1", d.cy - diagOff],
    ["x2", d.cx + diagOff],
    ["y2", d.cy + diagOff],
    ["stroke", fill],
    ["stroke-width", 0.4],
    ["stroke-opacity", 0.3],
    ["stroke-linecap", "round"],
  ])} />`;
  out += `<line${attrs([
    ["x1", d.cx - diagOff],
    ["y1", d.cy + diagOff],
    ["x2", d.cx + diagOff],
    ["y2", d.cy - diagOff],
    ["stroke", fill],
    ["stroke-width", 0.4],
    ["stroke-opacity", 0.3],
    ["stroke-linecap", "round"],
  ])} />`;
  out += "</g>";
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
    lastMonth = newMonth;
    const label = MONTHS[newMonth] ?? "";
    const x = GRID_X0 + col * CELL_SIZE;
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
  const opacityValues = "1;1;0;0";

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

  // Trail (rendered first so head/coma paint over it)
  for (const particle of COMET_TRAIL) {
    out += emitCometLayer(
      particle.radius,
      theme.cometTrail,
      particle.opacity,
      particle.beginOffsetS,
    );
  }

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

  const { days: normDays, peaks } = normalize(days);
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
  out += `<defs><filter id="organic-sphere" x="-80%" y="-80%" width="260%" height="260%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" /><feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" result="displaced" /><feGaussianBlur in="displaced" stdDeviation="1.4" /></filter></defs>`;
  out += renderDayLabels(theme);
  out += renderMonthLabels(days, theme);
  out += renderBgStars(seed, theme, animated);

  for (const d of placed) {
    if (!d.isActive) continue;
    if (d.isPeak) continue;
    if (!d.aboveMedian) continue;
    out += renderStar(d, theme);
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
