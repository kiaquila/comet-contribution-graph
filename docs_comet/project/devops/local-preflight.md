# Local Preflight

> Audience: all implementation agents. Canonical source for: local verification
> before pushing a PR branch.

`pnpm run preflight` is the local gate before a branch is pushed. It runs the
feature-memory check against the working tree first, then executes the same
repository CI chain used by `baseline-checks`.

## Required Command

```bash
pnpm run preflight
```

The command currently checks:

- complete feature memory for product/control-plane paths
- repository baseline files from `.unicorn-hub/config.json`
- prototype HTML validation
- prototype inline JavaScript lint
- TypeScript typecheck
- static preview build
- GitHub Action bundle and `dist-action/` verification
- formatting
- Node test suite and SVG snapshots

Use `pnpm run preflight -- --feature-memory-only` only for a quick local guard
probe while editing specs and control-plane files.

## Policy Source

`.unicorn-hub/config.json` carries the repo-specific control-plane policy:
durable docs root, specs root, product paths, supported review agents, required
checks, and baseline files. Scripts should read that config instead of
hard-coding generic Unicorn Hub paths.
