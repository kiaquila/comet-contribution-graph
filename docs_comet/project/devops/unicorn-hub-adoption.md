# Unicorn Hub Adoption

> Audience: all agents. Canonical source for: what this repository adopted from
> `kiaquila/unicorn-hub`, and what remains intentionally out of scope.

This repository uses Unicorn Hub as a process blueprint, not as a product
dependency. Keep the adopted control-plane pieces product-specific and avoid
copying blueprint-maintenance machinery unless a future feature spec justifies
it.

## Adopted

- `.unicorn-hub/config.json` as a small local policy file for docs root, specs
  root, product paths, required checks, enabled review agents, and baseline
  files.
- `scripts/shared.mjs` for shared config and argument parsing helpers.
- Config-aware repository baseline and feature-memory checks.
- `pnpm run preflight` as the local push-before gate.
- SENAR-style feature templates, PR checklist, and review lens.
- Event-driven `AI Review` reruns through trusted review-request markers and
  trusted review-evidence events.
- Branch-protection helper that reads required checks from local config.
- Supply-chain defaults already present in this repository:
  `minimumReleaseAge`, Dependabot cooldown, pinned package manager, and OSV
  scanning.

## Intentionally Not Adopted

- `bootstrap-repo.mjs`: this repository is already bootstrapped and has
  product-specific docs under `docs_comet/`.
- `profiles/`: profile selection is for installing Unicorn Hub into unrelated
  target repositories.
- `templates/`: these are source templates for other repositories, not runtime
  assets for the comet Action.
- `sanitize-blueprint.mjs`: useful for the public blueprint repository, but this
  product repo is not redistributing generic templates.
- `sync-workflows.mjs`: workflow drift should be handled through explicit
  feature specs here, not automatic blueprint synchronization.
- `docs_project/` docs root: this repository already uses `docs_comet/` as its
  durable memory layer.
- Claude review enablement: Claude review remains non-operational here until a
  dedicated restore/cleanup PR changes the policy and required checks.

## Revisit Conditions

Reconsider a skipped piece only when a feature spec names:

- the current pain it solves
- the simpler alternative that was rejected
- the verification evidence that proves the imported machinery is working
- the docs that become canonical after adoption
