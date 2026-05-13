# Branch Protection

> Audience: repository owner and orchestration agents. Canonical source for:
> applying the GitHub `main` protection contract.

Branch protection should be applied only after the workflows and helper scripts
are merged into the default branch. Do not apply protection from an unreviewed PR
branch.

## Required Checks

The required checks are read from `.comet-control/config.json`:

- `baseline-checks`
- `guard`
- `AI Review`
- `osv-scan`

## Apply

From a trusted local checkout of the default branch:

```bash
pnpm run branch:protect
```

The helper enables:

- strict required status checks
- admin enforcement
- stale review dismissal
- conversation resolution
- blocked force pushes
- blocked branch deletion

The default required human approvals value is `0`, which keeps the solo-owner
workflow usable while still requiring green checks and resolved conversations.
When `--approvals` is omitted, the helper prints an explicit warning before it
applies that default. Pass `--approvals 1` or higher when human approval should
become part of the protection rule.

## Verify

After applying, inspect the GitHub branch settings or run:

```bash
gh api repos/kiaquila/comet-contribution-graph/branches/main/protection
```
