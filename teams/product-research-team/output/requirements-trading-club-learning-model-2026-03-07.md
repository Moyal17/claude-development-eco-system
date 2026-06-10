# Trading Club — Learning Model Requirements Addendum
## Version: 1.1 | Authors: pm_1, pm_2 | Date: 2026-03-07
## Extends: requirements-trading-club-2026-03-07.md

---

## Overview

The v1 requirements define a strong supervised research platform. This addendum defines how Trading Club evolves into a **self-improving intelligence system** — one that learns from outcomes, calibrates its confidence, tracks claim lifecycles, adapts source credibility dynamically, and improves strategy policy over time through a shadow evaluation model.

The core thesis of this addendum:

> The EXTRA edge is not just **Traceable Conviction** — it is **Adaptive Conviction**.
> The system shows why it thinks something. Then it learns whether it was right. Then it gets better.

No competitor does this. Bloomberg analysts do this — they debrief after every call. Trading Club automates the debrief.

---

## The Learning Architecture — How It Works

The learning system is a **parallel background process** that never blocks the real-time pipeline. Signals still flow: Ingestion → Intelligence → Research → Strategy → Human. The learning layer runs behind that, consuming outputs and outcomes and writing calibration updates back into the system's scoring weights and prompt context.

```
FORWARD PIPELINE (real-time)
Signal Sources → Ingestion → Intelligence → Research → Strategy → Human

LEARNING PIPELINE (background)
Outcomes ─────────────────────────────────────────────────┐
Override Records ──────────────────────────────────────────┤
Claim Lifecycle Events ─────────────────────────────────── │
Source Accuracy Records ────────────────────────────────── ▼
                                              Post-Mortem Engine
                                                     │
                                          Calibration Subsystem
                                                     │
                              ┌──────────────────────┼───────────────────────┐
                              ▼                      ▼                       ▼
                   Source Credibility       Strategy Policy            Shadow Evaluator
                    Weight Updater            Optimizer               (parallel policy test)
                              │                      │                       │
                              └──────────────────────┼───────────────────────┘
                                                     ▼
                                          Updated Weights + Context
                                          fed back into forward pipeline
```

**Key principle:** The learning layer reads everything. It writes only to calibration tables, weight stores, and prompt context. It never writes directly to recommendations, dossiers, or the audit log. The forward pipeline consumes updated weights — it does not know it is being calibrated.

---

## Learning Loop 1 — Outcome Tracking

### What It Is
After every strategy recommendation, the system must eventually know what happened. Did the price move in the predicted direction? Did the event play out as classified? Was the severity right?

This is not about being a trading P&L tracker. It is about **calibrating confidence**.

### How It Works

```
Recommendation made: "Accumulate TSLA — 3-month horizon — 72% confidence"
        │
        ▼ (after 3 months)
Outcome recorded: "TSLA +18% in 3 months" → Direction: CORRECT
Confidence calibration check: 72% confidence recommendations should be right ~72% of the time
        │
        ▼
Calibration record created: {asset: TSLA, horizon: 3m, direction: correct,
                              magnitude_vs_predicted: within range,
                              confidence_at_time: 72, outcome_date: ...}
```

### Outcome Categories

| Outcome Type | Measured How | Learning Signal |
|-------------|-------------|----------------|
| Direction correct | Price moved predicted way by horizon | Positive confidence calibration |
| Direction wrong | Price moved opposite | Negative calibration — review which signals drove error |
| Severity miscalibrated | Event happened but impact smaller/larger than classified | Severity model adjustment |
| Time horizon wrong | Correct direction but wrong timing | Horizon classifier adjustment |
| Invalidation triggered | Prediction correctly self-invalidated | Invalidation conditions were well-designed |
| Override beat system | Human override outperformed system recommendation | Override win rate signal |
| System beat override | System recommendation outperformed human override | Trust-building evidence |

### What Happens with Outcomes

The Post-Mortem Engine (see Loop 5) consumes outcome records and runs a structured debrief:
- Which signals drove this recommendation?
- Which of those signals were from sources that proved accurate or inaccurate?
- Was the confidence appropriate for the outcome?
- Did the conviction card correctly identify the invalidation condition that materialized?

### New Database Tables

