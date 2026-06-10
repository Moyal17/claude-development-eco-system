---
name: nlm-deck
description: |
  Produce a professional NotebookLM slide deck (Presenter Slides) from curated sources, with optional exact slide-by-slide structure control. Use when: (1) the user wants to build a slideshow / presentation deck from documents to present their work, (2) the user says "make slides", "build a deck", "nlm deck", "presentation from these sources", (3) preparing a stakeholder/leadership presentation grounded in real source material. Claude owns curation + framing + the focus prompt; NotebookLM generates; the user can outline the structure exactly or let NotebookLM decide.
allowed-tools: mcp__notebooklm__*, Bash, AskUserQuestion
---

# nlm-deck — Professional NotebookLM Slide Deck

Build a source-grounded, professional slide deck via the NotebookLM MCP. Claude curates and frames; NotebookLM generates. Slides are the **only revisable artifact** and export to **PPTX**, so this is where precision is achievable — wording is paraphrased by NotebookLM but fully editable afterward.

## Capability ceiling (be honest with the user)
- **Structure:** near-exact achievable (~90% from generation, 100% after PPTX) — but only if the outline is fed as a **text source** and pinned, not just mentioned in the prompt.
- **Wording:** paraphrased, not verbatim. Fix per-slide with `studio_revise`, or finish in PPTX.
- **Slide count:** no exact control — only `short` / `default` length. State a target count in the focus prompt and regenerate if needed. Pin slide 1 = cover and last = back cover to stop merging/reordering.

---

## Step 0 — Auth check
Call `mcp__notebooklm__server_info`. If auth is not `configured` (e.g. `stale`/`not_configured`), tell the user to run `! nlm login` in the session (browser flow) before continuing. Do not proceed until auth is live.

## Step 0b — Reuse a prepped notebook?
If the user ran `/nlm-source-prep` first (or already has a curated notebook), ask for the `notebook_id` and **skip Steps 1 + 3** — the sources are already curated, ingested, and verified. Confirm the source list via `notebook_get`/`source_list_drive` and the audience/takeaways from the FRAMING note, then jump to Step 2 (outline fork). Prefer this path when also producing a video/infographic from the same material.

## Step 1 — Ask for sources (ALWAYS — unless a prepped notebook was supplied)
Ask the user what the deck should be built from. Accept any mix of:
- local files (PDF, DOCX, MD, TXT, CSV, PPTX, images) — added via `source_add(source_type="file", file_path=...)`
- URLs / YouTube links — `source_add(source_type="url", url=...)` or `urls=[...]`
- Google Drive doc IDs — `source_add(source_type="drive", document_id=..., doc_type=...)`
- pasted text — `source_add(source_type="text", text=..., title=...)`

**Enforce the curation discipline:** aim for **3–5 tightly-scoped sources** that directly support the deck's argument. If the user offers many, say so and suggest deselecting off-topic ones — over-loading makes NotebookLM regress to generic output. One notebook = one presentation.

Also ask (briefly) for **audience** and **core message / 3 key takeaways** — these drive the focus prompt and a framing note.

## Step 2 — Ask: outline ourselves, or let NotebookLM decide? (ALWAYS)
Use AskUserQuestion with this exact fork:

- **"I'll give the structure"** (recommended for precision) — the user provides a slide-by-slide outline (or Claude drafts one from the sources + takeaways for approval). Claude writes that outline as a **dedicated text source** titled `MASTER_OUTLINE` via `source_add(source_type="text", text=<outline>, title="MASTER_OUTLINE", wait=true)`, then pins generation to the relevant sources via `source_ids` and uses a strict focus prompt (see Step 4A).
- **"Let NotebookLM decide"** — NotebookLM determines structure from the sources; Claude supplies only audience/tone/emphasis in the focus prompt (see Step 4B).

If the user chooses to outline but hasn't written one, Claude drafts a numbered slide-by-slide outline from the sources and the stated takeaways, shows it, and gets approval before writing it as the `MASTER_OUTLINE` source.

## Step 3 — Ingest sources
Create the notebook (`notebook_create`, capture `notebook_id`), then `source_add` each source with **`wait=true`** so content is indexed before generation. Without `wait`, generation runs against unindexed sources and produces thin output. If outlining, add `MASTER_OUTLINE` as a text source here too.

## Step 4 — Generate (presenter slides)
Confirm with the user, then `studio_create(notebook_id, artifact_type="slide_deck", slide_format="presenter_slides", slide_length=<short|default>, focus_prompt=<built below>, source_ids=<relevant>, language=<bcp47, default en>, confirm=true)`.

Use `presenter_slides` for live speaking; only use `detailed_deck` if the deck must stand alone as a document. Set `language` explicitly for non-English.

### 4A — focus_prompt when the user gave an outline
Tie generation to the outline source with absolute imperatives, e.g.:
> "Build the deck strictly from the source titled MASTER_OUTLINE. One slide per numbered item, in the given order. Use each item's heading as the slide title. Do not add, merge, reorder, or drop slides. Slide 1 is the cover; the final slide is a back cover / next steps. One message per slide, 3–5 talking points each. Audience: <audience>. Tone: professional, confident, concise — no filler or casual humor."

Pin `source_ids` to `[MASTER_OUTLINE id]` plus any sources holding the supporting facts. Excluding noise sources sharply improves adherence.

### 4B — focus_prompt when letting NotebookLM decide
Steer audience/structure/tone without dictating slides, e.g.:
> "Presenter deck for <audience>. Open with a 1-slide executive summary, then sections: problem, approach, results, next steps. Business language, not jargon. 3–5 talking points per slide. Tone: professional, confident, concise."

## Step 5 — Poll
Studio generation is async. Loop `studio_status(notebook_id)` until the deck is ready and a URL/`artifact_id` appears. Never assume completion.

## Step 6 — Review + revise (slides only)
Show the user the generated deck. For any slide that's wrong, collect natural-language fixes and call `studio_revise(notebook_id, artifact_id, slide_instructions=[{slide:<n>, instruction:"..."}], confirm=true)`.

Caveats to tell the user: revise **creates a NEW artifact** (track the new `artifact_id` — poll `studio_status` again), it **cannot add or remove slides**, and it **does not re-read sources** (feed exact text in the instruction). For structural changes (add/remove slides), regenerate or finish in PPTX.

## Step 7 — Deliver
`download_artifact(notebook_id, artifact_type="slide_deck", output_path=..., slide_deck_format="pptx")` for the editable finishing path (editable text boxes + speaker notes), or `"pdf"` for a flat deliverable. Recommend PPTX as the professional finish.

## Step 8 — QA reminder
Studio artifacts carry an "may contain inaccuracies" disclaimer even though chat is source-grounded. Tell the user to verify every figure against its source before presenting.
