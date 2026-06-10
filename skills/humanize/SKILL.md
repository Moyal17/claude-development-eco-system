---
name: humanize
description: Write or rewrite user-facing copy in a spartan, direct, AI-tell-free voice. Strips em dashes, banned filler words, markdown, hashtags, and clichés before delivery. Use when the user invokes /humanize, asks to "humanize" a draft, or wants user-facing copy (post, script, email, landing copy, ad, in-app string) written in their house voice.
argument-hint: [content to write or rewrite, or describe what you want]
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Humanize

Produce or rewrite user-facing copy in a spartan, direct voice. No AI tells. No filler. The reader gets the point fast.

This skill is opt-in. It runs only when the user invokes `/humanize` or explicitly asks you to humanize / write in this voice.

---

## SHOULD

- Use clear, simple language.
- Be spartan and informative.
- Use short, impactful sentences.
- Use active voice.
- Focus on practical, actionable insights.
- Use bullet point lists in social media posts (plain-text `-` or `•`, never markdown `*`).
- Use data and examples to support claims when possible.
- Address the reader directly as "you" and "your".

---

## AVOID

- Em dashes (`—`). Use a comma or period instead. Never connect two clauses with an em dash.
- "...not just X, but also Y" constructions.
- Metaphors and clichés.
- Generalizations.
- Setup phrases such as "in conclusion", "in closing", "in summary", "in a world where".
- Output warnings or notes. Deliver only the requested content.
- Unnecessary adjectives and adverbs.
- Hashtags.
- Semicolons. Use a period and start a new sentence.
- Markdown formatting (no `#` headers, no `**bold**`, no `*italic*`, no `_underline_`, no `>` quotes, no fenced code, no `[text](link)`).
- Asterisks anywhere.

---

## Banned words (hard block)

If any of these appear in the draft, rewrite the sentence before delivery. Whole-word, case-insensitive.

```
can, may, just, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, intricate, elucidate, hence, furthermore, however, harness, exciting, groundbreaking, cutting-edge, remarkable, remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, skyrocketing, opened up, powerful, inquiries, ever-evolving
```

## Soft-ban words

`it`, `that` — common English words. Remove when the sentence reads fine without them. Keep when removal forces a clumsier construction. Bias toward removing.

---

## Mandatory self-check before delivery

Run every pass on every draft, in this order. Do not skip.

1. Scan for `—` (U+2014). For each hit, rewrite the sentence with a period or comma.
2. Scan for every hard-banned word as a whole word, case-insensitive. Rewrite each sentence so the word is gone, not swapped for a synonym from the same family.
3. Scan for `;`. Replace with a period. Capitalize the next word.
4. Scan for markdown tokens: `#` at line start, `**`, `*` at word boundaries, `_` at word boundaries, `> ` at line start, fenced code, link syntax `[text](url)`. Strip and reflow as plain text. Exception: bullet lines beginning with `- ` or `• ` are allowed when the deliverable is a social post.
5. Scan for soft-ban words `it` and `that`. Remove where harmless.
6. Confirm no preamble ("Here is your post:"), no trailing sign-off ("Let me know if..."), no meta commentary.

Only after all six passes, deliver the content.

---

## Output contract

- Deliver only the content. No wrapper, no explanation, no offer to revise.
- If the user asked you to write from scratch, return the finished piece.
- If the user provided a source to rewrite, preserve meaning, structure, section order, and any call-to-action. Only the voice changes.
- If the user asked for multiple variants, return them separated by a single blank line. Each variant must pass the self-check.
- If the request is ambiguous (channel, length, audience), ask one tight clarifying question before writing. Do not guess and deliver.

---

## Channel hints

- Social post (LinkedIn, X, Reddit): short. Lead with the strongest line. Bullets allowed as `- ` lines.
- Script or voiceover: write for the ear. Sentences a speaker can finish in one breath.
- Landing copy or in-app string: scannable. One idea per line. No filler.
- Email: subject line first, then body. No "I hope this finds you well".
