# Product Requirements Document: MyHive

## Version: 1.0 | Authors: pm_1, pm_2 | CPO: approved | Date: 2026-06-09

---

## 1. Product Vision

MyHive is a self-hosted, single-operator command center where you stand up a "hive" of AI agents and watch real engineering work flow across one opinionated 5-column delivery board — where a human-authored **Plan** is a first-class card that quietly decomposes into agent-executed tickets, and where every card is stoppable, reviewable, and traceable in one click.

---

## 2. Problem Statement

Paperclip already orchestrates AI agent companies extremely well — atomic ticket checkout, budget hard-stops, zombie-run recovery, a review loopback state machine, and ~12 wired agent runtimes. But it is framed as a *business goal manager for 20-agent companies* ("If you have one agent, you probably don't need Paperclip" — its own README). The solo technical operator gets a goal/company/governance surface they don't want, a board with 7 fixed status columns and zero card controls, no concept of a "Plan" as a board object, and — most painfully — **no discoverable way to stop or delete a running plan from the dashboard** even though the backend fully supports it. The capability exists; the product frame hides it.

---

## 3. Target Personas

### Persona 1: Solo Technical Founder ("the operator")
- **Description**: Runs an AI-assisted dev shop alone or near-alone. Already pays for a Claude subscription. Comfortable self-hosting a Node + Postgres app.
- **Goals**: Hand a feature/assignment to an agent team, see it planned and executed, intervene the moment something goes wrong, ship committed code.
- **Frustrations with existing solutions**: Paperclip's company/goal framing is overkill; couldn't find how to stop a runaway or delete a stale plan; board doesn't reflect a delivery pipeline; phases/waves clutter the view.
- **Success looks like**: Opens MyHive, sees a clean 5-column board, drops in an assignment, watches a Plan card appear → tickets flow Open → In Development → In Review → Done, kills anything misbehaving with one click.

### Persona 2: Engineering Lead Delegating to Agent Teams ("the delegator")
- **Description**: Has a small human team but wants agent teams (dev, QA, marketing) to take first-pass work.
- **Goals**: Define team structure (roles, who reviews whom), assign work to a team, monitor live agent activity and logs, enforce that nothing reaches Done without passing a review agent.
- **Frustrations with existing solutions**: No legible review loopback as a visible board motion; can't tell at a glance what each agent is doing right now.
- **Success looks like**: Configures a dev+QA team once, assigns features, trusts the In Review gate, audits any ticket's full agent log trail.

---

## 4. The EXTRA Edge

**MyHive is the single-operator delivery board that makes agent orchestration legible and stoppable.**

Paperclip can already stop, cancel, kill, and loop work — but it buries those powers behind a multi-company governance frame built for large agent businesses. MyHive inverts the frame:

1. **The 5-column board IS the product** (not a secondary view of a goal hierarchy).
2. **Plan is a first-class board entity** that hides its own phases/waves/subtasks — the operator sees intent, not machinery.
3. **The review loop is a visible board motion** — In Review → In Development is a thing you watch happen, driven by code-review agents.
4. **Stop / cancel / delete is one click on every card** — the flagship fix for the #1 documented user pain.

No competitor in the operator's reach owns "legible + stoppable orchestration on a delivery board." Paperclip owns "powerful but opaque." Plain Claude Code owns "single-agent, no board." Autonomous-agent products (Devin/Factory-style) own "high autonomy, low operator control." MyHive owns the **control + legibility** quadrant.

---

## 5. Feature List — MoSCoW Prioritized

