#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findHtmlFiles(full));
    } else if (entry.endsWith(".html")) {
      results.push(full);
    }
  }
  return results.sort();
}

function extractInlineScripts(html) {
  const scripts = [];
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const attrs = match[1];
    const code = match[2];
    let mode = "classic";
    const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/i);
    if (typeMatch) {
      const t = typeMatch[1].toLowerCase();
      if (t === "module") {
        mode = "module";
      } else if (t !== "text/javascript" && t !== "application/javascript") {
        continue;
      }
    }
    if (code.trim()) scripts.push({ code, mode });
  }
  return scripts;
}

function rel(file) {
  return relative(repoRoot, file);
}

// Escape a JS identifier for safe interpolation into a RegExp source.
// Identifiers may contain `$`, which is a regex end-anchor metacharacter.
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Split a parameter list string on top-level commas only, ignoring commas
// inside brackets/braces/parens (e.g. default values like `{x: 1, y: 2}`).
function splitParams(paramStr) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of paramStr) {
    if ("{([".includes(ch)) depth++;
    else if ("})]".includes(ch)) depth--;
    else if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts.filter(Boolean);
}

// Step 1: syntax check.
// - Classic scripts: vm.Script (catches missing arrows, unclosed braces, etc.)
// - Module scripts: vm.SourceTextModule (module grammar: import/export/top-level await)
async function syntaxCheck(htmlFiles) {
  let failed = false;
  const hasSourceTextModule = typeof vm.SourceTextModule === "function";
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    const scripts = extractInlineScripts(html);
    for (let i = 0; i < scripts.length; i++) {
      const { code, mode } = scripts[i];
      try {
        if (mode === "module") {
          if (hasSourceTextModule) {
            new vm.SourceTextModule(code);
          } else {
            console.error(`\n⚠ SKIP   ${rel(file)}  (block ${i + 1}, module)`);
            console.error(
              `  vm.SourceTextModule unavailable — re-run with --experimental-vm-modules`,
            );
          }
        } else {
          new vm.Script(code);
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.error(`\n✗ SYNTAX  ${rel(file)}  (block ${i + 1}, ${mode})`);
          console.error(`  ${e.message.split("\n")[0]}`);
          failed = true;
        }
      }
    }
  }
  return failed;
}

// Step 2: arity trap — .forEach(namedFn) where namedFn has ≥2 params with defaults.
// forEach passes (element, index, array), silently overwriting default values.
function arityCheck(htmlFiles) {
  let failed = false;
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    const scripts = extractInlineScripts(html);
    for (let i = 0; i < scripts.length; i++) {
      const { code } = scripts[i];
      const callRe = /\.forEach\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g;
      let callMatch;
      while ((callMatch = callRe.exec(code)) !== null) {
        const fn = callMatch[1];
        const fnEsc = escapeRegex(fn);
        const defPatterns = [
          new RegExp(`function\\s+${fnEsc}\\s*\\(([^)]*?)\\)`, "g"),
          new RegExp(
            `(?:const|let|var)\\s+${fnEsc}\\s*=\\s*(?:async\\s+)?\\(([^)]*?)\\)\\s*=>`,
            "g",
          ),
          new RegExp(
            `(?:const|let|var)\\s+${fnEsc}\\s*=\\s*(?:async\\s+)?function\\s*\\(([^)]*?)\\)`,
            "g",
          ),
        ];
        for (const defRe of defPatterns) {
          let defMatch;
          while ((defMatch = defRe.exec(code)) !== null) {
            const params = splitParams(defMatch[1] ?? "");
            const withDefaults = params.filter((p) => /=/.test(p));
            if (params.length >= 2 && withDefaults.length > 0) {
              console.error(`\n✗ ARITY TRAP  ${rel(file)}  (block ${i + 1})`);
              console.error(
                `  .forEach(${fn}) — '${fn}' has ${params.length} params, ${withDefaults.length} with defaults`,
              );
              console.error(
                `  forEach passes (element, index, array) — defaults get overwritten`,
              );
              console.error(`  Fix: .forEach((item) => ${fn}(item))`);
              failed = true;
            }
          }
        }
      }
    }
  }
  return failed;
}

const prototypesDir = resolve(repoRoot, "prototypes");
const htmlFiles = findHtmlFiles(prototypesDir);

if (htmlFiles.length === 0) {
  console.error("No HTML files found in prototypes/");
  process.exit(1);
}

console.log(`check:js — scanning ${htmlFiles.length} prototype(s)...`);

const syntaxFailed = await syntaxCheck(htmlFiles);
const arityFailed = arityCheck(htmlFiles);

if (syntaxFailed || arityFailed) {
  console.error("\ncheck:js FAILED");
  process.exit(1);
}

console.log("check:js passed ✓");
