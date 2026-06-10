# Trading Club — Autonomous Learning Requirements
## Version: 3.0 | Replaces: requirements-trading-club-learning-model-2026-03-07.md
## Authors: pm_1, pm_2 | Date: 2026-03-07

---

## Correction to Previous Learning Model

The previous learning addendum (v1.1) centered on human-feedback calibration: override learning, disagreement patterns, user-driven weight adjustment. **That was the wrong framing.**

Trading Club's intelligence model is:

> The system gets smarter on its own by researching, forming opinions, accumulating knowledge, remembering, and refining its understanding over time. The human gives it sources and assets. The system does the rest.

The human approves final decisions. The human does **not** teach the system how to think. The system teaches itself by doing research.

---

## Core Learning Principle

```
Week 1:  System knows nothing. It has sources and assets. It ingests and classifies.
Week 4:  System has opinions. It has seen enough to form assessments with confidence scores.
Week 12: System has memory. It remembers what happened before and uses it to research better.
Week 24: System has instincts. Patterns it has observed 10+ times inform its confidence automatically.
Week 52: System is an experienced researcher. It has a year of accumulated context, source
         reliability data, pattern memory, and strategy evolution history.
```

The system does not need a human to tell it something was wrong. It sees what happens in the market after it forms an opinion. It sees which sources were right and which were wrong. It remembers.

---

## Autonomous Learning Loop 1 — Active Web Research (MCP-Driven)

### What Changes

In v1, the system mostly processes what arrives from configured sources. In v2, the system actively goes out and researches.

### Trigger: Any Interesting Signal → Proactive Research

When a signal arrives from any configured source, the system does not just classify it. If the signal mentions a tracked asset or an interesting claim, the Asset Research Agent uses MCP tools to actively investigate.

### Research Actions the System Takes Autonomously

| Signal Type | Autonomous Research Action |
|------------|---------------------------|
| Telegram message mentions tracked asset | MCP crawls: recent news for that asset, project website, governance forums |
| WhatsApp message contains a link | MCP fetches link content + searches for related coverage from other sources |
| Twitter profile posts about a regulatory event | MCP searches for: the actual filing, government press release, legal analysis |
| News article mentions a competitor to a tracked asset | MCP crawls: competitor info, comparison analysis, market reaction |
| Any signal mentions a new asset not yet tracked | MCP searches for: what is this asset, market cap, team, recent news — summarizes as a "discovery report" for the user |
| Signal mentions an event date (earnings, unlock, vote) | MCP searches for: event details, historical context of similar events, analyst expectations |
| Multiple sources mention the same topic within 2 hours | MCP deep-dives: treats this as a developing story, searches for the original source and full context |

### MCP Research Pipeline

```
Signal arrives with interesting content
       │
       ▼
Asset Research Agent evaluates: "Should I research this further?"
       │
       ├── Is this about a tracked asset? → YES → Research
       ├── Is this a new claim I haven't seen? → YES → Research
       ├── Is this CRITICAL severity? → YES → Deep research
       ├── Is this a developing story (multiple sources)? → YES → Research
       └── Is this routine/duplicate? → NO → Skip active research, just classify
       │
       ▼ (if researching)
MCP Browser Tool: search the web for related information
       │
       ├── Search query 1: "[asset name] + [key claim from signal]"
       ├── Search query 2: "[asset name] latest news"
       ├── Search query 3: "[specific source mentioned in signal]" (e.g., SEC filing, governance forum)
       │
       ▼
Fetch top 3-5 results
       │
       ▼
Summarize each result
       │
       ▼
Form opinion: "Based on what I found, here is my assessment"
       │
       ▼
Save to DB:
  - Raw research findings
  - Summary with confidence score
  - Opinion text
  - Sources used
  - Knowledge graph updates
```

### Opinion Formation

The system is not neutral. It forms opinions. Every research finding includes:

```json
{
  "asset": "ARB",
  "claim": "Major partnership announcement expected",
  "research_conducted": [
    "Searched web for 'Arbitrum partnership announcement'",
    "Crawled Arbitrum governance forum",
    "Checked 3 Twitter profiles for corroboration",
    "Searched CoinDesk, The Block, CryptoSlate for coverage"
  ],
  "evidence_found": {
    "supporting": [
      "Governance forum thread discussing unnamed partnership — 47 replies",
      "Twitter account @arb_insider mentioned partnership — posted 6h before Telegram signal"
    ],
    "contradicting": [
      "No official Arbitrum Foundation communication",
      "No mainstream crypto news coverage yet"
    ],
    "context": [
      "ARB has announced 3 partnerships in the last 6 months — pattern is: forum leak → Twitter → official announcement (avg 4 days)"
    ]
  },
  "system_opinion": "Likely real but unconfirmed. The pattern matches previous ARB partnership announcements. I expect official confirmation within 3-5 days. If confirmed, this is HIGH severity for 2-week price action.",
  "confidence": 62,
  "confidence_reasoning": "2 corroborating sources but no official confirmation. Pattern match with previous announcements adds confidence. No contradicting evidence found, only absence of confirmation.",
  "saved_to": ["news_items", "research_dossiers", "knowledge_graph"],
  "next_action": "Monitor for official announcement. Re-check in 48h."
}
```

The confidence score is the system's own assessment — not a user-defined rating. It reflects how much evidence the system found and how credible that evidence is.

---

## Autonomous Learning Loop 2 — Weekly Memory Consolidation

### What It Is

Every week the system reviews everything that happened and produces a **structured memory document**. This is not a report for the user (though the user can read it). It is the system's own knowledge base — what it learned, what patterns it observed, what it got right, what it got wrong.

### When It Runs

Every Sunday at midnight (configurable). The Orchestrator triggers a scheduled job.

### Memory Structure