### Must Have (MVP)
| # | Feature | Research Source | Persona(s) | Notes |
|---|---------|----------------|-----------|-------|
| M1 | Fork Paperclip engine packages (db, heartbeat, recovery, budgets, execution-policy, adapters, activity-log, run-log-store) | R1 reuse matrix; R2 build-vs-fork | both | REUSE-AS-IS; do not rebuild |
| M2 | 5-column board projection (Plans, Open, In Development, In Review, Done) over existing 7-status enum | R1 status mapping | both | Fixed columns, frontend projection, no column-config schema |
| M3 | Plan as first-class entity; phases/waves/child tickets hidden behind Plan detail drawer | R2 Plans gap | operator | New schema: plan entity + phase/wave tiers; board hides descendants |
| M4 | Plan activation: activating a Plan emits its first-tier tickets into the Open column | R2 Plans gap; R1 delegation | operator | Reuse `issue_plan_decompositions` fan-out |
| M5 | Review loopback as visible board motion (In Review → In Development on `changes_requested`) | R2 review loopback (issue-execution-policy.ts:751-770) | delegator | REUSE-WITH-CHANGES; surface the existing state machine |
| M6 | One-click Stop / Cancel / Delete on every card AND at Plan level (Plan stop = cancel subtree) | R2 #1 pain (DELETE /issues/:id:5621, cancelRunInternal, tree-holds) | both | Flagship. Wire existing backend to new card controls |
| M7 | Create agent + create team (role, reportsTo / reviewer wiring) | R1 agent creation (agents.ts:2248) | both | REUSE-WITH-CHANGES; simplified first-run |
| M8 | Assign an assignment to an agent/team → triggers plan + execution | R1 assign flow (issues.ts:4395) | both | Reuse wakeup queue + heartbeat |
| M9 | Real-time agent monitoring: live "what is each agent doing now" + per-run log view | R1 activity-log + run-log-store | both | Reuse RunLogStore + activityLog; new monitoring UI |
| M10 | Claude subscription auth (no API key) via `claude_local` adapter | prior research; constraints | operator | `claude login`, leave ANTHROPIC_API_KEY unset |
| M11 | Solo-mode: hide multi-company, org-chart, governance, board-approvals behind a config flag | R2 differentiation | operator | Hide, don't delete — preserve upstream merge path |
| M12 | Board drag routes through the stage machine (no raw status writes) | R2 severe edge (KanbanBoard.tsx:335 bug) | both | Fix inherited bug; disallow manual backward drag |

### Should Have (Post-MVP v1)
| # | Feature | Research Source | Persona(s) | Notes |
|---|---------|----------------|-----------|-------|
| S1 | `blocked` surfaced as a badge/overlay on In Development cards | R1 mismatch (7→5) | both | No native column; show as state on the card |
| S2 | Real git commit verification for Done (vs best-effort ref capture) | R2 open question | operator | MVP only captures ref |
| S3 | Budget meter widget on the board header (spend vs cap, live) | R2 catastrophic (budget hard-stop) | operator | Backend exists; surface it |
| S4 | Per-team templates (dev, QA, marketing, management presets) | brief | delegator | One-click team scaffolds |

