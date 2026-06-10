# Research Index

Durable domain maps from `/research` runs. Use this index instead of grepping `docs/research/` from scratch.

| Slug | Scope | Date | Stale after |
|------|-------|------|-------------|

## How to use this index

- Before starting a `/research` run, check this file. If a recent map covers your scope, read it first instead of re-exploring.
- After producing a map worth keeping (see methodology/02-research-protocol.md for the bar), append a row here.
- If a map's `stale-after` date has passed and it still describes current code accurately, bump the date in the file and the row here. If it's stale, mark the row stale and either refresh or remove the file.

## Conventions

- **Slug** — kebab-case, matches the filename (`docs/research/<slug>.md`).
- **Scope** — one line; what subsystem or behavior the map covers.
- **Date** — when the map was last verified accurate.
- **Stale after** — when the map should be re-checked. Default 90 days; shorter if the area is actively changing.
