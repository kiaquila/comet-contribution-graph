# Native Codex receipt boundaries

## Goal

Accept observed native Codex clean replies without treating arbitrary prose as approval.

## Scope

Receipt presentation parser, regression matrix and workflow documentation only.

## Acceptance Criteria

- All catalogued clean closings pass with current-head trusted evidence.
- Foreign SHA, untrusted author, stale evidence and contradictory suffixes cannot pass.
- Existing request, finding, thread and branch protection rules stay active.

## Negative Scenario

A clean sentence followed by an authentication vulnerability remains blocked.

Current-service coverage includes the exact security-review help footer and a negative case for text injected into it.
