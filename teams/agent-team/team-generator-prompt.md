# Team Generator Prompt

Use this prompt to create a new multi-agent team for any domain. Copy everything below the line, fill in the `{{placeholders}}`, and give it to Claude.

---

## The Prompt

```
I want you to design and build a complete multi-agent team following the exact structure and quality standard of ~/sourceControl/claude-development-eco-system/teams/agent-team/ and ~/sourceControl/claude-development-eco-system/teams/recon-team/.

Read both of these directories first to understand the pattern:
- ~/sourceControl/claude-development-eco-system/teams/agent-team/ — an engineering team with CTO, Architect, Implementors, Code Reviewer, Wiring Expert
- ~/sourceControl/claude-development-eco-system/teams/recon-team/ — a product recon team with Research Director, 4 Specialists, Product Analyst, Devil's Advocate, Realist Angel

Study how they work: the team.json structure, the prompt depth and specificity, the schemas, the CLAUDE.md workflow, the gate enforcement, the cross-challenge/review matrix, and the decomposition template.

---

## What I Want

**Team Name**: {{TEAM_NAME}}
**Team Purpose**: {{ONE_PARAGRAPH_DESCRIBING_WHAT_THIS_TEAM_DOES}}
**Output Directory**: ~/sourceControl/{{DIRECTORY_NAME}}/

---

## Roles I Want

{{LIST_YOUR_ROLES — for each role, describe:}}

1. **{{Role Name}}** — {{what this role does, what it's responsible for, what makes it valuable}}
2. **{{Role Name}}** — {{description}}
3. ...repeat for all roles...

---

## The Orchestrator

The team's orchestrator (like the CTO or Research Director) is: **{{ORCHESTRATOR_ROLE_NAME}}**

Their job:
- {{KEY RESPONSIBILITY 1 — e.g., "decompose user requests into tasks"}}
- {{KEY RESPONSIBILITY 2 — e.g., "enforce all quality gates"}}
- {{KEY RESPONSIBILITY 3 — e.g., "produce the final deliverable/recommendation"}}

---

## Quality Gates

I want these gates enforced (describe your gate process):

{{DESCRIBE YOUR GATES — examples:}}
- "No implementation before plan approval by the architect"
- "Every report must be cross-challenged before synthesis"
- "Both reviewers must approve before a task is done"
- "The devil's advocate must review before final recommendation"

**Gate Matrix** (who reviews/challenges whom):
- {{Role A}} is reviewed/challenged by: {{Role X, Role Y}}
- {{Role B}} is reviewed/challenged by: {{Role Z}}
- ...

---

## Workflow Order

{{DESCRIBE THE EXECUTION ORDER — example:}}
1. Orchestrator asks pre-questions and decomposes into tasks
2. Roles A, B, C, D work in parallel
3. Cross-challenge gate
4. Role E synthesizes
5. Roles F and G give advisory verdicts
6. Orchestrator produces final deliverable

---

## Special Requirements

{{ANY DOMAIN-SPECIFIC REQUIREMENTS — examples:}}
- "Every claim must have a source URL or be labeled as estimate"
- "The team should always ask pre-questions before starting"
- "All reports publish independently to the user"
- "One role should think from a solo-developer's perspective"
- "Include a contrarian role that challenges optimistic conclusions"
- "Cap rejection/challenge cycles at N before escalating"

---

## Deliverables

The final output to the user should be:
{{DESCRIBE WHAT THE USER GETS — examples:}}
- Separate reports from each specialist
- A synthesized overview
- A go/no-go recommendation
- A prioritized action plan

---

## Now Build It

Create the complete team at ~/sourceControl/{{DIRECTORY_NAME}}/ with:

1. **team.json** — Full team configuration with agents, workflow lifecycle, gates, cross-challenge matrix, audit rules. Mirror the structure of agent-team/team.json and recon-team/team.json.

2. **prompts/{{role}}.md** — One prompt file per role. Each prompt must include:
   - Identity section (who they are, their mindset)
   - Core responsibilities (numbered list)
   - Methodology (phased approach to their work)
   - Output format (structured JSON template for their deliverable)
   - Evidence/quality rules (non-negotiable standards)
   - Cross-challenge/review defense rules (if applicable)
   - "What you must never do" section (guardrails)

   Make each prompt 150-300 lines. Be specific, not generic. The prompt should be so detailed that the agent can work autonomously without ambiguity.

3. **schemas/*.schema.json** — JSON Schema for every structured output type (tasks, reports, verdicts, recommendations, challenges). Mirror the schema style from the reference teams.

4. **tasks/decomposition.md** — The orchestrator's decomposition template. Include:
   - Pre-questions to ask the user (mandatory + conditional)
   - Task creation template with JSON format
   - Execution order template
   - Confirmation step before proceeding

5. **CLAUDE.md** — Step-by-step workflow instructions for operating as this team in Claude Code. Include:
   - Role switch announcements (e.g., `[ROLE NAME]`)
   - Step-by-step sequence matching the workflow order
   - Gate rules section (non-negotiable)
   - References to team.json and all prompt files

6. **README.md** — Documentation with:
   - Directory structure
   - Agent table (role, model, gate authority)
   - ASCII workflow diagram
   - Gate rules summary
   - Usage instructions

Make every file production-quality. No placeholders, no TODOs, no "customize this" notes. The team should be immediately usable.
```

