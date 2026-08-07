# 014 — tasks

## Setup

- [x] T001 Refresh GitHub state and inspect the reference PR.
- [x] T002 Create `.claude/worktrees/dependabot-cooldown-groups` on
      `codex/dependabot-cooldown-groups` from `origin/main`.

## Implementation

- [x] T003 Remove `github-actions` SemVer-specific cooldown keys while
      preserving `default-days: 7`.
- [x] T004 Add one minor-and-patch group to each configured ecosystem.
- [x] T005 Record ready-PR and Codex co-author policies in repository memory.

## Verification

- [x] T006 Parse and assert the Dependabot YAML structure.
- [x] T007 Run `pnpm run preflight`.
- [x] T008 Push, open a ready PR, and post `@codex review`.
- [x] T009 Diagnose the current-head OSV failure and identify its vulnerable
      transitive package paths.
- [x] T010 Raise only the affected pnpm override ranges and refresh the lockfile.
- [x] T011 Run preflight, push all changes, then post one
      current-head `@codex review` trigger.

## Process Memory

### Decisions

- Keep the existing npm SemVer-specific cooldown settings because the request
  targets unsupported keys in the `github-actions` ecosystem only.
- Name groups by ecosystem to keep Dependabot PR intent unambiguous.
- Do not alter global Codex configuration: it already defaults to ready PRs.
- Constrain OSV remediation to patched transitive package ranges instead of
  broad direct-dependency upgrades.
- Resolve `js-yaml@4.3.1` once with an approved command-line maturity override;
  retain the repository's 10080-minute release-age policy unchanged.

### Dead Ends

- The first preflight attempt stopped before CI because this repository treats
  all `.github/` changes as product paths and requires complete feature memory.

### Known Issues

- GitHub remains the final validator for Dependabot configuration and the OSV
  remediation after the PR is pushed.
