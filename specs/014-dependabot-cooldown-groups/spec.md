# 014 — Dependabot cooldown groups

## Goal

Keep Dependabot's GitHub Actions configuration within its supported cooldown
schema while reducing minor and patch update PR volume per ecosystem.

## Scope

In scope:

- Remove unsupported SemVer-specific cooldown keys from `github-actions`.
- Retain its seven-day default cooldown.
- Group minor and patch version updates separately for `github-actions` and
  npm.
- Update the existing pnpm overrides and lockfile only as needed to remediate
  the OSV findings on this PR.
- Record the default ready-for-review PR policy and Codex attribution reminder.

Out of scope:

- Updating unrelated package or action versions.
- Changing Dependabot's schedule, labels, or major-update behavior.
- Changing global Codex settings, which already default to ready PRs.

## Acceptance Criteria

1. Given the `github-actions` Dependabot entry, when its cooldown is read,
   then it contains only `default-days: 7`.
2. Given either supported ecosystem, when Dependabot finds minor or patch
   version updates, then it can group them in an ecosystem-specific PR while
   major updates remain ungrouped.
3. Given a PR prepared by Codex for this repository, when it is published
   without an explicit draft request, then it is ready for review and its
   description can retain Codex attribution.
4. Given OSV reports vulnerable transitive packages from `pnpm-lock.yaml`, when
   the supported override ranges are raised to patched releases, then OSV
   completes without these findings.

## Negative Scenarios

- SemVer-specific cooldown keys must not return to the `github-actions` entry.
- Remediation must not update unrelated direct dependencies.

## Success Criteria

- The Dependabot YAML parses and has the expected cooldown and group shape.
- `pnpm run preflight` passes before publication.
