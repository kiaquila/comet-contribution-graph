# Plan — chore-node24-migration

## Steps

1. Update `action.yml` runtime `using: "node20"` → `"node24"`
   → verify: grep confirms no `node20` in `action.yml`

2. Bump `actions/checkout` to `@v6` in all workflow files
   → verify: no `checkout@v4` references remain in `.github/workflows/`

3. Update `package.json` — `engines.node` and `@types/node` to Node 24
   → verify: `pnpm install` succeeds; lockfile updated

4. Rebuild `dist-action/index.js` via `pnpm run build`
   → verify: `pnpm run check:dist` exits 0 (byte-identical)

5. Update `README.md` usage snippet and `docs_comet/project/devops/github-action-target.md`
   → verify: no Node 20 / checkout@v4 references remain in docs

6. Create `specs/chore-node24-migration/` feature memory (this folder)
   → verify: `check:feature-memory` gate passes

7. Run full `pnpm run ci`
   → verify: all checks green
