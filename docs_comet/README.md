# comet-contribution-graph Docs Map

> Topical index. For the reading order, see `AGENTS.md § Reading Route`.

`docs_comet/` is the durable memory layer for this repository. Entry points are `CLAUDE.md` (Claude-specific) and `AGENTS.md` (universal); this directory holds content they link into.

## Structure by topic

**Product**

- `project-idea.md` — product facts (graph dimensions, animation concept, roadmap). **Canonical source** for product facts.

**Frontend**

- `project/frontend/frontend-docs.md` — prototype architecture, CSS grid, animation approach, build pipeline, accessibility.

**Delivery & CI**

- `project/devops/ai-orchestration-protocol.md` — agent routing, default review backend, native execution surfaces. **Canonical source** for review policy.
- `project/devops/ai-pr-workflow.md` — PR gates and merge rules.
- `project/devops/review-contract.md` — what each backend produces; severity rules.
- `project/devops/review-trigger-automation.md` — bot-trigger rejection (Tier 1 active; design for Tier 2/3 in ADR).
- `project/devops/delivery-playbook.md` — preview validation and production smoke.
- `project/devops/vercel-cd.md` — Vercel deploy contract (temporary preview infra for prototype phase).
- `project/devops/github-action-target.md` — future GitHub Action deliverable spec and open questions.

**Decisions**

- `adr/` — architecture decision records and cross-cutting choices.
