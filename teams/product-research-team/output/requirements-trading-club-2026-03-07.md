# Product Requirements Document: Trading Club
## Version: 1.0 | Authors: pm_1, pm_2 | CPO: Approved | Date: 2026-03-07

---

## 1. Product Vision

Trading Club is a supervised multi-agent research intelligence platform for serious retail and semi-professional traders — turning fragmented social, news, and community signals across WhatsApp, Telegram, Twitter, and the web into structured, traceable investment research with portfolio strategy recommendations that show their work.

---

## 2. Problem Statement

Serious retail traders in 2026 manage 20–200 assets across a manually assembled stack of 4–8 disconnected tools, synthesizing signals from WhatsApp groups, Telegram channels, Twitter feeds, and news sites entirely in their heads with no audit trail. Existing tools are strong on raw data but fail at synthesis, cross-source corroboration, portfolio-context recommendations, and thesis maintenance. The result: traders miss critical signals, act on rumors they can't verify, trade on stale research they forgot to update, and have no way to review why their strategy changed last week.

---

## 3. Target Personas

### Persona 1: The Active Retail Trader
- **Description**: Individual managing 20–50 positions in stocks and crypto, 1–5 trades/week, follows 10–50 assets actively
- **Goals**: Faster signal-to-decision flow; know what matters right now; not miss critical news
- **Frustrations with existing solutions**: Too many tools that don't talk to each other; can't tell which signal is real; no synthesis — all manual
- **Success looks like**: Opens one dashboard each morning; gets a prioritized digest of what changed, what it means, and what to do — with the reasoning visible

### Persona 2: The Semi-Professional Analyst
- **Description**: Portfolio manager or research analyst managing 50–200 positions, responsible for strategy recommendations to themselves or small team
- **Goals**: Structured research dossiers per asset; traceable thesis evolution; reliable re-check cadence; critical escalation system
- **Frustrations with existing solutions**: Research goes stale without a tool to maintain it; no audit trail of why strategy changed; critical events require manual assembly of scattered information
- **Success looks like**: System maintains living research per asset; re-check triggers on schedule; critical events are handled with a full evidence assembly and the analyst's decision is logged

### Persona 3: The Crypto-Native DeFi Researcher
- **Description**: Crypto-focused researcher, community-signal-dominant workflow, monitors 10–30 tokens with heavy Telegram/Twitter dependency
- **Goals**: WhatsApp + Telegram + Twitter synthesis; link extraction from messages; fast classification of project news
- **Frustrations with existing solutions**: Every tool ignores WhatsApp/Telegram; Twitter-only tools miss community alpha; no severity classification for project-specific news
- **Success looks like**: Inbound messages from 10 Telegram channels and 5 WhatsApp groups are automatically ingested, links fetched, content classified, and surfaced in a structured digest per project

---

## 4. The EXTRA Edge — Traceable Conviction

**What it is:** Every strategy recommendation the system produces is fully explainable: the signals that drove it, the sources those signals came from with credibility scores, how many independent sources corroborate it, the counter-signals that argue against it, the explicit conditions that would invalidate the recommendation, and a full revision history showing what changed and why.

**Why competitors don't do this:** Messari research is static and manual. Kaito AI surfaces signals but does not synthesize them into recommendations. Telegram bots produce uncontextualized alerts. TradingView community ideas are user-generated noise. No tool maintains a living, reasoned thesis per asset with transparent evidence and a revision history accessible to the trader.

**How Trading Club owns this:** Every recommendation UI component is a "conviction card" — not a number or a rating, but a structured artifact showing: signals → corroboration → counter-signals → invalidation conditions → confidence score → revision log. This is the product's core differentiator and must be present in the MVP.

---

## 5. Feature List — MoSCoW Prioritized

### Must Have (MVP)

