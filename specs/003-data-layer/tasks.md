# Tasks — Data layer

## Fixture capture

- [x] Create a throwaway PAT with `read:user` + `public_repo` scopes
- [x] Run live GraphQL query against `api.github.com/graphql` for user `kiaquila`, rolling 371-day window
- [x] Keep full GraphQL response wrapper (`{data: {user: {contributionsCollection: {contributionCalendar: {weeks: [...]}}}}}`); query requests no PII fields, so no stripping needed
- [x] Save sanitized payload to `tests/fixtures/graphql-sample.json`
- [x] Verify flattened day count (got: 53 weeks × 7 = 367 days; active=24, max=20) — GitHub aligns to week boundaries, parser must not hard-code 371

## Types

- [ ] Extend `src/types.ts` with `GraphQLContributionDay`, `GraphQLContributionWeek`, `GraphQLContributionsResponse`, `FetchOptions`
- [ ] No breaking changes to existing `ContributionDay` / renderer types

## `src/data.ts`

- [ ] Export `parseContributionsResponse(payload: unknown): ContributionDay[]` with manual narrow type guards, flatten weeks, validate integer counts ≥ 0
- [ ] Export `fetchContributions(username, token, opts?): Promise<ContributionDay[]>` — POST to `https://api.github.com/graphql` with Bearer token, minimal GraphQL query using variables (no interpolation)
- [ ] Private `computeWindow(now = new Date()): { from: string; to: string }` — rolling 371-day UTC window
- [ ] Private `buildQuery(username, from, to): { query, variables }`
- [ ] Error mapping:
  - [ ] Non-2xx → `Error('GitHub API request failed: HTTP <status>', { cause })`
  - [ ] 403 with `x-ratelimit-remaining=0` → message mentions rate limit
  - [ ] 200 + `payload.errors?.length` → `Error('GitHub GraphQL returned errors: <joined>', { cause: errors })`
  - [ ] 200 + `payload.data.user === null` → `Error('GitHub user not found: <username>')`
- [ ] `Authorization` header never logged; summaries print username + stats only

## CLI `scripts/fetch-contributions.mjs`

- [ ] Reads `username` from `argv[2]`, fails fast with usage hint if missing
- [ ] Reads `GITHUB_TOKEN` from env, fails fast if missing
- [ ] Prebuilds renderer via `spawnSync("pnpm", ["run", "build:renderer"])`, propagates exit code
- [ ] Imports `../dist-renderer/data.js`, calls `fetchContributions`
- [ ] Writes `sample-out/contributions-<username>.json` (pretty-printed, trailing newline)
- [ ] Prints single summary line: `wrote <path> (active=N max=M first=YYYY-MM-DD last=YYYY-MM-DD)`
- [ ] Add `fetch:sample` script alias in `package.json`

## Tests `tests/data.test.mjs`

- [ ] Parser: golden fixture → length matches fixture, chronological, all counts integers ≥ 0
- [ ] Parser: empty-year payload (zeroed counts derived from fixture) → same length, all zeros
- [ ] Parser: single-day-with-activity → exactly one count > 0
- [ ] Parser: rejects malformed payload (missing `data.user`)
- [ ] Parser: rejects non-integer `contributionCount`
- [ ] Parser determinism: two calls on same sample → deepEqual arrays
- [ ] Fetch transport: stub `globalThis.fetch`, assert URL, `Authorization: bearer <token>`, `Content-Type: application/json`, body includes `contributionsCollection` and username variable
- [ ] Fetch error: HTTP 401 → thrown error message contains "HTTP 401"
- [ ] Fetch error: HTTP 403 + `x-ratelimit-remaining: 0` → message contains "rate limit"
- [ ] Fetch error: 200 body with `errors: [...]` → message joins GraphQL error messages
- [ ] Fetch error: 200 body with `data.user: null` → message contains "user not found"
- [ ] `afterEach` restores original `globalThis.fetch`

## Verification

- [ ] `pnpm run check:ts` green
- [ ] `pnpm test` green (≥ 6 new cases passing)
- [ ] `pnpm run ci` green end-to-end locally
- [ ] `pnpm run check:feature-memory` green
- [ ] Manual smoke: `GITHUB_TOKEN=<pat> node scripts/fetch-contributions.mjs kiaquila` writes valid `sample-out/contributions-kiaquila.json`
- [ ] `git diff origin/main -- src/renderer.ts src/normalize.ts src/themes.ts src/prng.ts prototypes/` empty
- [ ] `code-reviewer` subagent pass on `src/data.ts`, tests, CLI — focus: purity, narrow guards, error boundary, no token leak
- [ ] Single commit on branch: `feat(data): GraphQL contributions fetcher + parser` (spec + code together)
- [ ] Pre-push hook passes
- [ ] PR opened against `main`
- [ ] `@codex review` posted via `gh` after initial push and after every subsequent push
- [ ] `baseline-checks`, `guard`, `AI Review` green on PR head SHA
- [ ] Vercel preview green (prototype unchanged)
- [ ] All blocking Codex findings resolved

## Out of scope (deferred)

- [ ] `action.yml` + ncc bundle + output-branch push — PR 004 (`specs/004-action-entrypoint/`)
- [ ] Dogfood workflow + README embed — PR 005 (`specs/005-dogfood/`)
- [ ] `--from` / `--to` CLI flags
- [ ] GitHub Enterprise host support
- [ ] Retries / timeouts / backoff
- [ ] Octokit or any HTTP/GraphQL client dep
