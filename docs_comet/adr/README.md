# comet-contribution-graph ADRs

This folder stores durable cross-cutting decisions that should survive
individual feature PRs.

## Index

- [ADR-0001 — Defer acorn-based inline JS validator](ADR-0001-defer-acorn-js-validator.md)
  — ESLint v9 + `eslint-plugin-html` adopted in PR #4 covers current `check:js`
  scope; reopen only if a hand-rolled detector reappears under `scripts/`.

## When to add an ADR

- framework migrations
- storage or data-sourcing strategy (GraphQL vs scraping vs `GITHUB_TOKEN`)
- deployment model changes
- SVG rendering architecture changes (CSS grid vs native SVG vs canvas)
- agent orchestration changes that affect repository policy
- any design that is captured in a devops doc but not currently adopted (extract as ADR to keep the devops doc about active behavior)
