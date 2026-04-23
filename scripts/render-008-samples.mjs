#!/usr/bin/env node
// Feature 008 one-off: render the 3 reference-account SVGs (animated dark theme)
// into specs/008-adaptive-star-rendering/samples/ for visual review.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const { renderCometSVG } = await import("../dist-renderer/renderer.js");
const { DARK_THEME } = await import("../dist-renderer/themes.js");

const outDir = "specs/008-adaptive-star-rendering/samples";
mkdirSync(outDir, { recursive: true });

const users = [
  { fixture: "kiaquila", out: "kiaquila.svg" },
  { fixture: "staks-sor", out: "staks-sor.svg" },
  { fixture: "yeachan-heo", out: "yeachan-heo.svg" },
];

for (const { fixture, out } of users) {
  const days = JSON.parse(
    readFileSync(`tests/fixtures/${fixture}.json`, "utf8"),
  );
  const svg = renderCometSVG(days, {
    theme: DARK_THEME,
    animated: true,
    seed: 42,
  });
  const path = resolve(outDir, out);
  writeFileSync(path, svg + "\n", "utf8");
  console.log(`wrote ${path} (${svg.length} bytes)`);
}