| # | Feature | Research Source | Persona(s) | Notes |
|---|---------|----------------|-----------|-------|
| M-01 | WhatsApp message ingestion connector | R1: WhatsApp is underserved alpha channel | All | 10-min cadence |
| M-02 | Telegram message ingestion connector | R1: Telegram is primary crypto community channel | All | 10-min cadence |
| M-03 | Twitter/X profile monitoring | R1: Breaking news + influencer monitoring | All | 10-min cadence, configurable profiles |
| M-04 | News/website crawler | R1: Structured news sites + project blogs | All | 30-min cadence, configurable URLs |
| M-05 | URL/link extraction from messages | R1: Links in messages are primary content payload | Crypto, Retail | Extract + queue for fetch |
| M-06 | Browser/MCP content fetcher | R1: Fetch and read full content of extracted links | All | Handles paywalls gracefully (marks partial) |
| M-07 | Semantic deduplication engine | R2: Rumor amplification is Critical failure mode | All | Story-level dedup, not just URL |
| M-08 | AI summarizer | R1: Synthesis is the core workflow gap | All | Per-article/message summary |
| M-09 | Asset classifier (which asset does this relate to) | R1: Asset-specific routing is the foundation | All | Ticker + token name + aliases |
| M-10 | News severity classifier (low/medium/high/critical) | R1: Severity routing drives escalation | All | Must be explicit, not implicit |
| M-11 | Time horizon classifier (intraday/2w/1m/3m/6m/1y) | R1: Strategy horizons defined in brief | All | Per news item |
| M-12 | News category classifier | R1: Category taxonomy required | All | See category taxonomy below |
| M-13 | Source credibility scoring | R2: Trust mechanics are the differentiation | All | Historical accuracy + anomaly detection |
| M-14 | Corroboration counter | R2: Single-source overreaction is High failure mode | All | Count of independent sources per story |
| M-15 | Asset research dossier per tracked asset | R1: Living research is the core product loop | All | Updated as signals arrive |
| M-16 | Strategy recommendation per asset | R1: The output traders actually need | All | Hold/Watch/Accumulate/Reduce/Exit |
| M-17 | Multi-horizon strategy (2w/1m/3m/6m/1y) | Brief requirement | All | Short/medium/long distinguished |
| M-18 | Traceable conviction card (the EXTRA edge) | R2: This is the EXTRA edge | All | Signals + corroboration + counter + invalidation + revision |
| M-19 | Confidence score per recommendation | R2: Explicit uncertainty is safety requirement | All | Composite of source quality + corroboration |
| M-20 | Invalidation conditions per recommendation | R2: "What would make this wrong" is the key insight | All | Explicit conditions, not vague |
| M-21 | Strategy re-check trigger (every 2-3 days) | Brief requirement | All | Scheduled re-check with staleness alert |
| M-22 | Critical news escalation workflow | R1: Escalation is where traders lose most money | All | Assemble evidence, re-strategize, alert human |
| M-23 | Tiered HITL approval model | R2: Tiered approval prevents approval fatigue | All | Informational: auto; recommendation change: silent window; critical: active |
| M-24 | Human override logging with mandatory reason | R2: Override log is the trust-building mechanism | All | Every override must capture reason |
| M-25 | Audit log for all system actions | Brief requirement | All | Every action, reasoning, and decision logged |
| M-26 | Morning digest view | R1: Entry point must reduce cognitive load | All | Prioritized digest, critical first |
| M-27 | Asset tracking management (add/remove assets) | Foundational requirement | All | Supports stocks and crypto |
| M-28 | Monitored source management | Brief requirement | All | Add/remove WhatsApp groups, Telegram channels, Twitter profiles, websites |
| M-29 | Staleness indicators on research and recommendations | R2: Stale data driving strategy is High failure mode | All | Visual freshness indicator per dossier |
| M-30 | Journal/activity log of all research and decisions | Brief requirement | All | Full timeline of what happened and why |

### Should Have (Post-MVP v1)

| # | Feature | Research Source | Persona(s) | Notes |
|---|---------|----------------|-----------|-------|
| S-01 | On-chain data integration (Nansen/Glassnode APIs) | R1: Valuable but costly | Crypto | Phase 2 |
| S-02 | Source engagement anomaly detection (pump detection) | R2: Social manipulation is High risk | All | Requires historical baseline |
| S-03 | Knowledge graph visualization | R1+R2: Graph relationships help analysts | Analyst | Visual exploration |
| S-04 | Token unlock / vesting schedule pre-alerting | R2: Crypto-specific edge case | Crypto | Calendar integration |
| S-05 | Earnings calendar pre-alerting | R2: Stocks-specific edge case | Stocks | Pre-event monitoring |
| S-06 | Portfolio performance tracking vs. recommendation accuracy | R1: Power user progression | All | Did the system recommendations perform? |
| S-07 | Collaborative research (shared knowledge graph) | R2: "Trading Club" naming implies this | Team users | Adds significant complexity |
| S-08 | Custom alert rules and thresholds | R1: Power user configuration | Analyst | Per-asset, per-source |

### Could Have (Future Consideration)

| # | Feature | Research Source | Persona(s) | Notes |
|---|---------|----------------|-----------|-------|
| C-01 | Broker integration (pre-filled order parameters) | Brief requirement, deferred | All | Behind manual approval — phase 3 |
| C-02 | Backtesting of strategy recommendations | R1: Power user feature | Analyst | Requires historical data |
| C-03 | Position sizing engine | Brief requirement, deferred | Analyst | Requires risk model |
| C-04 | API access for programmatic integration | R1: Power user progression | Power users | Phase 3 |
| C-05 | Mobile-native app | Operational requirement | All | Phase 3 |
| C-06 | Discord monitoring | Adjacent to Telegram | Crypto | Phase 2+ |

### Won't Have (Explicitly Out of Scope — Phase 1)

| # | Feature | Reason |
|---|---------|--------|
| W-01 | Autonomous trade execution | Safety: human approval required for all trades, always |
| W-02 | Portfolio risk modeling / VaR | Complexity: requires financial modeling expertise beyond scope |
| W-03 | Broker API integration (phase 1) | Deferred to phase 3: validation of research quality comes first |
| W-04 | On-chain data (phase 1) | Deferred to phase 2: API cost + complexity, WhatsApp/Telegram delivers 80% of value |
| W-05 | Multi-user / team collaboration (phase 1) | Deferred to phase 2: single-user first |
| W-06 | Mobile app (phase 1) | Web dashboard first; mobile is phase 3 |
| W-07 | Regulatory compliance filing | Out of scope entirely |

---

## 6. News Category Taxonomy

All news items must be classified into one of the following categories:

| Category | Description |
|----------|-------------|
| `earnings` | Quarterly/annual earnings results, guidance updates |
| `product` | Product launches, feature releases, roadmap updates |
| `regulatory` | Government actions, SEC filings, legal proceedings, bans |
| `macro` | Interest rates, inflation, broad market conditions |
| `sentiment` | Social sentiment shifts, community mood changes |
| `technicals` | Price action, volume anomalies, chart patterns |
| `on-chain` | Wallet activity, smart contract events, DeFi metrics |
| `security` | Exploits, hacks, vulnerabilities, rug pulls |
| `personnel` | Executive changes, team departures, key hire announcements |
| `partnerships` | New partnerships, integrations, business development |
| `tokenomics` | Token unlock, burn, supply changes, fork announcements |
| `exchange` | Exchange listing/delisting, trading pair additions |
| `funding` | Investment rounds, grants, institutional purchases |
| `rumor` | Unverified claims — flagged separately for lower confidence weighting |

