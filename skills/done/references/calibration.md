# Calibration log — `docs/metrics/calibration.tsv`

A per-repo, append-only TSV of estimate-vs-actual data. The team's own velocity, recorded over time. The file lives in the target repo (not the eco-system) because each project has its own pace.

## Format

Tab-separated. Header row + one row per closed plan:

```
slug	scoped_via	estimate_hours	story_points	started_at	done_at	actual_hours	accuracy_ratio	notes
improve-order-drawer-fast-path	scope	21	3	2026-05-08T16:08:00Z	2026-05-08T17:35:12Z	1.45	0.07
add-idempotency-to-webhook-handler	intake-research	7.5	1	2026-05-09T09:00:00Z	2026-05-09T15:30:00Z	6.5	0.87
```

| Column | Meaning |
|--------|---------|
| `slug` | Plan slug (matches `docs/plans/<slug>.md`) |
| `scoped_via` | `intake-research` (slow path) or `scope` (fast path) — captured from the plan frontmatter's `scoped-via` field |
| `estimate_hours` | Sum of per-task hours from the plan's `## Tasks` section (the canonical source) |
| `story_points` | The plan's `**Story points:** N` line, if present (else empty) |
| `started_at` | When `/plan` stamped approval (ISO 8601, UTC) |
| `done_at` | When `/done` ran (ISO 8601, UTC) |
| `actual_hours` | Wall-clock from `started_at` to `done_at`, OR a `--actual-hours` override the user provided |
| `accuracy_ratio` | `actual_hours / estimate_hours`. 1.0 = on target. <1 = faster. >1 = slower. |
| `notes` | Free-text. Empty by default. The user can add a one-line note via `--note "..."`. |

## How to read accuracy

- **0.5–1.5** is normal scatter. Expected variance — don't read too much into a single row.
- **Clusters around 0.5** mean the team systematically over-estimates. Bring the per-task hours down on the next 3 plans and watch.
- **Clusters around 2.0+** mean the team systematically under-estimates. Push back on planned scope, decompose more aggressively at intake, OR raise the SP-per-task ceiling.
- **Bimodal** (some 0.3, some 2.5) often means scope creep mid-build OR insufficient research → look at `scoped_via`. If the slow scopes are mostly `scope` (fast-path) closures, the fast path is over-eager.

## How to use it for the next plan

When `/plan` drafts task estimates, it should:

1. Read recent rows from `calibration.tsv` (last 5–10).
2. Compute the team's median accuracy ratio.
3. If ratio > 1.3, multiply the planner's per-task hour suggestions by `min(ratio, 1.5)` and warn the user.
4. If ratio < 0.7, multiply by `max(ratio, 0.7)`.

This is a *future enhancement* — v0.1 of `/plan` doesn't auto-adjust. For now, the user reads the log periodically and adjusts their own estimation feel.

## Append-only discipline

The log is append-only — never edit or delete a row. To correct an error:

- **Wrong actual_hours:** add a row at the bottom with `slug` set to the same slug + `notes` explaining the correction. Aggregations should use the latest row per slug.
- **Plan abandoned mid-build:** don't write the row at all. Set the plan's `status: abandoned` manually instead.
- **Want to back out a /done call:** `git revert` the closure commit. Reverses both the frontmatter stamps AND the calibration row.

## Privacy

The log contains slugs, timestamps, and aggregate numbers. No PII, no customer data, no commit hashes. Safe to share within the team and to commit publicly if the repo is public.

## Aggregation cookbook

Median accuracy across all closures:

```bash
awk -F'\t' 'NR>1 {print $8}' docs/metrics/calibration.tsv | sort -n | \
  awk '{a[NR]=$1} END {n=NR; print (n%2==1 ? a[(n+1)/2] : (a[n/2]+a[n/2+1])/2)}'
```

Last 10 closures, formatted:

```bash
tail -n 10 docs/metrics/calibration.tsv | column -t -s$'\t'
```

Group by `scoped_via`:

```bash
awk -F'\t' 'NR>1 {sum[$2]+=$8; n[$2]++} END {for (k in sum) print k, sum[k]/n[k], n[k]}' \
  docs/metrics/calibration.tsv
```
