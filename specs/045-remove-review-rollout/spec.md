# Spec: Remove the native-review rollout exception

## Goal and Scope

Remove PR #55's completed one-time validator pin and guard. Every AI Review run
must execute the trusted default-branch gate. Keep receipt validation, native
review requirements, read-only permissions, rerun automation, and protection.

## Acceptance Criteria

1. The workflow always checks out the repository default branch, with no PR
   number, branch, repository, or commit override for initial rollout.
2. Obsolete rollout-only tests are removed; a workflow trust-boundary regression
   test and the existing receipt, blocking-evidence, and race tests pass.
3. This cleanup PR's real AI Review job checks out `main`, validates native
   Codex evidence for its final head, and succeeds through normal event routing.
4. All required checks and conversations pass on the final reviewed SHA, remain
   ready for at least 120 seconds, and the PR merges through normal protection.

## Negative Scenarios

The workflow contract rejects a PR-code checkout or write credentials. Existing
gate tests continue to reject missing, stale, spoofed, or negative evidence and
unresolved findings. Do not publish a substitute check or weaken protection.