---

## 7. MVP Definition

The MVP is a single-user trading research intelligence system that:
1. Ingests signals from WhatsApp, Telegram, Twitter/X, and configured news sites
2. Extracts links, fetches content, deduplicates at story level, and summarizes
3. Classifies every news item by asset, category, severity, and time horizon
4. Maintains a living research dossier per tracked asset
5. Generates and updates strategy recommendations with full traceable conviction detail
6. Re-checks strategy every 2-3 days with staleness alerts
7. Escalates critical news with evidence assembly and human alert
8. Logs every action, decision, and override with reasons
9. Presents a morning digest as the primary UI entry point

**MVP explicitly excludes:** autonomous trade execution, on-chain data, broker integration, multi-user collaboration, mobile app, backtesting.

**MVP Success Metrics:**
- Signal-to-digest latency: < 15 minutes for non-critical signals
- Critical escalation latency: < 5 minutes from news ingestion to human alert
- Deduplication accuracy: < 5% false positives (same story counted twice)
- Strategy recommendation coverage: 100% of tracked assets have an active recommendation
- Re-check cadence compliance: 100% of recommendations re-checked within 3 days of last review
- User engagement: trader opens dashboard within 1 hour of morning digest generation ≥ 4 days/week

---

## 8. User Stories with Acceptance Criteria

### Epic 1: Signal Ingestion

#### US-001: WhatsApp Group Monitoring
**As an** active retail trader,
**I want** the system to automatically ingest messages from my configured WhatsApp groups every 10 minutes,
**so that** I don't have to manually check each group and can trust the platform to surface relevant signals.

**Acceptance Criteria:**
- Given a WhatsApp group is configured as a monitored source, when a new message is posted, then the system ingests it within 10 minutes
- Given a message contains one or more URLs, when the message is ingested, then each URL is extracted and queued for content fetching
- Given the same URL appears in multiple messages, when processed, then it is fetched once and linked to all source messages
- Given a message contains no actionable content (e.g., greetings, off-topic), when classified, then it is archived without generating a news item
- Given the WhatsApp connection drops, when reconnected, then all missed messages since last successful poll are retrieved

#### US-002: Telegram Channel Monitoring
**As a** crypto-native DeFi researcher,
**I want** the system to monitor configured Telegram channels every 10 minutes,
**so that** project announcements and community alpha are captured without me monitoring each channel manually.

**Acceptance Criteria:**
- Given a Telegram channel is configured, when a new message is posted, then it is ingested within 10 minutes
- Given a message contains a link to a tweet, article, or announcement page, when ingested, then the link is extracted and the target content is fetched and summarized
- Given a Telegram bot message is received (often formatted with emojis and no URLs), when processed, then the text is extracted and classified
- Given a channel posts 50+ messages in 10 minutes (high-activity event), when processed, then messages are queued and processed in order without data loss

#### US-003: Twitter/X Profile Monitoring
**As an** active retail trader,
**I want** the system to monitor specific Twitter/X profiles I configure every 10 minutes,
**so that** I don't miss tweets from analysts and project accounts I follow.

**Acceptance Criteria:**
- Given a Twitter/X profile is configured, when a new tweet, reply, or thread is posted, then it is ingested within 10 minutes
- Given a tweet contains external links, when processed, then links are extracted and target content is fetched
- Given a tweet thread is detected, when ingested, then the full thread is captured (not just the first tweet)
- Given rate limits are hit, when the next poll window opens, then missed tweets are retrieved without duplication

#### US-004: News Site Crawling
**As an** active retail trader,
**I want** the system to crawl configured news sites every 30 minutes,
**so that** relevant articles are captured and summarized without me manually scanning news.

**Acceptance Criteria:**
- Given a news site is configured, when new articles are published, then they are ingested within 30 minutes
- Given an article requires browser rendering (JavaScript), when fetched, then the browser/MCP tool is used and full content is captured
- Given an article is behind a paywall and cannot be fully fetched, when summarized, then the summary is marked as "partial — paywall" with a clear indicator
- Given the same article is linked from multiple sources, when processed, then it is fetched once and linked to all source references

### Epic 2: Content Intelligence

#### US-005: Semantic Deduplication
**As** the system (internal),
**I want** to deduplicate news items at the story level (not just URL level),
**so that** the same rumor spreading across 5 channels is not counted as 5 independent signals.

**Acceptance Criteria:**
- Given the same story is published by 3 different sites within 2 hours, when processed, then a single normalized news item is created with 3 linked sources
- Given two messages reference the same event with different wording, when classified with > 85% semantic similarity, then they are merged with both sources linked
- Given a genuine follow-up article adds new information to a prior story, when detected, then a new news item is created linked to the original (not merged)
- Given deduplication merges items, when a user views a news item, then all source links are visible

#### US-006: News Classification
**As** the system (internal),
**I want** to classify every news item by asset, category, severity, and time horizon,
**so that** items can be routed correctly and users can filter by what matters to them.

**Acceptance Criteria:**
- Given a news item is processed, when classification runs, then the item receives: asset name/ticker, category (from taxonomy), severity (low/medium/high/critical), and time horizon (intraday/2w/1m/3m/6m/1y)
- Given a news item mentions multiple assets, when classified, then each relevant asset receives its own classification entry
- Given a news item cannot be confidently classified, when saved, then severity defaults to "low" and category to the closest match with a "low confidence" flag
- Given a critical severity is assigned, when saved, then the critical escalation workflow is triggered immediately

