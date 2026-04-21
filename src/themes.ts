import type { Theme } from "./types.js";

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
  cometHead: "hsl(150,35%,97%)",
  cometComaInner: "hsl(185,70%,90%)",
  cometComaOuter: "hsl(195,90%,75%)",
  cometTrail: "hsl(185,80%,90%)",
  constellation: "rgba(255,255,255,0.1)",
  label: "rgba(122,172,216,0.75)",
};