```markdown
# Weekly Memory — [Date Range]
## System: Trading Club | Generated: [timestamp]

---

## 1. Top Events This Week (by actual market impact)

### Event 1: [Title]
- **What happened:** [factual summary]
- **What the system predicted:** [system's opinion at the time, with confidence]
- **What actually happened:** [outcome]
- **System accuracy assessment:** [correct / partially correct / wrong]
- **Key lesson:** [what this teaches for future similar situations]
- **Source performance:** [which sources got this right, which got it wrong]

### Event 2: [Title]
...

(Top 10 events maximum — ranked by impact on tracked assets)

---

## 2. Source Reliability This Week

| Source | Claims Made | Claims Verified | Claims Wrong | Claims Pending | Trend |
|--------|------------|----------------|-------------|---------------|-------|
| Telegram: CryptoAlpha | 12 | 8 | 2 | 2 | Reliable |
| Twitter: @analyst_x | 7 | 3 | 3 | 1 | Mixed |
| WhatsApp: Trading Group | 5 | 4 | 0 | 1 | Reliable |
| News: CoinDesk | 15 | 14 | 0 | 1 | Very reliable |

**Source credibility updates applied:**
- Twitter @analyst_x: regulatory news credibility reduced (2/4 regulatory claims incorrect this week)
- Telegram CryptoAlpha: tokenomics credibility increased (3/3 correct on unlock news)

---

## 3. Pattern Observations

Patterns the system observed this week that inform future research:

1. "[Pattern description — e.g., When BTC ETF outflows exceed $500M in a day, altcoins drop 4-8% within 24h. Observed 3rd time this quarter.]"
   → **Stored as pattern. Confidence: 72% (3 observations)**

2. "[Pattern description — e.g., Telegram channel X breaks Arbitrum news 12-18h before official announcement. 4th consecutive time.]"
   → **Stored as pattern. Confidence: 85% (4 observations)**

3. "[Pattern description — e.g., Single-source NVDA regulatory rumors from Twitter are overstated 60% of the time. 3rd observation.]"
   → **Stored as pattern. Confidence: 68% (3 observations)**

---

## 4. Strategy Evolution This Week

| Asset | Strategy Before | Strategy After | What Changed | Confidence |
|-------|----------------|---------------|-------------|-----------|
| BTC | Accumulate (6m) | Accumulate (6m) | Unchanged — thesis holds | 74% |
| ETH | Hold (3m) | Accumulate (3m) | 2 new positive catalysts identified | 68% |
| NVDA | Accumulate (3m) | Hold (3m) | Export control claim strengthened | 55% |
| ARB | Watch | Accumulate (2w) | Partnership confirmed | 81% |

---

## 5. Claims Lifecycle This Week

| Claim | Asset | Status Change | Reason |
|-------|-------|-------------|--------|
| C-015: ETH blob fee revenue growing | ETH | PROPOSED → ACTIVE | Confirmed by on-chain data article |
| C-008: NVDA export risk limited | NVDA | ACTIVE → WEAKENED | New reporting contradicts earlier scope assessment |
| C-022: ARB partnership imminent | ARB | PROPOSED → CONFIRMED | Official announcement published |
| C-011: BTC halving cycle thesis | BTC | ACTIVE → ACTIVE | Re-confirmed this week, no change |

---

## 6. Knowledge Gaps Identified

Things the system does not have good information on — flagged for future research:

1. "No reliable source for SEC filing real-time monitoring — relying on secondary news coverage (delay of 2-6 hours)"
2. "On-chain data for Solana ecosystem has only 1 weak source — research quality for SOL assets is below threshold"
3. "Asian market hours activity not covered by any configured source — potential blind spot for NVDA (Taiwan exposure)"

---

## 7. Self-Assessment

| Metric | This Week | Last Week | Trend |
|--------|----------|----------|-------|
| Recommendations that proved directionally correct | 71% | 65% | Improving |
| Average confidence on correct recommendations | 73% | 70% | Good calibration |
| Average confidence on incorrect recommendations | 58% | 62% | Improving (lower = better) |
| Critical events detected before mainstream coverage | 3/4 | 2/5 | Improving |
| Research depth (avg web searches per significant signal) | 3.2 | 2.1 | More thorough |
| Knowledge graph nodes added this week | 47 | 31 | Growing |
| New patterns identified | 3 | 1 | Good |
```

### How Memory Is Used

The weekly memory is not just stored — it is actively consumed by the agents:

| Agent | How It Uses Weekly Memory |
|-------|--------------------------|
| **Asset Research Agent** | Reads relevant past memories when researching an asset. "Last time ARB had a partnership rumor, it was confirmed in 4 days. This matches the pattern." |
| **Content Intelligence Agent** | Uses source reliability updates from memory to adjust confidence scoring. "Twitter @analyst_x has been wrong on regulatory calls 3 weeks running — reduce confidence weight." |
| **Strategy Agent** | Reads pattern observations when forming recommendations. "ETF outflow pattern observed 3 times — apply to current BTC thesis." |
| **Orchestrator** | Uses self-assessment trends to decide when to trigger deeper research on underperforming areas. |

### Memory Accumulation Over Time

```
Month 1:   4 weekly memories. System has basic source assessments and a few patterns.
Month 3:   12 memories. System recognizes recurring patterns with real confidence.
Month 6:   24 memories. System has deep source profiles, many observed patterns, and
           strong context for all tracked assets.
Month 12:  52 memories. System is an experienced researcher with a year of market memory.
           It has seen multiple market regimes, tracked hundreds of claims to resolution,
           and its confidence scores are well-calibrated from pure observation.
```

---

## Autonomous Learning Loop 3 — Pattern Recognition and Storage

### What It Is

As the system accumulates weekly memories, it naturally observes recurring patterns. These patterns are stored explicitly and used to inform future research and confidence scoring.

### Pattern Structure

```sql
observed_patterns (
  id,
  pattern_text,                  -- human-readable description
  pattern_type,                  -- source_behavior / price_reaction / event_sequence / correlation / timing
  scope,                         -- global / asset_class / specific_asset / specific_source
  scope_id,                      -- null for global, asset_id or source_id for specific
  observation_count,             -- how many times this pattern has been observed
  first_observed,                -- when was this first noticed
  last_observed,                 -- most recent observation
  confidence,                    -- 0-100, increases with observations
  supporting_memories[],         -- list of weekly_memory_ids that contain this pattern
  status,                        -- active / tentative / invalidated
  invalidation_reason            -- if invalidated, why
)
```

### Pattern Confidence Rules

| Observation Count | Confidence Level | Status |
|------------------|-----------------|--------|
| 1 | 30% | Tentative — noted but not acted on |
| 2 | 50% | Tentative — gaining credibility |
| 3 | 65% | Active — used in research context |
| 5+ | 75-85% | Active — directly influences confidence scoring |
| 10+ | 85-95% | Strong — treated as reliable market knowledge |
| Contradicted 2+ times | Drops by 20% per contradiction | May move to Invalidated |

### How Patterns Influence Research

When the Asset Research Agent researches a signal about a tracked asset, it checks the pattern store:

```
Signal: "BTC ETF outflows $600M today"

Pattern check:
  → Pattern P-007: "When BTC ETF outflows exceed $500M, altcoins drop 4-8% within 24h"
    Confidence: 72% (observed 3 times)
    Last observed: 2 weeks ago

Asset Research Agent response:
  "This matches an observed pattern (P-007, 72% confidence). Based on previous observations,
   correlated altcoins may see 4-8% downside within 24h. Flagging all tracked altcoins for
   potential impact. Adding this context to BTC and altcoin dossiers."
```

The system is not doing complex ML. It is doing what a good human researcher does: remembering what happened before in similar situations and applying that context.

---

## Autonomous Learning Loop 4 — Source Intelligence (Self-Learned)

### What Changes From v1.1

The previous addendum described source credibility as calibrated from human feedback. **Wrong.** The system learns source reliability by observing outcomes on its own.

### How It Works

Every time a source makes a claim (via a news item the system ingests), the system tracks whether the claim proves true:

