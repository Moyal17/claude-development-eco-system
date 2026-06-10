---
name: learn
description: Onboarding skill for joining an unfamiliar codebase. Multi-session-aware — picks up where it left off via docs/onboarding/<repo-slug>.md frontmatter. Builds a personal architecture map, extracts real team conventions from recent merged PRs, identifies hot-spot files by recent churn, drafts a project-specific CLAUDE.md candidate, and surfaces "what surprised me" notes. Use when (1) joining a new project for the first time, (2) returning to a project after months away, (3) the user says "ramp me up", "help me learn this repo", "onboard me", "where do I start", (4) a new developer needs a structured first-2-weeks plan, (5) you want to reduce hallucination risk by grounding context before any real work begins. Read-only against source code — only writes to docs/onboarding/.
argument-hint: [--phase <1-7>] [--resume] — usually no args; just /learn
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
---

# /learn — Codebase Onboarding

You are running the onboarding workflow for an unfamiliar codebase. The objective is to take someone from "I just cloned this repo" to "I can ship a small feature without breaking anything" in 1–2 weeks of structured, resumable sessions.

This skill does not do the work. It builds the **operator's manual** for the work — a personal map of the codebase that you and the user can reference forever.

**Read-only against source code.** Every artifact this skill produces lives under `docs/onboarding/` in the target repo. No edits to source files, no commits, no pushes.

---

## Compositions with the eco-system

- **`knowledge/context-engineering`** auto-activates throughout this skill — informs which files to load and how to structure context.
- **`knowledge/source-driven-development`** auto-activates when the skill encounters frameworks/libraries it needs to verify — prevents API hallucination during the "what stack does this repo use" phase.
- **`agents/dev-explorer`** is spawned in Phase 2 for the architecture map.
- After `/learn` completes its first pass, `/feature` becomes much safer to invoke because the brief/research stages can lean on the artifacts here.

---

## Pre-flight

Before doing anything, run these checks. If any fail, stop and report.

1. **Is this a git repo?** Run `git rev-parse --is-inside-work-tree`. If not a repo, refuse — `/learn` needs git history.
2. **Does `docs/onboarding/<slug>.md` already exist?** If yes, this is a resume — read its frontmatter `phase:` field and jump to that phase. If no, this is a fresh start at Phase 1.
3. **Compute the slug.** Default: the basename of the repo root, lowercased, hyphen-separated. Example: `Maitre-ai` → `maitre-ai`.
4. **Detect language stack** by checking which package files exist:
   - `package.json` → Node/TypeScript
   - `pyproject.toml` / `requirements.txt` / `setup.py` → Python
   - `go.mod` → Go
   - `Cargo.toml` → Rust
   - `pom.xml` / `build.gradle` → JVM
   - `Gemfile` → Ruby
   - `composer.json` → PHP
   - Multiple → record all, the repo is polyglot
5. **Detect ticketing system** — peek at the last 5 PR bodies (`gh pr list --state merged --limit 5 --json title,body`) and look for `[A-Z]+-\d+` (Jira), `#\d+` (GitHub Issues), or Linear `<TEAM>-\d+` patterns. Record but don't require.

If `gh` is missing, mark Phase 3 (PR-based convention extraction) as degraded but continue with `git log` only.

---

## Output structure

Everything goes under `docs/onboarding/` in the target repo. Create the directory if missing.

```
docs/onboarding/
├── <slug>.md            # main session log + frontmatter (single source of truth for resume)
├── architecture.md      # the domain map (Phase 2 output)
├── conventions.md       # extracted real team style (Phase 3 output)
├── hot-spots.md         # high-churn files, what to read first (Phase 5 output)
├── surprises.md         # append-only journal — non-obvious discoveries
├── claude-md-draft.md   # candidate project CLAUDE.md the user can adopt (Phase 7 output)
└── trust-audit.md       # advisory: fragile patterns spotted (Phase 8 output)
```

The main `<slug>.md` file uses this frontmatter (extend on each phase):

```yaml
---
slug: <repo-slug>
started_at: <ISO timestamp>
phase: <1-8>          # current/next phase to run
language_stack: [...]
ticketing: jira | github | linear | none
sessions: <count of /learn invocations>
last_session_at: <ISO>
done_at: <ISO>        # set when Phase 8 completes
---
```

---

## The 8 phases

Run in order. Each phase reads/extends the artifacts above and bumps `phase:` in the frontmatter. The user can stop after any phase — re-running `/learn` resumes.

If you're at Phase N and the skill is invoked, run Phase N. After completion, ask the user whether to continue into N+1 or stop and resume later.

### Phase 1 — Repo Scan (bootstrap)

**Reads:**
- Root `README.md`
- Root `CLAUDE.md` (if exists — copy verbatim into `claude-md-draft.md` as starting point)
- Detected package files (`package.json` etc.) — extract dependencies, scripts, engines
- `.github/workflows/` — list of CI workflows + what they do (parse `name:` and `on:` fields)
- Top-level directories (`ls -la`)
- `.gitignore` to learn what's deliberately excluded

