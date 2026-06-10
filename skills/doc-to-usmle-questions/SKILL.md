---
name: doc-to-usmle-questions
description: Turn a lecture presentation (PDF/PPTX/doc) into a short written analysis plus a USMLE-style question set of SECOND- and THIRD-ORDER clinical-reasoning items, saved as a .md file in ~/Downloads. Use when the user invokes /doc-to-usmle-questions, drops a lecture PDF path and asks for questions, or says "give me an analysis and create a questions file." Built for a BGU/Soroka medical student studying toward USMLE-style university exams.
argument-hint: [path to the lecture PDF/PPTX/doc]
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Doc → USMLE Questions

Process ONE lecture presentation at a time. For each one: read it, deliver a short written analysis, then create a USMLE-style question `.md` file in `~/Downloads`. The user drops a path → you deliver analysis + file → user drops the next path.

This skill is opt-in. Run it only when the user invokes `/doc-to-usmle-questions` or drops a lecture and asks for analysis + questions.

---

## Question level: SECOND- and THIRD-ORDER ONLY

Every question must test a reasoning chain, not a fact lookup. The target chain is:

> **Clinical clue → Diagnosis → Mechanism → Consequence → Correct answer**

Reasoning orders (tag each question in the answer key):

- **[F1] — Recognition/recall.** "What is X?" / "Which drug binds Y?" — **DO NOT write these as standalone questions.** A pure fact becomes the *first link* of a chain, a *distractor*, or a detail buried in the vignette — never the thing being asked.
- **[F2] — Diagnosis → mechanism.** The stem gives the clue/scenario; the answer is the *underlying mechanism, parameter, or "why."* (e.g., "A hypoalbuminemic patient on phenytoin develops toxicity at a normal total level — why?" → ↑ free fraction.)
- **[F3] — Diagnosis → mechanism → consequence.** The stem requires two linked inferences: identify the situation, reason through the mechanism, then predict the *downstream outcome, next step, complication, or what fails.* (e.g., "...therefore which of the following will happen if the dose is unchanged?")

**Rule of thumb:** if a strong student can answer by recognizing a single term, it's [F1] — rewrite it. The correct answer should sit one or two inferential steps *past* the fact the slide states. Aim for a roughly even mix of [F2] and [F3], leaning [F3] for clinically rich material.

---

## Workflow (per document)

1. **Read the document.** Use the Read tool on the PDF (it reads PDFs natively; for >10 pages pass `pages`). Read every slide/page including the lecturer's speaker-notes text under each slide — the notes carry most of the high-yield signal.

2. **Mine the source for reasoning chains** (not just facts). For each concept the deck teaches, build its chain — *clue → diagnosis/identification → mechanism → consequence* — using the deck's own contrasts and links. The chain is the raw material for an [F2]/[F3] question. Capture:
   - **Embedded board/review questions** the deck already contains (reproduce these FIRST, in order). If an embedded question is bare recall, **elevate it** to [F2]/[F3] by adding a vignette and pushing the answer one inferential step past the stated fact.
   - **Lecturer high-yield flags** — anything marked "HIGH YIELD," "the USMLE likes/loves," **bold**, underlined, or "you need to know." These are the chains to prioritize.
   - **Cause→effect and mechanism links**: gene→disease→drug, parameter→consequence, lesion→complication→outcome, "if X changes then Y." These are pure [F3] fuel.
   - **Definitions, classifications, mnemonics, named signs/triads, buzzwords, morphology** — treated as *links inside a chain or as distractors*, never as the question itself.
   - Explicit scope notes ("least emphasized," "beyond Step 1") — DEEMPHASIZE or skip.

3. **Write the questions** as clinical-vignette single-best-answer items (A–E; A–G only for an embedded matching question that needs it), **all at [F2] or [F3] level — no standalone [F1] recall.** Match the template format exactly (see below). Coverage is measured in *reasoning chains*, not facts: one question per distinct chain, so several related facts collapse into one multi-step item. Dense flagship decks may warrant 40–60 questions; lighter decks 20–35. Scale to how many genuine chains the material supports — do not pad with recall items to hit a number.

