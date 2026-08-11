# 016 — plan

| Phase | Work                                                           | Verification                                                   |
| ----- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| 1     | Rebase the Dependabot update onto current `main`.              | Diff contains only checkout-version changes.                   |
| 2     | Add feature memory and durable maintenance evidence.           | Guard finds a complete `specs/016-actions-checkout-v7/` triad. |
| 3     | Run preflight and publish the final head.                      | Local CI chain passes.                                         |
| 4     | Request a current-head Codex review and wait for GitHub gates. | No blocking review findings and all required checks are green. |

## Risks

- A checkout major update can change CI behavior; mitigate with the full PR
  gate and a current-head native review.
