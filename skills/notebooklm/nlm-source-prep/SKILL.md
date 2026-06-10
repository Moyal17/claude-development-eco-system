---
name: nlm-source-prep
description: |
  Prepare a high-quality NotebookLM notebook BEFORE generating any artifact — curate 3–5 scoped sources, add a framing note, ingest with indexing, then extract and verify the key claims against the sources. Use when: (1) starting any NotebookLM presentation (run this first), (2) the user says "prep the notebook", "nlm source prep", "set up sources for a presentation", (3) you want one prepped notebook to feed a deck + video + infographic without re-ingesting. Returns a notebook_id the generator skills (/nlm-deck, /nlm-video, /nlm-infographic) consume. Curation is the #1 quality lever — this is where it happens.
allowed-tools: mcp__notebooklm__*, Bash, AskUserQuestion
---

# nlm-source-prep — Curate + verify a notebook before generating

The front door for all NotebookLM presentation work. Quality of every downstream artifact (slides, video, infographic) is set here: **fewer, tightly-scoped sources win** — 3–5 sources produce sharp, citable output; 12+ make NotebookLM regress to generic summaries. This skill builds one notebook, curates it, frames it, and verifies its facts, then hands back a `notebook_id`.

Run this once per presentation. Then run `/nlm-deck`, `/nlm-video`, and/or `/nlm-infographic` against the same `notebook_id` — they detect a prepped notebook and skip re-ingestion.

---

## Step 0 — Auth check
Call `mcp__notebooklm__server_info`. If auth isn't `configured` (e.g. `stale`), tell the user to run `! nlm login` (browser flow) and stop until it's live.

## Step 1 — Discover intent
Ask the user (briefly):
- **Audience** — who is this presentation for?
- **Core message + 3 key takeaways** — the argument the sources must support.
- **What sources** — files (PDF/DOCX/MD/TXT/CSV/PPTX/images), URLs/YouTube, Drive doc IDs, or pasted text.

## Step 2 — Curate to 3–5 sources (the lever)
If the user offers more than ~5 sources, push back: name the ones that directly support the core message, and recommend dropping or deferring the rest. Each source should answer something the presentation argues — anything else is noise that dilutes output. One notebook = one presentation (notebooks can't cross-reference; 50-source cap on free tier).

If the user is light on sources, offer `research_start(query, mode="fast"|"deep", source="web")` → `research_status` → `research_import(cited_only=true)` to discover authoritative web sources, with the user approving what gets imported.

## Step 3 — Create the notebook + framing note
- `notebook_create(title=<presentation name>)` → capture `notebook_id`.
- Add a **framing note** as a text source so the angle is in the grounding corpus, not just in prompts:
  `source_add(notebook_id, source_type="text", title="FRAMING", text="Audience: <...>. Core message: <...>. Three takeaways: 1) … 2) … 3) …. Emphasize: <...>.", wait=true)`

## Step 4 — Ingest with indexing
`source_add(... wait=true)` for every source so each is fully indexed before any generation. Skipping `wait` lets downstream `studio_create` run against unindexed content and produce thin output.
- files → `source_type="file", file_path=...`
- urls/youtube → `source_type="url", url=...` or `urls=[...]`
- drive → `source_type="drive", document_id=..., doc_type="doc|slides|sheets|pdf"`
- text → `source_type="text", text=..., title=...`

## Step 5 — Extract + VERIFY key claims (the trust step)
NotebookLM chat is source-grounded and cites passages, but Studio artifacts (slides/video/infographic) carry an inaccuracy disclaimer — so lock the facts here, before generation.
- `chat_configure(notebook_id, goal="custom", custom_prompt="For each claim, state the figure and cite the exact source and section. Return as a structured list.", response_length="longer")`
- `notebook_query(notebook_id, query="What are the key claims, figures, and quotes that support: <core message>? Cite each.")` (use `notebook_query_start`/`notebook_query_status` if the notebook is large / query is slow).
- Show the cited claims to the user. Pin the confirmed set with `note(action="create", ...)` so generators can lean on a verified summary.
- Flag any claim the sources do **not** support — those must not appear in the deck/video.

## Step 6 — Hand off
Report to the user:
- `notebook_id`
- the curated source list (titles + ids)
- the verified key claims (with citations)
- a one-line "ready for /nlm-deck | /nlm-video | /nlm-infographic against notebook_id=<...>"

Do not generate artifacts here — that's the generator skills' job. This skill's deliverable is a clean, verified, reusable notebook.
