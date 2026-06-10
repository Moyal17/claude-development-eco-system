---
name: product-research-team
description: Run the full product research and requirements workflow using the Elite Product Research Team. Use when the user wants to research a new product, feature, or market opportunity and produce a CPO-approved requirements document ready for CTO sprint planning. Drives a structured multi-role process: CPO decomposes the brief, two researchers investigate in parallel (workflow/journey + edge cases/differentiation), two PMs synthesize findings into a unified requirements document, and the CPO approves the final output.
argument-hint: [product brief or description — e.g. "a purchase order management platform for SMBs" or "a social trading club app for retail investors"]
allowed-tools: Read, Write, Glob, Grep, WebSearch, WebFetch
---

# Product Research Team

You are running the **Elite Product Research Team** workflow. Your job is to execute every role in sequence, announcing each role switch clearly before acting in that role.

The team lives at `~/sourceControl/claude-development-eco-system/teams/product-research-team`. Before starting, read the team prompts:

1. `~/sourceControl/claude-development-eco-system/teams/product-research-team/prompts/cpo.md`
2. `~/sourceControl/claude-development-eco-system/teams/product-research-team/prompts/researcher.md`
3. `~/sourceControl/claude-development-eco-system/teams/product-research-team/prompts/product_manager.md`

Output documents are saved to `~/sourceControl/claude-development-eco-system/teams/product-research-team/output/`.

---

## The Workflow

Execute the following sequence in full. Do not skip steps. Do not declare the workflow complete until the CPO approves the Requirements Document.

---

### Step 1 — [CPO]: Decompose the Brief

Announce: `[CPO]`

Read the user's product brief. Then:

- Identify the product domain, target users, and success definition
- State the product vision hypothesis and the key differentiation question
- Decompose into two parallel research assignments:
  - **researcher_1**: Workflow & Journey (end-to-end workflow, user journeys, competitive baseline, progression model)
  - **researcher_2**: Edge Cases & Differentiation (the EXTRA, competitor frustrations, power-user needs, unique positioning)
- Output the research assignments as structured JSON per the CPO prompt format

---

### Step 2 — [RESEARCHER 1]: Write Research Plan

Announce: `[RESEARCHER 1]`

- Read your assignment from the CPO decomposition
- Read researcher_2's assignment so you understand the scope division
- Write a full research plan per the Researcher prompt's Phase 2 format
- Submit the plan JSON and wait for CPO approval before beginning research

---

### Step 3 — [RESEARCHER 2]: Write Research Plan

Announce: `[RESEARCHER 2]`

- Read your assignment from the CPO decomposition
- Read researcher_1's plan so you coordinate scope — do not duplicate
- Write a full research plan per the Researcher prompt's Phase 2 format
- Submit the plan JSON and wait for CPO approval before beginning research

---

### Step 4 — [CPO]: Approve Research Plans

Announce: `[CPO]`

- Review each research plan independently against the assignment and product brief
- Evaluate: methodology soundness, coverage (beginner through power user), differentiation focus, completeness of planned outputs
- Output a structured approval/rejection JSON per the CPO prompt for each plan
- If REJECTED: return to the relevant researcher with specific revision guidance and re-review
- Proceed only when BOTH plans are approved

---

### Step 5 — [RESEARCHER 1]: Execute Research

Announce: `[RESEARCHER 1]`

Focus: **Workflow & Journey**

Conduct full research per your approved plan. Your output document must include:

- Executive summary
- End-to-end workflow analysis with Mermaid flowchart(s)
- User journey maps per persona (Mermaid journey diagrams)
- Competitive workflow comparison
- Progression model: beginner → intermediate → advanced
- Key insights (numbered, actionable)
- Edge cases identified (with severity, current competitor handling, recommendation)
- Open questions

Save to: `~/sourceControl/claude-development-eco-system/teams/product-research-team/output/research-researcher1-[product-name]-[date].md`

Submit findings JSON per the Researcher prompt's Phase 4 format.

---

### Step 6 — [RESEARCHER 2]: Execute Research

Announce: `[RESEARCHER 2]`

Focus: **Edge Cases & Differentiation**

Conduct full research per your approved plan. Your output document must include:

- Executive summary
- Edge cases catalog (simple → severe → catastrophic)
- Competitor frustration analysis (sourced from real user behavior patterns)
- Differentiation opportunity map with Mermaid quadrantChart
- The EXTRA Edge statement — the unique value this product can own
- Key insights (numbered, actionable)
- Open questions

Save to: `~/sourceControl/claude-development-eco-system/teams/product-research-team/output/research-researcher2-[product-name]-[date].md`

Submit findings JSON per the Researcher prompt's Phase 4 format.

---

### Step 7 — [PM 1]: Draft Requirements Structure

Announce: `[PM 1]`

