# 015 — plan

| Phase | Work                                                             | Verification                                                           |
| ----- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1     | Review the Dependabot diff and the current PR gate failures.     | Only the intended workflow action versions change.                     |
| 2     | Record feature memory and durable maintenance guidance.          | Guard finds a complete `specs/015-dependabot-workflow-updates/` triad. |
| 3     | Run the local preflight chain and publish the updated PR head.   | `pnpm run preflight` passes.                                           |
| 4     | Request Codex review for the new head and wait for GitHub gates. | Native current-head review and all required checks are green.          |

## Risks

- GitHub Action releases can alter CI behavior; mitigate through the complete
  PR gate and a current-head review.
- A follow-up push invalidates prior review evidence; mitigate by requesting a
  new human-authored Codex review after every push.
