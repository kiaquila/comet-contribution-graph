# Plan — Data layer

## Approach

Single-phase implementation on this worktree. The surface is small and the moving parts are orthogonal: parser (pure), fetcher (I/O wrapper over parser), CLI (thin wrapper over fetcher). Unlike PR 002, there is no rendering math to eyeball — correctness is fully captured by fixture-driven unit tests. The only human-in-the-loop step is capturing the real-data fixture once, and a one-time manual smoke against live GitHub.

The renderer stays frozen. PR 003 delivers a data path that the Action entrypoint (PR 004) will compose with the renderer — this PR does not compose them itself.

## Why not /plan or /ralph

- `/plan` interview: decisions are fixed (see spec table). No ambiguity to resolve.
- `/ralph` loop: manual fixture capture + live smoke require human eyes; no machine-checkable "done."
- Manual executor + one `code-reviewer` pass before push is the proven shape from PR 002 (3 cycles, 4 × P2 resolved).

## Step order

### Step 1 — capture and sanitize the real-data fixture

Before writing any parser code, capture the exact GraphQL response shape for user `kiaquila`.

1. Create a throwaway PAT with `read:user` and `public_repo` scopes (classic or fine-grained; classic is simpler).
2. Manually issue the GraphQL query with `curl -H "Authorization: bearer $PAT" -d '{...}' https://api.github.com/graphql`, redirect to `tests/fixtures/graphql-sample.json`.
3. Keep the full GraphQL response wrapper (`{data: {user: {contributionsCollection: {contributionCalendar: {weeks: [...]}}}}}`) so the parser sees exactly what the real API returns. The query requests no PII fields, so the response naturally contains only `weeks[].contributionDays[]` data.
4. Verify: fixture has 53 `weeks`, flattened `contributionDays` length ≈ 371 (actual on 2026-04-21 capture: 367; GitHub truncates leading/trailing partial weeks — parser handles this without a hard-coded length).

### Step 2 — `src/types.ts` extensions

Add:

```ts
export interface GraphQLContributionDay {
  readonly date: ISODate;
  readonly contributionCount: number;
}
export interface GraphQLContributionWeek {
  readonly contributionDays: readonly GraphQLContributionDay[];
}
export interface GraphQLContributionsResponse {
  readonly data: {
    readonly user: {
      readonly contributionsCollection: {
        readonly contributionCalendar: {
          readonly weeks: readonly GraphQLContributionWeek[];
        };
      };
    } | null;
  };
  readonly errors?: readonly { readonly message: string }[];
}
```

Minimal enough to validate the path we actually read. Extra keys in the live payload are fine — TS structural typing ignores them.

### Step 3 — `src/data.ts`

Two exports, nothing else:

```ts
export async function fetchContributions(
  username: string,
  token: string,
  opts?: FetchOptions,
): Promise<ContributionDay[]>;

export function parseContributionsResponse(payload: unknown): ContributionDay[];
```

Internals (private, file-local):