**Writes:**
- `docs/onboarding/<slug>.md` with frontmatter + a "Phase 1 — Repo Scan" section containing:
  - Stack summary (1 paragraph)
  - Top-level layout table
  - CI workflows table
  - Build/test/dev commands extracted from package files
  - Notable dependencies (frameworks, ORMs, test runners) — flag anything unfamiliar

**Stop signal:** present the Phase 1 summary to the user, ask "continue to Phase 2 (architecture map)?" — wait for explicit yes.

### Phase 2 — Architecture Map

**Spawn `dev-explorer`** with this prompt:

> Produce a structured Domain Map of the major modules in this repo. For each module:
> - Module name and root path
> - Purpose (1 line)
> - Key entry files with file:line citations
> - External dependencies it uses
> - Modules it depends on (internal coupling)
> Output as a markdown table + a short narrative section "What surprised me about this layout".
> Cap output at 200 lines. Cite file:line for every claim.

**Writes:** `docs/onboarding/architecture.md` with the explorer's output, prefixed with a "How to read this" header.

Append the explorer's "What surprised me" section to `surprises.md` as the first entry.

Bump `phase: 3` in `<slug>.md` frontmatter.

**Stop signal:** present the architecture map, ask to continue.

### Phase 3 — Convention Extraction

Use `gh` to fetch real team conventions from recent merged PRs.

```bash
gh pr list --state merged --limit 10 --json number,title,body,author,mergedAt,headRefName
```

For each PR:
- Read the title and body — extract title style (conventional commits? imperative? sentence-case?)
- Read the diff via `gh pr diff <number>` (cap at 200 lines per PR)
- Read PR review comments via `gh api repos/:owner/:repo/pulls/<number>/comments`

Extract:
- **Commit message style** — prefix conventions (`feat:`, `fix:`, `chore:`), tense, length
- **Branch naming** — from `headRefName` field
- **PR title format**
- **Review tone** — terse vs verbose, line-comment vs summary, blocking severity language
- **Test patterns** — test file naming (`*.test.ts` vs `*.spec.ts` vs `__tests__/`), assertion library usage, fixture patterns
- **File naming** — kebab-case vs PascalCase vs snake_case, by directory

If `gh` is missing, fall back to `git log --pretty=format:"%h|%s|%an|%ai" -n 20` for commit message conventions only.