```
Telegram channel "CryptoAlpha" posts: "Binance listing for TOKEN X this week"
  → System ingests, classifies, and creates a claim: "TOKEN X Binance listing imminent"
  → Claim status: PROPOSED, confidence: 55%

5 days later:
  → System's MCP weekly scan finds: Binance announces TOKEN X listing
  → Claim status: CONFIRMED
  → Source update: CryptoAlpha — exchange listing claims accuracy: 4/5 (80%)
  → CryptoAlpha's credibility for exchange news: 82% (updated automatically)

OR:

10 days later:
  → No listing announced. System's MCP search finds nothing.
  → Claim status: EXPIRED (unconfirmed after reasonable window)
  → Source update: CryptoAlpha — exchange listing claims accuracy: 3/5 (60%)
  → CryptoAlpha's credibility for exchange news: 64% (updated automatically)
```

No human needed. The system observes what happens and updates its own source assessments.

### Source Profile (Self-Learned)

```json
{
  "source": "Telegram: CryptoAlpha",
  "overall_reliability": 71,
  "category_reliability": {
    "exchange_listings": 80,
    "partnerships": 75,
    "tokenomics": 85,
    "regulatory": 45,
    "price_predictions": 30,
    "macro": 20
  },
  "speed_profile": "Often first by 12-18h on exchange and partnership news",
  "total_claims_tracked": 84,
  "total_claims_resolved": 71,
  "total_claims_correct": 52,
  "total_claims_wrong": 19,
  "total_claims_pending": 13,
  "manipulation_incidents": 0,
  "last_updated": "2026-03-07",
  "weeks_of_history": 14
}
```

This profile is built entirely from the system's own observation. It gets richer every week.

---

## Autonomous Learning Loop 5 — Strategy Evolution Through Accumulated Knowledge

### What It Is

The Strategy Agent does not produce static recommendations. It evolves its strategy based on the knowledge the system has accumulated. This happens through three mechanisms:

**A. Claim lifecycle drives strategy naturally**

As claims are created, strengthened, weakened, or invalidated — the strategy changes automatically because the weight of evidence shifts. No human trigger needed. The research drives the strategy.

**B. Pattern memory adjusts confidence**

When the system recognizes a pattern it has seen before, it adjusts its confidence in the current situation:

```
Current situation: Single Twitter source claims NVDA facing new export restrictions
Pattern memory: "Single-source NVDA regulatory rumors from Twitter are overstated 60% of the time (3 observations)"
Confidence adjustment: System reduces confidence in this claim by 25% before forming a recommendation
```

**C. Weekly memory provides context for strategy re-checks**

When the system runs its 2-3 day strategy re-check, it reads the most recent weekly memories to understand if the market environment has shifted:

```
Strategy re-check for ETH — 3-month horizon

Current thesis: Accumulate, 68% confidence
Recent weekly memories consulted:
  - Week 9: "ETH blob fee revenue growing — new catalyst"
  - Week 8: "Macro risk-off environment — correlation shock observed"
  - Week 7: "Ethereum Foundation sold ETH — negative signal, but historically recovered in 2-3 weeks"

Re-check result: Thesis strengthened to 72% — Week 9 catalyst outweighs Week 8 concern.
                 Week 7 event is now > 2 weeks old — pattern says recovery complete.
```

---

## Autonomous Learning Loop 6 — System Self-Assessment

### What It Is

Every week, as part of the memory consolidation, the system evaluates its own performance. Not because a human asked. Because a good researcher reviews their own track record.

### What It Measures (Autonomously)

| Metric | How System Measures It | What It Does With It |
|--------|----------------------|---------------------|
| Directional accuracy | Compares recommendations to price outcomes at horizon | Adjusts confidence ranges for future recommendations |
| Source reliability trends | Tracks claim verification rates per source per category | Updates source profiles that influence future confidence |
| Pattern validity | Checks if previously observed patterns still hold | Invalidates patterns that no longer apply |
| Research thoroughness | Counts MCP searches per significant signal | If declining, increases research effort |
| Early detection rate | How often system identified a signal before mainstream news | Measures value of configured sources |
| Knowledge graph density | Tracks growth of graph nodes and relationships per asset | Flags assets with thin research coverage |
| Strategy stability | Counts recommendation flips per asset per month | If too many flips, the underlying research is too noisy — flags for deeper research |

The system uses these measurements to adjust its own behavior:
- If confidence is systematically too high → lower confidence ranges
- If a source is consistently wrong → downweight that source automatically
- If research on an asset is thin → proactively trigger MCP research sessions
- If a pattern stops holding → invalidate the pattern

---

## New Database Schema — Autonomous Learning

### Core Tables

```sql
-- Weekly memory consolidation
weekly_memories (
  id,
  week_start,
  week_end,
  top_events_json,               -- ranked list of top 10 events with outcomes
  source_reliability_updates_json,
  pattern_observations_json,
  strategy_evolution_json,
  claims_lifecycle_json,
  knowledge_gaps_json,
  self_assessment_json,
  created_at
)

-- Observed patterns (self-learned)
observed_patterns (
  id,
  pattern_text,
  pattern_type,
  scope,
  scope_id,
  observation_count,
  first_observed,
  last_observed,
  confidence,
  supporting_memory_ids[],
  status,                        -- tentative / active / invalidated
  invalidation_reason,
  created_at,
  updated_at
)

-- System opinion on every research finding
system_opinions (
  id,
  asset_id,
  claim_id,
  news_item_id,
  opinion_text,                  -- the system's actual assessment
  confidence,
  confidence_reasoning,
  research_actions_taken[],      -- what MCP searches were done
  evidence_found_json,           -- supporting + contradicting + context
  next_action,                   -- what the system plans to do next
  created_at
)

-- Research actions taken via MCP
research_actions (
  id,
  trigger_signal_id,             -- what signal triggered this research
  asset_id,
  action_type,                   -- web_search / crawl_site / fetch_article / check_forum
  query_or_url,                  -- what was searched/crawled
  result_summary,                -- what was found
  useful,                        -- did this contribute to the opinion?
  executed_at
)

-- Source profiles (self-learned)
source_profiles (
  id,
  source_id,
  overall_reliability,
  category_reliability_json,     -- per-category scores
  speed_profile,
  total_claims_tracked,
  total_claims_resolved,
  total_claims_correct,
  total_claims_wrong,
  total_claims_pending,
  manipulation_incidents,
  weeks_of_history,
  last_updated
)

-- Claim tracking and resolution
claim_resolutions (
  id,
  claim_id,
  source_id,
  claim_text,
  claimed_at,
  resolution_status,             -- confirmed / denied / expired / partially_true
  resolved_at,
  resolution_evidence,           -- what confirmed/denied it
  resolution_source,             -- how did system learn the outcome
  time_to_resolution_hours
)

-- Self-assessment snapshots
self_assessments (
  id,
  assessment_date,
  directional_accuracy_pct,
  avg_confidence_correct,
  avg_confidence_incorrect,
  early_detection_rate,
  knowledge_graph_nodes_added,
  patterns_identified,
  patterns_invalidated,
  source_reliability_changes,
  strategy_flips_count,
  research_depth_avg,
  created_at
)
```

### New Neo4j Relationships

