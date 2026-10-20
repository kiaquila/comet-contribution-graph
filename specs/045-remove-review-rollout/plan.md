# Plan: Remove the native-review rollout exception

1. Start an isolated branch from fresh `origin/main` after PR #55's merge.
2. Remove the pinned-validator checkout and inline PR-55-only guard. Preserve
   default-branch execution, read-only permissions, and credential cleanup.
3. Delete rollout-only tests and protect the unconditional default-branch
   checkout in the existing review regression suite.
4. Replace active rollout instructions with the normal validation contract and
   retain a concise historical link to PR #55's delivery evidence.
5. Run preflight and actionlint; publish one ready PR and request native Codex
   review for its final full SHA. Observe normal receipt/summary rerun routing.
6. Audit actual run logs for checkout of `main`, the real native receipt, and
   read-only permissions. Hold the unchanged green head for 120 seconds, then
   merge with exact-head matching and verify the result and protection.

## Boundaries

No parser, reviewer identity, renderer, dependency, backend-policy, or branch
protection changes. Keep unrelated main-checkout files untouched.
