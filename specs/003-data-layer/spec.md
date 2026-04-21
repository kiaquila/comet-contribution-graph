# Feature 003 — Data layer: GraphQL contributions fetcher + parser

## Goal

Add the data layer that the Action entrypoint (PR 004) will wire into the renderer (PR 002): a pure TypeScript module `src/data.ts` that fetches a user's contributions from GitHub's GraphQL API and parses the response into the flat `ContributionDay[]` array that `renderCometSVG` already consumes.

## Why

PR 002 delivered the renderer and five synthetic fixtures. Real-world verification has been stubbed out behind those synthetic fixtures. Before wrapping the Action shell in PR 004, we need a stand-alone data path that:

- Can be tested offline against a captured GraphQL response (no network in CI),
- Can be exercised manually against a real account (to de-risk the SVG on real-world distributions),
- Produces output identical in shape to what the renderer already expects, so PR 004 becomes pure glue.

Splitting data off from Action packaging keeps each PR within Codex's review comfort zone (historical budget: 3–6 cycles for L, cleaner for M).

## Scope

**In scope** (second of four PRs toward MVP Action)

- `src/data.ts` — two exported functions:
  - `fetchContributions(username: string, token: string, opts?: FetchOptions): Promise<ContributionDay[]>` — single POST to `https://api.github.com/graphql` using native Node 20 `fetch`, rolling 371-day window ending today UTC, returns parsed days in chronological order.
  - `parseContributionsResponse(payload: unknown): ContributionDay[]` — pure parser, no network, validates the expected GraphQL shape and flattens `weeks[].contributionDays[]` into the flat array.
- `src/types.ts` — extend with `FetchOptions` (`{ now?: Date }` — injected clock for deterministic rolling-window tests; MVP callers pass nothing). No GraphQL response types: the parser operates on `unknown` with runtime narrow-guards, so a static type would be dead documentation.
- `scripts/fetch-contributions.mjs` — CLI wrapper that reads `GITHUB_TOKEN` from env + username from arg, runs `fetchContributions`, writes `sample-out/contributions-<username>.json` and prints a summary (`active=N max=M first=YYYY-MM-DD last=YYYY-MM-DD`). Prebuilds the renderer output so the compiled `dist-renderer/data.js` is importable.
- `tests/data.test.mjs` — offline suite:
  - Parser: golden fixture `tests/fixtures/graphql-sample.json` → `ContributionDay[]` with correct length, dates monotone, counts integer ≥ 0.
  - Edge cases: empty-year payload (all counts 0), mid-week start (GitHub aligns weeks to Sunday — partial first week is still flattened correctly), single-day-with-activity.
  - Fetch transport: `globalThis.fetch` stubbed — assert endpoint URL, `Authorization: bearer <token>`, `Content-Type: application/json`, request body includes `contributionsCollection` and the username.
  - Error paths: HTTP 401, HTTP 403 with `x-ratelimit-remaining: 0`, top-level `errors: [...]` in a 200 body, malformed JSON response body.
- `tests/fixtures/graphql-sample.json` — captured GraphQL payload for a real account (user `kiaquila`, own token). Full response wrapper kept (`{data: {user: {contributionsCollection: {contributionCalendar: {weeks: [...]}}}}}`) so the parser sees what the real API returns; the query intentionally does not request PII fields (login/email/avatar), so no sanitization step was necessary.
- `package.json` script: `fetch:sample` = `node scripts/fetch-contributions.mjs`.

**Out of scope** (deferred)

- `action.yml`, `src/action.ts`, ncc bundle, output-branch push — PR 004.
- Wiring `fetchContributions` → `renderCometSVG` into an end-to-end flow — PR 004.
- `--from` / `--to` CLI flags — MVP always fetches the rolling 371-day window.
- GitHub Enterprise host support (custom GraphQL URL) — post-MVP; the endpoint is hardcoded.
- Octokit or any HTTP/GraphQL client dependency — native `fetch` only.
- Retries, exponential backoff, circuit breakers — one shot, fail fast with context.

## Constraints

