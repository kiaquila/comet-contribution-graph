import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

test("prototype entry file exists", () => {
  assert.ok(
    existsSync(resolve(root, "prototypes/variant-d-grid-peaks.html")),
    "prototypes/variant-d-grid-peaks.html must exist for the bootstrap build",
  );
});

test("vercel build config is present", () => {
  assert.ok(existsSync(resolve(root, "vercel.json")));
});
