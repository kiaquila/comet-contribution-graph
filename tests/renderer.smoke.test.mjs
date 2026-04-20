import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const compiled = resolve(here, "../dist-renderer/renderer.js");

test("renderer stub returns an <svg> string", async () => {
  const { renderCometSVG } = await import(compiled);
  const svg = renderCometSVG([], {
    theme: {
      name: "dark",
      background: "#000",
      starFill: "#fff",
      peakFill: "#ffd97a",
      cometHead: "#fff",
      cometTrail: "#fff",
      label: "#aaa",
    },
    animated: true,
  });

  assert.equal(typeof svg, "string", "renderer must return a string");
  assert.match(svg, /^<svg /, "output must start with <svg ");
  assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /<\/svg>$/, "output must end with </svg>");
});