```cypher
// Pattern connections
(:Pattern)-[:OBSERVED_IN]->(:WeeklyMemory)
(:Pattern)-[:APPLIES_TO]->(:Asset)
(:Pattern)-[:INVOLVES]->(:Source)

// Research action connections
(:ResearchAction)-[:TRIGGERED_BY]->(:NewsItem)
(:ResearchAction)-[:FOUND]->(:NewsItem)    // new items discovered by active research
(:ResearchAction)-[:UPDATED]->(:ResearchDossier)

// Memory connections
(:WeeklyMemory)-[:COVERS_PERIOD {start, end}]->(:TimeRange)
(:WeeklyMemory)-[:UPDATED_SOURCE]->(:Source)
(:WeeklyMemory)-[:IDENTIFIED_PATTERN]->(:Pattern)
(:WeeklyMemory)-[:EVOLVED_STRATEGY]->(:StrategyThesis)
```

---

## Updated Agent Responsibilities — Autonomous Intelligence

| Agent | Core v1 Responsibility | New Autonomous Learning Responsibility |
|-------|----------------------|---------------------------------------|
| **Orchestrator** | Workflow coordination, critical escalation | Trigger weekly memory consolidation; trigger proactive research sessions for assets with thin coverage; manage self-assessment schedule |
| **Signal Ingestion** | Poll sources, extract links, dedup | Flag signals that mention tracked assets for active research (passes to Asset Research) |
| **Content Intelligence** | Summarize, classify, score | Produce richer summaries that include the system's preliminary opinion on significance; track claim creation from source content |
| **Asset Research** | Maintain dossiers | **Biggest change:** Actively use MCP tools to research claims, not just process incoming signals. Create system opinions with confidence reasoning. Track claim lifecycle to resolution. Consume weekly memories for research context. Proactively flag thin-coverage assets. |
| **Strategy** | Generate recommendations | Consume observed patterns when forming recommendations. Adjust confidence using accumulated knowledge. Evolve strategy based on claim lifecycle shifts — not waiting for human re-check triggers. |
| **Journal** | Audit trail | Record all research actions taken (MCP queries, what was found). Store weekly memories. Archive self-assessment snapshots. Maintain pattern observation log. |

---

## What Event-Driven vs. Scheduled Looks Like Now

| Flow | Model | Cadence |
|------|-------|---------|
| Source polling (WhatsApp/Telegram/Twitter/news) | Scheduled | 10-30 min |
| Active MCP research on interesting signals | Event-driven | Triggered per signal flagged for research |
| Proactive MCP research on thin-coverage assets | Scheduled | Daily — check which assets need more research |
| Claim resolution checking | Scheduled | Daily — check if pending claims have been confirmed/denied |
| Source reliability recalculation | Scheduled | Weekly — part of memory consolidation |
| Pattern identification and update | Scheduled | Weekly — part of memory consolidation |
| Weekly memory consolidation | Scheduled | Weekly (Sunday midnight) |
| Self-assessment | Scheduled | Weekly — part of memory consolidation |
| Strategy re-check | Scheduled | Every 2-3 days (also triggered by significant claim lifecycle events) |

---

## Phased Integration — Corrected

### Phase 1 — Autonomous Research Foundation

Everything the system needs to form opinions on day 1:

| Feature | Phase 1 |
|---------|---------|
| MCP web research on interesting signals | Yes — this is the core capability |
| System opinions with confidence scores | Yes — every research finding includes the system's assessment |
| Claim creation and tracking | Yes — claims are the atoms of knowledge |
| Source profile creation (starts at neutral) | Yes — profiles grow from observation |
| Research action logging (what MCP searches were done) | Yes — full transparency on what the system investigated |
| Weekly memory schema | Yes — tables ready from day 1 |
| First weekly memory generation | Yes — runs from week 1 (even if sparse) |

### Phase 2 — Accumulated Intelligence

Once 8+ weeks of data exist:

| Feature | Phase 2 |
|---------|---------|
| Pattern recognition and storage | Enough data to identify real patterns |
| Dynamic source reliability by category | Enough claim resolutions to be meaningful |
| Self-assessment metrics | Enough outcomes to measure accuracy |
| Proactive research on thin-coverage assets | System knows where its gaps are |
| Memory-informed confidence adjustment | Patterns influence future scoring |

### Phase 3 — Deep Intelligence

After 6+ months:

| Feature | Phase 3 |
|---------|---------|
| Strategy evolution from accumulated knowledge | Deep enough memory to meaningfully evolve |
| Long-term pattern validation/invalidation | Enough observations to trust or reject patterns |
| Market regime awareness from observed patterns | Not a classifier — emergent from observed behavior |
| Shadow recommendation comparison | Enough history to meaningfully compare policy versions |

---

## Key Design Decision: No ML, No Training — Just Research and Memory

The system does not use machine learning. It does not train models. It does not need a GPU.

It uses:
- **LLM reasoning** (Claude API) to summarize, classify, form opinions, and consolidate memories
- **MCP tools** to actively crawl and research
- **Structured storage** to accumulate knowledge
- **Simple statistical tracking** to measure source reliability and pattern confidence
- **Weekly memory** as compounding institutional knowledge

This is intentional. ML-based trading systems are fragile, opaque, and hard to debug. A system that reasons with an LLM and accumulates structured memory is transparent, auditable, and explainable. You can read the weekly memory and understand exactly what the system knows and why it thinks what it thinks.

The system is not a quantitative trading model. It is a **tireless research analyst with a perfect memory.**

---

## Human as a Source — The Trader's Voice in the System

### Core Concept

The human trader is not above the system. They are not the teacher. They are **a source** — one with 4 years of market experience, instincts, and opinions. The system treats the human exactly like it treats a Telegram channel or a Twitter profile: as a signal source with a credibility profile that starts at 50% and evolves based on whether their calls prove accurate.

The difference: the human can provide reasoning, context, and nuance that automated sources cannot. A Telegram channel says "NVDA going down." The human says "NVDA is going down because I've seen this export control pattern before in 2023 and the market underpriced the risk then too." That context is valuable — but the system still verifies it independently.

### How It Works

**The human submits opinions through the chat interface.** Every opinion is processed as a signal:

```
Human types: "I think SOL is going to outperform ETH in the next 3 months.
             The Solana DeFi ecosystem is growing faster and fees are lower.
             I've been watching the TVL numbers and they're accelerating."

System processes:
  → Source: Human Trader (credibility: 50% — new source)
  → Claim created: "SOL will outperform ETH on 3-month horizon"
  → Category: competitive_analysis
  → Reasoning captured: "DeFi ecosystem growth, fee advantage, accelerating TVL"
  → System's independent action:
      MCP research triggered — search for SOL vs ETH DeFi TVL data,
      recent ecosystem news, fee comparison analysis
  → System forms its own opinion after research:
      "Human's claim partially supported. SOL TVL is growing 12% MoM vs ETH 4% MoM.
       However, ETH still dominates by absolute value (8x). Fee comparison is accurate.
       Counter-evidence: SOL has had 3 network outages in the last year.
       My assessment: claim has merit for short-term momentum. 3-month outperformance
       plausible but not certain. Confidence: 55%."
  → Both the human's opinion AND the system's independent assessment are saved
  → Claim tracked to resolution at 3-month mark
```

### Human Source Profile

The human gets a source profile identical in structure to every other source:

