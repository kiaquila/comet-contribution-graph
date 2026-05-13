# SENAR Mapping

SENAR is the supervised verification layer for
`comet-contribution-graph`. It does not replace the repository's spec-first PR
workflow; it makes the verification contract explicit inside the existing
artifacts.

| SENAR practice      | Repository artifact                                               |
| ------------------- | ----------------------------------------------------------------- |
| Goal                | `specs/<feature-id>/spec.md` Goal                                 |
| Scope               | `specs/<feature-id>/spec.md` Scope and `plan.md` Scope Boundaries |
| Acceptance evidence | `plan.md` Verification table and PR checks                        |
| Negative scenario   | `spec.md` Negative Scenarios                                      |
| Process memory      | `tasks.md` Process Memory                                         |
| Human supervision   | PR checklist and final merge decision                             |

## Done Gate

Before merge, the author should confirm:

- feature memory names goal and scope
- acceptance criteria have evidence
- negative scenarios are covered or explicitly waived
- process memory is current
- unresolved known issues are accepted by the human merge owner

The GitHub `guard` check remains structural: it requires a complete feature
folder for product/control-plane paths. Reviewers and humans use the SENAR done
gate to judge the quality of the evidence inside that folder.