4. **Save the file** to `~/Downloads/<Topic> - USMLE Questions.md`, where `<Topic>` is the deck's real subject (not the filename). Construction technique that works reliably:
   - `Write` the title block + `## Questions` section first.
   - Then `Edit` to append the `## Answer Key & Short Explanations` + compact tables, anchoring the Edit on the unique final answer-option text.

5. **Deliver a short written analysis** in chat (terse, per the user's style): the deck's structure/sections, the lecturer-flagged high-yield points, and a one-line note on coverage weighting + how many questions. Then say you're ready for the next PDF. Do NOT begin the next document until the user provides it.

---

## Output file format (match this template exactly)

Reference template: `/Users/user/Downloads/Cardiovascular Physiology - USMLE Questions.md`

```markdown
# <Topic> — USMLE-Style Question Set

*Based on "<Deck Title>" (<Lecturer, institution; textbook chapters>). Clinical-vignette stems, single best answer (A–E). All items are second-order [F2] (clue→mechanism) or third-order [F3] (clue→mechanism→consequence) — no bare-recall questions. Q1–QN reproduce/elevate the deck's embedded board questions. Answer key (with reasoning-order tag) and short explanations at the bottom.*

---

## Questions

**1.** <clinical vignette stem ending in a question>

- A. <option>
- B. <option>
- C. <option>
- D. <option>
- E. <option>

---

**2.** <next stem>

- A. …
( … repeat, each question separated by a `---` line … )

---

## Answer Key & Short Explanations

1. **B** *[F2]* — <one-line rationale; name the mechanism/why, not just the letter>.
2. **D** *[F3]* — <name the chain: clue → mechanism → consequence that lands on the answer>.
( … one numbered line per question; tag each [F2] or [F3] … )

### Answer Key (compact)

| Q | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|----|----|----|----|
| Ans | B | D | … |

( repeat the compact table in rows of ~13–14 columns until all questions are covered )
```

---

## Quality rules

- **[F2]/[F3] only.** Every stem tests a reasoning chain. The correct answer sits one (F2) or two (F3) inferential steps past the fact the slide states. If a strong student can answer by matching a single term, rewrite it.
- **Reproduce/elevate embedded questions first**, in the deck's own order; raise any recall ones to [F2]/[F3]. Then build chains from the lecturer's flagged points, then broader coverage.
- **The fact lives in the stem or the distractors, never as the question.** Bare facts (definitions, values, gene loci, buzzwords) become the *clue* the vignette gives you or the *trap* you must reject — the question asks for the mechanism/consequence they imply.
- **Clinical vignettes** — age, presentation, findings, and a *change or stressor* (disease state, missed dose, comorbidity, interacting drug) that forces the second/third step.
- **One unambiguous best answer.** Distractors should be plausible and themselves teach — favor the deck's own contrasts (the lesion/drug/parameter it's most confused with) so wrong answers reinforce discrimination.
- **Explanations name the chain**, not just the letter: clue → mechanism → consequence → answer, in one line, mirroring the deck's phrasing/buzzwords. Tag each [F2] or [F3].
- **Spread the correct-answer letter** across A–E; fix lopsidedness (the compact table makes it obvious).
- **University-toward-USMLE level**, weighted by what THIS lecturer emphasized.

## What NOT to do

- **Don't write standalone [F1] recall questions** ("What is X?", "Which drug binds Y?", "Define Z"). Convert the fact into the clue, a distractor, or the first link of a chain.
- Don't pad to a question count with recall items — fewer, genuine [F2]/[F3] chains beat many shallow ones.
- Don't process more than one document per turn unless the user explicitly asks.
- Don't write a plan doc, summary file, or any artifact other than the questions `.md`.
- Don't invent content the deck doesn't support; if you add standard board facts beyond the deck, keep them mainstream and correct. (A reasoning chain may connect the deck's facts to a standard downstream consequence, as long as the consequence is mainstream and correct.)
- Don't skip the lecturer's speaker notes — they hold the high-yield flags and the cause→effect links that make the best chains.