```json
{
  "source": "Human Trader",
  "source_type": "human_expert",
  "overall_reliability": 50,
  "category_reliability": {
    "regulatory": 50,
    "competitive_analysis": 50,
    "macro": 50,
    "sentiment": 50,
    "technicals": 50,
    "tokenomics": 50,
    "earnings": 50,
    "timing": 50
  },
  "experience_years": 4,
  "total_claims_tracked": 0,
  "total_claims_resolved": 0,
  "total_claims_correct": 0,
  "total_claims_wrong": 0,
  "total_claims_pending": 0,
  "weeks_of_history": 0,
  "strengths_identified": [],
  "weaknesses_identified": [],
  "last_updated": "2026-03-07"
}
```

After 3 months:

```json
{
  "source": "Human Trader",
  "overall_reliability": 63,
  "category_reliability": {
    "regulatory": 72,
    "competitive_analysis": 65,
    "macro": 58,
    "sentiment": 70,
    "technicals": 45,
    "tokenomics": 60,
    "earnings": 55,
    "timing": 38
  },
  "total_claims_tracked": 34,
  "total_claims_resolved": 28,
  "total_claims_correct": 18,
  "total_claims_wrong": 10,
  "strengths_identified": [
    "Strong regulatory instinct — correctly predicted export control scope 3/4 times",
    "Good sentiment read — catches community mood shifts before they show in price"
  ],
  "weaknesses_identified": [
    "Timing is consistently early — predicts correct direction but wrong timing window",
    "Technical analysis calls are below average — 3/7 correct"
  ]
}
```

The system might surface this to the human:

> "Based on 3 months of tracked calls, your strongest category is regulatory news (72% accuracy). Your weakest is short-term timing (38%). You tend to be right about direction but early on timing. I weight your regulatory opinions heavily and your timing calls conservatively."

That is genuinely useful feedback for any trader.

### Human as Source — Rules

| Rule | Description |
|------|-------------|
| Start at 50% | Same as every other new source — no special treatment |
| Per-category tracking | Human may be great at macro and terrible at technicals — track separately |
| Claims tracked to resolution | Every human opinion becomes a claim with an expiry window |
| System always does independent research | Human opinion is a signal, not a directive — system verifies independently |
| Credibility updates automatically | Based on outcome observation, same as all sources |
| Human can see their own profile | Full transparency — the human can ask "how accurate am I?" |
| Human opinions weighted in recommendations | If human has 72% regulatory accuracy, their regulatory calls get meaningful weight in the recommendation |
| No special override weight | Human opinions are weighted by credibility, not by authority — if the human has 38% accuracy on timing, timing opinions get 38% weight regardless of how strongly they feel about it |

### Adding New Sources via Chat

The human can add new sources at any time through natural conversation:

```
Human: "Add this Twitter account: @DefiIgnas — he's one of the best DeFi researchers"
System: "Added @DefiIgnas as a Twitter source.
         Initial credibility: 50%.
         Monitoring starts next poll cycle (within 10 minutes).
         I'll track his claims and build a reliability profile over the coming weeks.
         Any specific asset focus I should watch his content for?"
```

```
Human: "Remove the WhatsApp group 'Crypto Moonshots' — it's all pump and dump garbage"
System: "Removed 'Crypto Moonshots' from monitored sources.
         Final reliability profile: overall 23%, manipulation incidents: 4.
         Existing data from this source remains in DB but will be flagged as
         low-credibility in any research that referenced it."
```

```
Human: "Add this news site to monitoring: theblock.co — check it every 15 minutes"
System: "Added theblock.co with 15-minute polling cadence (adjusted from default 30min).
         Initial credibility: 50%. First poll starts within 15 minutes."
```

### New Database Tables — Human Source

```sql
-- Human opinions submitted via chat
human_opinions (
  id,
  trader_id,
  asset_id,
  opinion_text,                  -- full text as typed by human
  claim_id,                      -- linked to claim created from this opinion
  category,                      -- system-classified category of the opinion
  horizon,                       -- time horizon the opinion applies to
  reasoning_text,                -- human's stated reasoning
  system_independent_assessment, -- what the system concluded after its own research
  system_confidence,             -- system's confidence in the human's claim
  research_actions_triggered[],  -- what MCP research the system did to verify
  submitted_at
)
```

---

## Conversational Interface — Talk to the System

### Core Concept

The system must be conversational. The human should be able to ask it questions in natural language and get clear, reasoned answers grounded in the system's actual data. This is not a chatbot wrapper around a dashboard. It is the primary way the human interacts with the system's intelligence.

The key requirement that makes this work: **the system saves its reasoning behind every change it makes.** Not just the decision — the full chain of why. Every recommendation change, every claim update, every credibility shift, every portfolio rebalance — the reasoning is stored as a first-class data object.

### What the Human Can Ask

#### Category 1: Decision Reasoning

```
Human: "Why did you change NVDA from Accumulate to Hold?"

System: "I changed NVDA from Accumulate to Hold on March 5th.

Here's why:

1. Claim C-008 (export control risk is limited) was WEAKENED on March 4th.
   - A Reuters article reported broader scope than initially expected
   - Source: Reuters (credibility: 89% on regulatory news)
   - This claim was contributing +18 points to conviction. After weakening, it contributes +6.

2. Claim C-012 (data center demand accelerating) remains ACTIVE but was not strong
   enough alone to sustain an Accumulate recommendation.

3. No new positive catalysts were identified in the last 7 days to offset the
   negative shift.

Net result: Conviction dropped from 72% to 51%. Below my Accumulate threshold of 60%.
I moved to Hold.

What would change this back: If export control scope is clarified as narrower than
Reuters reported, or if Q1 earnings beat expectations significantly."
```

#### Category 2: Source Credibility

```
Human: "How reliable is the CryptoAlpha Telegram channel?"

System: "CryptoAlpha — 14 weeks of tracking, 84 claims tracked.

Overall reliability: 71%

By category:
  Exchange listings: 80% (8/10 correct) — this is their strongest area
  Partnerships: 75% (6/8)
  Tokenomics: 85% (11/13) — very strong
  Regulatory: 45% (5/11) — weak, I discount their regulatory calls
  Price predictions: 30% (3/10) — unreliable, I mostly ignore these
  Macro: 20% (1/5) — very weak

Speed: They often break exchange and partnership news 12-18h before
mainstream coverage.

My assessment: CryptoAlpha is a valuable source for tokenomics and exchange
listing news. I weight their signals heavily in those categories. I largely
ignore their regulatory and price prediction content.

Manipulation incidents: 0 — no coordinated pump behavior detected."
```

#### Category 3: Strategy Rationale

