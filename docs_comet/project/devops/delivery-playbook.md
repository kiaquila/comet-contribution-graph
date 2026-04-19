# Delivery Playbook

> Audience: all agents. Canonical source for: preview validation checklist, merge rule, production smoke. Prereq: `ai-pr-workflow.md`. Next: `vercel-cd.md` (deploy contract).

This playbook covers preview validation before merge and production smoke after
merge.

## Preview Checklist

For any app-facing PR, verify on the Vercel preview:

- graph grid loads and renders at 672px width without layout overflow
- contribution cells display with correct color gradations (inactive vs active vs star)
- comet animation starts and completes without visual glitches
- `prefers-reduced-motion` fallback works: when the OS reduced-motion preference is enabled, the static graph renders with highlighted stars and no animation plays
- no console errors appear during load or animation playback
- no obviously missing assets or broken links appear

## Merge Rule

Do not merge while any of these are true:

- required GitHub checks are pending or failing
- the active review backend has unresolved blocking findings
- the Vercel preview is failing or visibly broken for the changed flow

## Production Smoke

After merge to `main`, verify the production URL documented in
`VERCEL_PRODUCTION_DOMAIN`.

Minimum smoke:

- graph grid renders correctly at standard README width (672px)
- comet animation plays end-to-end without freezing
- `prefers-reduced-motion` fallback confirmed in a reduced-motion browser profile

If production smoke fails, treat it as an active incident and recover through a
new PR rather than a direct Vercel dashboard edit.
