import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const rendererPath = resolve(here, "../dist-renderer/renderer.js");
const themesPath = resolve(here, "../dist-renderer/themes.js");

test("renderer returns a valid <svg>…</svg> string on empty input", async () => {
  const { renderCometSVG } = await import(rendererPath);
  const { DARK_THEME } = await import(themesPath);
  const svg = renderCometSVG([], { theme: DARK_THEME, animated: true });

  assert.equal(typeof svg, "string");
  assert.match(svg, /^<svg /, "output must start with <svg ");
  assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /<\/svg>$/, "output must end with </svg>");
});

test("empty year produces no comet (no <animateMotion> element)", async () => {
  const { renderCometSVG } = await import(rendererPath);
  const { DARK_THEME } = await import(themesPath);
  const days = Array.from({ length: 371 }, (_, i) => ({
    date: new Date(2023, 0, 1 + i).toISOString().slice(0, 10),
    count: 0,
  }));
  const svg = renderCometSVG(days, { theme: DARK_THEME, animated: true });
  assert.ok(
    !svg.includes("<animateMotion"),
    "empty year must not animate a comet",
  );
  assert.ok(
    !svg.includes("constellation"),
    "empty year must not draw constellation",
  );
});

test("animated=false emits zero SMIL animation elements", async () => {
  const { renderCometSVG } = await import(rendererPath);
  const { DARK_THEME } = await import(themesPath);
  const days = Array.from({ length: 371 }, (_, i) => ({
    date: new Date(2023, 0, 1 + i).toISOString().slice(0, 10),
    count: i % 37 === 0 ? 18 : i % 3 === 0 ? 2 : 0,
  }));
  const svg = renderCometSVG(days, { theme: DARK_THEME, animated: false });
  assert.ok(
    !svg.includes("<animate"),
    "reduced-motion variant must have no <animate> tags",
  );
  assert.ok(
    !svg.includes("<animateMotion"),
    "reduced-motion variant must have no <animateMotion>",
  );
});

test("identical inputs produce byte-identical output (determinism)", async () => {
  const { renderCometSVG } = await import(rendererPath);
  const { DARK_THEME } = await import(themesPath);
  const days = Array.from({ length: 371 }, (_, i) => ({
    date: new Date(2023, 0, 1 + i).toISOString().slice(0, 10),
    count: i % 23 === 0 ? 17 : i % 4 === 0 ? 3 : 0,
  }));
  const opts = { theme: DARK_THEME, animated: true, seed: 42 };
  const a = renderCometSVG(days, opts);
  const b = renderCometSVG(days, opts);
  assert.equal(a, b, "renderer must be deterministic");
});