```
Human: "Walk me through the ETH thesis"

System: "ETH — Current recommendation: Accumulate (3-month horizon) — 68% confidence

Active claims supporting this thesis:

  C-015: Blob fee revenue growing (ACTIVE, HIGH strength)
    Evidence: 3 sources confirmed L2 transaction volume increasing MoM
    Contribution: +22 points to conviction

  C-016: L2 ecosystem expansion (ACTIVE, MEDIUM strength)
    Evidence: 2 new L2s launched this month, TVL growing
    Contribution: +14 points

  C-019: Institutional staking yield attractive (ACTIVE, MEDIUM strength)
    Evidence: ETH staking yield at 4.2%, above US Treasury
    Contribution: +12 points

Claims working against:
  C-018: Ethereum Foundation selling ETH (WEAKENED)
    Evidence: Foundation sold 15,000 ETH last month
    Contribution: -8 points
    Note: Pattern memory says this typically recovers in 2-3 weeks.
          We're now 3 weeks past the sale. Effect is fading.

  C-020: SOL ecosystem gaining DeFi share (ACTIVE, LOW strength)
    Contribution: -6 points

Net conviction: +34 points → 68% confidence → Accumulate

What would invalidate this:
  - If blob fee revenue flattens or declines for 2 consecutive months
  - If ETH staking yield drops below 3%
  - If a major L2 migrates away from Ethereum

Next re-check scheduled: March 9th"
```

#### Category 4: Historical Context

```
Human: "What happened last time BTC ETF outflows were this high?"

System: "I've observed this pattern 3 times in my memory:

  1. January 15: ETF outflows $520M → BTC dropped 6.2% in 48h,
     altcoins followed within 12h with avg -8.4% drawdown.
     Recovery: BTC recovered 80% within 2 weeks.

  2. February 3: ETF outflows $480M → BTC dropped 4.1%,
     altcoins dropped 5-7%.
     Recovery: Full recovery within 10 days.

  3. February 22: ETF outflows $610M → BTC dropped 7.8%,
     this was the largest. Altcoins dropped 9-12%.
     Recovery: Took 3 weeks for full recovery.

Pattern stored (P-007): 'When BTC ETF outflows exceed $500M,
altcoins drop 4-8% within 24h. Confidence: 72% (3 observations).'

Current situation: Today's outflows are $580M. Based on the pattern,
I expect BTC to drop 5-7% and altcoins 6-9% within 24-48h.
I've already factored this into today's conviction cards for all
tracked crypto assets."
```

#### Category 5: Portfolio Reasoning

```
Human: "Why is BTC 25% of the portfolio?"

System: "BTC is 25% because it has the highest conviction score in
the portfolio: 76%.

Allocation logic:
  - BTC thesis is supported by 3 active claims, 0 contradicting
  - Conviction: 76% (highest in portfolio)
  - Asset class: crypto (target: 50-60% of portfolio)
  - Within crypto allocation, BTC gets the largest share because:
    a) Highest conviction
    b) Highest liquidity (lowest concentration risk)
    c) Halving cycle thesis is the strongest long-term claim
       in the portfolio (C-001, observed across 3 prior cycles)

  - 25% is high for a single asset. I'm comfortable because:
    a) BTC is the least volatile crypto asset tracked
    b) Invalidation conditions are clear (ETF outflows sustained >$2B/week)
    c) If invalidation triggers, I'd reduce to 15% — not exit

  - If you think 25% is too concentrated, I can model what
    20% looks like and redistribute the 5% elsewhere."
```

#### Category 6: Self-Assessment

```
Human: "How accurate have you been this month?"

System: "March 2026 — 7 days in:

Directional accuracy: 71% (5/7 resolved recommendations correct)
Average confidence on correct calls: 73%
Average confidence on incorrect calls: 52% (good — I was less
  confident on the ones I got wrong)

Best call this month: ARB partnership detection (82% confidence,
  confirmed, +28% price impact)

Worst call: NVDA — I maintained Accumulate too long before the
  export control news. Should have moved to Hold 2 days earlier.
  The Reuters source (89% credibility on regulatory) had signaled
  this but I weighted it against 2 weaker counter-sources.
  Lesson stored: when Reuters breaks regulatory news for NVDA,
  weight it heavily even against multiple weaker counter-sources.

Source highlight: CryptoAlpha Telegram channel correctly called
  3 events this week. Their tokenomics credibility is now 85%.

Pattern performance: Pattern P-007 (ETF outflows) triggered once
  this month and played out as expected."
```

#### Category 7: Comparing Human vs. System Views

```
Human: "Do you agree with my NVDA bearish call?"

System: "Your opinion: NVDA pullback expected due to export controls.

My independent assessment:

Where I agree with you:
  - Export control risk is real. Reuters (89% credibility on regulatory)
    confirms broader scope. Claim C-008 is now WEAKENED.
  - Your historical parallel to 2023 chip restrictions is noted. I don't
    have that in my memory yet (I've only been running 3 months) but
    I've logged it as a pattern hypothesis.

Where I'm less certain:
  - You said 'this month.' My research suggests the timeline is less
    certain. The regulatory process typically takes 2-4 months from
    leak to implementation.
  - Data center demand (C-012) is still strong. This could offset
    some of the regulatory downside.

My recommendation: Hold (not Reduce). Confidence: 51%.
Your implied recommendation: Reduce.

Tracked as:
  Your claim: 'NVDA pullback this month due to export controls'
  Category: regulatory + timing
  Resolution window: 30 days
  I'll compare our views when this resolves.

Your current credibility on regulatory calls: 72% (strong).
Your current credibility on timing calls: 38% (weak).
Weighted assessment: I give your directional call meaningful weight
but discount the timing specificity."
```

### Reasoning Storage Requirement

**Every change the system makes must save its full reasoning chain.** This is what makes the conversational interface possible.

```sql
decision_reasoning (
  id,
  decision_type,                 -- recommendation_change / claim_update / credibility_update /
                                 -- portfolio_rebalance / escalation / pattern_identified
  entity_type,                   -- asset / source / claim / portfolio / pattern
  entity_id,
  previous_state,                -- what it was before
  new_state,                     -- what it changed to
  reasoning_text,                -- full natural language explanation of why
  supporting_evidence_ids[],     -- news_items, claims, patterns that drove this
  contradicting_evidence_ids[],  -- what argued against this decision
  confidence_at_decision,
  context_json,                  -- any additional context (regime, recent memory, etc.)
  agent_id,                      -- which agent made this decision
  created_at
)
```

This table is the backbone of the conversational interface. When the human asks "why did you do X?", the system queries this table and constructs a natural language answer from the stored reasoning.

---

## Mock Portfolio — The System Proves Itself

### Core Concept

The system starts with a mock wallet. The human gives it:
1. An amount of money (e.g., $100,000)
2. A list of stocks and/or crypto assets to consider
3. A target: **15% return in 6 months**

The system then researches every asset, builds its own portfolio, and manages it autonomously — making allocation decisions, rebalancing, and tracking performance against the target. No real money moves. This is paper trading with full reasoning.

### Day 1-2: Research Phase

When given the asset list, the system researches every asset deeply:

```
Human: "Here's $100,000 mock capital.
        Stocks: NVDA, AAPL, TSLA, META, MSFT
        Crypto: BTC, ETH, SOL, ARB, LINK
        Target: 15% return in 6 months. Go."

System response (after 24-48h of research):

"Research complete on all 10 assets. Here's what I found:

HIGH CONVICTION (>70% confidence):
  BTC — Strong halving cycle thesis + ETF flows. 76% confidence.
  NVDA — Data center demand dominant despite regulatory risk. 71% confidence.

MEDIUM CONVICTION (50-70%):
  ETH — Blob fee growth + L2 expansion. 68% confidence.
  AAPL — Stable earnings, AI integration potential. 62% confidence.
  META — Ad revenue recovery + AI capex payoff. 60% confidence.
  SOL — DeFi ecosystem growth, high momentum. 58% confidence.

LOWER CONVICTION (<50%):
  TSLA — High volatility, mixed signals. 45% confidence.
  MSFT — Strong fundamentals but fully priced. 42% confidence.
  ARB — Partnership potential but unconfirmed. 40% confidence.
  LINK — Oracle thesis intact but slow catalyst timeline. 38% confidence.

I'm ready to build the portfolio. Want me to proceed, or do you have
opinions on any of these before I allocate?"
```

### Day 2-3: Portfolio Construction

```json
{
  "portfolio": {
    "name": "Trading Club Mock Portfolio v1",
    "initial_capital": 100000,
    "target_return_pct": 15,
    "target_date": "2026-09-07",
    "required_monthly_return_pct": 2.36,
    "created_at": "2026-03-09",
    "allocations": [
      {
        "asset": "BTC",
        "allocation_pct": 22,
        "amount_usd": 22000,
        "thesis": "Post-halving cycle + institutional ETF demand",
        "confidence": 76,
        "horizon": "6m",
        "key_claims": ["C-001", "C-002"],
        "invalidation": "Sustained ETF outflows >$2B/week for 3+ weeks",
        "reasoning": "Highest conviction crypto asset. Halving cycle pattern has produced >100% returns in prior cycles. ETF flows add new institutional demand layer. 22% allocation reflects high conviction with room for increase on pullbacks."
      },
      {
        "asset": "NVDA",
        "allocation_pct": 18,
        "amount_usd": 18000,
        "thesis": "Data center AI demand dominant despite export risk",
        "confidence": 71,
        "horizon": "6m",
        "key_claims": ["C-012", "C-008"],
        "invalidation": "Export controls confirmed broader than expected + revenue miss",
        "reasoning": "Strongest fundamentals in the stock list. Export risk is real but priced in at current levels. Revenue growth trajectory supports 6m accumulation. 18% is moderate — room to increase if export risk clarifies positively."
      },
      {
        "asset": "ETH",
        "allocation_pct": 14,
        "amount_usd": 14000,
        "thesis": "L2 ecosystem expansion + blob fee revenue growth",
        "confidence": 68,
        "key_claims": ["C-015", "C-016", "C-019"],
        "invalidation": "Blob fee revenue flattens for 2 consecutive months",
        "reasoning": "Second-highest crypto conviction. Multiple supporting catalysts. Lower allocation than BTC due to lower confidence and higher competition risk from SOL."
      },
      {
        "asset": "AAPL",
        "allocation_pct": 10,
        "amount_usd": 10000,
        "thesis": "Stable earnings base + AI integration potential",
        "confidence": 62,
        "reasoning": "Defensive allocation. Lower upside potential but lower risk. Provides portfolio stability."
      },
      {
        "asset": "META",
        "allocation_pct": 10,
        "amount_usd": 10000,
        "thesis": "Ad revenue recovery + AI capex beginning to pay off",
        "confidence": 60,
        "reasoning": "Growth allocation in proven ad business with AI optionality."
      },
      {
        "asset": "SOL",
        "allocation_pct": 8,
        "amount_usd": 8000,
        "thesis": "DeFi ecosystem momentum + fee advantage over ETH",
        "confidence": 58,
        "reasoning": "Higher risk, higher reward. Ecosystem growth is accelerating. Smaller allocation due to network reliability risk (3 outages in past year)."
      },
      {
        "asset": "TSLA",
        "allocation_pct": 4,
        "amount_usd": 4000,
        "thesis": "Optionality on robotaxi + energy business",
        "confidence": 45,
        "reasoning": "Small speculative allocation. High volatility means even a small position can contribute meaningfully to returns if thesis plays out. Low confidence means low allocation."
      },
      {
        "asset": "ARB",
        "allocation_pct": 4,
        "amount_usd": 4000,
        "thesis": "Ecosystem growth + potential partnership catalyst",
        "confidence": 40,
        "reasoning": "Small allocation on unconfirmed partnership catalyst. If confirmed, will increase. If not, will reduce."
      }
    ],
    "cash_reserve": {
      "allocation_pct": 10,
      "amount_usd": 10000,
      "reasoning": "10% cash reserve for: (1) buying pullbacks on high-conviction assets, (2) adding to new high-conviction opportunities that emerge, (3) reducing drawdown impact during volatility. Cash is a position."
    },
    "not_allocated": [
      {
        "asset": "MSFT",
        "reason": "Strong business but fully priced. No catalyst for 15% return contribution. Better opportunities elsewhere. Will add if price pulls back >10%."
      },
      {
        "asset": "LINK",
        "reason": "Thesis is intact but timeline is too slow for 6-month target. Oracle adoption is gradual. Will reconsider if a major integration catalyst appears."
      }
    ]
  }
}
```

### Portfolio Management — Ongoing

The system manages the portfolio actively:

**Daily:** Track prices, update portfolio value, log P&L
**Every 2-3 days:** Strategy re-check triggers rebalance consideration
**On claim lifecycle change:** If a key claim strengthens/weakens, consider allocation adjustment
**On critical event:** Immediate assessment of portfolio impact
**Weekly:** Portfolio performance review as part of weekly memory

### Rebalance Decisions

Every rebalance saves full reasoning:

```
Rebalance — March 15, 2026

Action: Increase ARB from 4% to 8% (+$4,000 from cash reserve)
Trigger: Claim C-022 (ARB partnership) confirmed — official announcement published
Before: ARB 4%, Cash 10%
After: ARB 8%, Cash 6%

Reasoning: "Partnership confirmed as predicted. ARB price already up 12% but
I believe the full impact will play out over 2-3 weeks based on similar
partnership announcements (Pattern P-012, confidence: 75%). Increasing
allocation to capture remaining upside. Taking from cash reserve —
maintaining minimum 5% cash floor.

Risk: If partnership impact is already fully priced in, this increase
adds downside exposure. Invalidation: if ARB gives back >50% of the
partnership gain within 5 days, I'll reduce back to 4%."
```

### Progress Tracking Against 15% Target

The system is always aware of where it stands:

```
PORTFOLIO STATUS — Week 4 (March 31, 2026)

Starting capital:    $100,000
Current value:       $103,800
Return to date:      +3.8%
Target:              +15% by September 7
Required remaining:  +10.8% in 5 months (+2.08%/month)

Status: ON TRACK (slightly ahead of 2.36%/month pace)

Top contributors:
  BTC:  +5.2% (contributed +1.14% to portfolio)
  ARB:  +28% (contributed +1.12% to portfolio — partnership played out)
  NVDA: +3.1% (contributed +0.56% to portfolio)

Detractors:
  TSLA: -8.2% (cost -0.33% — small allocation limited damage)
  SOL:  -4.1% (cost -0.33%)

Assessment: "Portfolio is performing above required pace.
BTC thesis is playing out. ARB partnership call was the best decision
this month. TSLA allocation should be reviewed — volatility is not
producing upside. Considering reducing TSLA and adding to ETH which
has strengthened."
```