### Epic 3: Asset Research & Strategy

#### US-007: Asset Research Dossier
**As** a semi-professional analyst,
**I want** the system to maintain a living research dossier for each tracked asset,
**so that** I always have an up-to-date research summary without doing it manually.

**Acceptance Criteria:**
- Given a new asset is added to tracking, when first added, then an initial research dossier is generated within 24 hours
- Given new signals are classified for an asset, when processed, then the dossier is updated to incorporate the new information
- Given no new signals have been received for an asset for 7 days, when the staleness check runs, then the dossier is marked as "potentially stale" with a visual indicator
- Given a user views a dossier, when displayed, then it shows: summary, supporting signals with sources, counter-signals, last updated timestamp, and staleness status

#### US-008: Strategy Recommendation with Traceable Conviction
**As** an active retail trader,
**I want** each asset strategy recommendation to show me the specific signals and reasoning behind it,
**so that** I can decide whether I agree with the conclusion before acting on it.

**Acceptance Criteria:**
- Given a strategy recommendation is generated for an asset, when displayed, then it shows all of the following: recommendation (Hold/Watch/Accumulate/Reduce/Exit), confidence score (0-100%), supporting signals list with source and credibility score, counter-signals list, explicit invalidation conditions, and last revision date
- Given the recommendation changes from one state to another (e.g., Hold → Accumulate), when changed, then the previous recommendation is preserved in the revision history with a reason for the change
- Given a user views the conviction card, when looking at supporting signals, then each signal shows: source, original content snippet, credibility score, corroboration count
- Given a recommendation has a confidence score below 40%, when displayed, then a visual low-confidence warning is shown

#### US-009: Multi-Horizon Strategy
**As** a semi-professional analyst,
**I want** to see separate strategy recommendations for different time horizons,
**so that** I can manage short-term trades separately from long-term positions.

**Acceptance Criteria:**
- Given an asset is tracked, when recommendations are generated, then separate recommendations are produced for: 2-week, 1-month, 3-month, 6-month, and 1-year horizons
- Given short-term and long-term recommendations conflict (e.g., 2-week: Reduce, 1-year: Accumulate), when displayed, then the conflict is highlighted with an explanation
- Given a user views multi-horizon recommendations, when viewing, then the distinguishing signals for each horizon are visible

#### US-010: Strategy Re-Check Cadence
**As** an active retail trader,
**I want** the system to automatically re-check each asset's strategy every 2-3 days,
**so that** my strategy doesn't go stale without me noticing.

**Acceptance Criteria:**
- Given an asset's strategy was last reviewed more than 3 days ago, when the re-check trigger fires, then the strategy agent re-evaluates the recommendation using current research
- Given the re-check produces no change, when complete, then the recommendation is marked as "re-confirmed" with a new timestamp
- Given the re-check produces a change, when complete, then the change is logged in the revision history with supporting reasoning and the human is notified via dashboard alert
- Given the re-check produces a recommendation to invalidate the strategy, when surfaced, then the human receives an active notification requiring explicit decision

### Epic 4: Critical Escalation

#### US-011: Critical News Escalation
**As** an active retail trader,
**I want** the system to immediately assemble evidence and alert me when critical news hits,
**so that** I'm not caught flat-footed by material events.

**Acceptance Criteria:**
- Given a news item is classified as "critical", when classified, then the escalation workflow starts within 2 minutes
- Given escalation is triggered, when the evidence assembly runs, then at minimum: confirming signals, counter-signals, and source credibility check are gathered before the human is alerted
- Given the evidence assembly is complete, when the alert is sent, then the alert includes: asset name, news summary, severity, confirming signals, counter-signals, current recommendation impact, and recommended human action
- Given the human receives a critical alert, when responding, then they can: approve a strategy change, dismiss the alert with a reason, or request additional research — all options are accessible from the alert itself
- Given a critical alert is dismissed, when logged, then the dismissal reason is recorded in the audit trail
- Given 5+ critical escalations fire simultaneously (market crash scenario), when queuing, then they are prioritized by asset exposure and processed without data loss

### Epic 5: Human-in-the-Loop

#### US-012: Tiered Approval Model
**As** an active retail trader,
**I want** the system to only require my active input for critical events,
**so that** I don't get approval fatigue from confirming every minor update.

**Acceptance Criteria:**
- Given a system action is classified as "informational" (digest, log, summary), when executed, then no human approval is required and action proceeds automatically
- Given a recommendation changes (non-critical update), when triggered, then a 4-hour silent approval window opens — if not overridden, the change is applied and logged
- Given a critical escalation occurs, when fired, then active human approval is required before strategy is updated — system does not auto-update under critical events
- Given a strategy is being invalidated entirely, when triggered, then active human decision is required (cannot be silently approved)

#### US-013: Override Logging
**As** a semi-professional analyst,
**I want** every override I make to be logged with my reasoning,
**so that** I can review my own decision history and the system can learn from my corrections over time.

**Acceptance Criteria:**
- Given a user overrides any system recommendation, when submitted, then the override is blocked from saving without a reason field (minimum 10 characters)
- Given an override is saved, when logged, then it records: user decision, original recommendation, override value, reason, timestamp, and asset context
- Given a user views an asset's history, when displayed, then all past overrides with reasons are visible in the revision timeline
- Given the user has overridden the same recommendation direction 3+ times for an asset, when the pattern is detected, then a suggestion is surfaced to adjust the system's weighting for that asset type

### Epic 6: Audit & Logging

#### US-014: Full Audit Log
**As** a semi-professional analyst,
**I want** a complete audit trail of all system actions and decisions,
**so that** I can understand exactly why my portfolio recommendations look the way they do at any point in time.

