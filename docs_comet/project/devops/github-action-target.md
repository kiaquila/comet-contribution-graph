# GitHub Action Target

> Audience: all agents. **This is a stub doc for the future Action deliverable.** Nothing described here is implemented yet. Current PRs focus on the prototype and CI/CD infra. Update this doc when the Action work begins.

## Goal

Publish a GitHub Action to the GitHub Marketplace that any user can add to their
README workflow to generate the comet contribution graph SVG automatically.

The Action takes a GitHub username, generates the cinematic contribution graph
SVG (7×53 grid, golden stars, comet animation or static fallback), and either
commits it to the repository or makes it available as a workflow artifact for
use in a Pages or README embed workflow.

## Inputs

| Input      | Description                                         | Required | Default               |
| ---------- | --------------------------------------------------- | -------- | --------------------- |
| `username` | GitHub username to generate the graph for           | yes      | —                     |
| `theme`    | Visual theme variant                                | no       | `default`             |
| `top_n`    | Number of top productive days to highlight as stars | no       | `10`                  |
| `token`    | GitHub token for fetching contribution data         | no       | `${{ github.token }}` |

## Output

- An SVG file committed to the repository (e.g., `comet-graph.svg`) that can be
  embedded in a `README.md` via a standard `<img>` tag or markdown image syntax
- Alternatively: a workflow artifact for use in a Pages publishing step

## Constraints

- **Node-only rendering:** the SVG generator must produce valid SVG markup using
  only Node.js APIs and string templating. No `document`, no `window`, no
  `canvas`, no `requestAnimationFrame`. Browser-only animation layers are
  excluded from Action output.
- **Static-mode fallback for `prefers-reduced-motion`:** the generated SVG must
  include a `@media (prefers-reduced-motion: reduce)` CSS block that disables
  animation. GitHub's SVG renderer in README files supports embedded CSS, so
  this is feasible without JavaScript.
- **Bundle size:** the Action artifact should be self-contained and reasonably
  sized. Prefer zero-dep or very-low-dep approaches for the rendering path.
  Heavy CDN dependencies (Google Fonts, large animation libraries) must be
  replaced with bundled or inlined alternatives.
- **No scraping:** contribution data must be sourced through official GitHub
  APIs (GraphQL or REST), not by scraping `github.com` HTML.

## Status

**Not yet started.** The current prototype (`prototypes/variant-d-grid-peaks.html`)
is a browser-only single-file mockup with hardcoded fake data. Before Action
packaging can begin:

1. Real GitHub data wiring must be implemented (see `docs_comet/project-idea.md § Next Product Goals`)
2. The SVG generator must be extracted into a Node-compatible module
3. The animation overlay must be isolated as a browser-only optional layer

## Open Questions

- **Data sourcing:** GitHub GraphQL `contributionsCollection` query requires a
  user token with `read:user` scope. Should the Action require the user to
  supply a PAT, or can it work with the built-in `GITHUB_TOKEN`? (The built-in
  token can only query the repository owner's contributions in the context of
  their own repo.)
- **SVG animation in GitHub README:** GitHub's README SVG renderer supports CSS
  animations embedded in SVG files. Does the full comet animation (glowing
  trail, movement timing) translate cleanly to CSS-only, or does it require JS
  interactivity that is stripped by GitHub's SVG sanitizer?
- **Commit vs artifact output:** committing the SVG to the repo on every run
  creates frequent automated commits. Is there a cleaner pattern (e.g.,
  committing only on schedule, or using a dedicated branch)?
- **Multi-user support:** the Action inputs assume a single username. Should the
  Action support generating graphs for multiple users in one run?
