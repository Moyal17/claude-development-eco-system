# Recon Team

Multi-agent product reconnaissance team with cross-challenge gates, dual advisory roles, and Research Director oversight.

## Structure

```
recon-team/
├── team.json                              # Master team configuration
├── CLAUDE.md                              # Workflow instructions for Claude Code
├── prompts/
│   ├── research_director.md               # Orchestrator — decomposes, enforces gates, final verdict
│   ├── web_researcher.md                  # Deep-dives the target website/product
│   ├── market_researcher.md               # Reviews, articles, sentiment, competitive landscape
│   ├── design_analyst.md                  # Visual design system extraction + tech detection
│   ├── technical_architect.md             # Stack, infrastructure, costs, build complexity
│   ├── product_analyst.md                 # Synthesizes all reports into overview + gap analysis
│   ├── devils_advocate.md                 # Challenges everything — reasons NOT to build
│   └── realist_angel.md                   # Solo-dev feasibility, financial reality, risk/reward
├── schemas/
│   ├── task.schema.json                   # Recon task structure
│   ├── research_report.schema.json        # Web/Market research report structure
│   ├── design_report.schema.json          # Design system spec structure
│   ├── product_overview.schema.json       # Product overview + gap analysis structure
│   ├── advisory_verdict.schema.json       # Devil/Angel verdict structure
│   ├── challenge_report.schema.json       # Cross-challenge structure
│   └── director_recommendation.schema.json # Final go/no-go recommendation structure
├── tasks/
│   └── decomposition.md                   # Research Director's task decomposition template
└── reports/                               # Output directory for generated reports
```

## Agents

| Agent | Model | Role | Gate Authority |
|---|---|---|---|
| Research Director | claude-opus-4-6 | Orchestrator + final verdict | Task creation, challenge escalation, final recommendation |
| Web Researcher | claude-sonnet-4-6 | Website/product deep-dive | — |
| Market Researcher | claude-sonnet-4-6 | Reviews, sentiment, competitors | — |
| Design Analyst | claude-sonnet-4-6 | Visual design system extraction | — |
| Technical Architect | claude-opus-4-6 | Stack, costs, build complexity | Consultation authority |
| Product Analyst | claude-opus-4-6 | Synthesis + gap analysis | — |
| Devil's Advocate | claude-opus-4-6 | Skeptic — reasons NOT to build | — |
| Realist Angel | claude-opus-4-6 | Pragmatist — solo-dev feasibility | — |

## Workflow

```
User provides target (URL / product / idea)
    │
    ▼
[RESEARCH DIRECTOR] Pre-recon questions → User answers → Decompose into 7 tasks
    │
    ▼
[PARALLEL] Web Researcher + Market Researcher + Design Analyst + Technical Architect
    │
    ▼
[GATE: Cross-Challenge] Each report challenged by assigned challengers
    │ All defended/revised          │
    │                    Unresolved → Research Director decides (cap: 2 rounds)
    ▼
[PRODUCT ANALYST] Synthesizes all reports → Product Overview + Gap Analysis
    │
    ▼
[PARALLEL] Devil's Advocate + Realist Angel produce verdicts
    │
    ▼
[RESEARCH DIRECTOR] Reads everything → GO / NO-GO / CONDITIONAL-GO recommendation
    │
    ▼
All 8 reports delivered to user independently
```

## Cross-Challenge Matrix

| Report | Challenged By | Focus |
|---|---|---|
| Web Research | Market Researcher, Technical Architect | Feature accuracy, mechanism validity |
| Market Research | Web Researcher, Product Analyst | Source credibility, sentiment balance |
| Design Analysis | Technical Architect | Library identification accuracy, reproducibility |
| Technical Architecture | Web Researcher, Design Analyst | Evidence-based stack claims, cost realism |
| Product Overview | Devil's Advocate, Realist Angel | Honest gap analysis, real opportunities |

## Usage in Claude Code

Open Claude Code in a project that references this team:

```bash
claude /path/to/project
```

Then tell Claude what you want to research:

```
Research https://example.com — I want to build something better in their space
```

Or invoke directly:

```
/recon-team https://example.com
```

Claude will follow the full gate workflow:
1. Ask pre-recon questions
2. Decompose into tasks
3. Run all specialists
4. Cross-challenge all reports
5. Synthesize
6. Devil + Angel verdicts
7. Research Director final recommendation

## Output

Each recon mission produces 8 independent reports:
1. **Web Research Report** — features, mechanism, pricing, special sauce
2. **Market Research Report** — reviews, sentiment, competitors, opportunities
3. **Design Report** — CSS tokens, components, animations, packages to replicate
4. **Technical Architecture Report** — stack, costs, build complexity, alternatives
5. **Product Overview** — synthesized full picture + gap analysis
6. **Devil's Advocate Verdict** — reasons NOT to build, kill conditions
7. **Realist Angel Verdict** — solo-dev feasibility, financial reality, realistic path
8. **Research Director Recommendation** — GO / NO-GO / CONDITIONAL-GO with evidence

All reports are saved to the `reports/` directory, organized by target and date.