**Acceptance Criteria:**
- Given any system action occurs (signal ingested, classified, recommendation updated, escalation fired, approval received), when the action completes, then an immutable audit log entry is created within 1 second
- Given a user queries the audit log for a specific asset, when displayed, then all events for that asset are shown in chronological order with full context
- Given a user wants to understand why a recommendation changed on a specific date, when they navigate to that date in the audit log, then the full reasoning chain is available (signals considered, weights applied, decision made)
- Given the audit log grows beyond 6 months, when queried, then older entries are archived but remain queryable

### Epic 7: Configuration

#### US-015: Source Management
**As** a crypto-native DeFi researcher,
**I want** to add and remove WhatsApp groups, Telegram channels, Twitter profiles, and websites as monitored sources,
**so that** my signal intake matches my actual information network.

**Acceptance Criteria:**
- Given I add a new WhatsApp group, when configured, then monitoring begins within the next scheduled poll cycle (max 10 minutes)
- Given I remove a source, when removed, then monitoring stops immediately and existing content remains in the database
- Given I configure a Twitter profile, when saved, then I can specify whether to monitor tweets, replies, and/or threads independently
- Given I add a news site, when saved, then I can specify the polling cadence (30min default) and whether to follow extracted links from articles

---

## 8. Edge Case Requirements

| # | Edge Case | Severity | Requirement | Acceptance Criteria |
|---|-----------|----------|-------------|---------------------|
| EC-01 | Same story across 5+ channels simultaneously | High | Semantic dedup merges to single item with N sources | No single story counts as more than 1 independent signal regardless of how many channels re-post it |
| EC-02 | Critical news outside market hours | High | 24/7 monitoring, time-aware escalation | Critical alerts fire at any hour; alert includes "outside market hours" context for stocks |
| EC-03 | Contradictory signals from two credible sources | High | "Conflicting signals" state surfaced to human | System must not resolve genuine conflict algorithmically — must surface to human with both sides |
| EC-04 | Paywall blocks content fetch | Medium | Partial summary with clear "paywall" flag | Summary marked as partial; user sees indicator and can investigate manually |
| EC-05 | Asset delisted from exchange | Critical | Delisting as first-class event type | Detected within 10 minutes of announcement; triggers critical escalation; removes from active portfolio |
| EC-06 | WhatsApp/Telegram connection drops | High | Retry with message recovery | On reconnection, all messages since last successful poll are retrieved and processed |
| EC-07 | Signal volume spike (50x normal — market crash) | Critical | Queue prioritization under load | Critical severity items processed first; queue does not drop items; system remains operational |
| EC-08 | Bulk asset import (50+ assets at once) | Medium | Async research generation with progress | Initial research generated async; user sees progress indicator; no timeout |
| EC-09 | Research dossier not updated for 7+ days | Medium | Staleness indicator + re-check trigger | Visual staleness warning shown; scheduled re-check triggered |
| EC-10 | Stablecoin depeg event | Critical | Stablecoin category + critical severity | Any stablecoin deviating > 1% from peg triggers critical escalation for all affected positions |
| EC-11 | Source with no prior history added | Medium | Default low-confidence weighting | New sources start with 50% credibility score; score adjusts over 30 days of tracked accuracy |
| EC-12 | Same asset mentioned with different identifiers (BTC/Bitcoin/BTCUSD) | Medium | Asset alias normalization | All known aliases mapped to canonical asset record; no duplicate asset dossiers |

---

## 9. Differentiation Requirements

| # | Differentiator | Requirement | How It Beats Competitors |
|---|---------------|-------------|--------------------------|
| D-01 | WhatsApp + Telegram ingestion | Full message ingestion with link extraction from both platforms | Every competitor ignores these channels; this is where retail alpha circulates |
| D-02 | Traceable Conviction card | Every recommendation exposes: signals, corroboration, counter-signals, invalidation conditions, confidence, revision history | No competitor provides this; Bloomberg analysts do this manually at $25k/year |
| D-03 | Semantic deduplication | Story-level dedup counts rumors correctly across channels | Competitors count each re-post as an independent signal; Trading Club counts them as one |
| D-04 | Strategy re-check cadence (2-3 days) | Scheduled re-check with explicit "confirmed/changed/invalidated" output | No competitor actively maintains and re-validates a strategy thesis |
| D-05 | Staleness indicators | Every research item and recommendation shows its freshness status | No competitor actively warns traders when their research is getting stale |
| D-06 | Override log with mandatory reason | Every human override is logged with reason — creates trust-building loop | Creates an audit trail of trader vs. system disagreements that can be reviewed |
| D-07 | Multi-source corroboration counter | Every news item shows how many independent sources confirm it | Prevents single-source overreaction; surface-level in any competitor |
| D-08 | Critical escalation evidence assembly | Critical events trigger evidence gathering before alerting, not after | Competitors fire the alert and leave the research to the trader |

---

## 10. Recommended Agent Team Design

### 10.1 Agent Team — 6 Agents Total