```sql
recommendation_outcomes (
  id,
  recommendation_id,
  asset_id,
  horizon,
  predicted_direction,       -- accumulate / reduce / hold / exit
  predicted_confidence,      -- 0-100
  outcome_direction,         -- up / down / sideways
  outcome_magnitude_pct,     -- actual % move
  direction_correct,         -- boolean
  confidence_error,          -- |predicted_confidence - actual_accuracy_at_this_confidence|
  horizon_accuracy,          -- did the timing match?
  outcome_measured_at,       -- when was this recorded
  override_applied,          -- was there a human override?
  override_direction,        -- what did human do instead?
  override_outcome,          -- did override perform better?
  notes
)

calibration_snapshots (
  id,
  snapshot_date,
  confidence_bucket,         -- e.g. "60-70%"
  total_recommendations,
  correct_count,
  calibration_error,         -- |confidence_bucket_midpoint - actual_accuracy|
  asset_class,               -- stocks / crypto
  category                   -- earnings / regulatory / sentiment / etc.
)
```

---

## Learning Loop 2 — Dynamic Source Credibility

### What It Is
The v1 design gives every source a single credibility score. This is too coarse. A source can be excellent at breaking regulatory news and terrible at predicting price impact. A Telegram channel might be a reliable first-mover on project announcements but useless on macro analysis.

Source credibility must be **multi-dimensional and dynamic**.

### How It Works

Every time a news item from a source leads to a recommendation, and that recommendation has an outcome, the source gets a credibility update:

```
Source: "CryptoLeaks Telegram Channel"
─ Posted: "Binance listing for TOKEN X imminent"
─ News classified: HIGH severity, tokenomics category
─ Recommendation updated: Accumulate TOKEN X, 2-week horizon, 68% confidence
─ Outcome (2 weeks later): TOKEN X listed on Binance, +35% price move
─ Source credibility update:
    credibility_tokenomics: +2 points
    credibility_exchange:   +2 points
    credibility_overall:    recalculated
    speed_score:            confirmed as early-mover (news broke 18h before mainstream)
    novelty_score:          confirmed as original source (not a repost)
```

### Multi-Dimensional Source Score

Replace single `credibility_score` with a full profile:

| Dimension | What It Measures | Update Trigger |
|-----------|-----------------|---------------|
| `credibility_overall` | Weighted average of category scores | Recalculated on any category update |
| `credibility_earnings` | Accuracy on earnings/revenue claims | Post-earnings outcome |
| `credibility_regulatory` | Accuracy on regulatory event claims | Post-event outcome |
| `credibility_tokenomics` | Accuracy on tokenomics/supply claims | Post-event outcome |
| `credibility_sentiment` | Correlation of sentiment calls with price | Rolling 30-day correlation |
| `credibility_technicals` | Accuracy of technical level calls | Price outcome |
| `credibility_rumor` | What % of rumors from this source prove true | Rumor resolution tracking |
| `credibility_security` | Accuracy on exploit/hack alerts | Post-event outcome |
| `speed_score` | How often this source is first to a story | Calculated against timestamp of same story in other sources |
| `novelty_score` | What % of this source's content is original vs. repost | Deduplication cross-reference |
| `manipulation_risk` | Engagement anomaly history | Pump/dump outcome tracking |

### Credibility Update Rules

- Updates are batched — not real-time — to prevent overfitting to single events
- Minimum 10 outcome records required before a category score changes significantly
- Credibility score has a floor of 0.10 — sources are never fully silenced, just heavily discounted
- Sources with 0 history start at 0.50 (neutral) and converge over 30 days of tracked outcomes
- A source can have high `credibility_earnings` and low `credibility_rumor` simultaneously — these are independent

### New Database Tables

```sql
source_credibility_profiles (
  id,
  source_id,
  credibility_overall,
  credibility_earnings,
  credibility_regulatory,
  credibility_tokenomics,
  credibility_sentiment,
  credibility_technicals,
  credibility_rumor,
  credibility_security,
  speed_score,
  novelty_score,
  manipulation_risk_score,
  sample_count,              -- how many outcomes underly this profile
  last_updated
)

source_accuracy_history (
  id,
  source_id,
  news_item_id,
  category,
  claim_verified,            -- true / false / unverifiable
  outcome_id,                -- links to recommendation_outcomes if applicable
  recorded_at
)
```

---

## Learning Loop 3 — Claim-Level Thesis Memory

### What It Is
Research dossiers in v1 are stored as blobs — a summary that gets updated. This loses information. The real structure of a thesis is a set of **claims** — specific assertions about an asset that can be individually strengthened, weakened, or invalidated.