- **No runtime dependencies.** Node 20 stdlib (`fetch`, `URL`, `AbortController` if needed) only. Dev-deps unchanged beyond what PR 002 already added.
- **Deterministic parser.** `parseContributionsResponse(sample)` returns an identical array every call — no clock, no PRNG, no iteration-order surprises.
- **Errors on system boundary only.** Validation happens on HTTP response shape and GraphQL body; internal helpers trust inputs. Thrown errors use `Error` with a descriptive message and `cause` set to the underlying source (response body, stubbed fetch error). No custom error class — per "no abstractions for single-use."
- **Token is never logged.** CLI prints summaries only; on error, stack trace may include URL but never the `Authorization` header.
- **Rolling 371-day window**, computed in UTC, ending on today's UTC date. Matches the synthetic fixtures PR 002 uses (`TOTAL_DAYS = 371`) and GitHub's 53-week calendar grid. The GraphQL query passes `from` and `to` as ISO-8601 strings.
- **Prototype (`prototypes/variant-d-grid-peaks.html`) is byte-identical.** No renderer edits either; `src/renderer.ts`, `src/normalize.ts`, `src/themes.ts`, `src/prng.ts` untouched.
- `pnpm run ci` stays green: `check:repo`, `check:html`, `check:js`, `check:ts`, `build`, `format:check`, `test`. No new `ci` step needed — new tests slot into the existing `node --test "tests/**/*.test.mjs"` glob.

## Validation

- **Unit tests**: `pnpm test` runs the new `tests/data.test.mjs` alongside existing suites; all green.
- **Offline determinism**: parser test calls `parseContributionsResponse(sample)` twice and asserts array equality.
- **Transport correctness**: fetch-mock test inspects the exact request the module sends (URL, headers, body keys) without hitting the network.
- **Manual live smoke**: `GITHUB_TOKEN=<pat> node scripts/fetch-contributions.mjs kiaquila` writes `sample-out/contributions-kiaquila.json` with 371 entries. Summary line prints active-day count and max count. (Reviewer repeats locally.)
- **Type check**: `pnpm run check:ts` passes.
- **Format**: `pnpm run format:check` passes — `scripts/**/*.mjs` and `specs/**/*.md` are already covered.
- **No renderer regression**: `git diff origin/main -- src/renderer.ts src/normalize.ts src/themes.ts src/prng.ts` is empty.
- **CI gates**: `baseline-checks`, `guard`, `AI Review` green on head SHA; Vercel preview no-op (prototype unchanged).

## Acceptance

- `pnpm test` runs ≥ 6 new test cases covering parser, transport, and error paths; all pass.
- `parseContributionsResponse` exported and importable from `dist-renderer/data.js` after `pnpm run build:renderer`.
- `scripts/fetch-contributions.mjs` fails cleanly when `GITHUB_TOKEN` is missing and when `username` is missing (exit code 1, single-line error).
- `tests/fixtures/graphql-sample.json` committed; the file contains only `weeks[].contributionDays[]` data (no login, no avatarUrl, no email).
- PR diff touches only: `specs/003-data-layer/**`, `src/data.ts`, `src/types.ts`, `tests/data.test.mjs`, `tests/fixtures/graphql-sample.json`, `scripts/fetch-contributions.mjs`, `package.json`.

## Fixed design decisions (user-approved 2026-04-21)

| Parameter             | Value                                                                                                                                           | Source        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Window length         | rolling 371 days from today (UTC), matching PR 002 synthetic fixtures                                                                           | user approval |
| Endpoint              | `https://api.github.com/graphql` (hardcoded; GHE deferred post-MVP)                                                                             | user approval |
| Token source          | env var `GITHUB_TOKEN` only (no CLI arg — avoids shell history leak)                                                                            | user approval |
| Error shape           | plain `Error` with descriptive message + `cause` option (no custom class)                                                                       | user approval |
| HTTP client           | Node 20 native `fetch` (no Octokit, no `undici`, no `node-fetch`)                                                                               | user approval |
| GraphQL query         | minimal: `user(login) { contributionsCollection(from, to) { contributionCalendar { weeks { contributionDays { date contributionCount } } } } }` | user approval |
| Sample fixture source | one real dump from user `kiaquila`, sanitized (only `weeks[]` retained)                                                                         | user approval |

## Non-goals

- Any form of authenticated request flow other than Bearer-token PAT. GitHub App installation tokens are a PR 004 concern (the Action's `${{ secrets.GITHUB_TOKEN }}` is also a PAT-shaped string; no code change needed there).
- Caching, pagination, partial-year slicing — GitHub's `contributionsCollection` already returns a flat 53-week structure in a single request.
- Richer return types (private vs public counts, repositories, etc.) — renderer only uses `{date, count}`.