| Agent | Role | Expertise | Inputs | Outputs | Tools Allowed | Tools Denied |
|-------|------|-----------|--------|---------|--------------|-------------|
| **Orchestrator** | Supervisor + Critical Event Handler | Orchestration, delegation, escalation management | All agent outputs, incoming signals | Workflow coordination, critical alerts, conflict resolution | Read all outputs; trigger re-analysis; send alerts | Write to DB directly; make strategy decisions |
| **Signal Ingestion Agent** | Multi-source connector and raw event producer | WhatsApp, Telegram, Twitter/X, web crawling, link extraction | Configured sources | Raw events, extracted URLs, deduplicated story objects | Source connectors; crawler; link extractor; dedup service | Summarization; classification; strategy opinions |
| **Content Intelligence Agent** | Summarizer, classifier, and confidence scorer | NLP, content analysis, entity extraction, category classification | Raw events, fetched content | Summaries, classifications, asset mappings, confidence scores, corroboration counts | Browser/MCP fetcher; summarizer; classifier; entity extractor | Portfolio decisions; strategy recommendations |
| **Asset Research Agent** | Living research dossier maintainer | Per-asset fundamental and news-driven research | Classified signals, research DB, knowledge graph | Research dossier updates, thesis updates, supporting/counter evidence | Research DB read/write; knowledge graph read/write; market data APIs | Trade recommendations; strategy final decisions |
| **Strategy Agent** | Recommendation engine and revision manager | Portfolio strategy, multi-horizon analysis, conviction scoring | Research dossiers, knowledge graph | Strategy recommendations, confidence scores, invalidation conditions, revision log entries | Research DB read; portfolio policy rules engine; recommendation writer | Direct DB writes outside recommendation schema; trade execution |
| **Journal Agent** | Audit trail and revision historian | Logging, audit, versioning, change tracking | All agent outputs | Audit log entries, thesis diffs, revision records, compliance trail | Audit log write; revision DB write; thesis versioner | Research creation; market interpretation; strategy opinions |

### 10.2 Supervision Model

```
Orchestrator
├── Signal Ingestion Agent    [ingests, deduplicates, queues]
│   └── → Content Intelligence Agent [summarizes, classifies, scores]
│       └── → Asset Research Agent  [updates dossiers, knowledge graph]
│           └── → Strategy Agent    [generates/updates recommendations]
│               └── → Journal Agent [logs all actions and decisions]
└── Critical Event Path:
    └── On CRITICAL severity: Orchestrator assembles sub-team
        ├── Content Intelligence (source credibility re-check)
        ├── Asset Research (evidence gathering — both sides)
        └── Strategy (re-analysis) → Human Alert
```

### 10.3 Agent Supervision Boundaries

- **Orchestrator** orchestrates but does not implement. Cannot make strategy decisions directly.
- **Signal Ingestion** produces raw events only. No strategy opinions allowed.
- **Content Intelligence** classifies and scores. Cannot update research dossiers or make recommendations.
- **Asset Research** maintains dossiers. Cannot make final strategy recommendations.
- **Strategy Agent** proposes only. Cannot execute trades. Cannot write directly to audit log.
- **Journal Agent** writes only. Cannot create research or make recommendations.
- **Disagreement resolution:** If two agents produce conflicting classifications for the same signal, Orchestrator surfaces both to human reviewer with a structured conflict summary. System does not auto-resolve.

---

## 11. Non-Functional Requirements

### Performance
- Signal ingestion latency: < 10 minutes for all scheduled sources
- Critical escalation pipeline (classify → evidence → alert): < 5 minutes end-to-end
- Content fetch + summarize: < 60 seconds per article
- Strategy re-check (per asset): < 120 seconds
- Dashboard morning digest load: < 3 seconds

### Reliability
- Source connectors must implement retry with exponential backoff (max 3 retries)
- Message queues must be persistent — no signal dropped on service restart
- Critical escalation pipeline must have 99.9% uptime target
- All DB writes must be idempotent — duplicate processing must not create duplicate records

### Security & Privacy
- WhatsApp and Telegram content must be stored encrypted at rest
- Source credentials (API keys, auth tokens) must be stored in secrets manager — never in code or config files
- Audit logs must be append-only — no delete operations permitted
- All external HTTP requests must validate TLS; no self-signed certificates in production

### Explainability
- Every recommendation must be accompanied by human-readable reasoning (not just a score)
- Every confidence score must be accompanied by its component scores (source credibility, corroboration, freshness, specificity)
- Every classification must expose the classifier's reasoning in at least one sentence

### Auditability
- Every action in the system must generate an immutable audit log entry
- The full state of any recommendation at any point in time must be reconstructable from the audit log
- Human overrides must be stored with reason, timestamp, and user context — no anonymous overrides

---

## 12. Recommended Data Model

### 12.1 PostgreSQL — Structured Data

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `assets` | id, ticker, name, asset_class (stock/crypto), aliases[], active | Tracked assets |
| `monitored_sources` | id, type (whatsapp/telegram/twitter/website), config, active, last_polled_at | Configured sources |
| `raw_events` | id, source_id, content, urls[], metadata, ingested_at, processed | Raw ingested messages |
| `news_items` | id, title, summary, category, asset_id, severity, time_horizon, confidence, source_count, ingested_at | Normalized news |
| `news_sources` | id, news_item_id, raw_event_id, source_url, credibility_score | Source links per news item |
| `research_dossiers` | id, asset_id, summary, supporting_signals[], counter_signals[], last_updated, staleness_score | Per-asset research |
| `strategy_recommendations` | id, asset_id, horizon, recommendation, confidence, invalidation_conditions[], created_at, status | Strategy per asset per horizon |
| `recommendation_revisions` | id, recommendation_id, previous_value, new_value, reason, changed_at, agent_id | Revision history |
| `human_actions` | id, action_type, target_id, decision, reason, actor, timestamp | All human approvals and overrides |
| `audit_log` | id, event_type, entity_type, entity_id, payload, agent_id, timestamp | Immutable audit trail |
| `alerts` | id, asset_id, type, severity, status, fired_at, resolved_at | Alert history |
| `signal_dedup` | id, content_hash, semantic_hash, first_seen, source_count | Deduplication index |