This is the most immediately user-visible learning feature. It powers the Traceable Conviction card directly.

### How It Works

When the Asset Research Agent builds or updates a dossier, it decomposes the thesis into explicit claims:

```
Asset: NVIDIA (NVDA)
Thesis (3-month): Accumulate — 78% confidence

Claims:
  [C-001] "Data center revenue growing >100% YoY — confirmed by Q3 earnings"
           Status: ACTIVE | Strength: HIGH | Supporting: 3 sources | Contradicting: 0
           Affects: 1m, 3m, 6m horizons

  [C-002] "AMD competing on price in inference market — credible threat emerging"
           Status: ACTIVE | Strength: MEDIUM | Supporting: 2 sources | Contradicting: 1
           Affects: 3m, 6m horizons (reduces conviction)

  [C-003] "Export control risk on H100 to China — regulatory risk flagged"
           Status: WEAKENED | Strength: LOW | Supporting: 1 source | Contradicting: 2
           Affects: 6m, 1y horizons
           Note: "Latest State Dept guidance reduced scope — downgraded from HIGH"
```

### Claim Lifecycle States

```
PROPOSED ──▶ ACTIVE ──▶ STRENGTHENED
                │              │
                │              ▼
                └──────▶ WEAKENED ──▶ INVALIDATED
                                          │
                                          ▼
                                      RESOLVED
                                   (post-mortem filed)
```

| State | Description | Effect on Recommendation |
|-------|-------------|------------------------|
| `PROPOSED` | New claim, not yet corroborated | Adds to dossier; low weight |
| `ACTIVE` | Normal operating state | Normal confidence contribution |
| `STRENGTHENED` | Additional evidence confirmed it | Higher confidence contribution |
| `WEAKENED` | Counter-evidence emerged | Reduces confidence contribution |
| `INVALIDATED` | Claim proven false or obsolete | Triggers strategy re-evaluation |
| `RESOLVED` | Claim's prediction window passed; outcome known | Archived; feeds outcome calibration |

### Why This Matters for the Conviction Card

Instead of showing "recommendation changed," the system can now show:

> **Why this recommendation weakened from 78% → 61%:**
> - Claim C-003 (export control risk) was STRENGTHENED — two new sources confirmed broader scope
> - Claim C-002 (AMD competition) moved from MEDIUM to HIGH — AMD pricing announcement published
> - Claim C-001 remains ACTIVE — unchanged

This is the difference between a useful insight and a confusing number change.

### Claim Reasoning Engine

When the Strategy Agent evaluates a recommendation, it now reasons at the claim level:

```
For NVDA 3-month recommendation:
  Sum of active claim weights × confidence contributions
  = (C-001 HIGH × 0.4) + (C-002 MEDIUM × 0.35 negative) + (C-003 LOW × 0.25 negative)
  = positive net conviction → Accumulate, 61% confidence

If C-001 is INVALIDATED:
  = (C-001 INVALIDATED × 0) + (C-002 MEDIUM × 0.35 negative) + (C-003 LOW × 0.25 negative)
  = negative net conviction → trigger strategy re-evaluation → likely downgrade to Hold or Reduce
```

### New Database Tables

```sql
thesis_claims (
  id,
  asset_id,
  dossier_id,
  claim_text,
  claim_type,                -- fundamental / regulatory / competitive / sentiment / technical / macro
  status,                    -- proposed / active / strengthened / weakened / invalidated / resolved
  strength,                  -- high / medium / low
  supporting_source_count,
  contradicting_source_count,
  affected_horizons[],       -- which horizons this claim influences
  confidence_contribution,   -- positive or negative weight in recommendation
  created_at,
  last_updated,
  resolved_at,
  resolution_outcome         -- was claim correct when it resolved?
)

claim_evidence (
  id,
  claim_id,
  news_item_id,
  evidence_type,             -- supporting / contradicting
  source_credibility_at_time,
  added_at
)

claim_lifecycle_events (
  id,
  claim_id,
  from_status,
  to_status,
  reason,
  triggering_news_item_id,
  changed_at,
  changed_by_agent
)
```

### New Neo4j Relationships