### Could Have (Future Consideration)
| # | Feature | Research Source | Persona(s) | Notes |
|---|---------|----------------|-----------|-------|
| C1 | User-configurable columns per board | R1 top open question | delegator | Needs new schema; deliberately deferred |
| C2 | Plugin system (re-activate Paperclip's dormant plugins) | R1 reuse matrix | delegator | Off MVP critical path |
| C3 | Multi-operator / shared hive | — | delegator | Re-enable hidden multi-company |

### Won't Have (Explicitly Out of Scope)
| # | Feature | Reason |
|---|---------|--------|
| W1 | Rebuilding the heartbeat/execution engine | R1: 11k LOC + tests, biggest risk to rebuild — fork it |
| W2 | Rewriting agent runtime adapters | Constraint: must not rewrite adapters |
| W3 | Cloud/hosted multi-tenant MyHive | Self-hosted single-operator is the MVP frame |
| W4 | New LLM billing/proxy layer | Costs pass through to Claude subscription; no markup layer |

---

## 6. MVP Definition

The MVP is a **forked Paperclip backend** (engine packages reused as-is) with a **new board-first UI** and a **new Plan entity**, delivering this loop for a single self-hosted operator authenticated via their Claude subscription:

Create a team → give it an assignment → a **Plan** card appears in the Plans column → operator activates it → tickets flow into **Open** → agents pull them into **In Development** → code-review agents move them to **In Review** → on `changes_requested` they loop back to In Development, on approval they reach **Done** with a captured commit ref. At every moment the operator can open any agent's live log and stop/cancel/delete any card or whole Plan in one click.

**Explicitly excludes**: configurable columns, real git verification, plugins, multi-company, org-chart governance UI.

**MVP Success Metrics**:
1. Operator completes the full Plans→Done loop on a real assignment without touching the CLI or DB.
2. Stopping a running Plan from the board halts all its agent runs within 10 seconds (verifiable in activity log).
3. A `changes_requested` review visibly returns the ticket to In Development and reassigns to the original developer agent.
4. Zero board actions write status directly — 100% route through the stage machine.

---

## 7. User Stories with Acceptance Criteria

### Epic: The Board

#### US-001: View the 5-column board
**As an** operator, **I want to** see all work across exactly five columns, **so that** the board reads as a delivery pipeline.
**Acceptance Criteria:**
- Given a hive with issues in any of the 7 backend statuses, when I open the board, then I see exactly 5 columns labeled Plans, Open, In Development, In Review, Done.
- Given a `backlog` or `todo` issue, when the board renders, then that issue appears in the Open column.
- Given a `done` or `cancelled` issue, when the board renders, then it appears in the Done column (cancelled visually distinct).
- Given an issue with `workMode="planning"`, when the board renders, then it appears as a Plan card in the Plans column and NOT as individual tickets elsewhere.
- Edge: Given a `blocked` issue, when the board renders, then it appears in In Development with a visible "blocked" badge (MVP) — it does not vanish.

#### US-002: Plan hides its machinery
**As an** operator, **I want** a Plan card to show only its overview, **so that** I see intent, not phases/waves/subtasks.
**Acceptance Criteria:**
- Given a Plan with phases, waves, and child tickets, when I view the Plans column, then I see a single Plan card with title + overview and no child tickets.
- Given I click a Plan card, when its detail drawer opens, then I can see its phases/waves/child tickets there.
- Given a Plan has not been activated, when the board renders, then none of its child tickets appear in Open.

#### US-003: Activate a Plan
**As an** operator, **I want to** activate a Plan, **so that** its tickets become workable.
**Acceptance Criteria:**
- Given a Plan in the Plans column, when I activate it, then its first-tier child tickets appear in the Open column.
- Given activation fails (e.g., decomposition empty), when I activate, then I see an error and the Plan stays in Plans (no partial emit).

### Epic: Execution & Review

#### US-004: Agents pull tickets into development
**As an** operator, **I want** agents to pick up Open tickets, **so that** work progresses without manual assignment.
**Acceptance Criteria:**
- Given an Open ticket assigned to an agent, when its heartbeat fires, then the ticket moves to In Development and the card shows the working agent.
- Edge: Given two agents target the same ticket, when both attempt checkout, then exactly one succeeds (atomic CAS/`FOR UPDATE`) and the other no-ops.

#### US-005: Review loopback
**As a** delegator, **I want** code-review agents to gate Done, **so that** nothing ships unreviewed.
**Acceptance Criteria:**
- Given an In Development ticket the developer agent finishes, when it submits, then the ticket moves to In Review and is assigned to a review participant.
- Given a review agent requests changes, when it records `changes_requested`, then the ticket returns to In Development AND is reassigned to the original developer agent (`returnAssignee`).
- Given a review agent approves, when it records approval, then the ticket moves to Done with a captured commit ref (best-effort).
- Edge: Given a non-reviewer agent attempts to advance an In Review ticket, when it tries, then the advance is rejected.

### Epic: Control & Monitoring (the EXTRA Edge)

#### US-006: One-click stop/cancel/delete
**As an** operator, **I want** stop/cancel/delete on every card and Plan, **so that** I am never stuck watching a runaway.
**Acceptance Criteria:**
- Given any card with a running agent, when I click Stop, then the agent's heartbeat run process group is terminated within 10 seconds and the activity log records the cancel.
- Given a Plan card, when I click Stop, then all descendant tickets' runs are cancelled (subtree tree-hold) and the Plan is marked stopped.
- Given any card, when I click Delete and confirm, then the issue is deleted (`DELETE /issues/:id`) and removed from the board.
- Edge: Given I Stop a card with no active run, when I click Stop, then the action is a safe no-op with a clear "nothing running" message (no error).

#### US-007: Live agent monitoring
**As an** operator, **I want to** see what each agent is doing now and read its logs, **so that** I can diagnose issues.
**Acceptance Criteria:**
- Given agents are running, when I open the monitor view, then I see each active agent, its current ticket, and its liveness state, updating live.
- Given I select a run, when I open its log, then I see streamed stdout/stderr/system output from the RunLogStore.
- Edge: Given a run produced no output, when I open its log, then I see an explicit "no output captured" state, not a blank panel.

### Epic: Hive Setup

#### US-008: Create agent / team via Claude subscription
**As an** operator, **I want to** create agents/teams that run on my Claude subscription, **so that** I don't need an API key.
**Acceptance Criteria:**
- Given `claude login` is complete and `ANTHROPIC_API_KEY` is unset, when an agent runs, then it uses subscription credentials (no API key error).
- Given I create a team, when I define roles and reviewer wiring (`reportsTo`/reviewer), then assignments to the team route work and reviews per that wiring.
- Edge: Given `ANTHROPIC_API_KEY` is set in the environment, when the agent starts, then MyHive warns that API-key auth will override subscription auth.

---

## 8. Edge Case Requirements

| # | Edge Case | Severity | Requirement | Acceptance Criteria |
|---|-----------|----------|-------------|---------------------|
| E1 | Can't stop/delete plan from dashboard | Catastrophic | Every card + Plan exposes Stop/Cancel/Delete wired to existing backend | US-006 ACs |
| E2 | Runaway token spend | Catastrophic | Reuse budget hard-stop auto-cancel; surface spend on board (S3) | Given spend hits cap, agent auto-pauses and board shows paused state |
| E3 | Board drag bypasses stage machine | Severe | All drag routes through transition logic; no raw status writes | US-001 + metric 4 |
| E4 | Two agents, same ticket | Severe | Reuse atomic checkout (CAS/`FOR UPDATE`) | US-004 edge AC |
| E5 | Heartbeat never terminates | Severe | Reuse watchdog + process-group kill | Given a run exceeds its watchdog window, it is force-killed and marked failed |
| E6 | Zombie/stale tickets | Severe | Reuse recovery service | Given an orphaned in_progress run, recovery resets it to a workable state |
| E7 | Child tickets leak onto board | Severe | Board grouping hides Plan descendants until activation | US-002 + US-003 ACs |
| E8 | Lost review feedback | Simple | Reuse comment-required-on-changes | Given `changes_requested`, a feedback comment is mandatory and shown on the returned card |
| E9 | Orphaned plans (no children) | Simple | Activation guard rejects empty decomposition | US-003 edge AC |

---

## 9. Differentiation Requirements

| # | Differentiator | Requirement | How It Beats Competitors |
|---|---------------|-------------|--------------------------|
| D1 | Board-first IA | The 5-column board is the landing surface and primary nav | Paperclip lands on goals/company; MyHive lands on the pipeline |
| D2 | Plan as first-class, machinery hidden | Plan entity + phase/wave tiers, board shows overview only | Paperclip has no plan-as-entity; children leak onto the board |
| D3 | Visible review loop | In Review→In Development is an animated, observable board motion with reviewer attribution | Paperclip has the state machine but no legible board surface for it |
| D4 | One-click control everywhere | Stop/Cancel/Delete on every card + Plan | Paperclip hides these behind subtree/governance flows nobody discovers |
| D5 | Solo simplicity | Multi-company/org/governance hidden by default | Paperclip forces the 20-agent-business frame on a solo operator |

---

## 10. Non-Functional Requirements

### Performance
- Board initial render < 1.5s for a hive of ≤ 500 issues.
- Stop action terminates the target run process group within 10s.
- Live monitor + log stream latency < 2s from event to UI.

### Accessibility
- WCAG 2.1 AA for board, card controls, and forms. Card actions keyboard-reachable; column regions ARIA-labeled.

### Security & Privacy
- Reuse Paperclip auth (better-auth + agent JWT + RBAC). Claude subscription credentials never logged. `ANTHROPIC_API_KEY` presence detected and surfaced, never persisted by MyHive.

### Reliability & Error Handling
- No silent error swallow on stop/cancel/delete — every control reports success/failure to the operator.
- Solo-mode flag must not break engine paths it hides (hidden ≠ removed).
- Fork must remain mergeable with upstream Paperclip engine packages (hidden, not deleted).

---

## 11. Post-MVP Roadmap

| Phase | Feature(s) | Value Delivered | Dependency |
|-------|-----------|-----------------|------------|
| v1.1 | S1 blocked badge, S3 budget meter | Operator situational awareness | MVP board |
| v1.2 | S2 real git verification for Done | Trustworthy "committed" semantics | Done column |
| v1.3 | S4 team templates (dev/QA/marketing/mgmt) | Faster hive setup | Team creation |
| v2.0 | C1 configurable columns, C3 multi-operator | Team/scale use | Re-enable hidden subsystems |

---

## 12. Explicit Out-of-Scope

- Configurable/renamable board columns (MVP is fixed 5).
- Real git commit verification (MVP captures a best-effort ref).
- Plugin system activation.
- Multi-company, org-chart governance UI, board-approval governance.
- Any LLM proxy/billing/markup layer.
- Rebuilding heartbeat engine or agent adapters.
- Cloud/hosted MyHive.

---

## Appendix A: PM Cross-Consultation Log

| # | Topic | pm_1 position | pm_2 challenge | Resolution | Evidence |
|---|-------|---------------|----------------|------------|----------|
| 1 | Columns fixed vs configurable (R1's #1 open question) | Fixed 5, frontend projection, no schema | Configurability dilutes the opinionated board and inflates MVP | **Fixed 5 (M2); configurable deferred to C1** | R1 reuse matrix; KanbanBoard.tsx fixed columns |
| 2 | Plan phase/wave depth | Plan→phases/waves→tickets; board shows only Plan card | Phases/waves MUST stay hidden or the EXTRA edge (legibility) dies | **Plan first-class, machinery hidden behind drawer (M3, US-002)** | R2 Plans gap |
| 3 | Manual backward drag In Review→In Dev | Disallow manual backward drag | Board drag must route through stage machine — fixes inherited bug | **No manual backward drag; loopback only via `changes_requested` (M5, M12, E3)** | R2 KanbanBoard.tsx:335 |
| 4 | "Committed" semantics in Done | Status flip + commit ref capture | Real git verification too heavy for MVP | **MVP = ref capture (M-Done); real verification = S2** | R2 open question |
| 5 | Solo-mode: delete vs hide | Hard-remove multi-company code | Hard-remove = merge-hell on upstream updates | **Hide behind flag, don't delete (M11, NFR reliability)** | R2 build-vs-fork |
| 6 | Build-new vs fork | Fork engine, build new UI | Agreed — keep hard parts, replace frame | **FORK engine packages, BUILD board-first UI + Plan entity** | R1 + R2 both converge |
| 7 | Stop/delete priority | One of several Must-haves | This IS the flagship — it's the documented #1 pain | **M6 elevated to flagship MVP differentiator (D4)** | R2 #1 pain |

## Appendix B: Research Traceability Matrix

| Requirement ID | Source | Researcher | Finding Summary |
|----------------|--------|-----------|-----------------|
| M1, W1, W2 | Reuse matrix | R1 | Engine packages REUSE-AS-IS; rebuilding is top risk |
| M2, US-001 | Status mapping | R1 | 7-status enum projects to 5 columns; blocked/cancelled need handling |
| M3, M4, US-002, US-003, E7 | Plans gap | R2 | No plan-as-entity; children leak; needs new schema + hide-descendants grouping |
| M5, US-005, E8 | Review loopback | R2 | issue-execution-policy.ts:751-770 already loops in_review→in_progress w/ returnAssignee |
| M6, US-006, E1 | #1 pain | R2 | DELETE /issues/:id:5621, cancelRunInternal, tree-holds exist; card has zero controls |
| M7, US-008 | Agent/team creation | R1 | agents.ts:2248, reportsTo org hierarchy |
| M8 | Assign flow | R1 | issues.ts:4395 queues wakeup |
| M9, US-007 | Monitoring | R1 | activityLog + RunLogStore reusable; new UI needed |
| M10, US-008 | Subscription auth | prior research | claude_local adapter, ANTHROPIC_API_KEY unset |
| M11, D5 | Differentiation | R2 | Paperclip forces 20-agent-business frame; strip for solo |
| M12, E3 | Stage machine bug | R2 | KanbanBoard.tsx:335 drag bypasses transitions |
| E2, S3 | Budget | R2 | Hard-stop auto-cancel exists; surface it |
| E4 | Concurrency | R2 | issues.ts:3636-3747 atomic checkout |
| E5, E6 | Resilience | R2 | watchdog + process-group kill + recovery service |
