# lookup-skill-builder

A **meta-skill**: it generates dynamic-database "lookup" skills for any folder of
docs or data, so the model can find exactly what it needs without loading the
whole corpus into context (progressive disclosure).

## How to use it

In any project, say something like:

> "make me a skill to look up the needed data from the /docs folder"

The skill will inspect the folder, scaffold a new lookup skill, generate its
index, verify a sample lookup, and (optionally) install it globally.

## What it produces

```
<install>/<name>/
├── SKILL.md              # Tier 1 — description + navigation protocol
├── lookup.config.json    # what to index and how (parser, globs, dataDir)
├── index.json           # Tier 2 — lean router: aliasIndex + entries
├── detail-index.json    # Tier 2 — heavy fine-grained map (headings / item names), read on demand
└── scripts/build-index.js
```

The corpus is **referenced**, never copied — `index.json` records its absolute path.

## Assets (used during generation)

- `assets/build-index.js`     — generic, dependency-free, config-driven indexer (copied into each generated skill)
- `assets/SKILL.md.template`  — template for the generated skill's SKILL.md
- `assets/README.md.template` — template for the generated skill's README

## The three tiers

1. **SKILL.md** — always loaded; what exists + the lookup algorithm.
2. **index.json / detail-index.json** — read on demand; keyword → file path.
3. **The data files** — read one at a time; the actual content.

Supports `markdown` (title/headings/frontmatter tags), `json` (category + item
names), and `auto` (per-extension) corpora.
