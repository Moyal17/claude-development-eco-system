# CLAUDE.md — <REPO NAME>

> Template from `claude-development-eco-system`. Replace the bracketed sections, then commit.

## What this repo does

<one paragraph: what the system is, who uses it, what business problem it solves>

## Stack

- **Languages:** <e.g., TypeScript (Node 20, React 18, Next 14), Python 3.11>
- **Datastores:** <e.g., MongoDB, Redis, S3>
- **Infra:** <e.g., AWS Lambda, Cloudflare Workers, GHA for CI>
- **Test runners:** <e.g., vitest for TS, pytest for Python>
- **Lint/format:** <e.g., eslint + prettier; ruff + black>

## Working with Claude in this repo

This repo follows the **claude-development-eco-system** methodology. Before changing code:

1. `/intake "<request>"` — produces a Brief in `docs/plans/<slug>.md`.
2. `/research` — appends a Domain Map.
3. `/plan` — drafts the plan, gets architect review and user approval, freezes it.
4. Then build (`/dev-roles full --from-plan docs/plans/<slug>.md` or, later, `/build`).

**No code is written before the plan in `docs/plans/<slug>.md` is `status: approved`.** This is convention, not enforced by hooks. Reviewers will catch violations.

The full protocol lives at `~/sourceControl/claude-development-eco-system/methodology/`.

## Repo conventions

### Code style
<bullets — e.g., "no default exports", "prefer named functions over arrow functions at module level", "Joi for runtime validation, never `as`">

### Error handling
<bullets — e.g., "throw typed errors with .status; let the global handler format responses">

### Testing
<bullets — e.g., "every controller has at least one happy-path and one auth-bypass test", "no mocks for the database — use the test container">

### Naming
<bullets — e.g., "files kebab-case, classes PascalCase, functions camelCase">

## What's where

- `src/` — <brief tour of the top-level folders>
- `docs/adr/` — Architecture Decision Records, numbered
- `docs/research/` — durable domain maps from `/research` runs (see `docs/research/INDEX.md`)
- `docs/plans/` — in-flight and recent plans; archived after merge to `docs/plans/archive/`

## Mistakes Claude has made here (update when it happens)

<this section grows. When Claude does something wrong that wasn't already obvious from the code, add a one-line entry here so future sessions don't repeat it. Per Boris Cherny's tip #4.>

- ...

## Forbidden actions

Never, regardless of permission mode:
- Force-push to `main` or any release branch
- `git reset --hard` shared branches
- Skip pre-commit hooks (`--no-verify`) without explicit user approval in the same session
- Commit `.env*` files or anything that looks like a secret
- Create a PR or merge a PR without explicit user instruction in the same turn
- Run database migrations against any non-local database

## Useful commands

```bash
<install command>
<test command>
<lint command>
<dev server command>
```