- `buildQuery(username, from, to)` — returns `{ query, variables }` JSON for the POST body. Uses GraphQL variables, not string interpolation, to sidestep injection concerns (even though `username` comes from a trusted CLI arg, the pattern is right).
- `computeWindow(now = new Date())` — returns `{ from, to }` as ISO-8601 strings, rolling 371 days ending at `now` UTC. `now` parameter is for testability; no real caller passes it.
- Response handling in `fetchContributions`:
  1. `fetch(endpoint, { method: 'POST', headers: {Authorization, Content-Type, Accept, User-Agent}, body })`.
  2. Non-2xx → `throw new Error('GitHub API request failed: HTTP <status>', { cause: { status, body } })`. Special-case 403 with `x-ratelimit-remaining: '0'` to mention rate limiting in the message.
  3. 2xx → `await response.json()`.
  4. If `payload.errors?.length` → `throw new Error('GitHub GraphQL returned errors: <joined messages>', { cause: payload.errors })`.
  5. If `payload.data.user === null` → `throw new Error('GitHub user not found: <username>')` (the public GraphQL endpoint returns this when the login doesn't exist).
  6. Return `parseContributionsResponse(payload)`.
- `parseContributionsResponse`:
  1. Narrow-type-guard the incoming `unknown` manually (`typeof`, `Array.isArray`). No runtime schema lib.
  2. Walk `data.user.contributionsCollection.contributionCalendar.weeks[]`, flatten `contributionDays[]` into `ContributionDay[]` with `{ date, count: contributionCount }`.
  3. Validate each `count` is a finite integer ≥ 0; coerce `NaN` / non-integer to an error.
  4. Return chronological order — GraphQL already returns weeks oldest-first, so flattening preserves order.

No retry, no timeout arg exposed. If a live call hangs, user Ctrl-C's the CLI. (Action will add a wrapper timeout in PR 004 if needed.)

### Step 4 — `scripts/fetch-contributions.mjs`

```
#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const username = process.argv[2];
if (!username) { console.error("Usage: node scripts/fetch-contributions.mjs <username>"); process.exit(1); }
const token = process.env.GITHUB_TOKEN;
if (!token) { console.error("GITHUB_TOKEN env var required"); process.exit(1); }

const build = spawnSync("pnpm", ["run", "build:renderer"], { stdio: "inherit" });
if (build.status !== 0) process.exit(build.status);

const { fetchContributions } = await import("../dist-renderer/data.js");
const days = await fetchContributions(username, token);

mkdirSync("sample-out", { recursive: true });
const outPath = `sample-out/contributions-${username}.json`;
writeFileSync(outPath, `${JSON.stringify(days, null, 2)}\n`, "utf8");

const active = days.filter(d => d.count > 0).length;
const max = days.reduce((m, d) => Math.max(m, d.count), 0);
console.log(`wrote ${outPath} (active=${active} max=${max} first=${days[0].date} last=${days.at(-1).date})`);
```

Error handling: if `fetchContributions` throws, the default `unhandledRejection` prints stack and exits non-zero. Good enough; no `try/catch` adornment.

### Step 5 — `tests/data.test.mjs`

Structure:

```
test("parser: golden fixture → 371 days chronological")
test("parser: empty-year payload → 371 zeros")
test("parser: single-day-with-activity → exactly one count > 0")
test("parser: rejects malformed payload (missing user)")
test("parser: rejects non-integer count")
test("fetch: POST url/headers/body shape")   // uses globalThis.fetch stub
test("fetch: HTTP 401 throws auth-flavored error")
test("fetch: HTTP 403 + x-ratelimit-remaining=0 mentions rate limit")
test("fetch: top-level errors[] in 200 body throws with joined message")
test("fetch: data.user === null throws user-not-found")
test("fetch: determinism — parser called twice on sample returns deepEqual arrays")
```

`globalThis.fetch` is replaced per-test with a fresh stub and restored in `afterEach`. Response objects use minimal `{ ok, status, headers: new Headers({...}), json: async () => payload }` shape. No `@mswjs` or similar — Node's test runner + native fetch types are enough.

Empty-year and single-day payloads are built in-test from the golden fixture by zeroing / setting specific counts — no separate fixture files.

### Step 6 — package.json scripts

Add:

```
"fetch:sample": "node scripts/fetch-contributions.mjs"
```

No changes to `ci` — the new test glob already picks up `tests/data.test.mjs`.

### Step 7 — commit discipline

Single commit on this worktree (user-approved 2026-04-21 — spec ships alongside code):

- `feat(data): GraphQL contributions fetcher + parser` — `specs/003-data-layer/**`, `src/data.ts`, `src/types.ts`, `tests/data.test.mjs`, `tests/fixtures/graphql-sample.json`, `scripts/fetch-contributions.mjs`, `package.json`.

## Fixture length note

Real capture for user `kiaquila` on 2026-04-21 yielded **53 weeks × 7 days = 367 flattened days** (not exactly 371): GitHub's `contributionsCollection` aligns the requested window to week boundaries (weeks start Sunday), so leading/trailing partial weeks are truncated. Parser tests MUST derive expected length from the fixture itself (`fixture.weeks.flatMap(w => w.contributionDays).length`) — do not hard-code 371 anywhere.

## Validation order

1. Step 1 → raw fixture captured; length 371 confirmed.
2. Steps 2–3 → `pnpm run check:ts` green.
3. Step 4 → `GITHUB_TOKEN=<pat> node scripts/fetch-contributions.mjs kiaquila` writes `sample-out/contributions-kiaquila.json`. Summary matches expected distribution.
4. Step 5 → `pnpm test` green; ≥ 6 new cases.
5. Full `pnpm run ci` local green.
6. `pnpm run check:feature-memory` green (spec folder complete).
7. `code-reviewer` subagent pass on `src/data.ts` + tests — focus: purity, narrow type guards, error-boundary hygiene, token leak potential.
8. `git push` → PR open → `@codex review` via gh CLI (per `feedback_codex_human_trigger` memory).
9. Iterate on findings. Budget: 2–4 cycles for an M PR.

## Risks

- **Fixture drift**: real GitHub response format could change (unlikely — this endpoint has been stable for years, but possible). Mitigation: fixture is captured once; parser is resilient to extra unknown keys.
- **Rate-limit flakiness on local smoke**: with the default 5000 req/hr authenticated limit we're nowhere near it. No mitigation needed.
- **Token leak in CI logs**: CLI prints only `username` and summary. `fetch` errors include URL but not headers. Covered by "token is never logged" constraint; verified in code-review step.
- **`data.user: null` vs 404**: GitHub returns 200 + `data.user: null` for missing logins, not 404. Test explicitly covers this branch.
- **ESM import of compiled TS from `.mjs`**: PR 002 already set this up (`dist-renderer/*.js` ES modules); `scripts/render-sample.mjs` is the template, just copy its shape.
- **Codex inline-comment pinning** (`feedback_codex_inline_pinned_to_head`): verify final verdict from Codex summary comment, not inline-comment count.

## Out of bounds

- No changes to `src/renderer.ts`, `src/normalize.ts`, `src/themes.ts`, `src/prng.ts`.
- No changes to `.github/workflows/*`.
- No changes to `prototypes/**`.
- No changes to `docs_comet/**` — docs for the Action wiring land with PR 004 / PR 005.
- No new lint rules, no ESLint config edits.
