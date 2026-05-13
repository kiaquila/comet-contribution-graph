# ADR-0001: Defer acorn-based inline JS validator

- **Status**: Deferred — superseded by ESLint v9 adoption in PR #4.
- **Date**: 2026-05-13
- **Context PRs**: #3 (`chore/ci-prototype-js-validation`, abandoned), #4 (ESLint
  v9 + `eslint-plugin-html` adopted as canonical `check:js`).

## Context

PR #3 added a hand-rolled `scripts/check-prototype-js.mjs` that validated inline
`<script>` blocks in `prototypes/*.html` in two passes:

1. **Syntax check** — `new vm.Script(code)` for classic scripts and
   `new vm.SourceTextModule(code)` for `type="module"`. Cheap, reliable, no
   extra deps.
2. **Arity-trap check** — detect `arr.forEach(namedFn)` where `namedFn` had
   ≥2 params with ≥1 default. Implemented with three hand-rolled regexes
   (`function` decl / arrow / function expression) plus helpers `splitParams`
   (top-level-comma splitter), `stripComments` (string-literal-aware comment
   stripper) and `escapeRegex` (identifiers can contain `$`).

The regex path drifted over five Codex review cycles. Each fix was narrow:
module grammar, `$` in identifiers, comment stripping, first-definition-only,
template-literal awareness in splitters. The class of remaining edge cases is
open-ended — destructured params, nested functions, object-method definitions,
class methods, `arr?.forEach(fn)`, `obj.arr.forEach(fn)`, methods assigned via
`Object.assign`, TDZ/reassignment, etc. Every future "trap" pattern (not just
arity) would reopen the same regex whack-a-mole.

PR #3 was ultimately **abandoned**. PR #4 adopted **ESLint v9 + eslint-plugin-html**
as the canonical `check:js`; `package.json` now defines
`"check:js": "eslint \"prototypes/**/*.html\""`. While PR #3 was open, an
acorn-based AST migration was drafted as an alternative to extending the regex
chain. The analysis is preserved here as institutional memory.

## Decision

**Defer adopting acorn for inline JS validation.** ESLint covers the current
`check:js` scope; new detector classes (e.g. accidental `===` on `NaN`,
`addEventListener` passive-listener traps, `.map`/`.filter`/`.reduce` arity
checks) are expected to land as ESLint rules or plugin entries, not as a custom
AST walker.

Re-open this ADR only if both conditions hold:

1. A hand-rolled regex-based detector is reintroduced under `scripts/` because
   ESLint cannot express the rule, **and**
2. A second trap pattern of the same class is proposed before the first one
   stabilises.

If either condition fails, the right answer is an ESLint rule, not acorn.

## Alternative analyzed (for the historical case)

If a hand-rolled detector were ever reinstated, replacing its regex layer with
acorn would be the path of least churn.

### Footprint

- `acorn@8.x` — single package, zero runtime deps, ~130 KB unpacked
  (~65 KB min+gz for the ESM build).
- **Already present transitively** through ESLint's parser chain
  (`eslint → espree → acorn`); `pnpm-lock.yaml` on `main` already pins
  `acorn@8.16.0`. Promoting it to a direct `devDependency` would only fix the
  version.
- `acorn-walk@8.x` (optional) adds simple/full tree-walker helpers; it depends
  on its sibling `acorn@^8.11.0`. The pair has zero **external** transitive deps
  but `acorn-walk` does pull `acorn` — characterising the duo as "zero
  transitive deps" is accurate for `acorn` alone, not for both.

### Sketch (illustrative)

Keep step 1 (vm-based syntax check) as-is — it already covers module grammar
via `vm.SourceTextModule` and gives good error locations. Acorn would duplicate
it with slightly different messages.

Replace step 2 with a single AST pass:

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

That replaces `splitParams`, `stripComments`, `escapeRegex`, the three
`defPatterns` regexes, the outer `callRe`, and the first-match-wins scan. The
rewrite is grammatically correct by construction — comments-in-strings,
`$`-in-identifiers, nested quotes, template literals, destructuring, trailing
commas are all handled by the parser, not by hand-rolled state machines.

### Costs

- ESLint is the lower-friction default; an acorn detector is justified only
  when ESLint cannot express the rule.
- `acorn-walk` adds one transitive dep on `acorn` (same author, MIT, widely
  audited).
- Lockfile churn on promotion — bare `pnpm install` required before
  frozen-lockfile mode picks up the new direct dependency.

### Costs not paid

- No CI runtime change — acorn parse of ~1000 lines is <1 ms; `vm.Script`
  already does a full parse anyway.
- No change to the shipped Action bundle (`dist-action/`) — dev-only.

## Consequences

- ESLint flat config (`eslint.config.mjs`) is the canonical extension point for
  new prototype JS rules.
- `docs_comet/project/devops/local-preflight.md` references `check:js` without
  further qualification, which now correctly reflects the ESLint reality.
- If a regex-based detector reappears under `scripts/`, contributors should
  re-open this ADR before adding the second hand-rolled rule.