---

## Example: Filling It In

Here's how I would have filled this in to generate the recon-team:

```
**Team Name**: Elite Recon Team
**Team Purpose**: A product reconnaissance team that analyzes websites, SaaS products, marketplaces, and ideas to extract their essence, design system, technical architecture, market position, and competitive vulnerabilities — then delivers a go/no-go recommendation calibrated for a solo developer.
**Output Directory**: ~/sourceControl/claude-development-eco-system/teams/recon-team/

## Roles I Want

1. **Research Director** — Orchestrates the entire recon mission. Asks pre-questions, decomposes into tasks, enforces cross-challenge gates, hears both advisory roles, produces final GO/NO-GO/CONDITIONAL-GO recommendation with personal judgment. Does not research — only orchestrates and decides.

2. **Web Researcher** — Deep-dives the target website/product. Maps all features, mechanism (how it works), pricing strategy, and "special sauce" (what makes them different). Every claim must be sourced.

3. **Market Researcher** — Finds what the WORLD says: reviews (G2, Reddit, HN, Product Hunt), articles, competitive landscape, business intelligence (funding, team size, estimated ARR). Produces an opportunity map of unmet user needs.

4. **Design Analyst** — Reverse-engineers the visual design into a reusable design system spec: CSS tokens (colors, fonts, spacing, borders, shadows), component inventory, animation catalog with library identification, and a packages-to-replicate list. Output must be precise enough to rebuild the look without seeing the original.

5. **Technical Architect** — Reverse-engineers the tech stack, infrastructure, third-party services (with alternatives for each), estimates running costs, and assesses build complexity for a solo developer. Recommends a stack for rebuilding.

6. **Product Analyst** — Reads all 4 specialist reports and synthesizes into a comprehensive product overview + gap analysis (SWOT per product area). Surfaces contradictions between reports. Maps gaps to prioritized opportunities.

7. **Devil's Advocate** — Challenges every optimistic conclusion. Finds reasons NOT to build. Assesses the competitor's moat strength. Defines kill conditions (observable triggers to abandon). Must include concessions (what the team got right).

8. **Realist Angel** — The solo-developer's financial advisor. Calculates MVP build time, startup costs, monthly burn, breakeven point, revenue ceiling. Assesses risk/reward ratio. Defines the realistic MVP path (what to build in Phase 1 that fits in 4-6 weeks). Counters the Devil's specific concerns with evidence. Defines kill metrics.

## The Orchestrator: Research Director
- Decompose recon requests into 7 specialist tasks
- Ask mandatory pre-questions before every new target
- Enforce cross-challenge gate (every report challenged before synthesis)
- Read all reports + both advisory verdicts
- Produce final recommendation — be opinionated, not hedging

## Quality Gates
- Every specialist report must be cross-challenged before the Product Analyst reads it
- Cross-challenge cycles cap at 2 — escalate to Research Director if unresolved
- Product Analyst cannot start until all 4 specialist reports pass cross-challenge
- Devil and Angel cannot start until Product Analyst finishes
- Research Director cannot recommend until all 7 reports are in

Gate Matrix:
- Web Researcher challenged by: Market Researcher, Technical Architect
- Market Researcher challenged by: Web Researcher, Product Analyst
- Design Analyst challenged by: Technical Architect
- Technical Architect challenged by: Web Researcher, Design Analyst
- Product Analyst challenged by: Devil's Advocate, Realist Angel

## Workflow Order
1. Research Director asks pre-recon questions, waits for answers
2. Research Director decomposes into 7 tasks, confirms with user
3. Web Researcher, Market Researcher, Design Analyst, Technical Architect work in parallel
4. Cross-challenge gate — each report challenged by assigned challengers
5. Product Analyst synthesizes all reports into overview + gap analysis
6. Devil's Advocate and Realist Angel produce verdicts (Angel reads Devil first)
7. Research Director reads everything, produces final GO/NO-GO/CONDITIONAL-GO

## Special Requirements
- Every claim must have a source URL or be labeled as fact/strong_inference/estimate
- Pre-recon questions are mandatory before every new target
- All 8 reports publish independently — user gets everything, not just the summary
- The Realist Angel always thinks in solo-developer scale (time, money, skills of one person)
- The Devil must always include concessions (intellectual honesty)
- The Research Director must state who made the stronger case (Devil vs Angel) and why

## Deliverables
- 8 separate reports: Web Research, Market Research, Design System, Technical Architecture, Product Overview + Gap Analysis, Devil's Verdict, Angel's Verdict, Director's Recommendation
- The Director's Recommendation is the headline deliverable with GO/NO-GO/CONDITIONAL-GO
```