```cypher
(:Claim)-[:SUPPORTS {weight}]->(:StrategyThesis)
(:Claim)-[:CONTRADICTS {weight}]->(:StrategyThesis)
(:NewsItem)-[:STRENGTHENS]->(:Claim)
(:NewsItem)-[:WEAKENS]->(:Claim)
(:NewsItem)-[:INVALIDATES]->(:Claim)
(:Claim)-[:DEPENDS_ON]->(:Claim)    // when one claim logically requires another
(:Claim)-[:RESOLVED_BY]->(:Event)
```

---

## Learning Loop 4 — Market Regime Classifier

### What It Is
A strategy system that treats all market environments as identical will systematically fail in:
- High-volatility panic events
- Trending breakout regimes
- Sideways chop (low-signal noise environment)
- Macro risk-off (correlations collapse to 1)
- Coordinated manipulation events (pump/dump)

The Market Regime Classifier is a background service that labels the current environment for each asset and for the broader market. Strategy recommendations are then weighted by regime context.

### Regime Dimensions

| Dimension | Labels | Source |
|-----------|--------|--------|
| **Volatility Regime** | low / normal / elevated / extreme | Implied or realized vol of tracked assets |
| **Liquidity Regime** | ample / constrained / crisis | Bid-ask spread patterns, exchange order book depth |
| **Event Density** | quiet / active / saturated | Count of HIGH/CRITICAL events in rolling 48h window |
| **Correlation Shock** | normal / correlated / decoupled | Cross-asset return correlation vs. 90-day baseline |
| **Sentiment Regime** | fear / neutral / greed / euphoria | Aggregate social sentiment score across tracked sources |
| **Manipulation Suspicion** | low / medium / high | Engagement anomaly count in rolling 24h window |
| **Macro Risk Posture** | risk-on / neutral / risk-off | Derived from macro news classification |

### How Regime Affects Recommendations

Regime does not change the underlying research. It changes how the Strategy Agent interprets confidence:

```
Normal regime:
  "Accumulate NVDA — 72% confidence — based on 4 supporting claims"

Elevated volatility + high event density regime:
  "Accumulate NVDA — 58% confidence (reduced from 72% — high-volatility regime active)"
  Shown to user as: "⚠ Confidence reduced in current market environment — verify before acting"

Euphoria sentiment + high manipulation suspicion:
  "Research quality warning — current environment shows signs of social coordination.
   Recommendations may be influenced by amplified sentiment signals."
```

### Regime in the Conviction Card

The Traceable Conviction card gains a new section:

> **Market Context at time of recommendation:**
> Volatility: Elevated | Event Density: Saturated | Sentiment: Greed | Manipulation Suspicion: Medium
> *Confidence adjusted downward by 14 points due to elevated regime risk*

### New Database Tables

```sql
regime_snapshots (
  id,
  snapshot_at,
  scope,                      -- 'global' or asset_id for asset-specific
  volatility_regime,
  liquidity_regime,
  event_density,
  correlation_shock,
  sentiment_regime,
  manipulation_suspicion,
  macro_risk_posture,
  regime_confidence,          -- how confident is the classifier in this label
  notes
)

recommendation_regime_context (
  recommendation_id,
  regime_snapshot_id,
  confidence_adjustment,      -- how many points regime shifted the confidence
  adjustment_reason
)
```

---

## Learning Loop 5 — Post-Mortem Engine

### What It Is
After every critical escalation and every significant recommendation change, the system runs a structured debrief. This is the core mechanism that closes the learning loop — it converts experience into calibration updates.

### When Post-Mortems Trigger

| Trigger | Delay Before Post-Mortem |
|---------|--------------------------|
| Recommendation direction changes (Hold → Reduce) | Immediate (logs the "why" at change time) |
| Critical escalation resolves | 24 hours after resolution |
| Strategy invalidated | 7 days after invalidation |
| Recommendation horizon expires | On horizon date |
| Human override applied | 24 hours after override (to capture initial reasoning) |
| Human override outcome measured | On horizon expiry |

### Post-Mortem Structure

For every post-mortem event:

```json
{
  "postmortem_id": "PM-001",
  "trigger_type": "critical_escalation_resolved",
  "asset_id": "NVDA",
  "event_summary": "...",
  "questions": {
    "was_event_real": true,
    "was_severity_correct": false,
    "severity_classified": "critical",
    "severity_actual": "high",
    "was_recommendation_correct": true,
    "was_confidence_appropriate": false,
    "confidence_at_time": 85,
    "estimated_appropriate_confidence": 65,
    "which_signals_drove_error": ["signal_id_A", "signal_id_B"],
    "which_sources_were_inaccurate": ["source_id_X"],
    "which_claims_were_invalidated": ["claim_id_C001"],
    "did_regime_affect_quality": true,
    "regime_at_time": "elevated_volatility",
    "human_override_applied": false,
    "lessons": "Source X overstated severity. Event density was saturated — should have reduced confidence."
  },
  "calibration_updates_triggered": [
    {"type": "source_credibility", "source_id": "X", "category": "regulatory", "adjustment": -3},
    {"type": "severity_model", "adjustment": "reduce critical threshold for single-source regulatory news"},
    {"type": "confidence_floor", "regime": "saturated_event_density", "adjustment": -10}
  ],
  "filed_at": "2026-03-10T08:00:00Z",
  "filed_by_agent": "orchestrator"
}
```

### What Post-Mortems Feed

| Post-Mortem Finding | Feeds Into |
|---------------------|-----------|
| Source was inaccurate | Source credibility history |
| Severity was miscalibrated | Severity classifier prompt context |
| Confidence too high | Calibration snapshot + confidence floor adjustment |
| Regime was misread | Regime classifier update |
| Claim was wrongly active | Claim lifecycle + asset research quality |
| Override beat system | Override win rate + trust score vs. system |
| Timing was off (right direction, wrong horizon) | Horizon classifier adjustment |

### New Database Table

```sql
post_mortems (
  id,
  trigger_type,
  asset_id,
  recommendation_id,
  escalation_id,
  was_event_real,
  was_severity_correct,
  severity_classified,
  severity_actual,
  was_recommendation_correct,
  was_confidence_appropriate,
  confidence_at_time,
  confidence_appropriate_estimate,
  signals_driving_error[],
  sources_inaccurate[],
  claims_invalidated[],
  regime_affected_quality,
  regime_snapshot_id,
  lessons_text,
  calibration_updates_json,
  filed_at,
  filed_by_agent
)
```

---

## Learning Loop 6 — Calibration Metrics

### What It Is
Accuracy alone is the wrong metric for a recommendation system. A system that says "Accumulate" on everything in a bull market will be 80% "correct" without providing any real value. The right metric is **calibration** — are the confidence scores accurate representations of actual accuracy?

### Core Calibration Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Calibration Error** | `|stated_confidence - actual_accuracy|` per confidence bucket | < 8 points average |
| **Reversal Frequency** | % of recommendations that flip within 30 days | < 15% |
| **Override Win Rate** | % of overrides that outperformed the system recommendation | Track, do not target |
| **Source Confidence Drift** | How much source credibility scores change month-over-month | Flag if > 20 points in 30 days |
| **Stale Thesis Exposure Rate** | % of active recommendations based on dossiers > 7 days old | < 10% |
| **Time-to-Invalidation** | Average days before an invalidation condition triggers | Track by category |
| **Claim Survival Rate** | % of claims that remain ACTIVE at horizon vs. INVALIDATED | Target > 60% |
| **Severity Accuracy** | % of CRITICAL events that were genuinely critical | Track; too many false criticals = fatigue |
| **Regime Confidence Adjustment Accuracy** | When confidence was reduced due to regime — did it help? | Track over 90 days |

### Calibration Dashboard (Internal — not primary user view)

A separate internal view shows the system's own self-assessment:

```
CALIBRATION REPORT — Rolling 90 days

Confidence Bucket | Stated | Actual | Error
60-70%            |  65%   |  61%   | -4%  ✓
70-80%            |  75%   |  71%   | -4%  ✓
80-90%            |  85%   |  68%   | -17% ✗  ← overconfident in this bucket
90-100%           |  93%   |  74%   | -19% ✗  ← significant overconfidence

Action triggered: Reduce confidence floor for 80%+ recommendations.
                  Source X contributing to overconfidence — flagged.

Override Win Rate: 34% (system won 66% of disagreements)
Reversal Frequency: 11% ✓
Stale Thesis Exposure: 7% ✓
Critical Severity Accuracy: 71% (29% of criticals were false alarms — review threshold)
```

### How Calibration Updates the System

Calibration findings do not immediately change live recommendations. They feed into the **Shadow Evaluator** (Learning Loop 7) which tests proposed policy changes in parallel before any are promoted to production.

---

## Learning Loop 7 — Shadow Evaluator

