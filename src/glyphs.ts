import type { Theme } from "./types.js";

// SVG glyphs shared by both layouts (grid + orbit): attribute helpers,
// golden peak stars, and the animated comet stack.

export type AttrValue = string | number;

export function fmt(value: AttrValue): string {
  return typeof value === "number" ? value.toFixed(2) : value;
}

export function attrs(
  pairs: readonly (readonly [string, AttrValue | undefined])[],
): string {
  let out = "";
  for (const [key, value] of pairs) {
    if (value === undefined || value === "") continue;
    out += ` ${key}="${fmt(value)}"`;
  }
  return out;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function coreFill(t: number, hue: number): string {
  const hueAdj = t >= 0.7 ? hue - ((t - 0.7) / 0.3) * 14 : hue;
  const s = lerp(50, 82, t);
  const l = lerp(38, 88, t);
  return `hsl(${hueAdj.toFixed(1)},${s.toFixed(0)}%,${l.toFixed(0)}%)`;
}

export const HALO_DURATION_S = 3;
export const HALO_STAGGER_S = 0.6;

const COMET_NUCLEUS_R = 1.85;
const COMET_COMA_INNER_R = 3.29;
const COMET_COMA_OUTER_R = 5.36;
const COMET_COMA_INNER_OPACITY = 0.55;
const COMET_COMA_OUTER_OPACITY = 0.28;
export const COMET_TAIL_RX = 56;
const COMET_TAIL_RY = 3.0;

// Gradient tail + blur + the displaced-noise sphere behind every peak.
export const GLYPH_DEFS =
  `<linearGradient id="tail-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#c8e0ff" stop-opacity="0"/><stop offset="40%" stop-color="#c8e0ff" stop-opacity="0.1"/><stop offset="70%" stop-color="#d8ecff" stop-opacity="0.5"/><stop offset="90%" stop-color="#ffffff" stop-opacity="0.85"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></linearGradient>` +
  `<filter id="tail-blur" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="1.2"/></filter>` +
  `<filter id="organic-sphere" x="-80%" y="-80%" width="260%" height="260%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" /><feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" result="displaced" /><feGaussianBlur in="displaced" stdDeviation="1.4" /></filter>`;

function peakFill(count: number): string {
  if (count > 19) return "hsl(48,100%,92%)";
  const lightness = lerp(68, 86, Math.max(0, (count - 15) / 4));
  return `hsl(48,100%,${lightness.toFixed(1)}%)`;
}

export interface PeakGlyph {
  readonly cx: number;
  readonly cy: number;
  readonly angle: number;
  readonly count: number;
}

export function renderPeak(
  d: PeakGlyph,
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

export interface CometMotion {
  readonly cycleS: number;
  // Fraction of the cycle spent travelling; 1 means the comet never
  // pauses or fades (closed-loop paths).
  readonly travFrac: number;
  readonly tailRx: number;
}

// Animated comet: gradient tail (rotate="auto" so the gradient tracks the
// path tangent), two coma layers, nucleus. Tail is emitted first so the
// head paints over it.
export function renderCometStack(
  pathD: string,
  theme: Theme,
  motion: CometMotion,
): string {
  const { cycleS, travFrac, tailRx } = motion;
  const loop = travFrac >= 1;
  const dur = `dur="${cycleS.toFixed(2)}s"`;
  const keys = loop
    ? `keyTimes="0;1" keyPoints="0;1"`
    : `keyTimes="0;${travFrac.toFixed(4)};1" keyPoints="0;1;1"`;
  const opacityKeyTimes = `0;${travFrac.toFixed(4)};${(travFrac + 0.001).toFixed(4)};1`;
  const motionEl = (rotate: boolean): string =>
    `<animateMotion ${dur} begin="0s" repeatCount="indefinite" ${keys} calcMode="linear"${rotate ? ' rotate="auto"' : ""} path="${pathD}" />`;
  const fadeEl = (baseOpacity: number): string =>
    loop
      ? ""
      : `<animate attributeName="opacity" ${dur} begin="0s" repeatCount="indefinite" keyTimes="${opacityKeyTimes}" values="${baseOpacity};${baseOpacity};0;0" />`;

  let out =
    `<ellipse cx="-${tailRx}" cy="0" rx="${tailRx}" ry="${COMET_TAIL_RY.toFixed(2)}" fill="url(#tail-grad)" filter="url(#tail-blur)">` +
    motionEl(true) +
    fadeEl(1) +
    `</ellipse>`;

  const layers: ReadonlyArray<readonly [number, string, number]> = [
    [COMET_COMA_OUTER_R, theme.cometComaOuter, COMET_COMA_OUTER_OPACITY],
    [COMET_COMA_INNER_R, theme.cometComaInner, COMET_COMA_INNER_OPACITY],
    [COMET_NUCLEUS_R, theme.cometHead, 1],
  ];
  for (const [radius, fill, baseOpacity] of layers) {
    out +=
      `<circle${attrs([
        ["cx", 0],
        ["cy", 0],
        ["r", radius],
        ["fill", fill],
        ["opacity", baseOpacity],
      ])}>` +
      motionEl(false) +
      fadeEl(baseOpacity) +
      "</circle>";
  }
  return out;
}
