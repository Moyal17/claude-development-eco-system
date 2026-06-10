# Product Research Team Workflow

All product research under this directory uses the agent team defined at `~/sourceControl/claude-teams/product-research-team`.
When researching a new product or feature — follow the full team gate workflow below.
Do not begin research without an approved research plan. Do not write requirements without CPO-approved research findings.

---

## Team Configuration

@product-research-team/team.json

---

## Role Prompts

@product-research-team/prompts/cpo.md

@product-research-team/prompts/researcher.md

@product-research-team/prompts/product_manager.md

---

## How to Operate in Claude Code

When the user gives you a product brief or research request, execute the following sequence.
Announce each role switch clearly before acting in that role.

---

### Step 1 — CPO: Decompose the Brief
Announce: `[CPO]`
- Read the user's product brief in full
- Identify the product domain, target users, and success definition
- Decompose into two parallel research assignments:
  - **researcher_1**: Workflow & Journey (simple → advanced use, competitive baseline)
  - **researcher_2**: Edge Cases & Differentiation (the EXTRA, competitive gap, power-user needs)
- State the product vision hypothesis and the key differentiation question the research must answer
- Output the research assignments as structured JSON (see `tasks/decomposition.md`)

---

### Step 2 — Researcher(s): Write Research Plans
Announce: `[RESEARCHER 1]` then `[RESEARCHER 2]`
- Each researcher independently writes a research plan
- The plan must identify: research questions, sources/methods, scope, and expected outputs
- Plans are submitted separately; each is reviewed independently by the CPO
- Do NOT begin research until the CPO approves your plan

---

### Step 3 — CPO: Approve Research Plans
Announce: `[CPO]`
- Review each research plan against the assignment and the product brief
- Approve or reject each plan independently with structured reasoning
- If REJECTED: return the plan to the researcher with specific revision guidance
- If both APPROVED: proceed to Step 4

---

### Step 4 — Researcher(s): Execute Research (Parallel)
Announce: `[RESEARCHER 1]` then `[RESEARCHER 2]`
- Both researchers work concurrently on their assigned focus areas
- Cross-consultation with CPO is always permitted for product vision questions
- Each researcher produces a full Research Findings Document (see template)
- Findings must include Mermaid diagrams for all workflow and journey content
- Submit findings using the `findings_submit` tool when complete

---

### Step 5 — PM Cross-Consultation: Requirements Synthesis
Announce: `[PM 1]` then `[PM 2]`
- Both PMs read ALL research findings from both researchers
- PM 1 drafts the initial requirements structure (feature list, prioritization, user stories)
- PM 2 challenges and augments (differentiation coverage, edge case requirements, experience quality)
- **Mandatory**: PMs must cross-consult and document alignment before submitting requirements
- The PM cross-consultation log must be included in the requirements submission
- When aligned, jointly produce a single unified Requirements Document

---

### Step 6 — CPO: Approve Requirements Document
Announce: `[CPO]`
- Review the Requirements Document against both research documents and the original brief
- Evaluate: completeness, differentiation, edge case coverage, MVP clarity, testability of criteria
- Approve or reject with structured reasoning
- If REJECTED: return to Step 5 with all blocking findings; only PMs address them
- If APPROVED: proceed to Step 7

---

### Step 7 — CPO: Finalize and Hand Off
Announce: `[CPO]`
- Confirm both output documents are complete:
  - Research Document (with all Mermaid diagrams)
  - Requirements Document (CPO-approved)
- Summarize the product brief, key findings, and top 3 differentiators for the handoff
- State clearly: "This requirements document is ready for CTO sprint planning."
- **WORKFLOW COMPLETE**

---

## Gate Rules — Non-Negotiable

- **No research before CPO approves the research plan.** If research is started without approval, stop and go back to Step 2.
- **No requirements without complete research findings.** Both researchers must submit before PMs begin.
- **PM cross-consultation is mandatory.** Requirements submitted without a PM consultation log will be returned.
- **No WORKFLOW COMPLETE before CPO approves requirements.** The CPO is the sole authority on requirements readiness.
- **Rejection cycles cap at 3.** If the same document is rejected 3 times, stop and surface the problem to the user.
- **CPO does not create sprints or engineering tasks.** The handoff is the requirements document only.

---

## Output Documents

### Research Document
Location: `outputs/[product-name]/research-[product-name]-[date].md`
Template: `templates/research_document.md`
Must contain:
- Executive summary with product opportunity hypothesis
- Full workflow analysis (Mermaid flowchart)
- User journey maps per persona (Mermaid journey diagram)
- Competitive landscape analysis
- Edge cases catalog (simple → complex)
- Differentiation opportunities
- The EXTRA Edge — the unique insight that defines the product's market position

### Requirements Document
Location: `outputs/[product-name]/requirements-[product-name]-[date].md`
Template: `templates/requirements_document.md`
Must contain:
- Product vision statement
- Target personas with goals and frustrations
- MoSCoW-prioritized feature list
- MVP definition with scope boundary
- Post-MVP roadmap
- User stories with testable acceptance criteria
- Edge case requirements
- Differentiation requirements (the EXTRA Edge specced out)
- Non-functional requirements
- Explicit out-of-scope list
