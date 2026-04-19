#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const prototypeDir = resolve(root, "prototypes");
const prototypeIndex = resolve(prototypeDir, "variant-d-grid-peaks.html");
const distDir = resolve(root, "dist");
const distIndex = resolve(distDir, "index.html");
const distPrototypes = resolve(distDir, "prototypes");

if (!existsSync(prototypeIndex)) {
  throw new Error(
    "Missing prototypes/variant-d-grid-peaks.html — bootstrap build cannot proceed.",
  );
}

rmSync(distDir, { force: true, recursive: true });
mkdirSync(distDir, { recursive: true });

// Copy the active prototype as the dist landing page so Vercel preview shows it.
cpSync(prototypeIndex, distIndex);

// Also expose all prototypes/ files under dist/prototypes/ for direct browsing.
cpSync(prototypeDir, distPrototypes, { recursive: true });

console.log(`Built bootstrap artifact: ${distIndex}`);