### When Behind Target

```
PORTFOLIO STATUS — Week 12 (May 26, 2026)

Starting capital:    $100,000
Current value:       $106,200
Return to date:      +6.2%
Target:              +15% by September 7
Required remaining:  +8.3% in 3.3 months (+2.5%/month)

Status: BEHIND PACE

Assessment: "Currently 1.4% behind required pace. This is recoverable
but requires either current positions performing to thesis or one
high-conviction catalyst materializing.

I am NOT recommending increasing risk to catch up. Chasing returns
by over-allocating to high-volatility positions is the most common
mistake when behind target. Instead:

  1. Maintain current allocation discipline
  2. Increase research depth on highest-conviction positions
  3. Deploy remaining cash (6%) only on >75% confidence opportunities
  4. Accept that 12-14% may be the realistic outcome if no major
     catalyst materializes

The 15% target was aggressive. Being at 6.2% in 12 weeks with
controlled risk is solid performance. I'd rather deliver 13% with
low drawdown than chase 15% and risk a 20% loss."
```

This is important: the system should be honest about the target, not reckless about chasing it.

### New Database Tables — Mock Portfolio

```sql
mock_portfolios (
  id,
  name,
  initial_capital,
  target_return_pct,
  target_date,
  status,                        -- active / completed / abandoned
  created_at
)

portfolio_allocations (
  id,
  portfolio_id,
  asset_id,
  allocation_pct,
  amount_usd,
  entry_price,
  thesis_summary,
  confidence_at_entry,
  key_claim_ids[],
  invalidation_conditions,
  reasoning_text,
  allocated_at,
  is_current                     -- boolean, false when rebalanced away
)

portfolio_rebalances (
  id,
  portfolio_id,
  asset_id,
  action,                        -- increase / decrease / add / exit / hold
  previous_allocation_pct,
  new_allocation_pct,
  amount_change_usd,
  trigger_type,                  -- scheduled_recheck / critical_event / claim_change /
                                 -- human_opinion / pattern_match / target_tracking
  reasoning_text,                -- full reasoning for this rebalance
  confidence_at_decision,
  claims_driving_decision[],
  created_at
)

portfolio_daily_snapshots (
  id,
  portfolio_id,
  snapshot_date,
  total_value_usd,
  daily_return_pct,
  cumulative_return_pct,
  vs_target_pct,                 -- how far from target pace
  on_track,                      -- boolean
  allocations_json,              -- current breakdown
  best_performer_asset,
  worst_performer_asset,
  notable_events_json,           -- what happened today
  assessment_text                -- system's daily portfolio assessment
)

portfolio_weekly_reviews (
  id,
  portfolio_id,
  week_start,
  week_end,
  weekly_return_pct,
  cumulative_return_pct,
  target_pace_pct,               -- where should we be to hit target
  vs_pace_delta_pct,             -- ahead or behind
  top_contributors_json,
  top_detractors_json,
  rebalances_this_week,
  system_assessment_text,        -- full weekly portfolio analysis
  linked_weekly_memory_id,       -- connects to the weekly memory
  created_at
)
```

### Portfolio in the Knowledge Graph

```cypher
(:MockPortfolio {id, name, initial_capital, target_return, status})
(:PortfolioAllocation {asset_id, pct, confidence, thesis})-[:PART_OF]->(:MockPortfolio)
(:PortfolioAllocation)-[:BASED_ON]->(:StrategyThesis)
(:PortfolioRebalance {action, reasoning})-[:MODIFIED]->(:PortfolioAllocation)
(:PortfolioRebalance)-[:TRIGGERED_BY]->(:Claim)
(:PortfolioRebalance)-[:TRIGGERED_BY]->(:NewsItem)
(:PortfolioRebalance)-[:TRIGGERED_BY]->(:Pattern)
(:PortfolioWeeklyReview)-[:REVIEWS]->(:MockPortfolio)
(:PortfolioWeeklyReview)-[:LINKED_TO]->(:WeeklyMemory)
```

---

## Updated Phased Integration — v3.0

### Phase 1 — Complete System with Mock Portfolio

Everything needed for the system to operate autonomously from day 1:

| Feature | Phase 1 |
|---------|---------|
| All v2 features (MCP research, opinions, claims, memory) | Yes |
| Human as a source (50% start, tracked like any source) | Yes |
| Add/remove sources via chat | Yes |
| Conversational interface (ask questions, get reasoned answers) | Yes |
| Decision reasoning storage (every change saves its "why") | Yes |
| Mock portfolio creation from human-provided asset list | Yes |
| Portfolio allocation with full reasoning per position | Yes |
| Daily portfolio tracking (price, P&L, vs-target) | Yes |
| Portfolio rebalancing with saved reasoning | Yes |
| Weekly portfolio review (part of weekly memory) | Yes |
| 15% target tracking with honest assessment | Yes |

### Phase 2 — Accumulated Intelligence + Portfolio Maturity

| Feature | Phase 2 |
|---------|---------|
| Pattern recognition applied to portfolio decisions | Yes |
| Dynamic source reliability (including human profile evolution) | Yes |
| Portfolio performance attribution (which claims/patterns drove returns) | Yes |
| Human credibility profile surfacing ("here's where you're strong/weak") | Yes |
| Multi-portfolio support (test different strategies in parallel) | Yes |

### Phase 3 — Deep Intelligence

| Feature | Phase 3 |
|---------|---------|
| Historical market data research (learn from past cycles) | Yes |
| Strategy backtesting against historical data | Yes |
| Portfolio risk clustering and correlation analysis | Yes |
| Broker integration for real execution (always human-approved) | Yes |
| Multiple human traders as separate sources | Yes |

---

## Updated Core Learning Principle — v3.0

```
Week 1:  System knows nothing. It has sources, assets, and a mock portfolio.
         It ingests, classifies, researches, and forms opinions.
         The human is just another source starting at 50%.

Week 4:  System has opinions and an active portfolio.
         It tracks every claim to resolution.
         It knows which sources (including the human) are getting things right.
         Portfolio is being actively managed with full reasoning.

Week 12: System has memory, patterns, and a track record.
         It remembers what happened before and uses it.
         Human's credibility profile is taking shape — strengths and weaknesses visible.
         Portfolio performance vs. 15% target is tracked honestly.

Week 24: System is an experienced researcher with 6 months of memory.
         Source profiles are deep and multi-dimensional.
         Human knows their own strengths and blind spots.
         Portfolio target period ends — full performance review.
         System has proven (or not) whether its research translates to returns.

Week 52: System is a seasoned intelligence platform.
         A year of market memory, hundreds of resolved claims, deep source profiles.
         The human and the system have a working relationship —
         each knows what the other is good at.
```

The system is a **tireless research analyst with a perfect memory, its own portfolio to prove itself, and a human partner whose opinions it respects exactly as much as the evidence warrants.**
