# Dependency maintenance

> Audience: maintainers and agents. This document records the durable process
> for dependency-only pull requests.

Dependency upgrades can change build, runtime, or supply-chain behavior even
when the source diff is limited to version references. Keep each update scoped
to its proposed dependency, add complete feature memory, run preflight, and
request a human-authored current-head AI review before merge.

## Recorded updates

- `actions/checkout` v6 → v7: verified across all repository workflows by the
  required GitHub checks and a final-head Codex review.
