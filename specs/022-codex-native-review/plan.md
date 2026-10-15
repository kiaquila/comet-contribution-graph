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
initial rollout. If the connector provides only new receipts, investigate safe
reviewed deployment options and retain a blocked PR rather than bypass gates.

## Verification

- Receipt/parser and evidence-selection regressions in the Node test suite.
- Workflow filter, runtime routing, active/completed requeue, and push races.
- Required pnpm preflight and GitHub checks on the final reviewed head.

## Scope Boundaries

No renderer, Action bundle, credentials, protection, or other product changes.
