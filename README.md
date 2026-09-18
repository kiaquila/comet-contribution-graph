# comet-contribution-graph

A cinematic GitHub contribution graph. A comet traces your most productive days across a constellation of your year.

[![comet-graph](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/comet-graph.yml/badge.svg)](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/comet-graph.yml) [![OSV Scanner](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/osv-scan.yml/badge.svg)](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/osv-scan.yml) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

![cinematic comet contribution graph](https://raw.githubusercontent.com/kiaquila/comet-contribution-graph/comet-graph/comet.svg)

## Usage

Add the following workflow to your profile repo (`<user>/<user>`) to render and publish your comet graph on a weekly schedule. The Action fetches your contribution data, renders the SVG, and force-pushes it to a `comet-graph` branch in the same repo.

```yaml
# .github/workflows/comet-graph.yml in <user>/<user>
name: comet-graph
on:
  schedule:
    - cron: "0 3 * * 1"
  workflow_dispatch:
jobs:
  render:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v6
      - uses: kiaquila/comet-contribution-graph@v2
        with:
          username: <user>
```

### Embed in your profile README

```markdown
![cinematic comet contribution graph](https://raw.githubusercontent.com/<user>/<user>/comet-graph/comet.svg)
```

### Reduced-motion fallback

For users who prefer reduced motion, serve the static companion SVG via a `<picture>` element:

```html
<picture>
  <source
    media="(prefers-reduced-motion: reduce)"
    srcset="
      https://raw.githubusercontent.com/<user>/<user>/comet-graph/comet-reduced.svg
    "
  />
  <img
    alt="cinematic comet contribution graph"
    src="https://raw.githubusercontent.com/<user>/<user>/comet-graph/comet.svg"
  />
</picture>
```

### Inputs

| name       | required | default               | description                                                                                                                                              |
| ---------- | -------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `username` | yes      | —                     | GitHub login to render the graph for                                                                                                                     |
| `token`    | no       | `${{ github.token }}` | Token with `contents:write` on the target repo; for cross-repo use a classic PAT with `repo` scope or a fine-grained PAT with `Contents: Read and write` |
| `reduced`  | no       | `"true"`              | Also emit `comet-reduced.svg` for `prefers-reduced-motion` fallback                                                                                      |
| `branch`   | no       | `"comet-graph"`       | Output branch; force-pushed on every run                                                                                                                 |
| `layout`   | no       | `"orbit"`             | `orbit` — radial year + stats panel (896×300); `grid` — classic 7×53 sky (896×150)                                                                       |

## How it works

Every run fetches your GitHub contributions via the GraphQL API, passes them through a pure-TS SVG renderer (SMIL-animated comet orbiting a radial constellation of your year, or tracing your peak days across the classic grid), and force-pushes the result to an orphan branch in the repository where the workflow runs. Your profile README embeds the SVG via a stable `raw.githubusercontent.com` URL.

## Concept

- **Orbit (default):** the year is wound into seven rings (one per weekday) around a sun that carries your total; month ticks mark the way round, and a comet orbits continuously. A panel beside it shows active days, longest streak, best day, busiest weekday and a weekly-volume histogram — so the poster still answers "how active is this person?" at a glance.
- **Grid (`layout: grid`):** the familiar 7×53 contribution grid as a night sky, with a comet flying through your peak days chronologically.
- In both layouts every active day is a star whose size and brightness scale with your own contribution volume, relative to your personal peak; the top productive days are golden spike stars.

## Contributing

This is a personal project, maintained solo. Feel free to open issues for bugs you hit, but please do not submit pull requests — I'm not accepting external contributions at this time.

## License

Released under the [MIT License](./LICENSE). © 2026 Kristina Aquila.