### What It Is
A parallel policy testing system. When calibration findings suggest the system should change how it weights signals, scores confidence, or interprets severity — those changes are first tested in "shadow mode" against real incoming data. The shadow model runs in parallel with the live model, producing recommendations that are stored but never shown to the user. Only when the shadow model demonstrably outperforms the live model on calibration metrics is it promoted.

### How Shadow Mode Works

```
Live recommendation pipeline ─────────────────────────────▶ User sees this
         │
         ├── (same inputs, alternative weights) ──▶ Shadow pipeline
         │                                                 │
         │                                         Shadow recommendations stored
         │                                                 │
         ▼ (after N days, outcomes known)                  ▼
     Live outcomes                               Shadow outcomes
         │                                                 │
         └────────────────────────────────────────────────-┘
                         │
                 Comparison evaluation
                         │
                 Promotion decision (human sign-off required)
```

### Promotion Criteria

A shadow model is promoted to live only when **all** of the following hold over a minimum 30-day evaluation window:

| Criterion | Threshold |
|-----------|-----------|
| Calibration error improvement | Shadow error < Live error by ≥ 5 points |
| Reversal frequency | Shadow ≤ Live |
| Override win rate | Shadow override win rate ≤ Live (system should win more) |
| No regression on critical events | Shadow severity accuracy ≥ Live |
| Human sign-off | Required — system cannot self-promote |

### What Gets Shadow-Tested

| Change Type | Shadow Test Duration |
|------------|---------------------|
| Confidence weighting adjustment | 30 days minimum |
| Source credibility model update | 14 days minimum |
| Severity threshold change | 30 days minimum |
| Regime adjustment factor change | 30 days minimum |
| New prompt template for classification | 14 days minimum |

### New Database Table

```sql
shadow_recommendations (
  id,
  shadow_model_version,
  asset_id,
  horizon,
  recommendation,
  confidence_score,
  live_recommendation_id,        -- paired with live recommendation
  invalidation_conditions_json,
  created_at
)

shadow_evaluation_runs (
  id,
  shadow_model_version,
  evaluation_start,
  evaluation_end,
  calibration_error_shadow,
  calibration_error_live,
  reversal_frequency_shadow,
  reversal_frequency_live,
  override_win_rate_shadow,
  override_win_rate_live,
  promotion_eligible,
  promoted,
  promoted_at,
  promoted_by
)
```

---

## Learning Loop 8 — Disagreement as a Training Signal

### What It Is
Every time human judgment disagrees with the system — via override, dismissal of an escalation, or manual thesis correction — that disagreement is a training signal. The system should not just log it; it should learn from the pattern of disagreements over time.

### Disagreement Record Types

| Type | What Happened | What System Learns |
|------|-------------|-------------------|
| **Direction override** | Human changed Accumulate → Hold | What signals did the system weight that the human did not trust? |
| **Escalation dismissed** | Human said "this is not critical" | Was the source or category systematically over-triggering? |
| **Confidence challenged** | Human acted as if confidence was lower than stated | System may be overconfident on this category |
| **Horizon disagreement** | Human acted on shorter/longer horizon than recommended | Horizon classifier may be miscalibrated for this asset type |
| **Repeated flip** | Recommendation changed 3+ times in 30 days | Signal quality for this asset or category is too noisy |

### Pattern Detection

After accumulating disagreement records, the system flags:

```
Pattern detected: "Analyst X consistently overrides SELL recommendations on biotech assets"
Action: Increase confidence threshold required before biotech SELL recommendations
        Show this pattern to analyst as a "Your trading profile" insight

Pattern detected: "Telegram channel Y triggers critical escalations 3x/week — 80% dismissed"
Action: Reduce Y's severity weight in escalation trigger; suggest analyst review Y's monitoring config

Pattern detected: "Recommendations flip 4x in 30 days on DeFi tokens during high-volatility regime"
Action: Apply stability filter — require 48h corroboration window before updating DeFi recommendations in volatile regime
```

### New Database Table

```sql
disagreement_records (
  id,
  disagreement_type,           -- direction_override / escalation_dismissed / confidence_challenged / etc.
  asset_id,
  recommendation_id,
  escalation_id,
  system_position,
  human_position,
  reason_given,
  regime_snapshot_id,
  category,
  asset_class,
  recorded_at
)

disagreement_patterns (
  id,
  pattern_type,
  scope,                       -- asset_id / category / source_id / regime / asset_class
  pattern_description,
  occurrence_count,
  confidence_in_pattern,
  action_triggered,
  action_status,               -- pending / applied / shadow_testing / rejected
  detected_at,
  resolved_at
)
```