**Writes:** `docs/onboarding/conventions.md` with extracted conventions + concrete examples (paste actual commit messages, actual PR titles — don't paraphrase).

### Phase 4 — Recent-Changes Scan

```bash
git log --since="3 months ago" --pretty=format:"%h | %ai | %an | %s" --no-merges
```

Cluster commits by:
- Author (who's been active?)
- Theme (auth, perf, refactor, deps, feature work)
- File (which areas of the code are moving)

Append a "Recent Activity" section to `<slug>.md` with the top 3 themes and top 5 active contributors.

This phase is fast (~30 seconds). No separate file — appends to main log.

### Phase 5 — Hot-Spot Identification

```bash
git log --since="3 months ago" --name-only --pretty=format: --no-merges | grep -v '^$' | sort | uniq -c | sort -rn | head -30
```

The top files by churn are either:
- **Active development hot zones** — read these first to understand current direction
- **Bug magnets** — repeated fixes signal fragility
- **High-churn config** (lockfiles, generated) — usually noise, filter out

Cross-reference each hot file with:
- Last 3 commits touching it (one-liner each)
- Whether it has a colocated test
- Approximate LOC

**Writes:** `docs/onboarding/hot-spots.md` with the top 15 non-noise hot files, each with:
- Path
- Reason it's hot (recent feature work / bug fixes / refactor)
- Recommended read order (1-15)
- Test coverage status

This is the user's "first 2 weeks of reading" list.

### Phase 6 — "What Surprised Me" — append journal

Throughout Phases 1–5, every time the skill notices something non-obvious, append to `docs/onboarding/surprises.md`:

```markdown
## <date> | <category: arch | convention | naming | tooling | gotcha>
**Where:** <file:line or area>
**Surprise:** <1–3 sentences — what was unexpected and why>
**Why it matters:** <implication for future work>
```

Examples of what counts as surprising:
- A pattern that contradicts the framework's defaults (e.g. raw SQL alongside Prisma)
- An undocumented env var that's required at runtime
- A config flag with non-obvious side effects
- Code that looks dead but is actually called via reflection/dynamic import
- A test that's silently disabled
- Convention that diverges from the README

If nothing is surprising, write that explicitly: "Phase N completed without surprises." Don't fabricate surprise for the sake of filling the file.

### Phase 7 — Project CLAUDE.md Draft

Synthesize everything from Phases 1–6 into a candidate `CLAUDE.md` for the target repo. This is what Claude Code should know at session start.

Sections to include:
- **Stack** — language, framework, key deps, versions
- **Commands** — build/test/dev/lint, full executable strings
- **Code Style** — extracted conventions, with a real code snippet from the repo as exemplar
- **Boundaries** — Always do / Ask first / Never do (three-tier from spec-driven-development)
- **Patterns to follow** — pointers to 1–2 exemplar files for common tasks
- **Patterns to avoid** — anti-patterns observed in `surprises.md`
- **Hot-spot files** — top 5 from Phase 5 with one-line description each
- **Ticketing reference** — if Jira/Linear/GH detected

**Writes:** `docs/onboarding/claude-md-draft.md`. Do **not** copy this to the repo's root `CLAUDE.md` automatically. Tell the user: "Review this draft, edit it, then `cp docs/onboarding/claude-md-draft.md CLAUDE.md` when you're happy with it."

### Phase 8 — Trust Audit

Read-only advisory. Scan for patterns that look fragile:

- `try { ... } catch { /* empty */ }` — swallowed errors
- `// TODO` and `// FIXME` density (count + cluster by file)
- Test files that are skipped (`it.skip`, `xit`, `@pytest.mark.skip`)
- `any` types in TS, `# type: ignore` in Python — type escape hatches
- Hardcoded credentials/URLs (`http://localhost`, `password = "..."`) that look out of place
- Functions over 200 lines
- Files over 500 lines without clear modular structure

**Writes:** `docs/onboarding/trust-audit.md` with findings grouped by severity:
- **Watch** — likely fragile, plan to read before changing
- **Note** — quirks, not blockers
- **Pleasant** — areas that look well-tested and disciplined (give credit; this is a usable signal too)

Stamp `phase: done` and `done_at:` in `<slug>.md`. Onboarding pass complete.

---

## Multi-session resume contract

The skill is **stateful via the file system**. State lives in `docs/onboarding/<slug>.md` frontmatter, nowhere else.

On every invocation:
1. Compute slug
2. If `<slug>.md` exists, read frontmatter, jump to `phase:` value
3. If frontmatter says `phase: done`, ask the user whether to:
   - Just review existing artifacts
   - Re-run a specific phase (`/learn --phase 5`)
   - Reset and start fresh (requires explicit confirmation; renames old file to `<slug>.<date>.md`)

Bump `sessions:` and `last_session_at:` on every invocation.

---

## What this skill explicitly does NOT do

- ❌ No code edits anywhere in the target repo (only writes to `docs/onboarding/`)
- ❌ No commits, no pushes, no PRs
- ❌ No assumptions baked into the architecture map — everything cited file:line, verifiable
- ❌ No fabricated surprises — if nothing's weird, say so
- ❌ No copying `claude-md-draft.md` to root `CLAUDE.md` automatically (user must opt in)
- ❌ No running of the project's tests, build, or dev server (this is read-only)
- ❌ No installation of dependencies (the user's environment is theirs to manage)
- ❌ No external network calls beyond `gh` for PR/issue metadata

---

## Anti-rationalization table

| Rationalization | Reality |
|---|---|
| "I've used this stack before, I can skip Phase 1" | Repo conventions ≠ stack defaults. Run it. |
| "The README covers it, I don't need an architecture map" | READMEs lie / drift. The map cites file:line; trust that. |
| "Conventions are obvious from one file" | One file is one author's style on one day. PR review history shows what the team actually enforces. |
| "Surprises journal is fluff" | The bug you ship in week 3 will be the surprise you didn't write down in week 1. |
| "I'll skip the trust audit, I want to start coding" | Trust-audit is 10 minutes. The first PR you submit that breaks a known-fragile area is 10 hours. |
| "I can write the project CLAUDE.md without running Phase 7" | Phase 7 synthesizes Phases 1–6. Skipping it produces a CLAUDE.md based on guesses, which is the failure mode CLAUDE.md is supposed to prevent. |
| "The repo is small enough that this is overkill" | The full pass on a small repo takes 30 minutes. The cost of a wrong assumption is days. |

---

## Red flags during execution

- The architecture map cites zero file:lines — the explorer didn't actually look at the code, re-spawn with stricter prompt
- No surprises after Phase 5 in any non-trivial repo — you're not looking hard enough
- The CLAUDE.md draft is generic enough that it could be any repo — the synthesis didn't engage with the conventions
- Hot-spot list contains only `package-lock.json`, `yarn.lock`, generated files — filter is broken, fix and re-run Phase 5

---

## Verification

Onboarding pass is complete when:

- [ ] All 8 phases ran with their artifacts present
- [ ] `<slug>.md` frontmatter shows `phase: done`
- [ ] `architecture.md` has at least 5 modules with file:line citations
- [ ] `conventions.md` quotes 3+ real commit messages and 2+ real PR titles
- [ ] `hot-spots.md` has 10+ files ranked
- [ ] `surprises.md` has at least 1 entry (or an explicit "no surprises" note)
- [ ] `claude-md-draft.md` is concrete enough that it could not have been written without reading this specific repo
- [ ] `trust-audit.md` has findings or an explicit "clean" note
- [ ] Zero source files modified outside `docs/onboarding/`

---

## Examples

```
/learn
  → fresh start, runs Phase 1, asks to continue to Phase 2

/learn
  → resumes from frontmatter — if last session ended at Phase 4, runs Phase 5 next

/learn --phase 7
  → re-runs CLAUDE.md draft phase (e.g. after user added new info to surprises)

/learn --resume
  → explicit resume; equivalent to plain /learn but logs intent
```
