# 013 — plan

| Phase | Work                                                                  | Verification                                       |
| ----- | --------------------------------------------------------------------- | -------------------------------------------------- |
| 1     | Rename the policy directory and update shared config discovery.       | `pnpm run preflight -- --feature-memory-only`      |
| 2     | Update AI review marker/severity helpers and tests.                   | `node --test tests/helpers.test.mjs`               |
| 3     | Add branch-protection warning and docs.                               | `node --check scripts/apply-branch-protection.mjs` |
| 4     | Run full local verification, push, open PR, and trigger Codex review. | `pnpm run preflight`                               |

## Files

- `.comet-control/config.json`
- `scripts/shared.mjs`
- `scripts/ai-review-helpers.mjs`
- `scripts/ai-review-gate.mjs`
- `scripts/apply-branch-protection.mjs`
- `tests/helpers.test.mjs`
- `package.json`
- `docs_comet/project/devops/*.md`
- `specs/013-review-gate-followups/`

## Risks

- Renaming the policy directory can break helpers if any path remains stale.
- Tightening Gemini severity parsing can accidentally ignore a real blocking
  severity if the accepted marker shapes are too narrow.
- Marker author configurability should not weaken trust by accepting arbitrary
  commenters by default.
