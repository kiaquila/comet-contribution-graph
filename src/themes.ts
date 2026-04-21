import type { Theme, ThemeName } from "./types.js";

export const DARK_THEME: Theme = {
  name: "dark",
  background: "#010209",
  bgStarTints: [
    "hsl(0,0%,100%)",
    "hsl(200,45%,88%)",
    "hsl(15,35%,80%)",
    "hsl(130,22%,80%)",
    "hsl(268,32%,82%)",
  ],
  dataStarHue: 214,
  peakCore: "hsl(48,100%,88%)",
  peakHalo: "hsla(48,100%,74%,0.35)",
  cometHead: "#ffffff",
  constellation: "rgba(255,255,255,0.1)",
  label: "rgba(122,172,216,0.75)",
};

export const LIGHT_THEME: Theme = {
  name: "light",
  background: "#f5f6fa",
  bgStarTints: [
    "hsl(0,0%,45%)",
    "hsl(200,45%,35%)",
    "hsl(15,35%,40%)",
    "hsl(130,22%,34%)",
    "hsl(268,32%,38%)",
  ],
  dataStarHue: 214,
  peakCore: "hsl(36,90%,42%)",
  peakHalo: "hsla(36,85%,55%,0.3)",
  cometHead: "#1b1f2b",
  constellation: "rgba(10,20,40,0.18)",
  label: "rgba(40,60,90,0.8)",
};

export const THEMES: Readonly<Record<ThemeName, Theme>> = {
  dark: DARK_THEME,
  light: LIGHT_THEME,
};