### 12.2 Knowledge Graph (Neo4j) — Relationship Model

| Node Type | Key Properties |
|-----------|---------------|
| `Asset` | ticker, name, asset_class, aliases |
| `Company` | name, sector, exchange |
| `Token` | symbol, chain, contract_address |
| `Person` | name, role, affiliation |
| `TwitterProfile` | handle, follower_count, credibility_score |
| `Source` | type, identifier, credibility_score |
| `NewsItem` | summary, severity, category, timestamp |
| `Claim` | content, confidence, verified |
| `Event` | type, timestamp, severity |
| `ResearchDossier` | asset_id, version, summary |
| `StrategyThesis` | asset_id, horizon, recommendation, confidence |
| `Catalyst` | description, expected_impact, time_horizon |
| `Risk` | description, severity, probability |

| Relationship | From → To | Properties |
|-------------|----------|-----------|
| `POSTED` | Source → NewsItem | timestamp |
| `AFFECTS` | NewsItem → Asset | severity, time_horizon |
| `MENTIONS` | NewsItem → Person | context |
| `SUPPORTS` | NewsItem → StrategyThesis | confidence_contribution |
| `CONTRADICTS` | NewsItem → StrategyThesis | confidence_reduction |
| `BELONGS_TO` | Token → Company | ownership_type |
| `TRACKED_BY` | TwitterProfile → Asset | monitoring_intent |
| `FOLLOWED_BY` | Source → Person | relationship_type |
| `IMPACTS` | Event → Asset | impact_severity |
| `IS_CATALYST_FOR` | Catalyst → Asset | expected_time |
| `IS_RISK_FOR` | Risk → Asset | severity |
| `CORROBORATES` | NewsItem → NewsItem | similarity_score |
| `RESULTED_IN` | Event → StrategyThesis | revision_reason |

---

## 13. Recommended Project Architecture

### 13.1 Structure

```
trading-club/
├── apps/
│   ├── api/                    # Fastify REST API (user-facing dashboard backend)
│   ├── worker-ingestion/       # Signal ingestion workers (WhatsApp/Telegram/Twitter/News)
│   ├── worker-intelligence/    # Content intelligence pipeline (fetch/summarize/classify)
│   ├── worker-research/        # Asset research dossier maintenance
│   ├── worker-strategy/        # Strategy recommendation engine + re-check scheduler
│   └── worker-orchestrator/    # Orchestrator + critical event coordinator
├── packages/
│   ├── agents/                 # Agent definitions, prompts, and behaviors
│   │   ├── orchestrator/
│   │   ├── signal-ingestion/
│   │   ├── content-intelligence/
│   │   ├── asset-research/
│   │   ├── strategy/
│   │   └── journal/
│   ├── tools/                  # Tool adapters (browser, crawler, connectors)
│   │   ├── whatsapp-connector/
│   │   ├── telegram-connector/
│   │   ├── twitter-connector/
│   │   ├── web-crawler/
│   │   ├── mcp-browser/
│   │   └── deduplicator/
│   ├── db/                     # Database clients, Prisma schema, migrations
│   ├── graph/                  # Neo4j client and graph query layer
│   ├── queue/                  # BullMQ queue definitions and worker base
│   └── shared/                 # Types, interfaces, constants, utilities
├── docs/
│   ├── ARCHITECTURE.md
│   ├── AGENT_TEAM_DESIGN.md
│   ├── DATA_MODEL.md
│   └── API.md
└── config/
    ├── .env.example
    └── monitoring-config.example.json
```

### 13.2 Event-Driven vs. Scheduled

| Flow | Model | Rationale |
|------|-------|-----------|
| Signal ingestion (WhatsApp/Telegram/Twitter) | **Scheduled polling** (BullMQ repeatable jobs) | External APIs; push not available |
| News site crawling | **Scheduled polling** (30-min BullMQ jobs) | Batch processing appropriate |
| Link extraction | **Event-driven** (triggered by ingestion) | Must happen immediately after message arrives |
| Content fetch + summarize | **Event-driven** (queue per URL) | Parallel processing; rate limited |
| Asset classification | **Event-driven** (queue per news item) | Triggered after summarization |
| Research dossier update | **Event-driven** (triggered by classification) | Incremental update per new signal |
| Strategy re-check | **Scheduled** (every 2-3 days, per asset) | Batch re-evaluation |
| Critical escalation | **Event-driven** (immediate trigger on CRITICAL classification) | Cannot be delayed |
| Morning digest generation | **Scheduled** (daily, user-configurable time) | Batch aggregation |
| Audit logging | **Event-driven** (every system action triggers log write) | Must be immediate and atomic |

### 13.3 Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| API | **Fastify** | Fastest Node.js framework; schema validation built-in |
| Workers | **BullMQ + Redis** | Battle-tested job queue; repeatable jobs for scheduling; dead letter queues |
| Primary DB | **PostgreSQL + Prisma** | Relational integrity for recommendations and audit; Prisma for type safety |
| Knowledge Graph | **Neo4j** | Native graph queries for relationship traversal; well-documented TypeScript driver |
| Caching | **Redis** | Dedup hashes; session state; rate limit counters |
| Browser/Crawl | **MCP browser tool + Playwright** | Handles JS-rendered pages; MCP adapter for agent use |
| Message Queue | **Redis Streams or BullMQ** | Event passing between workers |
| LLM | **Claude API (claude-sonnet-4-6)** | Summarization + classification + research synthesis |

---

## 14. Phased Implementation Plan

### Phase 1 — Research Intelligence Core (MVP)

**Goal:** Working ingestion + classification + research + strategy recommendation + audit

