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
    const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/i);
    if (typeMatch) {
      const t = typeMatch[1].toLowerCase();
      if (
        t !== "text/javascript" &&
        t !== "application/javascript" &&
        t !== "module"
      ) {
        continue;
      }
    }
    if (code.trim()) scripts.push(code);
  }
  return scripts;
}

function rel(file) {
  return relative(repoRoot, file);
}

// Step 1: syntax check via vm.Script (catches missing arrows, unclosed braces, etc.)
function syntaxCheck(htmlFiles) {
  let failed = false;
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    const scripts = extractInlineScripts(html);
    for (let i = 0; i < scripts.length; i++) {
      try {
        new vm.Script(scripts[i]);
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.error(`\n✗ SYNTAX  ${rel(file)}  (block ${i + 1})`);
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
      const code = scripts[i];
      const callRe = /\.forEach\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g;
      let callMatch;
      while ((callMatch = callRe.exec(code)) !== null) {
        const fn = callMatch[1];
        const defPatterns = [
          new RegExp(`function\\s+${fn}\\s*\\(([^)]*?)\\)`, "g"),
          new RegExp(
            `(?:const|let|var)\\s+${fn}\\s*=\\s*(?:async\\s+)?\\(([^)]*?)\\)\\s*=>`,
            "g",
          ),
          new RegExp(
            `(?:const|let|var)\\s+${fn}\\s*=\\s*(?:async\\s+)?function\\s*\\(([^)]*?)\\)`,
            "g",
          ),
        ];
        for (const defRe of defPatterns) {
          let defMatch;
          while ((defMatch = defRe.exec(code)) !== null) {
            const params = (defMatch[1] ?? "")
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean);
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

const syntaxFailed = syntaxCheck(htmlFiles);
const arityFailed = arityCheck(htmlFiles);

if (syntaxFailed || arityFailed) {
  console.error("\ncheck:js FAILED");
  process.exit(1);
}

console.log("check:js passed ✓");