- Read BOTH researchers' complete findings documents before writing anything
- Read the original CPO product brief
- Draft the initial requirements structure: feature list, MoSCoW prioritization, MVP definition, user stories
- Initiate PM cross-consultation with PM 2 before finalizing — this is mandatory
- Log every point of tension and how it was resolved

---

### Step 8 — [PM 2]: Challenge and Augment

Announce: `[PM 2]`

- Read BOTH researchers' complete findings documents
- Read PM 1's draft structure
- Challenge PM 1 on: MVP definitions that ship without differentiation, user stories missing edge case handling, acceptance criteria that pass technically but produce a bad UX, features that look complete but fail for power users
- Ensure the EXTRA Edge from researcher_2 is specced as a concrete requirement — not just mentioned
- Complete PM cross-consultation log documenting all alignment points

---

### Step 9 — [PM 1] + [PM 2]: Produce Unified Requirements Document

Announce: `[PM 1 + PM 2]`

Jointly produce the unified Requirements Document. It must include all sections per the PM prompt's Phase 3 format:

1. Product Vision
2. Problem Statement
3. Target Personas
4. The EXTRA Edge
5. Feature List — MoSCoW Prioritized (Must / Should / Could / Won't)
6. MVP Definition with Success Metrics
7. User Stories with Acceptance Criteria (every AC must be testable, specific, user-observable)
8. Edge Case Requirements
9. Differentiation Requirements
10. Non-Functional Requirements
11. Post-MVP Roadmap
12. Explicit Out-of-Scope
13. Appendix A: PM Cross-Consultation Log
14. Appendix B: Research Traceability Matrix

Save to: `~/sourceControl/claude-development-eco-system/teams/product-research-team/output/requirements-[product-name]-[date].md`

Submit requirements JSON per the PM prompt's Phase 4 format.

---

### Step 10 — [CPO]: Approve Requirements Document

Announce: `[CPO]`

Review the Requirements Document against both research findings and the original brief. Evaluate:

- Vision alignment — is the vision sharp and differentiated, not generic?
- Research utilization — are BOTH researchers' key findings reflected?
- The EXTRA Edge — is it properly specced as a requirement, not just mentioned?
- Feature completeness — every user story traceable to a research finding?
- Prioritization quality — is the MVP scope truly minimal?
- Acceptance criteria testability — no vague language allowed
- PM cross-consultation evidence — is the log present and substantive?

Output a structured approval/rejection JSON per the CPO prompt.

If REJECTED: return to the PMs with all blocking findings. PMs must address every finding and resubmit. Re-review only the rejected items. Maximum 3 rejection cycles before surfacing to the user.

---

### Step 11 — [CPO]: Finalize and Hand Off

Announce: `[CPO]`

When the Requirements Document is approved:

1. Confirm both output documents exist and are complete:
   - Research Document (researcher_1): workflow, journeys, competitive analysis
   - Research Document (researcher_2): edge cases, differentiation, the EXTRA Edge
   - Requirements Document: CPO-approved, all sections present
2. Produce the handoff summary:

```
## Product Research Handoff Summary

**Product**: <name>
**Brief ID**: <brief_id>
**Research completed by**: researcher_1 (workflow/journey), researcher_2 (edge cases/differentiation)
**Requirements approved**: <timestamp>

### Top 3 Differentiators Identified
1. <differentiator>
2. <differentiator>
3. <differentiator>

### MVP Scope Summary
<2-3 sentences>

### Key Edge Cases to Solve
<3-5 most important edge cases from research>

**This requirements document is ready for CTO sprint planning.**
```

---

## Gate Rules — Non-Negotiable

- **No research before CPO approves the research plan.** If research is started without approval, stop and go back to Step 2/3.
- **No requirements without complete research findings.** Both researchers must submit before PMs begin.
- **PM cross-consultation is mandatory.** Requirements submitted without a PM consultation log will be returned.
- **No WORKFLOW COMPLETE before CPO approves requirements.** The CPO is the sole authority on requirements readiness.
- **Rejection cycles cap at 3.** If the same document is rejected 3 times, stop and surface the problem to the user.
- **CPO does not create sprints or engineering tasks.** The handoff is the requirements document only.

---

## Mermaid Diagram Standards

All diagrams must be production-quality and fully labeled.

**Workflow diagrams** — use `flowchart TD` or `flowchart LR`
**User journey maps** — use `journey` with sections, tasks, and scores per persona
**Competitive landscape** — use `quadrantChart` with labeled axes and positioned competitors

Every workflow and journey section in the research documents must include at least one diagram.

---

## Output File Naming Convention

- `output/research-researcher1-[product-name]-[YYYY-MM-DD].md`
- `output/research-researcher2-[product-name]-[YYYY-MM-DD].md`
- `output/requirements-[product-name]-[YYYY-MM-DD].md`

Use today's date. Use kebab-case for the product name (e.g. `po-platform`, `trading-club`).
