# Assessment: replace regex in `check-prototype-js.mjs` with acorn

Status: draft assessment, not a decision. Written while PR #3 (`chore/ci-prototype-js-validation`) was still open.

## Problem

`scripts/check-prototype-js.mjs` does two things against inline `<script>` blocks in `prototypes/*.html`:

1. **Syntax check** — `new vm.Script(code)` for classic, `new vm.SourceTextModule(code)` for `type="module"`. Cheap, reliable, no deps. This is fine.
2. **Arity-trap check** — detect `arr.forEach(namedFn)` where `namedFn` has ≥2 params and ≥1 default. Implemented with 3 hand-rolled regexes (function decl / arrow / function expr), plus custom helpers: `splitParams` (top-level-comma splitter), `stripComments` (string-literal-aware comment stripper), `escapeRegex` (because identifiers can contain `$`).

The regex path has drifted over 5 Codex review cycles on PR #3. Each fix was narrow (module grammar, `$` in identifiers, comment stripping, first-definition-only, template-literal awareness in splitters…). The class of edge cases is open-ended: destructured params, nested functions, object-method definitions, class methods, `arr?.forEach(fn)`, `obj.arr.forEach(fn)`, methods assigned via `Object.assign`, TDZ/reassignment, etc. Every future "trap" pattern (not just arity) will reopen the same regex whack-a-mole.

## Option: acorn

Acorn is the de facto lightweight JS parser (ESLint, Rollup, Webpack, Babel's fallback all use it or a fork). A full parse of a ~1000-line inline script is sub-millisecond.

### Footprint

- `acorn@8.x`: single package, zero runtime deps, ~130 KB unpacked (~65 KB min+gz for the ESM build).
- **Not currently transitively installed.** Grep of `pnpm-lock.yaml` on both `main` and `chore/ci-prototype-js-validation`: zero acorn entries. `html-validate`, `prettier`, `@playwright/test` do not pull it.
- Adding it is a net-new `devDependency`. Runtime bundle (the Action embed we ship later) is unaffected — `check:js` is CI-only.
- `acorn-walk@8.x` (optional) adds another ~25 KB for tree traversal helpers; we could hand-roll a tiny walker and skip it.

### What the rewrite looks like

Keep step 1 (vm-based syntax check) as-is — it already covers module grammar via `vm.SourceTextModule` and gives good error locations. Acorn would duplicate it with slightly different error messages; no reason to churn.

Replace step 2 with a single pass:

```js
import { parse } from "acorn";
import { simple as walk } from "acorn-walk";

function arityCheckAst(code) {
  const ast = parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
    allowHashBang: true,
  });
  const fnParams = new Map(); // name -> params array (first definition wins)

  walk(ast, {
    FunctionDeclaration(node) {
      if (node.id && !fnParams.has(node.id.name))
        fnParams.set(node.id.name, node.params);
    },
    VariableDeclarator(node) {
      if (node.id.type !== "Identifier" || fnParams.has(node.id.name)) return;
      const init = node.init;
      if (
        init &&
        (init.type === "FunctionExpression" ||
          init.type === "ArrowFunctionExpression")
      ) {
        fnParams.set(node.id.name, init.params);
      }
    },
  });

  const traps = [];
  walk(ast, {
    CallExpression(node) {
      const callee = node.callee;
      if (
        callee.type !== "MemberExpression" ||
        callee.property.type !== "Identifier" ||
        callee.property.name !== "forEach" ||
        node.arguments.length !== 1 ||
        node.arguments[0].type !== "Identifier"
      )
        return;
      const name = node.arguments[0].name;
      const params = fnParams.get(name);
      if (!params || params.length < 2) return;
      const defaults = params.filter(
        (p) => p.type === "AssignmentPattern",
      ).length;
      if (defaults > 0)
        traps.push({
          name,
          paramCount: params.length,
          defaults,
          loc: node.loc,
        });
    },
  });
  return traps;
}
```

That replaces: `splitParams`, `stripComments`, `escapeRegex`, the three `defPatterns` regexes, the outer `callRe`, and the first-match-wins scan. Net line delta: roughly −120 / +40. More importantly, the rewrite is _grammatically correct by construction_ — comments-in-strings, `$`-in-identifiers, nested quotes, template literals, destructuring, trailing commas — all handled by the parser, not by hand-rolled state machines.

### Bonus wins, cheap to unlock once we have the AST

- Match `arr?.forEach(fn)` — literally one extra `callee.type === "ChainExpression"` unwrap.
- Catch `.map(fn)` / `.filter(fn)` / `.reduce(fn)` with the same trap — change one string.
- Catch arrow defaults via `Object.values(x).forEach(fnWithDefault)` — the AST already knows.
- Report column numbers via `node.loc` — currently we only print the block index.

### Costs

- +1 devDependency. Supply-chain surface is minimal (Marijn Haverbeke, widely audited, MIT, zero transitive deps). `acorn-walk` adds the same author/repo.
- Team has to know acorn if they edit the checker. Low bar — the AST node shapes are stable and well-documented at the estree spec.
- Lockfile churn on adoption (must run bare `pnpm install` first per the existing note about new deps + frozen-lockfile).

### Costs we do **not** pay

- No change to CI runtime: acorn parse of ~1000 lines is <1 ms; vm.Script already does a full parse anyway.
- No change to the shipped Action bundle — dev-only.
- No change to step-1 syntax checking — we keep `vm.Script` / `vm.SourceTextModule`.

## Recommendation

**Defer until a second "trap" pattern appears, then cut over in one PR.**

Rationale: right now we have one detector (forEach arity) and it finally passes review on PR #3. Rewriting mid-review reopens the checker as a moving target and blocks a PR that otherwise just shipped Playwright smoke. But the next time we're tempted to add a second regex-based check (e.g. `.map` arity, `addEventListener` passive-listener traps, accidental `===` on `NaN`), do **not** extend the regex machinery — add acorn at that point, port the forEach rule, and add the new rule on top. The cost of the acorn migration is paid once; every regex detector after #1 pays the review-cycle tax we just saw.

If a third regex-based check gets proposed before the second one lands, promote this to an ADR and do the swap unconditionally — three hand-rolled detectors is past the break-even.

## Open questions for the reviewer

- Is the supply-chain policy already OK with acorn as a devDep, or does it need a `docs_comet/` note similar to how CDN fonts are justified?
- Do we want `acorn-walk`, or hand-roll a 15-line walker to keep deps at exactly +1?
- Should the checker move into `tests/` and run under `pnpm test` (node --test) instead of its own `check:js` script, once it's AST-based and easy to unit-test per-rule?
