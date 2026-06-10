# claude-development-eco-system — TODO

Backlog of nice-to-haves, ranked by pain-removed-per-hour-spent. Current version: 0.2.0.

## 🔴 Most-pain-removed-per-hour

- [ ] **1. Branch protection on `main`** (GitHub UI, 30 seconds, $0)
  Without it, the whole loop is opt-in convention. Anyone can `git push origin main` and bypass everything.
  **Action:** Settings → Branches → Add rule for `main`: require PR before merge, block direct pushes, optionally require `Claude PR review` status check.
  **Highest ROI item on the list.**

- [ ] **2. `/doctor` skill** (~30 min)
  New devs run `./install.sh` and nothing tells them whether it actually works.
  **Checks:**
  - Symlinks present in `~/.claude/skills/` and `~/.claude/agents/`
  - `gh auth status` OK
  - `jira.json` exists + token valid (`GET /rest/api/3/myself` returns 200)
  - GHA secrets set in current repo (`gh secret list`)
  - Branch protection enabled on `main`
  **Output:** one-shot pass/fail report. Catches silent misconfigurations before they surface mid-loop.

- [ ] **3. `/amend-plan` skill** (~20 min)
  Mid-build scope changes today have two bad options: silently expand (forbidden) or tear up the plan and restart.
  **Behavior:**
  - Bumps `plan_version` in frontmatter
  - Captures the delta in an `## Amendments` section
  - Routes architect re-approval on just the delta (not the whole plan)
  - Preserves `started_at`
  **Why it matters:** the only one of these that closes a *correctness* gap, not a polish gap. Current loop assumes scope is locked at plan approval; reality says it isn't.

## 🟡 Real gaps but smaller

- [ ] **4. Local pre-push git hook**
  Mirrors `/ready-for-review`'s local quality gate. If you `git push` directly (skipping the skill), hook runs `npm test`/`pytest` and refuses on red.
  Belt-and-suspenders for moments you forget the skill.

- [ ] **5. Success-signal validation in `/done`**
  The brief insists on an *observable* success signal. After merge nobody checks it.
  **Action:** Have `/done` prompt: "Brief said `<signal>`. Verified? [yes / no / not measurable yet]" and log next to the calibration row.
  **Payoff:** Three months in you can answer "of the last 50 plans, how many actually achieved their stated success signal?"

- [ ] **6. ADR auto-detection in `/plan`**
  Methodology says ADRs exist; nothing creates them.
  **Action:** Have `/plan` detect "introduces a new dependency, touches >2 domains, or changes a public API" and prompt to write `docs/adr/NNN-title.md` from a template.
  Without this, ADRs stay aspirational.

- [ ] **7. Stale-plan sweeper (`/plans:cleanup`)**
  Abandoned plans (`status: approved` but no `started_at` after N days) accumulate.
  **Action:** List candidates, offer to set `status: abandoned` or archive.
  Today's `/done --no-archive` doesn't help — abandoned plans never reach `/done`.

## 🟢 Lower priority

- [ ] **8. Multi-ticket / Epic support in `/jira-sync`**
  Currently 1 plan = 1 Jira ticket. Real work often is 1 plan = 1 Epic + N Stories.
  May belong in the PM-side `/pm-eco-system` instead. Already tagged v2.

- [ ] **9. Cost telemetry for `claude-pr-review.yml`**
  Log input/output tokens per review to a TSV in the repo. After 50 PRs you know your real per-PR cost vs. the rough estimate.

- [ ] **10. Dependency hygiene templates**
  Renovate / Dependabot config templates in `templates/.github/`.
  Not really eco-system's job, but easy to bundle.

- [ ] **11. `/plan --retry` flag**
  When architect rejects 3 times and surfaces, today the user has no resume command.
  **Action:** Pick up from cycle 3 with a re-architecture pass.

## Recommended sequencing

**This week:** #1 + #2. Converts the system from "works if everyone follows the convention" to "self-verifying."

**Next session:** #3. Only correctness-gap fix; everything else is polish.

**After that:** diminishing returns kick in fast. The system is functionally complete without #4–#11.

## Done in v0.2.0

- [x] `/start-dev <slug?>` — branch creation + `started_at` stamping
- [x] Local quality gate in `/ready-for-review` (`npm test` / `pytest -q` / `cargo test` / `go test`)
- [x] `/address-review <PR#?>` — fetch + parse + fix PR review findings
- [x] Plan archival in `/done` — `git mv docs/plans/<slug>.md docs/plans/archive/`
