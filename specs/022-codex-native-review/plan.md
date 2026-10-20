# Plan: Native Codex review receipts

## Approach

1. Reproduce legacy acceptance and prefixed receipt rejection on origin/main.
2. Parse the optional receipt prefix strictly and bind explicit commit fields;
   preserve marker/timeline proof for legacy responses without a commit field.
3. Evaluate native reviews and summaries without discarding earlier findings;
   inspect unresolved native threads and verify HEAD after API reads.
4. Route receipt and summary updates from trusted identities. A workflow_run
   completion observer recovers evidence racing an active gate. Attempt start
   timestamps bound requeue to new evidence; API head checks prevent stale reruns.
5. Run negative regression tests and repository preflight, then native review,
   checks, thread resolution, 120-second readiness hold, and protected merge.

## Trust and Bootstrap

All privileged review/rerun scripts continue to come from the default branch.
Try a real native formal review, already understood by the old gate, for the
initial rollout. The connector returned only a new receipt for immutable
`5773da6b5b93d5f91486b2c6d631e56faea4da44`. Pin that reviewed validator in a
PR run restricted to open PR #55, the same repository/branch, Codex
policy, and the live event head. Give the entire gate job read permissions
only, disable persisted checkout credentials, and require a fresh native review
of the final workflow head before rerunning the PR gate. The pinned validator
evaluates real final-head evidence; it does not publish a synthetic verdict. Closing #55
disables this exception. Other PRs and manual runs retain default-branch checkout.

## Verification

- Receipt/parser and evidence-selection regressions in the Node test suite.
- Workflow filter, runtime routing, active/completed requeue, and push races.
- Required pnpm preflight and GitHub checks on the final reviewed head.

## Scope Boundaries

No renderer, Action bundle, credentials, protection, or other product changes.
