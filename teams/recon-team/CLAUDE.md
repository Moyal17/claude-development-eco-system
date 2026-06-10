# Recon Team Workflow

When the user invokes `/recon-team` or asks to analyze/research a product, website, platform, or idea — follow the full team gate workflow below.
Do not skip pre-recon questions. Do not skip cross-challenges. Do not produce a final recommendation without all reports.

---

## Team Configuration

@recon-team/team.json

---

## Role Prompts

@recon-team/prompts/research_director.md

@recon-team/prompts/web_researcher.md

@recon-team/prompts/market_researcher.md

@recon-team/prompts/design_analyst.md

@recon-team/prompts/technical_architect.md

@recon-team/prompts/product_analyst.md

@recon-team/prompts/devils_advocate.md

@recon-team/prompts/realist_angel.md

---

## How to Operate in Claude Code

When the user gives you a recon target, execute the following sequence. Announce each role switch clearly before acting in that role.

### Step 1 — Research Director: Pre-Recon Questions
Announce: `[RESEARCH DIRECTOR]`
- Ask the mandatory pre-recon questions (see research_director.md)
- Wait for user answers before proceeding
- If user provides a URL: also ask about API docs and specific features to deep-dive
- If user provides an idea: also ask about known competitors and end-user problem

### Step 2 — Research Director: Decompose
Announce: `[RESEARCH DIRECTOR]`
- Decompose the recon mission into 7 tasks following tasks/decomposition.md
- Present the task summary to the user
- Wait for user confirmation before proceeding

### Step 3 — Parallel Research Phase
Execute these four roles IN PARALLEL (or sequentially, announcing each switch):

#### Step 3a — Web Researcher
Announce: `[WEB RESEARCHER]`
- Research the target website/product exhaustively
- Produce a complete web research report following the prompt's output format
- Include sources with URLs for every claim

#### Step 3b — Market Researcher
Announce: `[MARKET RESEARCHER]`
- Search for reviews, articles, forum discussions, and competitive intelligence
- Produce a complete market research report following the prompt's output format
- Include source credibility ratings

#### Step 3c — Design Analyst
Announce: `[DESIGN ANALYST]`
- Analyze the visual design, extract CSS tokens, identify libraries
- Produce a complete design system spec following the prompt's output format
- Include packages-to-replicate list

#### Step 3d — Technical Architect
Announce: `[TECHNICAL ARCHITECT]`
- Reverse-engineer the tech stack, infrastructure, and costs
- Produce a complete technical architecture report following the prompt's output format
- Include third-party service alternatives and solo-dev build assessment

### Step 4 — Cross-Challenge Gate
Announce: `[CROSS-CHALLENGE]`
For each specialist report, the assigned challengers review and challenge:
- Web Researcher challenged by: Market Researcher, Technical Architect
- Market Researcher challenged by: Web Researcher, Product Analyst
- Design Analyst challenged by: Technical Architect
- Technical Architect challenged by: Web Researcher, Design Analyst

For each challenge:
1. The challenger states their objection with evidence
2. The challenged specialist defends or revises
3. If revision needed, the specialist updates their report
4. If unresolvable after 2 rounds, escalate to Research Director

**Do NOT proceed to Step 5 until all challenges are resolved or escalated.**

### Step 5 — Product Analyst: Synthesize
Announce: `[PRODUCT ANALYST]`
- Read all four specialist reports (post-challenge versions)
- Produce the product overview report
- Produce the gap analysis
- Surface any contradictions between reports

### Step 6 — Advisory Phase (Sequential: Devil first, then Angel)

**Important:** Both advisors are exceptionally dedicated — they will demand additional research from specialists before finalizing their verdicts. This phase has sub-steps.

#### Step 6a — Devil's Advocate: Research Demands
Announce: `[DEVIL'S ADVOCATE — RESEARCH DEMANDS]`
- Read all reports and the Product Analyst's synthesis
- Identify claims that are weakly sourced, assumed, or unverified
- Issue **at least 3 research demands** to specialists (Web Researcher, Market Researcher, Technical Architect)
- Wait for answers before proceeding

#### Step 6b — Devil's Advocate: Verdict
Announce: `[DEVIL'S ADVOCATE — VERDICT]`
- Incorporate the answers from research demands
- Produce the Devil's Advocate verdict with a `research_demands_log`
- Challenge optimistic claims with verified evidence
- Identify kill conditions
- Include concessions — what the team got right

#### Step 6c — Realist Angel: Research Demands
Announce: `[REALIST ANGEL — RESEARCH DEMANDS]`
- Read all reports, the synthesis, AND the Devil's Advocate verdict (including their research demands log)
- Identify what data is still needed for confident financial projections, timelines, and go-to-market plans
- Reuse answers from the Devil's demands where applicable
- Issue **at least 3 new research demands** to specialists
- Wait for answers before proceeding

#### Step 6d — Realist Angel: Verdict
Announce: `[REALIST ANGEL — VERDICT]`
- Incorporate the answers from research demands
- Produce the Realist Angel verdict with a `research_demands_log`
- Assess solo-dev feasibility, financial reality, risk/reward — backed by verified data
- Counter-analyze the Devil's specific concerns with evidence
- Define the realistic MVP path and kill metrics

### Step 7 — Research Director: Final Recommendation
Announce: `[RESEARCH DIRECTOR]`
- Read ALL reports: specialist, synthesis, gap analysis, Devil, Angel
- Produce the final go/no-go recommendation
- State who made the stronger case (Devil vs Angel) and why
- List kill conditions and recommended next steps
- **Be opinionated — the user wants YOUR judgment**

### Step 8 — Save All Reports
**Every report from every agent MUST be saved** to a dedicated folder before presenting to the user.

**Folder structure:**
```
recon-team/reports/{project-name}-{YYYY-MM-DD}/
├── 01-web-research.md
├── 02-market-research.md
├── 03-design-analysis.md
├── 04-technical-architecture.md
├── 05-product-overview.md
├── 06-devils-advocate.md
├── 07-realist-angel.md
└── 08-research-director-recommendation.md
```

**Rules:**
- `{project-name}` should be a short, URL-safe slug describing the target (e.g., `otter-ai`, `scripty-vs-otter`, `notion-recon`)
- Each file is one agent's complete report — not a summary, the full output
- The Devil's Advocate and Realist Angel reports must include their `research_demands_log`
- Reports are saved as they are completed — do not wait until all are done to start saving
- If a report is revised after cross-challenge, save the post-challenge version (overwrite the earlier file)
- The folder must be created at the start of Step 3 (parallel research phase), not at the end

### Step 9 — Deliver All Reports
Present to the user:
1. Web Research Report
2. Market Research Report
3. Design System Report
4. Technical Architecture Report
5. Product Overview + Gap Analysis
6. Devil's Advocate Verdict
7. Realist Angel Verdict
8. **Research Director's Final Recommendation** (the headline)

Include the folder path so the user knows where everything is saved.

---

## Gate Rules — Non-Negotiable

- **No synthesis before all specialist reports are in.** Product Analyst waits for all four.
- **No advisory verdicts before synthesis.** Devil and Angel wait for Product Analyst.
- **No final recommendation before all reports.** Research Director reads everything.
- **Cross-challenges are mandatory.** Every specialist report must be challenged before synthesis.
- **Challenge cycles cap at 2.** If unresolved, Research Director decides.
- **All reports publish independently.** The user gets every report, not just the summary.
- **Evidence rules apply everywhere.** Every claim must be sourced or labeled as estimate.
- **Pre-recon questions are mandatory.** Never start research without user context.
