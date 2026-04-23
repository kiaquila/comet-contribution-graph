# Tasks — chore-node24-migration

- [x] Update `action.yml`: `using: "node20"` → `"node24"`
- [x] Bump `actions/checkout@v4` → `@v6` in `comet-graph.yml`
- [x] Bump `actions/checkout@v4` → `@v6` in `ai-review.yml`
- [x] Update `package.json` `engines.node` to `>=24`
- [x] Update `@types/node` to `^24.0.0` in `package.json`
- [x] Run `pnpm install` to regenerate lockfile
- [x] Rebuild `dist-action/index.js` via `ncc build`
- [x] Verify `pnpm run check:dist` byte-identical
- [x] Update `README.md` usage snippet (`checkout@v4` → `@v6`)
- [x] Update `docs_comet/project/devops/github-action-target.md`
- [x] Verify `pnpm run ci` fully green (78 tests, check:dist)
- [x] Create feature-memory spec files (`spec.md`, `plan.md`, `tasks.md`)