---

## Learning Loop 9 — Light Portfolio Context Engine (Phase 1.5)

### What It Is
Not a full risk engine. A lightweight correlation and exposure layer that answers four questions before any recommendation is surfaced:

1. Is this asset already heavily represented in the tracked portfolio?
2. Does this event affect multiple correlated assets simultaneously?
3. Is this recommendation redundant with an existing holding?
4. Does a single critical signal impact several tracked assets?

### Why Phase 1.5 (Not Phase 1)

The Portfolio Context Engine needs 30-60 days of tracked recommendations before correlation patterns are meaningful. The data structures go in phase 1. The active analysis logic activates in phase 1.5 once there is enough portfolio history.

### Portfolio Context in the Conviction Card

```
Conviction Card — NVDA — Accumulate — 3-month

⚠ Portfolio Context:
  • NVDA already represents ~23% of tracked positions (high concentration)
  • AMD and SMCI — also tracked assets — show similar positive signals
  • Accumulating NVDA increases semiconductor exposure to ~41% of portfolio
  • Consider whether concentration risk aligns with your risk posture
```

This is not a recommendation override — it is a contextual flag. The human decides.

### New Database Tables

```sql
portfolio_snapshots (
  id,
  snapshot_at,
  asset_allocations_json,        -- {asset_id: weight}
  total_tracked_assets,
  concentration_flags_json       -- assets above threshold
)

asset_correlations (
  asset_id_a,
  asset_id_b,
  correlation_coefficient,       -- rolling 90-day
  correlation_regime,            -- what regime was this measured in
  last_updated
)
```

---

## Updated Agent Responsibilities (Still 6 Agents)

The learning system does not require a 7th agent. Learning is absorbed as background responsibilities within the existing 6, with clear ownership:

| Agent | New Learning Responsibilities Added |
|-------|-----------------------------------|
| **Orchestrator** | Trigger post-mortem engine after critical escalation resolution; manage shadow model evaluation runs; surface disagreement patterns to human as periodic "system improvement digest" |
| **Signal Ingestion Agent** | Flag engagement anomaly events (timestamp + account pattern) for manipulation suspicion scoring |
| **Content Intelligence Agent** | Tag each news item with regime context at time of processing; compute novelty score per source; compute speed score per source vs. other sources on same story |
| **Asset Research Agent** | Decompose dossier updates into claim objects; manage claim lifecycle (proposed → active → weakened → invalidated); flag claims whose supporting evidence became stale |
| **Strategy Agent** | Reason at claim level when building recommendations; apply regime adjustment to confidence; run shadow recommendation in parallel with live recommendation; consume calibration feedback from calibration subsystem |
| **Journal Agent** | Record post-mortem filings; log disagreement records; archive calibration snapshots; log shadow evaluation outcomes and promotion decisions |

**New background process (not an agent — a subsystem):**

**Calibration Subsystem** — runs on a schedule (daily), reads outcomes and post-mortems, updates calibration snapshots, identifies shadow model promotion candidates, surfaces disagreement patterns. It is a scheduled worker, not a conversational agent. It has no LLM calls — it is pure analytics over structured data.

---

## Phased Integration Plan — Learning Features

### Phase 1 — Instrument Everything (Build the Data Foundation)

These structures go into phase 1 even though the learning algorithms are not yet active. You cannot retroactively add outcome tracking. The data must accumulate from day 1.

| Feature | What Goes in Phase 1 |
|---------|---------------------|
| Claim-level thesis memory | Full claim schema, lifecycle states, claim decomposition in Asset Research Agent |
| Conviction card with claim visibility | User sees current claims and their status — immediately valuable |
| Override logging with reason | Already in v1 — feeds disagreement records |
| Outcome tracking schema | Tables created; outcomes populated manually or semi-automatically where price data available |
| Regime snapshot schema | Tables created; regime labels populated (simple rules-based initially) |
| Post-mortem schema | Tables created; post-mortems filed manually by Orchestrator after critical events |
| Source accuracy history schema | Tables created; populated as outcomes accumulate |
| Disagreement records schema | Tables created; populated from every override |
| Portfolio snapshot schema | Tables created; populated from tracked assets |

