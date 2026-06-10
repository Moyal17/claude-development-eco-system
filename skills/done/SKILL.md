---
name: done
description: Mark an approved plan as done, record the actual elapsed hours vs the estimate, and append a row to the per-repo calibration log so the team learns its own velocity over time. Use when running /done <slug?> after the build finishes and you've signed off on the work, when "mark this done", "record actuals", "close out the plan" type asks come in. Stamps done_at + actual_hours into the plan frontmatter, computes accuracy vs the ## Estimate section, and writes one row to docs/metrics/calibration.tsv. Refuses if the plan isn't status approved or if it's already done.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
metadata:
  ecosystem-version: 0.1.0
  related-protocol: methodology/04-alignment-protocol.md
---

# /done — Close out an approved plan and record actuals

Manually invoked after the build is finished and you're satisfied with the work. Records the actual elapsed time, compares it to the estimate, and writes a row to the per-repo calibration log so estimation accuracy improves over time.

## Read first

- `references/calibration.md` (this folder) — what the calibration log records, how to read it, and how to use it for future plans
- The target plan file in `docs/plans/<slug>.md` (must be `status: approved` and not already have `done_at`)

## Workflow

### Step 1 — Locate the plan

User invokes: `/done [<slug>] [--actual-hours <N>] [--no-archive]`

- `<slug>` (optional): if omitted, find the most recently modified plan under `docs/plans/` with `status: approved` AND no `done_at` field. If multiple qualify or none, surface and ask.
- `--actual-hours <N>` (optional): override the auto-computed wall-clock from `started_at` to now. Use when the wall-clock would mislead (e.g., you started the work, took a 3-day break, came back).
- `--no-archive` (optional): skip moving the plan file to `docs/plans/archive/<slug>.md`. Default is to archive — keeps the active `docs/plans/` folder small so future `/intake` / `/research` runs aren't confused by stale "most recent approved" matches.

### Step 2 — Verify the plan is eligible

The plan must satisfy ALL of:
- `status: approved` (or `shipped`, but not `draft`)
- A `started_at` field present (stamped by `/plan` at approval)
- No existing `done_at` field (refuse with clear message if already done)

If `started_at` is missing — usually because the plan predates the timestamp feature — ask the user for the start time.

### Step 3 — Compute actual hours

Run the script in dry-run first to show the user what will be recorded:

```bash
python3 ~/sourceControl/claude-development-eco-system/skills/done/scripts/mark_done.py \
  --plan docs/plans/<slug>.md \
  --dry-run \
  [--actual-hours <N>]
```

The script prints:
- The plan's estimate (sum from per-task hours and from the `## Estimate` Total line; warns on mismatch)
- The plan's `started_at`
- The current time (or `--actual-hours` override)
- Computed `actual_hours` (default: wall-clock from `started_at` to now)
- Computed `accuracy_ratio` = `actual / estimate` (1.0 = on target; <1 = faster than estimate; >1 = slower)

### Step 4 — Confirm with the user

Use `AskUserQuestion`:

- **Mark done with computed actual** — record `actual_hours` from wall-clock
- **Mark done with manual override** — let the user enter a different number (use `--actual-hours`)
- **Cancel** — abort, plan stays open

### Step 5 — Record

Run the script live (no `--dry-run`):

```bash
python3 ~/sourceControl/claude-development-eco-system/skills/done/scripts/mark_done.py \
  --plan docs/plans/<slug>.md \
  [--actual-hours <N>]
```

The script:
1. Stamps `done_at: <now>` and `actual_hours: <N>` into the plan's frontmatter (and updates `last-updated`).
2. Bumps `status: shipped` (terminal status).
3. Appends a row to `<repo-root>/docs/metrics/calibration.tsv` (creates the file with a header if missing).
4. Archives the plan (unless `--no-archive`): `git mv docs/plans/<slug>.md docs/plans/archive/<slug>.md` (falls back to a plain filesystem move if the file isn't tracked or the repo isn't a git repo). The archive target's parent dir is created if missing.
5. Prints a summary.

### Step 6 — Print the close-out summary

Tell the user:

> Plan `<slug>` closed out.
> - Estimate: `<estimate_h>h` (`<estimate_sp>` SP)
> - Actual:   `<actual_h>h`
> - Accuracy: `<ratio>` (faster / on target / slower)
> Logged to `docs/metrics/calibration.tsv`. Run `tail -n 10 docs/metrics/calibration.tsv | column -t -s$'\t'` to see your last 10 closures.

If the plan has a `jira-ticket` field, suggest pushing the closure to Jira (set `Time Spent` and transition to Done) — but don't auto-do it; ask first.

## Hard rules

- **Refuse non-approved plans.** No closing drafts.
- **Refuse already-closed plans.** A plan can only be marked done once. Override only via direct `git revert` of the closure commit.
- **Never delete the calibration log row.** Even on retroactive corrections, the log is append-only. Edit subsequent rows or add notes; never remove.
- **One row per plan.** Re-running `/done` on a closed plan refuses; doesn't append a duplicate.
- **Wall-clock is the default.** It's the honest signal for sprint planning even when individual sessions were short — it accounts for context-switching and waiting.

## When to skip /done

- The plan was abandoned (didn't ship). Either `git revert` it or set `status: abandoned` manually; don't pollute calibration data.
- The plan is part of a larger umbrella where actuals are better tracked at the umbrella level.

## Examples

```
/done                                              # most recent approved plan
/done improve-order-drawer-fast-path               # explicit slug
/done improve-order-drawer-fast-path --actual-hours 18   # manual override
```

## Troubleshooting

**`Plan has no started_at field`**
The plan predates the timestamp feature OR the plan was created without `/plan` stamping it. Add `started_at: <ISO timestamp>` to the frontmatter manually, then re-run `/done`.

**`Plan is already done (done_at present)`**
The plan was previously closed. Open `docs/metrics/calibration.tsv` and find the matching row; or `git log` the plan file to see the closure commit.

**`Computed actual is negative`**
`started_at` is in the future relative to your system clock. Check both — usually a misformatted timestamp.

**Want to back out a closure?**
`git revert <closure-commit>` reverses both the frontmatter stamps and the calibration row. The audit trail stays clean.
