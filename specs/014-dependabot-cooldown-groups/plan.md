# 014 — plan

| Phase | Work                                                                            | Verification                                            |
| ----- | ------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1     | Inspect the current Dependabot configuration and supported options.             | Official GitHub documentation and YAML structure check. |
| 2     | Correct the `github-actions` cooldown and add per-ecosystem minor/patch groups. | Parsed YAML asserts the expected keys and values.       |
| 3     | Record the ready-PR and Codex-attribution policy in repository memory.          | Focused diff review.                                    |
| 4     | Raise only OSV-identified override ranges and refresh the lockfile.             | `pnpm why` and OSV scan.                                |
| 5     | Run preflight, publish a ready PR, and post the trusted Codex trigger.          | Local and GitHub checks.                                |

## Files

- `.github/dependabot.yml`
- `.github/pull_request_template.md`
- `AGENTS.md`
- `docs_comet/project/devops/vercel-cd.md`
- `dist-action/index.js`
- `package.json`
- `pnpm-lock.yaml`
- `specs/014-dependabot-cooldown-groups/`

## Risks

- Unsupported Dependabot keys can invalidate or silently misconfigure updates;
  mitigate with a structure check and GitHub PR validation.
- Grouping all updates could conceal major-version changes; restrict each group
  to `minor` and `patch` only.
- A broad dependency update can change unrelated behavior; constrain the
  remediation to the vulnerable transitive packages reported by OSV.
