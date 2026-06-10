---
name: nlm-video
description: |
  Produce a professional NotebookLM Video Overview from curated sources, ALWAYS steered by a focus_prompt (audience + tone + emphasis + order). Use when: (1) the user wants a narrated video overview of their work from documents, (2) the user says "make a video", "video overview", "nlm video", "explainer video from these sources", (3) an async shareable walkthrough of a topic for stakeholders. Claude curates + builds the steering prompt; NotebookLM generates.
allowed-tools: mcp__notebooklm__*, Bash, AskUserQuestion
---

# nlm-video — Professional NotebookLM Video Overview

Build a source-grounded Video Overview via the NotebookLM MCP. Claude curates and constructs the steering prompt; NotebookLM generates the MP4.

## Capability ceiling (state this up front — it's a hard limit)
- **Narration is AI-generated and paraphrased.** There is **no verbatim-script capability** — no narration/script parameter, and video has **no revise path**. You cannot make it speak your exact words.
- The **focus_prompt is the only steering lever**, and this skill **always** builds one. It controls: **focus/emphasis** (what to cover, which sources to prioritize), **audience**, **tone register** (authoritative / formal / confident / calm), and **order** ("cover points in the order they appear").
- **If the user needs their exact words spoken**, do NOT use NotebookLM for narration. The professional split: NotebookLM (or a slide tool) produces the visuals, and a dedicated TTS path narrates the verbatim script. This repo's ecosystem has an ElevenLabs voiceover path (Remotion `rules/voiceover.md`) — point the user there and offer to composite in Remotion.

---

## Step 0 — Auth check
Call `mcp__notebooklm__server_info`. If auth isn't `configured`, instruct the user to run `! nlm login` before proceeding.

## Step 0b — Reuse a prepped notebook?
If the user ran `/nlm-source-prep` (or has a curated notebook), ask for the `notebook_id` and **skip Steps 1 + 4** — sources are already curated and ingested. Pull audience/emphasis from the FRAMING note, then go straight to Step 2 (build the focus_prompt).

## Step 1 — Ask for sources (unless a prepped notebook was supplied)
Same curation discipline as decks: **3–5 tightly-scoped sources**, one notebook = one video. Accept files / URLs / YouTube / Drive IDs / pasted text via the matching `source_add` types. **Add image/PDF sources** when possible — video uses a visual-crop pipeline that pulls charts/diagrams/photos from sources onto the screen, so visual sources enrich the output. Also ask for **audience** and the **core message / emphasis**.

## Step 2 — Build the focus_prompt (ALWAYS)
This step is mandatory and never skipped. Construct a steering prompt from audience + tone + emphasis + order. Default template (adapt to the user's answers):

> "Focus on <core topic/emphasis>. Audience: <audience>. Tone: professional, confident, concise — avoid casual humor. Emphasize results and business impact. Define any acronym once. Cover the points in the order they appear in the sources. Prioritize the source(s): <names>."

Confirm the assembled focus_prompt with the user before generating. If the user gave nothing to steer with, ask one quick clarifying question rather than generating a generic video.

## Step 3 — Pick format + visual style
- `video_format`: **`explainer`** (default — structured narrated slide-deck video, the right pick for a work/boardroom context) | `brief` (quick) | `cinematic` (immersive, but **English-only / 18+** — flag this before choosing).
- `visual_style`: **`classic`** for professional, or `auto_select`; or pass `video_style_prompt` describing a clean corporate look. (Style customization requires an 18+ account.)
- `language`: BCP-47, default `en` — narration supports 80+ languages; set explicitly if non-English.

## Step 4 — Ingest sources
`notebook_create` → `source_add(... wait=true)` for each. Index before generating or output is thin.

## Step 5 — Generate
Confirm, then `studio_create(notebook_id, artifact_type="video", video_format=<chosen>, visual_style=<chosen>, video_style_prompt=<optional>, focus_prompt=<the prompt from Step 2 — ALWAYS set>, source_ids=<relevant>, language=<bcp47>, confirm=true)`.

## Step 6 — Poll (expect it to be slow)
Loop `studio_status(notebook_id)` until ready. Video generation can exceed **30 minutes** — set expectations, and consider a long-interval check-back rather than tight polling.

## Step 7 — Deliver
`download_artifact(notebook_id, artifact_type="video", output_path=...)` → MP4.

## Step 8 — Limits / QA reminder
No fine-grained editing — video isn't a timeline editor and has no revise. If the result is off, regenerate with an adjusted `focus_prompt` / `visual_style`. AI-generated, so verify any on-screen figures. If wording matters, repeat the verbatim-narration caveat from the top and offer the TTS+Remotion composite path.
