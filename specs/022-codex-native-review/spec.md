# Spec: Native Codex review receipts

## Goal

Accept the current native Codex no-findings receipt without weakening review or
trusted-default-branch execution boundaries.

## Scope

- Codex receipt/legacy classification, evidence selection, and exact-head safety.
- Created/edited evidence routing and bounded requeue after an active gate.
- Local review wrapper, regression tests, and review contract documentation.
- A PR-55-only read-only dispatch using an immutable natively reviewed validator
  for the initial receipt-parser deployment.

## Acceptance Criteria

1. Trusted legacy and receipt no-findings responses match the reviewed head;
   native formal reviews remain supported.
2. Findings survive a new request marker; unresolved blocking threads still fail.
3. Both created and edited receipts/summary updates wake the actual CI path.
   A summary, reaction, or completed label alone never passes the gate.
4. Evidence arriving during a running gate is reconsidered after completion,
   once per new evidence timestamp, without stale-head reruns or rerun loops.
5. Preflight passes, and the reviewed PR merges only through existing green gates.
6. Rollout rejects other PRs, policies, forks, closed/draft PRs, and a stale
   dispatch SHA; ordinary privileged paths retain default-branch scripts.

## Negative Scenarios

Reject spoofed authors, missing/stale/conflicting SHAs, duplicate/malformed
markers, incomplete/negative receipts, and pushes racing evaluation or requeue.
Structured summaries are wakeup signals only, including malformed/negative data.

## Requirements

Keep default-branch scripts trusted. Do not manufacture reviews/checks, weaken
protection, or run unreviewed PR scripts with elevated permissions for bootstrap.