### Phase 2 — Activate the Learning Loops

Once 60+ days of data exist:

| Feature | Phase 2 Activation |
|---------|-------------------|
| Automated post-mortem engine | Orchestrator files post-mortems automatically after horizon expiry |
| Dynamic source credibility updates | Calibration subsystem runs weekly source credibility recalculation |
| Calibration snapshots | Automated weekly calibration reports |
| Disagreement pattern detection | Pattern detector runs weekly; surfaces actionable patterns |
| Regime classifier (active) | Moves from rules-based labels to ML-assisted regime detection |
| Portfolio context engine | Active concentration and correlation analysis after 60 days of portfolio history |
| Calibration dashboard | Internal view showing system's own self-assessment |

### Phase 3 — Shadow Evaluation and Policy Adaptation

| Feature | Phase 3 |
|---------|---------|
| Shadow evaluator | Parallel shadow recommendations for policy testing |
| Automated calibration feedback into prompts | Calibration findings adjust prompt context for classifiers |
| Shadow model promotion workflow | Human-gated promotion with explicit criteria |
| Full disagreement-driven weight adaptation | Pattern-detected adjustments tested via shadow model before promotion |
| Per-user calibration profile | System learns individual trader's systematic disagreement patterns |

---

## Updated EXTRA Edge Definition

**v1 EXTRA edge:** Traceable Conviction
- Shows why a recommendation was made

**v2 EXTRA edge:** Adaptive Conviction
- Shows why a recommendation was made *(Traceable)*
- Tracks whether the reasoning held up *(Claim lifecycle)*
- Measures whether confidence was appropriate *(Calibration)*
- Learns which sources to trust more or less over time *(Dynamic credibility)*
- Gets smarter from every human disagreement *(Disagreement as signal)*
- Tests policy improvements safely before applying them *(Shadow evaluation)*
- Communicates its own self-improvement to the trader *(Calibration digest)*

The last point is critical: the system should periodically show the trader how it has improved. "Last month I had a 23-point calibration error in high-confidence recommendations. This month it is 8 points. Here is what changed." That is when a trader stops seeing the system as a tool and starts seeing it as a partner.

---

## Summary — New Database Tables Required

| Table | Phase | Purpose |
|-------|-------|---------|
| `recommendation_outcomes` | 1 (schema) / 2 (active) | Track what happened after each recommendation |
| `calibration_snapshots` | 1 (schema) / 2 (active) | Confidence bucket accuracy over time |
| `source_credibility_profiles` | 1 (schema) / 2 (active) | Multi-dimensional source scores |
| `source_accuracy_history` | 1 (schema) / 2 (active) | Per-event source accuracy records |
| `thesis_claims` | 1 | Claim-level thesis decomposition |
| `claim_evidence` | 1 | Supporting/contradicting evidence per claim |
| `claim_lifecycle_events` | 1 | Audit trail of claim state transitions |
| `regime_snapshots` | 1 | Market environment labels at point in time |
| `recommendation_regime_context` | 1 | Regime context at time of each recommendation |
| `post_mortems` | 1 (schema) / 2 (active) | Structured debrief after critical events |
| `disagreement_records` | 1 | Every human override or dismissal |
| `disagreement_patterns` | 2 | Detected systematic disagreement patterns |
| `portfolio_snapshots` | 1 (schema) / 2 (active) | Asset allocation tracking |
| `asset_correlations` | 2 | Rolling correlation coefficients between tracked assets |
| `shadow_recommendations` | 3 | Parallel shadow model outputs |
| `shadow_evaluation_runs` | 3 | Shadow vs. live model comparison results |

## Summary — New Neo4j Relationships Required

```cypher
(:Claim)-[:SUPPORTS {weight}]->(:StrategyThesis)
(:Claim)-[:CONTRADICTS {weight}]->(:StrategyThesis)
(:NewsItem)-[:STRENGTHENS]->(:Claim)
(:NewsItem)-[:WEAKENS]->(:Claim)
(:NewsItem)-[:INVALIDATES]->(:Claim)
(:Claim)-[:DEPENDS_ON]->(:Claim)
(:Claim)-[:RESOLVED_BY]->(:Event)
(:Regime)-[:CONTEXT_FOR]->(:StrategyThesis)
(:PostMortem)-[:REVIEWS]->(:Event)
(:PostMortem)-[:IDENTIFIES_INACCURACY_IN]->(:Source)
```
