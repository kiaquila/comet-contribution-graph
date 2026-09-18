import {
  GLYPH_DEFS,
  attrs,
  coreFill,
  lerp,
  renderCometStack,
  renderPeak,
} from "./glyphs.js";
import { normalize } from "./normalize.js";
import { makePRNG } from "./prng.js";
import type { ContributionDay, RenderOptions, Theme } from "./types.js";

// Orbit layout: the year is wound into rings around a "sun" that carries the
// total; the comet orbits continuously. A stats panel on the right restores
// the legibility the radial form gives up (raw numbers + weekly histogram).

const SVG_WIDTH = 896;
const SVG_HEIGHT = 300;
const COLS = 53;
const ROWS = 7;
const DEFAULT_SEED = 0x5eed;

const ORBIT_CX = 160;
const ORBIT_CY = 152;
const RING_R0 = 50;
const RING_STEP = 11.5;
// Leave a 10° gap at the top so the year has a visible start and end.
const ARC_START_DEG = -85;
const ARC_SPAN_DEG = 350;
const MONTH_LABEL_R = 145;
const COMET_ORBIT_R = 134;
const COMET_ORBIT_S = 14;
const COMET_TAIL_RX = 38;
const SUN_R = 44;

const PANEL_X = 340;
const PANEL_RIGHT = SVG_WIDTH - 24;
const PANEL_WIDTH = PANEL_RIGHT - PANEL_X;
// Typical advance width of monospace glyphs, used to decide when a title
// (GitHub logins go up to 39 chars) must be squeezed to the panel.
const MONO_ADVANCE_EM = 0.62;
const BARS_BASELINE = 262;
const BARS_MAX_H = 44;

const BG_STAR_COUNT = 110;
const TWINKLE_DURATION_S = 7;
const BG_STATIC_OPACITY = 0.15;

const TITLE_FILL = "#e8f3ff";
const VALUE_FILL = "#dff1ff";
const SUN_TEXT_FILL = "#fff3c4";
const RING_STROKE = "#5d7ea8";
const EMPTY_BAR_FILL = "#0e182b";

