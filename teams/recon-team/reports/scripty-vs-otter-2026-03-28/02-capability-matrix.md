# Report 2: Capability Matrix
**Agent:** Technical Architect
**Date:** 2026-03-28

---

## Full Feature Comparison

| Capability | Otter.ai | Scripty | Advantage |
|-----------|----------|--------|-----------|
| **Real-time transcription** | Yes (live in meetings) | No (file upload only) | Otter |
| **Meeting bot integration** | Zoom, Meet, Teams bots | None | Otter |
| **Multi-provider STT** | Single (proprietary) | AWS + Azure + GCP with routing | **Scripty** |
| **Cost-optimized paths** | Single path | Saver ($0.003/min) vs Express ($0.024/min) | **Scripty** |
| **Translation** | No | Built-in (AWS Translate, multi-language) | **Scripty** |
| **Language support** | ~10 languages | 100+ languages (GCP BCP-47) | **Scripty** |
| **Hebrew/Arabic accuracy** | Basic | Specialized (GCP Chirp 2, normalization) | **Scripty** |
| **Speaker diarization** | Yes | Yes (all 3 providers) | Tie |
| **WebVTT subtitles** | No (transcript only) | Yes (auto-generated .vtt) | **Scripty** |
| **AI summaries** | Basic auto-summary | Two-pass with quality scoring (0-100), custom prompts | **Scripty** |
| **Custom prompt templates** | No | Yes (4 categories, user-created) | **Scripty** |
| **CRM integration** | Salesforce, HubSpot | None | Otter |
| **AI Chat (Q&A)** | Yes (Otter AI Chat) | Planned (RAG over transcripts) | Otter (for now) |
| **Flashcard generation** | No | Planned | **Scripty** (planned) |
| **Audio study podcasts** | No | Planned | **Scripty** (planned) |
| **Cross-lecture intelligence** | No | Planned | **Scripty** (planned) |
| **Pricing flexibility** | Fixed subscription | Credit-based + subscriptions + dynamic top-up | **Scripty** |
| **Student pricing** | $6.67/mo (with .edu) | $9/mo (20 hrs Saver) | Otter (slightly cheaper) |
| **Free tier** | Unlimited meetings (basic) | 50 credits (~1.7 hrs) | Otter (more generous) |
| **File size handling** | Meeting-length | Up to 5GB (multipart upload) | **Scripty** |
| **Offline/export** | Limited | Full (txt, vtt, json, audio) | **Scripty** |

---

## Scripty's Technical Moat

### 1. Multi-Provider Routing
No other consumer tool lets you choose between AWS/Azure/GCP with automatic cost optimization. Otter is locked to their single STT engine. Scripty can route by:
- Cost (Saver vs Express)
- Language (GCP Chirp 2 for Hebrew, Azure for specific languages)
- Quality (compare providers per language)

### 2. Saver Path Economics
At $0.003/min (GCP Dynamic Batch), Scripty can offer 20 hours of transcription for $9/mo with healthy margins (~33%). Otter charges $19.99/mo for fewer features.

| Path | Cost/Hour | Credits/Hour | Margin at Student Plan ($9/mo, 600 credits) |
|------|-----------|-------------|----------------------------------------------|
| Saver (GCP Dynamic Batch) | ~$0.18 | 30 | ~$5.40 cost → **~40% margin** |
| Express (Azure) | ~$1.00 | 100 | ~$6.00 cost → **~33% margin** |

### 3. Translation Pipeline
Built-in, automatic, stored per-language on the same transcript. AWS Translate with batching, respecting 10KB limits. Multiple languages can coexist on the same transcript. Otter doesn't translate at all.

### 4. Two-Pass AI Summaries
Quality-scored summaries with audit trails:
- Pass 1: Summarizer (Claude Sonnet, temp 0.7)
- Pass 2: Evaluator (Claude Sonnet, temp 0.2)
- Quality score 0-100 based on missing info + unsupported claims
- Automatic self-correction if score fails
- Chunked mode for long transcripts (>20K tokens)

Otter's summaries are single-pass with no quality metrics or custom prompts.

### 5. Credit System Flexibility
Pay-per-use is architecturally better for irregular demand (students):
- Dynamic top-up: $0.03/credit, pay exactly what you need
- Fixed plans: predictable monthly allocation
- Rollover: unused credits carry forward (2-month expiry)
- Pause: freeze subscription for up to 2 months/year
