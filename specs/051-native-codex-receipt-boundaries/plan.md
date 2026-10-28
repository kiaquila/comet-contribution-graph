# Plan

Reuse the existing review helpers and request contracts. Isolate complete receipt presentation matching in a pure helper and keep review authority in the gate.

## Verification

| Acceptance criterion                          | Evidence                                                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Complete clean catalog and hostile boundaries | `node --test tests/codex-receipt-boundaries.test.mjs`                                               |
| Existing contracts                            | Repository preflight and native PR checks                                                           |
| Protected delivery                            | Owner native review; resolved threads; 120 seconds unchanged green evidence; normal protected merge |
