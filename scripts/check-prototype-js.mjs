#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "acorn";
import { ancestor } from "acorn-walk";

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
    const typeMatch = attrs.match(
      /type\s*=\s*(?:["']([^"']+)["']|([^\s>"']+))/i,
    );
    if (typeMatch) {
      const t = (typeMatch[1] ?? typeMatch[2]).toLowerCase();
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

function parseScript({ code, mode }) {
  return parse(code, {
    ecmaVersion: "latest",
    sourceType: mode === "module" ? "module" : "script",
    allowAwaitOutsideFunction: mode === "module",
    allowReturnOutsideFunction: false,
    locations: true,
  });
}

// Parse each inline script. Syntax errors surface here; acorn uses the correct
// grammar for the script's mode (module vs classic).
function syntaxCheck(htmlFiles) {
  let failed = false;
  const parsed = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    const scripts = extractInlineScripts(html);
    for (let i = 0; i < scripts.length; i++) {
      const s = scripts[i];
      try {
        const ast = parseScript(s);
        parsed.push({ file, blockIndex: i, ast, mode: s.mode });
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.error(
            `\n✗ SYNTAX  ${rel(file)}  (block ${i + 1}, ${s.mode})`,
          );
          console.error(`  ${e.message}`);
          failed = true;
        } else {
          throw e;
        }
      }
    }
  }
  return { failed, parsed };
}

// Given a Function node's params array, return parameter count and the number
// of defaults that appear after the first argument.
function inspectParams(params) {
  const count = params.length;
  const defaultsAfterFirst = params
    .slice(1)
    .filter((p) => p.type === "AssignmentPattern").length;
  return { count, defaultsAfterFirst };
}

function isNode(value) {
  return Boolean(
    value && typeof value === "object" && typeof value.type === "string",
  );
}

function getScopeStatements(scopeNode) {
  if (!scopeNode?.body) return [];
  if (Array.isArray(scopeNode.body)) return scopeNode.body;
  if (
    scopeNode.body.type === "BlockStatement" &&
    Array.isArray(scopeNode.body.body)
  ) {
    return scopeNode.body.body;
  }
  return [];
}

function addVarBinding(declaration, bindings) {
  for (const d of declaration.declarations) {
    if (d.id?.type === "Identifier" && d.init && !bindings.has(d.id.name)) {
      bindings.set(d.id.name, d);
    }
  }
}

function collectHoistedVarBindings(node, bindings) {
  if (!isNode(node)) return;
  if (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  ) {
    return;
  }
  if (node.type === "VariableDeclaration" && node.kind === "var") {
    addVarBinding(node, bindings);
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (isNode(entry)) {
          collectHoistedVarBindings(entry, bindings);
        }
      }
    } else if (isNode(value)) {
      collectHoistedVarBindings(value, bindings);
    }
  }
}

// Walk a scope (Program/Function body, or a BlockStatement) and collect
// bindings declared directly inside it. Does NOT descend into nested
// functions/blocks (those introduce their own scopes).
function collectBindings(scopeNode) {
  const bindings = new Map();
  const body = getScopeStatements(scopeNode);

  if (
    scopeNode.type === "FunctionDeclaration" ||
    scopeNode.type === "FunctionExpression" ||
    scopeNode.type === "ArrowFunctionExpression"
  ) {
    for (const param of scopeNode.params ?? []) {
      if (param.type === "Identifier") {
        bindings.set(param.name, param);
      } else if (
        param.type === "AssignmentPattern" &&
        param.left.type === "Identifier"
      ) {
        bindings.set(param.left.name, param);
      } else if (
        param.type === "RestElement" &&
        param.argument.type === "Identifier"
      ) {
        bindings.set(param.argument.name, param);
      }
    }
  }

  for (const stmt of body) {
    if (stmt.type === "FunctionDeclaration" && stmt.id) {
      bindings.set(stmt.id.name, stmt);
    } else if (stmt.type === "VariableDeclaration") {
      for (const d of stmt.declarations) {
        if (d.id?.type === "Identifier" && d.init) {
          bindings.set(d.id.name, d);
        }
      }
    } else if (stmt.type === "ExportNamedDeclaration" && stmt.declaration) {
      const decl = stmt.declaration;
      if (decl.type === "FunctionDeclaration" && decl.id) {
        bindings.set(decl.id.name, decl);
      } else if (decl.type === "VariableDeclaration") {
        for (const d of decl.declarations) {
          if (d.id?.type === "Identifier" && d.init) {
            bindings.set(d.id.name, d);
          }
        }
      }
    }
  }

  // `var` is function/global scoped, so include declarations nested in
  // child blocks (`if`, `for`, etc.) while skipping nested function scopes.
  if (
    scopeNode.type === "Program" ||
    scopeNode.type === "FunctionDeclaration" ||
    scopeNode.type === "FunctionExpression" ||
    scopeNode.type === "ArrowFunctionExpression"
  ) {
    for (const stmt of body) {
      collectHoistedVarBindings(stmt, bindings);
    }
  }

  return bindings;
}

// Resolve `name` to its defining node by walking ancestors from innermost
// outward; first matching scope wins (lexical scope semantics). Returns
// the Function-like node whose params we should inspect, or null.
function resolveBinding(ancestors, name) {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const node = ancestors[i];
    const isScope =
      node.type === "Program" ||
      node.type === "BlockStatement" ||
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression";
    if (!isScope) continue;
    const bindings = collectBindings(node);
    const hit = bindings.get(name);
    if (!hit) continue;
    if (hit.type === "FunctionDeclaration") return hit;
    if (hit.type === "VariableDeclarator") {
      const init = hit.init;
      if (
        init &&
        (init.type === "FunctionExpression" ||
          init.type === "ArrowFunctionExpression")
      ) {
        return init;
      }
      return null;
    }
    if (hit.type === "AssignmentPattern") {
      const right = hit.right;
      if (
        right &&
        (right.type === "FunctionExpression" ||
          right.type === "ArrowFunctionExpression")
      ) {
        return right;
      }
      return null;
    }
  }
  return null;
}

// Step 2: arity trap detection via AST walk.
// Finds `.forEach(identifier)` calls and checks the bound function's params.
function arityCheck(parsed) {
  let failed = false;
  for (const { file, blockIndex, ast } of parsed) {
    ancestor(ast, {
      CallExpression(node, _state, ancestors) {
        const callee = node.callee;
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "forEach"
        ) {
          return;
        }
        if (
          node.arguments.length !== 1 ||
          node.arguments[0].type !== "Identifier"
        ) {
          return;
        }
        const name = node.arguments[0].name;
        // ancestors[] includes `node` itself at the end; exclude it.
        const fnNode = resolveBinding(ancestors.slice(0, -1), name);
        if (!fnNode) return;
        const { count, defaultsAfterFirst } = inspectParams(fnNode.params);
        if (count >= 2 && defaultsAfterFirst > 0) {
          console.error(
            `\n✗ ARITY TRAP  ${rel(file)}  (block ${blockIndex + 1})`,
          );
          console.error(
            `  .forEach(${name}) — '${name}' has ${count} params, ${defaultsAfterFirst} default(s) after param #1`,
          );
          console.error(
            `  forEach passes (element, index, array) — defaults get overwritten`,
          );
          console.error(`  Fix: .forEach((item) => ${name}(item))`);
          failed = true;
        }
      },
    });
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

const { failed: syntaxFailed, parsed } = syntaxCheck(htmlFiles);
const arityFailed = arityCheck(parsed);

if (syntaxFailed || arityFailed) {
  console.error("\ncheck:js FAILED");
  process.exit(1);
}

console.log("check:js passed ✓");
