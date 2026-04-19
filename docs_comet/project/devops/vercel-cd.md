# Vercel CD

> Audience: all agents. **IMPORTANT: Vercel is temporary preview infrastructure for the prototype phase.** The final delivery target for this project is a GitHub Action artifact, not Vercel hosting. See `github-action-target.md` for the long-term deliverable. This doc covers the current Vercel setup for prototype previews only.

## Deploy Model

This repository uses **Vercel Git integration** as the current CD layer during the prototype phase.

- Pull requests create Vercel preview deployments
- Merge to `main` creates a Vercel production deployment
- GitHub Actions remain the canonical CI and AI-review layer

## Connected Project

Current Vercel project:

- name: `comet-contribution-graph`
- owner: `kiaquila`

## Build Contract

Once a build step is introduced:

- `buildCommand`: `pnpm run build`
- `outputDirectory`: `dist`

During the current prototype phase there is no build step; Vercel serves the
`prototypes/` directory directly or via a minimal static wrapper. This will be
updated when the Node SVG generator is extracted.

Vercel auto-detects pnpm from `pnpm-lock.yaml` and uses the version pinned in
`packageManager`. No Vercel dashboard overrides required.

## Operational Rule

Do not treat manual dashboard edits as the delivery path. Product behavior should change through:

1. repository change
2. PR checks
3. merge to `main`
4. Vercel production deploy from the merged commit

Preview validation and post-merge smoke are documented in
`docs_comet/project/devops/delivery-playbook.md`.

## Security Headers

Once `vercel.json` is configured, it should set response headers for every path
as a baseline hardening layer:

- **Content-Security-Policy** — `default-src 'self'`; explicit allowlist for
  Google Fonts (`fonts.googleapis.com` CSS + `fonts.gstatic.com` WOFF). Any
  additional external origin added to the prototype must be added here in the
  same PR, otherwise the browser will block it.
- **Strict-Transport-Security** — HSTS with `max-age=63072000; includeSubDomains; preload`.
- **X-Frame-Options: DENY** and `frame-ancestors 'none'` in CSP — blocks
  embedding in third-party iframes (anti-clickjacking).
- **X-Content-Type-Options: nosniff**, **Referrer-Policy**, **Permissions-Policy** —
  standard defense-in-depth defaults.

Inline scripts and styles in the current single-file prototype require
`'unsafe-inline'` in the CSP. Tightening this is deferred until the SVG
generator is extracted and the prototype is refactored.

## Supply-chain Hygiene

- **OSV Scanner** should be wired once `pnpm-lock.yaml` is present.
- **Dependabot** should be enabled for `github-actions` and `npm` ecosystems.
- **Pinned action SHAs.** Third-party GitHub Actions should be pinned to a
  commit SHA with a trailing `# v<tag>` comment once CI workflows are added.

## Prototype Phase Note

Vercel hosting is used here to provide a stable preview URL during development.
Once the GitHub Action is published and a demo page is needed, the hosting
strategy will be revisited. Do not build permanent product features that depend
on Vercel-specific behavior (edge functions, server-side rendering, etc.); keep
the output a static artifact that works anywhere.
