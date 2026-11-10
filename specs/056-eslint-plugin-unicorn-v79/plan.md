# Plan: eslint-plugin-unicorn v79 maintenance

1. Inspect PR #67 against the current `main` base and review the official v79
   release notes and compatibility requirements.
2. Merge the current `main` base so the preceding dependency, workflow, and
   feature-memory changes remain intact.
3. Resolve the lockfile to combine ESLint 10.14.0 with Unicorn 79.0.0 without
   changing the repository's lint configuration.
4. Add the required feature memory and durable dependency-maintenance record.
5. Complete a frozen install, run prototype linting, and run the full preflight
   chain.
6. Publish the final head and request one trusted Codex review for that SHA.
7. Confirm every required check, review thread, and mergeability condition,
   observe the two-minute hold, then merge through the repository's permitted
   method.

## Risks

- v79 changes `no-top-level-side-effects`; the rule is not enabled here, and
  explicit prototype linting verifies that no existing rule regresses.
- The plugin requires ESLint 10.4+, flat config, ESM, and Node 22+; the project
  already uses ESLint 10.14, flat ESM config, and Node 24+.
- Any later push invalidates current-head review evidence and requires a new
  trusted review request for the new SHA.
