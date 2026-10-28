# Native Codex receipts

Native clean replies share an explicit verdict and a reviewed commit, but vary
their presentation. The gate recognizes the complete observed receipt or legacy
body, its known closing, one SHA binding and the known optional service footer.
A matching phrase inside arbitrary prose, an unknown receipt version, duplicated
metadata, foreign SHA or altered footer never grants approval.

The receipt parser is presentation-only: existing trusted actor/request timing,
formal review, finding history and unresolved-thread checks still apply. Native
Codex remains the reviewer; no separate audit task or synthetic review is needed.
Request it from the owner account with `@codex review <current-full-head-sha>`.
The native request/rerun path keeps its current permissions and trusted code.

`tests/codex-receipt-boundaries.test.mjs` exercises all 19 catalogued closings plus
observed emoji, wrong heads/authors/times and ambiguous or contradictory bodies.
Unknown future formats fail closed and require a recorded fixture and review.
