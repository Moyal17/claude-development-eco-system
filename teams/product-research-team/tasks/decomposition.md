# CPO Brief Decomposition Guide

Use this guide when the CPO receives a product brief from the user and must decompose it into research assignments.

---

## Step 1: Analyze the Brief

Before creating assignments, think through:

1. **What is the core product?** What does it do, for whom, and in what context?
2. **What is the biggest unknown?** What must research answer for this product to be differentiated — not just competent?
3. **Who are the users?** Name the personas from beginner to power user. Name the personas who will stress-test edge cases.
4. **What is the competitive landscape?** Are there dominant incumbents? Is this a crowded or open space?
5. **What is the EXTRA?** What category of value is underserved by the entire market right now?

---

## Step 2: Validate Brief Completeness

A brief is sufficient if it answers:
- What the product does (core function)
- Who the primary users are
- What market or category it competes in
- What success looks like (outcome, not features)

If the brief is missing any of these, ask the user to clarify before decomposing.

---

## Step 3: Write the Research Brief

```json
{
  "brief_id": "BRIEF-001",
  "product_name": "<working name — can be placeholder>",
  "product_domain": "<domain: fintech | productivity | health | devtools | e-commerce | social | gaming | etc>",
  "vision_hypothesis": "<one sentence: what would make this product exceptional if the research confirms it>",
  "differentiation_question": "<the single question that, if answered well, gives this product its edge>",
  "target_personas": [
    "<persona 1 — give a human name and one-line description>",
    "<persona 2>",
    "<persona 3 — include a power user persona>"
  ],
  "research_assignments": {
    "researcher_1": {
      "focus": "workflow_and_journey",
      "primary_questions": [
        "What is the complete workflow a user goes through to accomplish [core goal], from first touch to task completion?",
        "How do the top 3-5 competitors handle this workflow? Where do they succeed and where do they fail?",
        "How does the workflow evolve from a new user to a power user? What are the progression milestones?",
        "<domain-specific question 4>",
        "<domain-specific question 5>"
      ],
      "scope": "End-to-end workflow analysis, user journey mapping per persona, competitive workflow benchmarking, progression modeling",
      "out_of_scope": "Edge case analysis (researcher_2 owns this), pricing research, technical architecture"
    },
    "researcher_2": {
      "focus": "edge_cases_and_differentiation",
      "primary_questions": [
        "What are the most common edge cases users encounter that competitors handle poorly or ignore entirely?",
        "What are the top user frustrations with existing solutions in this category — sourced from real feedback?",
        "What category of value is missing from all current alternatives? Where is the market blind spot?",
        "What do power users do that no product has properly designed for yet?",
        "<domain-specific question 5>"
      ],
      "scope": "Edge case enumeration and severity classification, competitor frustration analysis, differentiation opportunity mapping, power-user needs analysis, The EXTRA Edge identification",
      "out_of_scope": "Workflow analysis (researcher_1 owns this), implementation feasibility, technical constraints"
    }
  },
  "success_definition": "The research is complete when: (1) all user workflows are diagrammed, (2) all edge cases are cataloged with severity, (3) the EXTRA Edge is identified and articulated, (4) a requirements document is approved by the CPO.",
  "constraints": []
}
```

---

## Step 4: Output the Brief and Confirm

Output a human-readable summary for the user:

```
## Research Brief Summary — [Product Name]

I have decomposed your product brief into a research engagement:

**Brief ID**: BRIEF-001
**Product**: [Product Name] ([domain])
**Vision Hypothesis**: [one sentence]
**Differentiation Question**: [the key question]

**Research Tracks**:
- **Researcher 1 (Workflow & Journey)**: [2-sentence summary of focus]
- **Researcher 2 (Edge Cases & Differentiation)**: [2-sentence summary of focus]

**Personas**: [list]

**What you will get**:
1. Research Document — workflow diagrams, journey maps, competitive analysis, edge cases, The EXTRA Edge
2. Requirements Document — MoSCoW-prioritized features, user stories with acceptance criteria, MVP definition

Shall I proceed and issue research assignments to the team?
```

Wait for user confirmation before dispatching.

---

## Decomposition Anti-Patterns to Avoid

| Anti-pattern | Why it fails |
|---|---|
| Vague vision hypothesis | Researchers produce generic findings with no strategic direction |
| Differentiation question missing | The EXTRA edge never gets hunted — team produces a competent but forgettable product spec |
| Overlapping researcher scopes | Duplicated effort, conflicting findings, wasted cycles |
| Too many personas | Research spreads thin — better to have 2-3 sharp personas than 8 vague ones |
| No power user persona | Edge cases and power-user needs get ignored — product ships good but not great |
| Skipping brief validation | Ambiguous briefs produce unfocused research |
| Assigning edge case work to researcher_1 | Workflow researcher gets distracted; edge cases get shallow treatment |
| Missing out_of_scope boundaries | Researchers drift into each other's territory |
