---
name: lookup-skill-builder
description: >-
  Generate a dynamic-database "lookup" skill for any folder of docs or data, so
  the model can find exactly what it needs without loading the whole corpus into
  context. Use when the user says things like "make me a skill to look up data
  from the /docs folder", "build a knowledge-base skill for this directory",
  "create a lookup/index skill for X", "turn this data into a dynamic database",
  or "I don't want to overpopulate context with all these docs". Produces a
  self-contained skill: SKILL.md (navigation protocol), lookup.config.json, a
  generated index.json (+ detail-index.json), and scripts/build-index.js.
---

# Lookup Skill Builder

You build **dynamic-database skills** that use progressive disclosure (3 tiers):

```
Tier 1  SKILL.md       always loaded — what exists + how to navigate
Tier 2  index.json     read on demand — keyword/alias → file path
Tier 3  the data files  read one at a time — the actual content
```

The whole point: a model should pay tokens only for the one file it needs, never
the whole corpus. You are NOT copying the data — you are building a router over it.

This skill ships reusable assets next to it:
- `assets/build-index.js`     — generic, dependency-free, config-driven indexer
- `assets/SKILL.md.template`  — template for the generated skill's SKILL.md
- `assets/README.md.template` — template for the generated skill's README

## Procedure

### 1. Gather inputs (ask only what you can't infer)
- **source folder** — the corpus to index (e.g. `./docs`). Resolve to an absolute path.
- **skill name** — kebab-case, e.g. `docs-lookup` (default: `<foldername>-lookup`).
- **install location** — where the skill should live. Default: a `skills/`
  subfolder in the current project. If the user wants it usable everywhere,
  also symlink it into `~/.claude/skills/`.
- **trigger description** — when the model should reach for it (used in frontmatter).

### 2. Inspect the corpus
- List the folder; sample 3–5 files to learn the format.
- Decide the parser:
  - mostly `.md`/`.mdx` → `"markdown"` (extracts title, headings, frontmatter tags as aliases)
  - mostly `.json` → `"json"` (set `categoryField`, `aliasFields`, and if leaves
    contain a sub-array of named items, `itemsField` + `itemNameField` so each
    item becomes a fine-grained detail key)
  - mixed → `"auto"` (markdown for `.md`, json for `.json`)
- Confirm each file is reasonably **self-contained**. If not, tell the user the
  index will still work but answers may need cross-file reads.

### 3. Scaffold the skill
Create `<install>/<name>/` with:
- `scripts/build-index.js` — **copy verbatim** from `assets/build-index.js` (do not rewrite it).
- `lookup.config.json` — written from step 2. Use an **absolute** `dataDir` so it
  survives symlinks. Example:
  ```json
  {
    "name": "docs-lookup",
    "dataDir": "/abs/path/to/docs",
    "include": ["**/*.md"],
    "exclude": ["**/node_modules/**"],
    "parser": "markdown"
  }
  ```
  For JSON corpora add a `"json": { ... }` block.
- `SKILL.md` — render `assets/SKILL.md.template`, filling `{{NAME}}`, `{{TITLE}}`,
  `{{DESCRIPTION}}`, `{{FILE_COUNT}}` (from step 4). For markdown set
  `{{DETAIL_LABEL}}`=`sections`; for json with items set `{{DETAIL_LABEL}}`=`operations`.
  If a `detail-index.json` is produced, fill `{{DETAIL_ROW}}` /`{{DETAIL_STEP}}`
  to reference it; otherwise replace them with empty strings.
- `README.md` — render `assets/README.md.template`.

### 4. Generate the index
Run `node <install>/<name>/scripts/build-index.js`. It reads `lookup.config.json`
and writes `index.json` (+ `detail-index.json` if there are detail keys). Capture
the reported file count for the SKILL.md.

### 5. Verify
- Confirm `index.json` exists and `entries.length` matches the corpus size.
- Simulate one realistic lookup: pick a known topic, resolve via `aliasIndex`
  (or `detail-index.json`), and confirm the resolved file actually contains it.
- Sanity-check `index.json` size — if it's very large (say > ~150 KB), narrow
  `include`, or note that the heavy map is the on-demand `detail-index.json`
  (which is fine — it's only read when needed).

### 6. Install & report
- If global use was requested: `ln -sfn <abs skill dir> ~/.claude/skills/<name>`.
- Tell the user: where the skill lives, that it appears in `/skills` after a
  restart/new session, a sample trigger phrase, and the one command to rebuild
  the index when the corpus changes.

## Rules
- Never duplicate the corpus into the skill — always reference it via `dataDir`.
- Always regenerate the index from data; never hand-write `index.json`.
- Keep the generated `SKILL.md` body as a navigation *protocol*, not data.
- The generated skill must be self-contained and runnable with plain `node` (no deps).