// deep navy → ice white, used for the weekly bars
const BAR_STOPS: ReadonlyArray<readonly [number, number, number]> = [
  [13, 27, 56],
  [20, 62, 116],
  [33, 124, 186],
  [102, 212, 232],
  [240, 251, 255],
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
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

interface MonthSpan {
  readonly label: string;
  readonly colStart: number;
  readonly colEnd: number;
}

interface YearStats {
  readonly total: number;
  readonly activeDays: number;
  readonly longestStreak: number;
  readonly best: ContributionDay | undefined;
  readonly busiestWeekday: string;
  readonly weekly: readonly number[];
  readonly weeklyMax: number;
  readonly months: readonly MonthSpan[];
  readonly first: ContributionDay | undefined;
  readonly last: ContributionDay | undefined;
}

function parseDate(date: string): Date | undefined {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function groupThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function dayMonth(date: string): string {
  const d = parseDate(date);
  return d ? `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}` : date;
}

function dayMonthYear(date: string): string {
  const d = parseDate(date);
  return d ? `${dayMonth(date)} ${d.getUTCFullYear()}` : date;
}

function barFill(t: number): string {
  const x = Math.max(0, Math.min(1, t)) * (BAR_STOPS.length - 1);
  const k = Math.min(Math.floor(x), BAR_STOPS.length - 2);
  const u = x - k;
  const a = BAR_STOPS[k] ?? [0, 0, 0];
  const b = BAR_STOPS[k + 1] ?? a;
  const c = a.map((v, j) => Math.round(lerp(v, b[j] ?? v, u)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function computeStats(
  days: readonly ContributionDay[],
  activeDays: number,
): YearStats {
  let total = 0;
  let longestStreak = 0;
  let streak = 0;
  let best: ContributionDay | undefined;
  const weekly: number[] = Array.from({ length: COLS }, () => 0);
  const weekdayTotals = Array.from({ length: 7 }, () => 0);
  const months: MonthSpan[] = [];
  let lastMonthKey = "";

  days.forEach((d, i) => {
    total += d.count;
    if (d.count > 0) {
      streak += 1;
      if (streak > longestStreak) longestStreak = streak;
      if (!best || d.count > best.count) best = d;
    } else {
      streak = 0;
    }
    const col = Math.floor(i / ROWS);
    if (col < COLS) weekly[col] = (weekly[col] ?? 0) + d.count;

    const parsed = parseDate(d.date);
    if (!parsed) return;
    weekdayTotals[parsed.getUTCDay()] =
      (weekdayTotals[parsed.getUTCDay()] ?? 0) + d.count;
    const key = `${parsed.getUTCFullYear()}-${parsed.getUTCMonth()}`;
    const current = months[months.length - 1];
    if (key === lastMonthKey && current) {
      months[months.length - 1] = { ...current, colEnd: col };
    } else {
      months.push({
        label: MONTHS[parsed.getUTCMonth()] ?? "",
        colStart: col,
        colEnd: col,
      });
      lastMonthKey = key;
    }
  });

  // Only parsed dates can be grouped by weekday; if none carried any
  // contributions the panel shows a dash instead of defaulting to Sunday.
  const weekdayMax = Math.max(...weekdayTotals);
  const busiestWeekday =
    weekdayMax > 0 ? (WEEKDAYS[weekdayTotals.indexOf(weekdayMax)] ?? "—") : "—";
  return {
    total,
    activeDays,
    longestStreak,
    best,
    busiestWeekday,
    weekly,
    weeklyMax: Math.max(...weekly, 1),
    months,
    first: days[0],
    last: days[days.length - 1],
  };
}

function orbitPos(col: number, row: number): readonly [number, number] {
  const deg = ARC_START_DEG + ((col + 0.5) / COLS) * ARC_SPAN_DEG;
  const rad = (deg * Math.PI) / 180;
  const r = RING_R0 + row * RING_STEP;
  return [ORBIT_CX + Math.cos(rad) * r, ORBIT_CY + Math.sin(rad) * r];
}

function text(
  x: number,
  y: number,
  content: string,
  o: {
    readonly size: number;
    readonly fill: string;
    readonly anchor?: "middle" | "end";
    readonly spacing?: number;
    readonly weight?: "bold";
    // Squeeze the run into this many px when its estimated width exceeds it.
    readonly maxWidth?: number;
  },
): string {
  const estimated =
    content.length * (o.size * MONO_ADVANCE_EM + (o.spacing ?? 0));
  const fit = o.maxWidth !== undefined && estimated > o.maxWidth;
  return `<text${attrs([
    ["x", x],
    ["y", y],
    ["font-family", "monospace"],
    ["font-size", o.size],
    ["fill", o.fill],
    ["text-anchor", o.anchor],
    ["letter-spacing", o.spacing],
    ["font-weight", o.weight],
    ["textLength", fit ? o.maxWidth : undefined],
    ["lengthAdjust", fit ? "spacingAndGlyphs" : undefined],
  ])}>${content}</text>`;
}

function renderBgStars(seed: number, theme: Theme, animated: boolean): string {
  const rng = makePRNG(seed ^ 0xdeadbeef);
  let out = "";
  for (let i = 0; i < BG_STAR_COUNT; i++) {
    const cx = rng() * SVG_WIDTH;
    const cy = rng() * SVG_HEIGHT;
    const r = 0.3 + rng() * 0.9;
    const delay = rng() * TWINKLE_DURATION_S;
    const tint =
      theme.bgStarTints[Math.floor(rng() * theme.bgStarTints.length)] ??
      "#ffffff";
    const body = `<circle${attrs([
      ["cx", cx],
      ["cy", cy],
      ["r", r],
      ["fill", tint],
      ["opacity", animated ? 0.05 : BG_STATIC_OPACITY],
    ])}`;
    out += animated
      ? body +
        `><animate attributeName="opacity" values="0.05;0.3;0.05" dur="${TWINKLE_DURATION_S}s" begin="-${delay.toFixed(2)}s" repeatCount="indefinite" /></circle>`
      : body + " />";
  }
  return out;
}

function renderSun(total: number, theme: Theme, animated: boolean): string {
  const glow = `<circle${attrs([
    ["cx", ORBIT_CX],
    ["cy", ORBIT_CY],
    ["r", SUN_R],
    ["fill", "url(#sun-glow)"],
  ])}`;
  let out = animated
    ? glow +
      `><animate attributeName="r" values="42;47;42" dur="6s" repeatCount="indefinite" /></circle>`
    : glow + " />";
  out += text(ORBIT_CX, ORBIT_CY + 5, groupThousands(total), {
    size: 17,
    fill: SUN_TEXT_FILL,
    anchor: "middle",
    weight: "bold",
  });
  out += text(ORBIT_CX, ORBIT_CY + 17, "contributions", {
    size: 7,
    fill: theme.label,
    anchor: "middle",
  });
  return out;
}

function renderRingsAndMonths(stats: YearStats, theme: Theme): string {
  let out = "";
  for (const row of [0, 3, 6]) {
    out += `<circle${attrs([
      ["cx", ORBIT_CX],
      ["cy", ORBIT_CY],
      ["r", RING_R0 + row * RING_STEP],
      ["fill", "none"],
      ["stroke", RING_STROKE],
      ["stroke-width", 0.4],
      ["opacity", 0.18],
    ])} />`;
  }
  for (const m of stats.months) {
    const [x1, y1] = orbitPos(m.colStart - 0.5, 7.2);
    const [x2, y2] = orbitPos(m.colStart - 0.5, 7.7);
    out += `<line${attrs([
      ["x1", x1],
      ["y1", y1],
      ["x2", x2],
      ["y2", y2],
      ["stroke", theme.label],
      ["stroke-width", 0.6],
    ])} />`;
    if (m.colEnd - m.colStart < 2) continue;
    const deg = ARC_START_DEG + ((m.colStart + 0.5) / COLS) * ARC_SPAN_DEG;
    const rad = (deg * Math.PI) / 180 + 0.13;
    out += text(
      ORBIT_CX + Math.cos(rad) * MONTH_LABEL_R,
      ORBIT_CY + Math.sin(rad) * MONTH_LABEL_R + 3,
      m.label,
      { size: 8, fill: theme.label, anchor: "middle" },
    );
  }
  return out;
}

function renderPanel(
  stats: YearStats,
  theme: Theme,
  username: string | undefined,
): string {
  let out = "";
  if (username) {
    out += text(PANEL_X, 40, username.toUpperCase(), {
      size: 18,
      fill: TITLE_FILL,
      spacing: 6,
      maxWidth: PANEL_WIDTH,
    });
  }
  if (stats.first && stats.last) {
    out += text(
      PANEL_X,
      56,
      `${dayMonthYear(stats.first.date)} → ${dayMonthYear(stats.last.date)}`,
      { size: 9, fill: theme.label },
    );
  }
  const cells: ReadonlyArray<readonly [string, string]> = [
    [groupThousands(stats.activeDays), "active days"],
    [`${stats.longestStreak}d`, "longest streak"],
    [
      stats.best ? groupThousands(stats.best.count) : "—",
      stats.best ? `best day · ${dayMonth(stats.best.date)}` : "best day",
    ],
    [stats.busiestWeekday, "busiest weekday"],
  ];
  cells.forEach(([value, label], k) => {
    const x = PANEL_X + (k % 2) * 250;
    const y = 104 + Math.floor(k / 2) * 58;
    out += text(x, y, value, { size: 26, fill: VALUE_FILL });
    out += text(x, y + 15, label.toUpperCase(), {
      size: 8,
      fill: theme.label,
      spacing: 1.5,
    });
  });

  out += text(PANEL_X, BARS_BASELINE - 54, "WEEKLY VOLUME", {
    size: 8,
    fill: theme.label,
    spacing: 1.5,
  });
  const bw = PANEL_WIDTH / COLS;
  stats.weekly.forEach((w, c) => {
    const t = Math.sqrt(w / stats.weeklyMax);
    const h = 2 + BARS_MAX_H * t;
    out += `<rect${attrs([
      ["x", PANEL_X + c * bw],
      ["y", BARS_BASELINE - h],
      ["width", bw - 2],
      ["height", h],
      ["rx", 1],
      ["fill", w > 0 ? barFill(t) : EMPTY_BAR_FILL],
    ])} />`;
  });
  for (const m of stats.months) {
    if (m.colEnd - m.colStart < 2) continue;
    out += text(PANEL_X + m.colStart * bw, BARS_BASELINE + 13, m.label, {
      size: 8,
      fill: theme.label,
    });
  }
  return out;
}

export function renderOrbitSVG(
  days: readonly ContributionDay[],
  options: RenderOptions,
): string {
  const { theme, animated } = options;
  const seed = options.seed ?? DEFAULT_SEED;

  const norm = normalize(days);
  const stats = computeStats(days, norm.activeDays);

  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" role="img" aria-label="Cinematic comet contribution orbit">`;
  out += `<rect${attrs([
    ["x", 0],
    ["y", 0],
    ["width", SVG_WIDTH],
    ["height", SVG_HEIGHT],
    ["fill", theme.background],
  ])} />`;
  out +=
    `<defs>${GLYPH_DEFS}` +
    `<radialGradient id="sun-glow"><stop offset="0" stop-color="#ffe9a8" stop-opacity="0.55"/><stop offset="0.45" stop-color="#ffb74a" stop-opacity="0.14"/><stop offset="1" stop-color="#ffb74a" stop-opacity="0"/></radialGradient>` +
    `</defs>`;
  out += renderBgStars(seed, theme, animated);
  out += renderSun(stats.total, theme, animated);
  out += renderRingsAndMonths(stats, theme);

  for (const d of norm.days) {
    if (!d.isActive || d.isPeak) continue;
    const col = Math.floor(d.index / ROWS);
    if (col >= COLS) continue;
    const [cx, cy] = orbitPos(col, d.index % ROWS);
    const t = d.intensity;
    out += `<circle${attrs([
      ["cx", cx],
      ["cy", cy],
      ["r", lerp(0.9, 2.6, Math.sqrt(t))],
      ["fill", coreFill(t, theme.dataStarHue)],
      ["opacity", lerp(0.6, 1, t)],
    ])} />`;
  }

  if (animated && norm.activeDays > 0) {
    const orbit = `M${ORBIT_CX},${ORBIT_CY - COMET_ORBIT_R}A${COMET_ORBIT_R},${COMET_ORBIT_R} 0 1 1 ${ORBIT_CX},${ORBIT_CY + COMET_ORBIT_R}A${COMET_ORBIT_R},${COMET_ORBIT_R} 0 1 1 ${ORBIT_CX},${ORBIT_CY - COMET_ORBIT_R}`;
    out += renderCometStack(orbit, theme, {
      cycleS: COMET_ORBIT_S,
      travFrac: 1,
      tailRx: COMET_TAIL_RX,
    });
  }

  norm.peaks.forEach((p, idx) => {
    const col = Math.floor(p.index / ROWS);
    if (col >= COLS) return;
    const [cx, cy] = orbitPos(col, p.index % ROWS);
    // deterministic rotation from position, same as the grid layout
    const angle = ((cx + cy) % 90) - 45;
    out += renderPeak({ cx, cy, angle, count: p.count }, idx, theme, animated);
  });

  out += renderPanel(stats, theme, options.username);
  out += "</svg>";
  return out;
}