**What to build:**
1. Signal ingestion workers (Telegram + Twitter + news sites first — WhatsApp is complex, comes 2nd within phase 1)
2. Link extraction and content fetcher (MCP browser tool)
3. Semantic deduplication engine
4. Summarizer + classifier (asset, category, severity, horizon)
5. Source credibility scoring (initial model, improves over time)
6. Asset research dossier system
7. Strategy recommendation engine with traceable conviction
8. Strategy re-check scheduler (2-3 days)
9. Critical escalation workflow
10. Tiered HITL approval model
11. Override logging with mandatory reason
12. Audit log
13. Morning digest API
14. Basic dashboard (asset list, recommendation view, conviction card, audit log)
15. WhatsApp connector (added after Telegram is stable — more complex auth)

**Explicitly NOT in Phase 1:**
- On-chain data
- Broker integration
- Multi-user / collaboration
- Mobile app
- Backtesting
- Advanced engagement anomaly detection (social manipulation)

**Phase 1 success:** A single user can add 20 assets, connect 5 Telegram channels, 10 Twitter profiles, and 5 news sites, and receive a daily structured digest with traceable recommendations that re-check themselves every 3 days.

### Phase 2 — Signal Quality & Intelligence Expansion

**What to build:**
1. On-chain data integration (Nansen or free alternatives first)
2. Engagement anomaly detection (social manipulation defense)
3. Token unlock / earnings calendar pre-alerting
4. Knowledge graph visualization
5. Portfolio performance tracking vs. recommendation accuracy
6. Multi-user collaboration (shared knowledge graph, per-user recommendation views)
7. Source engagement anomaly detection (pump detection signals)
8. Discord monitoring

### Phase 3 — Decision Support & Integration

**What to build:**
1. Broker API integration (pre-filled order parameters behind manual approval — never auto-execute)
2. Mobile app (React Native)
3. Backtesting of historical recommendations
4. Position sizing guidance engine (risk-adjusted)
5. API access for programmatic integration
6. Advanced custom alert rule engine

---

## 15. Explicit Out-of-Scope (Phase 1)

- Autonomous trade execution (never in phase 1, always human-gated)
- On-chain data (phase 2)
- Broker integration (phase 3)
- Multi-user collaboration (phase 2)
- Mobile application (phase 3)
- Backtesting (phase 3)
- Portfolio risk modeling / VaR (phase 3)
- Regulatory compliance filing (out of scope entirely)
- Social manipulation engagement anomaly detection (phase 2 — requires baseline data)
- Position sizing engine (phase 3)

---

## Appendix A: PM Cross-Consultation Log

| Topic | PM-1 Position | PM-2 Position | Resolution |
|-------|-------------|-------------|-----------|
| On-chain in MVP | Include as optional | Exclude entirely — too complex | **Exclude from phase 1.** Researcher_2 and researcher_1 both recommend this. WhatsApp/Telegram alone differentiates phase 1. |
| Traceable Conviction in MVP | Yes — must have | Yes — non-negotiable | **Full agreement: Traceable Conviction card is phase 1 Must Have.** This is the EXTRA edge and cannot be deferred. |
| HITL model | Tiered silent approval | Agreed + override reason mandatory | **Full agreement: tiered model with mandatory override reason.** Both mechanisms are Must Have. |
| Agent count | 5 agents + 1 orchestrator = 6 | Agreed | **6 total: Orchestrator + 5 specialist agents.** Matches brief constraint exactly and the natural workflow boundaries. |
| WhatsApp timing | Build first alongside Telegram | Build second — Telegram is simpler | **Telegram first, WhatsApp second within phase 1.** Both in phase 1 but sequenced by complexity. |
| Morning digest | Primary UI entry point | Agreed | **Morning digest is the primary user-facing entry point.** Dashboard starts with digest view. |

---

## Appendix B: Research Traceability Matrix

| Requirement ID | Source | Researcher | Finding Summary |
|----------------|--------|-----------|----------------|
| M-01 through M-04 | Competitive analysis | researcher_1 | WhatsApp and Telegram are underserved; Twitter and news sites are baseline expectation |
| M-07 | Failure mode analysis | researcher_2 | Rumor amplification is a Critical failure mode; story-level dedup is required |
| M-13, M-14 | Trust mechanics research | researcher_2 | Source credibility scoring and corroboration counting are the core signal quality mechanisms |
| M-16, M-17, M-18, M-19, M-20 | EXTRA edge + trader frustration | researcher_2 | Traceable Conviction is the market gap; traders explicitly want to see the reasoning |
| M-21 | Competitive workflow analysis | researcher_1 | No competitor actively re-checks and maintains strategy theses |
| M-22 | Critical escalation analysis | researcher_1 | Critical events are where traders lose the most money; escalation is a first-class workflow |
| M-23, M-24 | HITL design research | researcher_2 | Tiered approval prevents fatigue; override logging creates trust loop |
| M-25, M-30 | Audit requirements | researcher_2 | Auditability is a trust feature, not a compliance feature |
| M-29 | Staleness failure mode | researcher_2 | Stale data driving strategy is a High failure mode |
| D-01 | Competitive gap analysis | researcher_1+2 | WhatsApp/Telegram ignored by all competitors |
| D-02 | EXTRA edge articulation | researcher_2 | Traceable Conviction is the core differentiation claim |
| D-03 | Failure mode: rumor amplification | researcher_2 | Competitors count re-posts as independent signals |
| D-04 | Competitive workflow gap | researcher_1 | No competitor maintains and re-validates strategy theses |
| D-05 | Staleness failure mode | researcher_2 | No competitor warns traders about stale research |
