# Trading Club — Product Research Report
## Full Product-Research-Team Analysis | Date: 2026-03-07

---

## 1. Executive Summary

Trading Club is a viable and differentiated product with a clear market gap to fill. Serious retail and semi-professional traders in 2026 manage complex multi-asset portfolios across a manually-assembled stack of 4–8 disconnected tools, synthesizing signals from WhatsApp groups, Telegram channels, Twitter feeds, and news sites entirely in their own heads with no audit trail, no thesis maintenance, and no structured escalation when critical news hits. No tool in the market combines: multi-source signal ingestion (especially WhatsApp + Telegram) + AI synthesis + portfolio-context recommendations + structured revision history.

The recommended product is a **supervised 6-agent research intelligence system** — not a trading bot. It ingests, synthesizes, classifies, researches, recommends, and logs. Humans approve. The core differentiator is **Traceable Conviction**: every recommendation the system produces shows exactly why it was made, what would invalidate it, and how it has evolved over time.

**Phase 1 must not include** autonomous execution, on-chain data, broker integration, or multi-user collaboration. The research and signal layer alone represents 12–18 months of meaningful product work.

---

## 2. What We're Actually Building

A **decision-support research system** — not a trading bot.

The system:
- Watches WhatsApp groups, Telegram channels, Twitter profiles, and news sites on a scheduled cadence
- Extracts links, fetches content, deduplicates at story level, and summarizes using AI
- Classifies every news item: asset, category, severity (low/medium/high/critical), time horizon
- Maintains a living research dossier per tracked asset
- Generates strategy recommendations with full traceable conviction detail
- Re-checks strategy every 2-3 days and flags stale or changed recommendations
- Escalates critical news immediately with an evidence assembly workflow
- Logs every action, reasoning, and human decision in an immutable audit trail
- Surfaces all of this through a morning digest and dashboard — with human approval required for material changes

**It does NOT:**
- Execute trades automatically
- Connect to brokers in phase 1
- Make decisions without surfacing reasoning
- Count a rumor repeated across 10 channels as 10 independent signals

---

## 3. Key Risks & Blind Spots

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Confident wrongness** — LLM produces plausible but false analysis | Critical | Mandatory confidence scores; explicit uncertainty; source traceability on every claim |
| **Rumor amplification** — same story from 5 sources counted as 5 signals | Critical | Semantic story-level deduplication; corroboration counter on every news item |
| **Stale data driving strategy** — old research guides current recommendations | High | Staleness indicators; mandatory re-check cadence; "last validated" timestamps on all dossiers |
| **WhatsApp connector compliance** | High | WhatsApp Business API or third-party — must be evaluated for ToS compliance before build |
| **Social manipulation (coordinated pump)** | High | Phase 2: engagement anomaly detection; phase 1: single-source flag + corroboration counter as partial defense |
| **Approval fatigue** — too many HITL gates | Medium | Tiered HITL model: silent approval for low-impact; active only for critical events and strategy invalidations |
| **Scope creep into execution** | High | Hard product boundary: no trade execution without explicit broker integration (phase 3, fully human-gated) |
| **On-chain complexity underestimated** | Medium | Explicitly deferred to phase 2; WhatsApp/Telegram delivers 80% of value without it |
| **LLM cost at scale** | Medium | Batch summarization; caching; use cheaper models for classification, better models for strategy synthesis |

---

## 4. Recommended Final Product Scope

### Phase 1 Scope (Build This First)
- Signal ingestion: Telegram + Twitter + News (week 1–4), WhatsApp (week 5–8)
- Link extraction + content fetching (MCP browser tool)
- Semantic deduplication engine
- AI summarizer + classifier (asset, category, severity, horizon)
- Source credibility scoring (initial static model)
- Asset research dossier (per tracked asset, updated as signals arrive)
- Strategy recommendation engine with Traceable Conviction card
- Multi-horizon strategy (2w/1m/3m/6m/1y)
- Strategy re-check scheduler (every 2-3 days)
- Critical escalation workflow (immediate, with evidence assembly)
- Tiered HITL approval model
- Override logging with mandatory reason
- Immutable audit log
- Morning digest API + dashboard
- Asset and source management

### Out of Phase 1 (Explicitly Deferred)
- On-chain data integration → Phase 2
- Social manipulation / engagement anomaly detection → Phase 2
- Multi-user collaboration → Phase 2
- Broker API integration → Phase 3 (always human-gated, never auto-execute)
- Mobile application → Phase 3
- Backtesting → Phase 3
- Position sizing engine → Phase 3

---

## 5. Recommended Agent Team Design

### 6 Agents: 1 Orchestrator + 5 Specialists

| # | Agent | Role | Primary Tools | Hard Boundaries |
|---|-------|------|--------------|----------------|
| 1 | **Orchestrator** | Supervises workflow; coordinates critical escalations; resolves conflicts | Read all outputs; trigger re-analysis; send alerts | Cannot make strategy decisions; cannot write to DB directly |
| 2 | **Signal Ingestion Agent** | Polls WhatsApp/Telegram/Twitter/news; extracts links; deduplicates | Source connectors; crawler; link extractor; dedup service | No summarization; no classification; no strategy |
| 3 | **Content Intelligence Agent** | Fetches URLs; summarizes; classifies; scores confidence; counts corroboration | Browser/MCP tool; summarizer; classifier; entity extractor | No dossier updates; no strategy recommendations |
| 4 | **Asset Research Agent** | Maintains living research dossiers; manages knowledge graph | Research DB read/write; graph read/write; market data APIs | No final strategy recommendations; no trade opinions |
| 5 | **Strategy Agent** | Generates and updates recommendations; manages revision log; produces conviction cards | Research DB read; policy rules engine; recommendation writer | No trade execution; no direct audit log writes |
| 6 | **Journal Agent** | Records all actions, decisions, and overrides in immutable audit trail | Audit log write; revision DB write; dossier/recommendation read (for diffs) | No research creation; no market interpretation; no strategy opinions |

### Why 6 and not fewer?

- **5 would require combining** Content Intelligence + Asset Research — these have fundamentally different responsibilities (raw processing vs. maintained knowledge) and combining them creates a god-agent with too much surface area
- **4 would force** combining Strategy + Asset Research — strategy requires a clean separation from research so the recommendation can challenge the dossier rather than simply echo it
- **6 is the right number:** each agent has a single, clear responsibility and a hard tool boundary that prevents scope creep

---

## 6. Agent Roles, Tools, Expertise, and Boundaries

### Orchestrator
**Expertise:** Workflow coordination, escalation management, conflict surfacing
**Tools Allowed:** Read outputs from all agents; trigger re-analysis jobs; send human alerts; manage workflow state
**Tools Denied:** Direct DB writes; strategy decision-making; content classification
**Supervision boundary:** Above all agents; activated by critical events and conflicts; does not participate in normal pipeline execution
**Escalation rule:** If any agent raises a CRITICAL severity classification, Orchestrator immediately suspends normal pipeline for that asset and convenes the critical sub-team (Content Intelligence + Asset Research + Strategy)

### Signal Ingestion Agent
**Expertise:** Multi-source connector management, link extraction, deduplication, raw event production
**Tools Allowed:** WhatsApp connector; Telegram connector; Twitter/X connector; web crawler; URL extractor; semantic dedup service
**Tools Denied:** LLM summarizer; asset classifier; research DB write; recommendation engine
**Supervision boundary:** Produces raw events only; passes to Content Intelligence via queue; cannot interpret what it ingests
**Escalation rule:** On connector failure, alert Orchestrator; continue processing from other sources; log missed window for recovery

### Content Intelligence Agent
**Expertise:** NLP, summarization, entity extraction, severity classification, confidence scoring
**Tools Allowed:** Browser/MCP tool; LLM summarizer; category classifier; entity extractor; confidence scorer; corroboration counter; news_items DB write
**Tools Denied:** Research dossier write; strategy recommendation write; audit log write (Journal Agent does this)
**Supervision boundary:** Processes raw events into structured news items; outputs to Asset Research queue; no dossier-level decisions
**Escalation rule:** On CRITICAL classification, immediately notify Orchestrator before completing normal pipeline

### Asset Research Agent
**Expertise:** Asset-specific research synthesis, thesis evolution, knowledge graph maintenance
**Tools Allowed:** Research DB read/write (dossiers only); Neo4j graph read/write; market data API adapters (future); news_items DB read
**Tools Denied:** Strategy recommendation write; audit log write; final portfolio decisions
**Supervision boundary:** Maintains dossiers as a function of incoming signals; cannot make strategy calls; passes updated dossiers to Strategy Agent
**Escalation rule:** If new signal fundamentally contradicts existing dossier thesis, flag for human review before updating

### Strategy Agent
**Expertise:** Multi-horizon portfolio strategy, conviction scoring, invalidation condition design, revision management
**Tools Allowed:** Research DB read (dossiers + news items); portfolio policy rules engine; strategy_recommendations DB write; recommendation_revisions DB write
**Tools Denied:** Audit log write; direct trade execution; raw event access; content fetching
**Supervision boundary:** Proposes recommendations only; changes above "informational" level route through HITL model; no auto-execution under any circumstance
**Escalation rule:** If strategy changes classification from any state to SELL/EXIT on a CRITICAL event, Orchestrator is notified and active human approval is required before update is applied

### Journal Agent
**Expertise:** Audit logging, revision tracking, change diffing, compliance trail maintenance
**Tools Allowed:** audit_log write (append-only); revision DB write; strategy_recommendations read (for diffs); research_dossiers read (for diffs)
**Tools Denied:** Research creation; market interpretation; strategy opinions; source ingestion
**Supervision boundary:** Receives events from all other agents; writes immutable records; cannot modify or delete any log entry; operates completely independently of the analysis pipeline

---

## 7. Supervision / Orchestration Model

```
                    ┌─────────────────────────────┐
                    │         ORCHESTRATOR         │
                    │  (Workflow + Escalation Hub)  │
                    └──────────┬──────────────────-┘
                               │ coordinates
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
  ┌───────────────┐   ┌───────────────┐   ┌────────────────┐
  │    Signal     │   │   Content     │   │    Journal     │
  │  Ingestion    │──▶│ Intelligence  │   │     Agent      │
  │    Agent      │   │    Agent      │   │  (audit sink)  │
  └───────────────┘   └──────┬────────┘   └────────────────┘
                             │                     ▲
                             ▼                     │ logs
                    ┌───────────────┐              │
                    │    Asset      │──────────────┘
                    │   Research    │
                    │    Agent      │
                    └──────┬────────┘
                           │
                           ▼
                    ┌───────────────┐
                    │   Strategy    │──────────────┐
                    │    Agent      │              │
                    └──────┬────────┘              │
                           │                       ▼
                           │              ┌─────────────────┐
                           │              │  HUMAN REVIEWER  │
                           └─────────────▶│  (approvals,     │
                                          │   overrides,     │
                                          │   decisions)     │
                                          └─────────────────┘
```

**Normal pipeline:** Signal Ingestion → Content Intelligence → Asset Research → Strategy → HITL → Human (if needed)

**Critical event pipeline:** CRITICAL classification → Orchestrator notified → Content Intelligence re-checks source → Asset Research gathers confirming/disconfirming evidence → Strategy re-analyzes → Active human approval required

**Conflict resolution:** If two agents produce contradictory outputs (rare — they operate in sequence, not debate), Orchestrator surfaces both to human with a structured conflict summary. No algorithmic auto-resolution.

---

## 8. Critical News Escalation Flow

```
Critical News Classified
         │
         ▼ (< 2 minutes)
Orchestrator Assembles Sub-Team
         │
         ├──▶ Content Intelligence: Verify source credibility
         │         • Is this source historically accurate?
         │         • Is engagement pattern anomalous (pump signal)?
         │         • Is this a derivative report or original source?
         │
         ├──▶ Asset Research: Gather confirming evidence
         │         • Find at least 1 supporting independent source
         │         • Check if existing dossier thesis anticipated this
         │
         ├──▶ Asset Research: Gather disconfirming evidence
         │         • Find counter-signals or contradictory information
         │         • Check if this contradicts established thesis
         │
         ▼ (Evidence assembled, < 5 min total)
Strategy Agent: Re-analyze affected assets
         │         • What changes to recommendation?
         │         • What are new invalidation conditions?
         │         • How confident is the new analysis?
         │
         ▼
Journal Agent: Log full incident trail
         │         • Original signal
         │         • Evidence gathered (both sides)
         │         • Strategy before/after
         │         • Timestamp chain
         │
         ▼
Human Alert Sent (push + dashboard)
         │
         ├──▶ Approve strategy change → Applied, logged, closed
         ├──▶ Dismiss alert → Dismissal reason logged, strategy unchanged
         ├──▶ Request more data → Research loop continues
         └──▶ Override with custom decision → Override logged with reason
```

**Under market crash conditions (5+ simultaneous critical events):**
- Queue by asset exposure weighting — highest-exposure assets first
- No items dropped — queue persists to Redis even on worker restart
- Alert batched into single digest after 60 seconds of continuous critical events: "X critical events firing — see digest"
- Human can dismiss all non-critical escalations and focus on the highest-severity items

---

## 9. Recommended Data Model

### PostgreSQL Schema (Structured)

```sql
-- Core asset tracking
assets (id, ticker, name, asset_class, aliases[], sector, chain, active, created_at)
monitored_sources (id, type, identifier, config_json, credibility_score, active, last_polled_at)
source_asset_mappings (source_id, asset_id, relevance_weight)

-- Ingestion pipeline
raw_events (id, source_id, content, urls[], metadata_json, ingested_at, processed, dedup_hash)
signal_dedup (content_hash, semantic_hash, canonical_event_id, first_seen, source_count)
pending_urls (id, url, raw_event_id, status, queued_at, fetched_at, content_path)

-- Intelligence layer
news_items (id, title, summary, category, asset_id, severity, time_horizon, confidence_score,
            source_count, dedup_group_id, published_at, ingested_at)
news_sources (id, news_item_id, source_url, source_type, credibility_score, raw_event_id)
confidence_breakdown (news_item_id, source_credibility, corroboration_count,
                      content_quality, freshness, specificity)

-- Research layer
research_dossiers (id, asset_id, version, summary, supporting_signals_json,
                   counter_signals_json, last_updated, staleness_score, is_current)
dossier_revisions (id, dossier_id, previous_summary, change_reason, changed_at, agent_id)

-- Strategy layer
strategy_recommendations (id, asset_id, horizon, recommendation, confidence_score,
                          invalidation_conditions_json, supporting_signals_json,
                          counter_signals_json, status, created_at, last_recheck_at)
recommendation_revisions (id, recommendation_id, previous_value, new_value,
                          reason, changed_at, triggering_news_id, agent_id)

-- Human interaction
human_actions (id, action_type, target_type, target_id, decision, reason,
               actor_id, timestamp, context_json)
alerts (id, asset_id, type, severity, status, payload_json, fired_at, resolved_at,
        resolved_by, resolution_reason)

-- Audit
audit_log (id, event_type, entity_type, entity_id, agent_id, payload_json,
           timestamp) -- APPEND ONLY, NO DELETES

-- Knowledge graph sync
graph_sync_queue (id, operation, node_type, node_id, payload_json, status, queued_at, processed_at)
```

### Neo4j Knowledge Graph Schema

```cypher
// Node definitions
(:Asset {id, ticker, name, asset_class, aliases})
(:Company {id, name, sector, exchange, country})
(:Token {id, symbol, chain, contract_address, decimals})
(:Person {id, name, roles[], affiliations[]})
(:TwitterProfile {id, handle, follower_count, credibility_score, tracked_for_assets[]})
(:Source {id, type, identifier, credibility_score, domain})
(:NewsItem {id, summary, severity, category, confidence, timestamp})
(:Claim {id, content, confidence, verified, source_count})
(:Event {id, type, description, severity, timestamp})
(:ResearchDossier {id, asset_id, version, summary, staleness_score})
(:StrategyThesis {id, asset_id, horizon, recommendation, confidence, invalidation_conditions[]})
(:Catalyst {id, description, expected_impact, time_horizon, probability})
(:Risk {id, description, severity, probability, category})

// Relationship definitions
(Source)-[:POSTED {timestamp}]->(NewsItem)
(NewsItem)-[:AFFECTS {severity, time_horizon}]->(Asset)
(NewsItem)-[:MENTIONS {context}]->(Person)
(NewsItem)-[:SUPPORTS {confidence_contribution}]->(StrategyThesis)
(NewsItem)-[:CONTRADICTS {confidence_reduction}]->(StrategyThesis)
(NewsItem)-[:CORROBORATES {similarity_score}]->(NewsItem)
(Token)-[:BELONGS_TO {ownership_type}]->(Company)
(Person)-[:WORKS_AT {role, start_date}]->(Company)
(TwitterProfile)-[:TRACKS {monitoring_intent}]->(Asset)
(TwitterProfile)-[:BELONGS_TO]->(Person)
(Source)-[:COVERS {coverage_quality}]->(Asset)
(Event)-[:IMPACTS {impact_severity, time_horizon}]->(Asset)
(Event)-[:INVOLVES]->(Person)
(Catalyst)-[:IS_CATALYST_FOR {expected_time, confidence}]->(Asset)
(Risk)-[:IS_RISK_FOR {severity, probability}]->(Asset)
(ResearchDossier)-[:COVERS]->(Asset)
(StrategyThesis)-[:BASED_ON]->(ResearchDossier)
(StrategyThesis)-[:REVISED_BECAUSE_OF]->(Event)
(Claim)-[:MADE_BY]->(Source)
(Claim)-[:ABOUT]->(Asset)
```

---

## 10. Recommended Knowledge Graph Model

### Core Entity Graph Pattern

The knowledge graph exists to answer questions that relational joins cannot efficiently handle:

1. **"What do all the sources that cover this asset have in common?"** → Source → covers → Asset
2. **"What signals in the last 7 days support vs. contradict the current thesis?"** → NewsItem → supports/contradicts → StrategyThesis
3. **"Who are the people most mentioned in connection with this asset?"** → NewsItem → mentions → Person → works at → Company → related to → Asset
4. **"What other assets are linked to the same risks?"** → Risk → is_risk_for → Asset (multiple)
5. **"Are these two news items actually the same story?"** → NewsItem → corroborates → NewsItem (with similarity score)

### Graph Traversal Use Cases

| Query | Graph Pattern | Use |
|-------|-------------|-----|
| Influence network for an asset | Asset ← covers ← Source ← posted ← NewsItem | Source quality analysis |
| Evidence chain for a recommendation | StrategyThesis ← supports/contradicts ← NewsItem ← posted ← Source | Traceable conviction rendering |
| Risk correlation across portfolio | Asset → is_risk_for ← Risk → is_risk_for → Asset (other) | Portfolio risk clustering |
| People network around an event | Event → involves → Person → works_at → Company → related_to → Asset | Stakeholder impact analysis |
| Story deduplication network | NewsItem → corroborates → NewsItem (cluster) | Single-story, many-source detection |

---

## 11. Recommended Project Architecture

### Monorepo Structure
```
trading-club/                          # TypeScript monorepo (npm workspaces or turborepo)
├── apps/
│   ├── api/                           # Fastify REST API
│   │   ├── src/routes/               # Dashboard endpoints
│   │   ├── src/middleware/           # Auth, rate limit, validation
│   │   └── src/plugins/              # DB, graph, queue plugins
│   ├── worker-ingestion/              # Signal ingestion workers
│   │   ├── src/connectors/           # WhatsApp, Telegram, Twitter, Web
│   │   └── src/jobs/                 # BullMQ job processors
│   ├── worker-intelligence/           # Content intelligence pipeline
│   │   ├── src/fetcher/              # MCP browser + HTTP fetcher
│   │   ├── src/summarizer/           # LLM summarization
│   │   ├── src/classifier/           # Asset, category, severity, horizon
│   │   └── src/deduplicator/         # Semantic dedup engine
│   ├── worker-research/               # Asset research maintenance
│   │   ├── src/dossier/              # Dossier generator and updater
│   │   └── src/graph/                # Knowledge graph sync
│   ├── worker-strategy/               # Strategy recommendation engine
│   │   ├── src/recommender/          # Multi-horizon recommendation
│   │   ├── src/conviction/           # Traceable conviction builder
│   │   └── src/recheck/              # Scheduled re-check jobs
│   └── worker-orchestrator/           # Orchestrator + critical events
│       ├── src/escalation/           # Critical event handler
│       ├── src/hitl/                 # HITL approval workflow
│       └── src/conflict/             # Conflict surfacing
├── packages/
│   ├── agents/                        # Agent definitions and prompts
│   │   ├── orchestrator/
│   │   ├── signal-ingestion/
│   │   ├── content-intelligence/
│   │   ├── asset-research/
│   │   ├── strategy/
│   │   └── journal/
│   ├── tools/                         # External tool adapters
│   │   ├── whatsapp-connector/        # WhatsApp Business API wrapper
│   │   ├── telegram-connector/        # Telegram Bot API wrapper
│   │   ├── twitter-connector/         # Twitter API v2 wrapper
│   │   ├── web-crawler/               # Cheerio + rate-limited HTTP
│   │   ├── mcp-browser/               # MCP-compatible Playwright adapter
│   │   └── deduplicator/              # Semantic similarity + hash dedup
│   ├── db/                            # PostgreSQL layer
│   │   ├── prisma/schema.prisma      # Full schema definition
│   │   ├── migrations/               # Versioned migrations
│   │   └── src/repositories/         # Per-entity DB access layer
│   ├── graph/                         # Neo4j layer
│   │   ├── src/client/               # Neo4j driver wrapper
│   │   ├── src/queries/              # Named Cypher queries
│   │   └── src/sync/                 # Pg → Graph sync service
│   ├── queue/                         # BullMQ setup
│   │   ├── src/queues/               # Queue definitions
│   │   └── src/processors/           # Shared processor base
│   ├── llm/                           # LLM client (Claude API)
│   │   ├── src/client/               # Anthropic SDK wrapper
│   │   ├── src/prompts/              # Prompt templates per use case
│   │   └── src/parsers/              # Structured output parsers
│   └── shared/                        # Shared types and utilities
│       ├── src/types/                # All TypeScript interfaces
│       ├── src/constants/            # Taxonomies, enums
│       └── src/utils/                # Validation, formatting
├── docs/
│   ├── ARCHITECTURE.md
│   ├── AGENT_TEAM_DESIGN.md
│   ├── DATA_MODEL.md
│   ├── KNOWLEDGE_GRAPH_SCHEMA.md
│   ├── EVENT_PIPELINES.md
│   └── API.md
└── config/
    ├── .env.example
    ├── monitoring-sources.example.json
    └── asset-list.example.json
```

### Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Language | TypeScript (strict) | Type safety across the entire pipeline; shared interfaces between workers |
| API | Fastify | Fastest Node.js framework; built-in schema validation; plugin system |
| Job Queue | BullMQ + Redis | Repeatable jobs for polling cadence; dead letter queues; persistent across restarts |
| Primary DB | PostgreSQL + Prisma | Relational integrity for audit logs and revision history; Prisma for type-safe queries |
| Knowledge Graph | Neo4j + official TypeScript driver | Native graph traversal for relationship queries; proven in production at scale |
| Cache / State | Redis | Dedup hashes; HITL window state; rate limit counters; queue backend |
| Browser Tool | MCP Playwright adapter | Handles JS-rendered pages; MCP-compatible for agent tool use |
| LLM | Claude API (claude-sonnet-4-6 for strategy; claude-haiku-4-5 for classification) | Sonnet for quality reasoning; Haiku for high-volume classification to control cost |
| Monitoring | Structured logging (pino) + future Prometheus/Grafana | Audit trail quality requires structured logs from day 1 |

---

## 12. What Should Be Event-Driven vs. Scheduled

| Flow | Model | Cadence / Trigger |
|------|-------|------------------|
| Telegram monitoring | Scheduled poll | Every 10 minutes (BullMQ repeatable) |
| Twitter/X monitoring | Scheduled poll | Every 10 minutes |
| WhatsApp monitoring | Scheduled poll | Every 10 minutes |
| News site crawling | Scheduled poll | Every 30 minutes |
| Link extraction | Event-driven | Triggered immediately on message ingestion |
| URL content fetch | Event-driven (queue) | Triggered immediately on link extraction |
| Summarization | Event-driven (queue) | Triggered after successful fetch |
| Asset classification | Event-driven | Triggered after summarization |
| Research dossier update | Event-driven | Triggered after classification |
| Knowledge graph sync | Event-driven (batched) | Triggered after dossier update; batched every 60s |
| Strategy recommendation update | Event-driven | Triggered after research dossier update |
| Strategy re-check | Scheduled | Every 48-72 hours per asset (BullMQ delayed) |
| Morning digest generation | Scheduled | Daily at user-configured time |
| Staleness check | Scheduled | Daily scan of all dossiers |
| Critical escalation | Event-driven (immediate) | Triggered on CRITICAL severity classification |
| HITL approval window close | Scheduled (delayed) | 4-hour delay from recommendation change |
| Audit log write | Event-driven (synchronous) | Every system action — must be synchronous |

---

## 13. What To Build in Phase 1

**Week 1-2: Foundation**
- Monorepo setup, TypeScript config, shared types
- PostgreSQL schema + Prisma + migrations
- Redis + BullMQ setup
- Claude API client wrapper (prompt templates for summarizer + classifier)
- Fastify API scaffold with auth

**Week 3-4: Ingestion Core**
- Telegram connector + polling job
- Twitter/X connector + polling job
- News site crawler (Cheerio + rate-limited HTTP)
- Link extractor
- Basic deduplication (hash-based, semantic in next sprint)
- Raw event persistence

**Week 5-6: Intelligence Pipeline**
- MCP browser adapter (Playwright)
- Content fetcher (with paywall partial-content handling)
- AI summarizer (Claude Haiku)
- Asset classifier
- Category + severity + time horizon classifier
- Semantic deduplication upgrade
- Source credibility initial model (category-based priors)
- News item persistence

**Week 7-8: Research Layer**
- Asset research dossier schema + generator
- Dossier updater (incremental on new signals)
- Neo4j setup + basic graph schema
- Knowledge graph sync (news items → graph)
- Staleness calculation + indicators

**Week 9-10: Strategy Layer**
- Strategy recommendation engine
- Multi-horizon recommendation (2w/1m/3m/6m/1y)
- Traceable conviction card builder (signals + corroboration + counter + invalidation + confidence)
- Revision history schema + writer
- Re-check scheduler (BullMQ delayed, 48-72h)

**Week 11-12: Orchestration + HITL**
- Critical escalation workflow
- Evidence assembly sub-pipeline
- Tiered HITL approval model
- Silent approval window (4h, BullMQ delayed)
- Override logging with mandatory reason
- Human alert system (dashboard + push notification hook)

**Week 13-14: WhatsApp + Dashboard**
- WhatsApp connector (WhatsApp Business API or evaluated alternative)
- Morning digest generator
- Dashboard API endpoints (digest, asset list, conviction card, audit log, source management)
- Basic dashboard UI (React — can be simple in phase 1)
- Journal Agent audit log interface

**Week 15-16: Hardening**
- Integration tests across full pipeline
- Load testing (signal volume spike simulation)
- Queue prioritization under load
- Error handling, retry logic, dead letter queues
- Monitoring and alerting setup

---

## 14. What To Delay Until Later

| Feature | Delay Until | Why |
|---------|------------|-----|
| On-chain data (Nansen/Glassnode) | Phase 2 | API cost + complexity; WhatsApp/Telegram already differentiates |
| Social manipulation detection (engagement anomaly) | Phase 2 | Requires 30+ days of baseline data before detection works |
| Multi-user collaboration | Phase 2 | Single-user validation first; adds significant DB and permission complexity |
| Knowledge graph visualization | Phase 2 | Graph must have data before visualization adds value |
| Token unlock / earnings calendar pre-alerting | Phase 2 | Calendar integration is additive; not blocking core value |
| Portfolio performance tracking vs. recommendations | Phase 2 | Needs 60+ days of recommendations before meaningful |
| Broker API integration | Phase 3 | Human approval always required; broker integration is a risk surface to add carefully |
| Mobile app | Phase 3 | Web dashboard first; validate product-market fit before mobile investment |
| Backtesting | Phase 3 | Requires historical data accumulation + financial modeling |
| Position sizing engine | Phase 3 | Requires risk modeling expertise; out of scope for research platform |
| API access (external) | Phase 3 | Internal product stability first |
| Advanced custom alert rule engine | Phase 3 | Start with standard thresholds; custom rules add complexity |

---

## 15. Final Recommendation

### 1. Recommended Final Architecture
A **TypeScript monorepo** with separate worker processes for each pipeline stage (ingestion, intelligence, research, strategy, orchestration), unified behind a Fastify API, with PostgreSQL + Prisma for structured data and Neo4j for the knowledge graph, connected by BullMQ + Redis queues. All LLM calls go through a shared Claude API client package with prompt templates per use case.

### 2. Recommended Number of Agents
**6 agents** — 1 Orchestrator/Supervisor + 5 specialist agents. This is the minimum that gives clean separation of responsibilities. Fewer would require god-agents; more would add coordination overhead without benefit.

### 3. Recommended Role Split
1. **Orchestrator** — workflow coordination, escalation management, conflict surfacing
2. **Signal Ingestion Agent** — raw event production from all sources
3. **Content Intelligence Agent** — fetch, summarize, classify, score
4. **Asset Research Agent** — dossier maintenance, knowledge graph
5. **Strategy Agent** — recommendations, conviction cards, revision log
6. **Journal Agent** — immutable audit trail, override logging

### 4. Recommended Supervision Hierarchy
Orchestrator supervises all agents. Normal pipeline is sequential (Ingestion → Intelligence → Research → Strategy → HITL → Human). Critical events bypass normal pipeline: Orchestrator convenes Intelligence + Research + Strategy immediately. Journal Agent runs in parallel as a passive listener and logger. No agent can block Journal Agent from logging.

### 5. Recommended Storage Model
- **PostgreSQL + Prisma** for all structured data (assets, news items, recommendations, revisions, audit log, human actions)
- **Neo4j** for relationship traversal (source networks, evidence chains, risk correlation across portfolio, story deduplication graph)
- **Redis** for queue backend, dedup hashes, HITL window state, rate limit counters
- **Audit log is append-only** — no deletes, no updates, only inserts. This is non-negotiable.

### 6. What Should Be Built First
In sequence:
1. Ingestion (Telegram + Twitter + news sites)
2. Content intelligence (fetch → summarize → classify)
3. Semantic deduplication
4. Asset research dossiers
5. Strategy recommendations with Traceable Conviction cards
6. Critical escalation workflow
7. HITL model with override logging
8. Morning digest + dashboard
9. WhatsApp connector (complex — comes after Telegram is stable)
10. Audit log and Journal Agent (actually built in parallel from day 1, not last)

### 7. What Should Explicitly NOT Be Built Yet
- Autonomous trade execution (never in phase 1)
- On-chain data (phase 2)
- Broker API (phase 3)
- Multi-user collaboration (phase 2)
- Mobile app (phase 3)
- Backtesting (phase 3)
- Position sizing (phase 3)
- Social manipulation detection (phase 2 — needs baseline data)

---

## Product Research Handoff Summary

**Product:** Trading Club
**Brief ID:** BRIEF-TC-001
**Research completed by:** researcher_1 (workflow & journey), researcher_2 (edge cases & differentiation)
**Requirements approved:** 2026-03-07

### Top 3 Differentiators Identified
1. **WhatsApp + Telegram ingestion** — every competitor ignores these channels; this is where retail alpha circulates and no tool currently serves this
2. **Traceable Conviction** — every recommendation exposes its full evidence chain (signals, corroboration, counter-signals, invalidation conditions, revision history) — no competitor delivers this without a Bloomberg Terminal subscription
3. **Active strategy re-check cadence** — the system actively maintains and re-validates research theses every 2-3 days; no competitor does this; traders currently do it manually or not at all

### MVP Scope Summary
Phase 1 delivers a single-user trading research intelligence platform covering signal ingestion from WhatsApp, Telegram, Twitter/X, and news sites; AI-powered summarization, classification, and deduplication; living research dossiers with staleness tracking; strategy recommendations with full traceable conviction detail; a 2-3 day automated re-check cycle; critical news escalation with evidence assembly; and a tiered human-in-the-loop approval model with mandatory override logging. No trade execution, no broker integration, no on-chain data in phase 1.

### Key Edge Cases to Solve
1. Story-level semantic deduplication — the same rumor across 10 channels must count as 1 signal, not 10
2. Critical event handling during market crashes — 5+ simultaneous critical escalations must be queued by asset exposure priority without data loss
3. WhatsApp connector compliance — WhatsApp Business API vs. third-party must be evaluated before implementation begins
4. Paywall content handling — partial content must be clearly flagged; no hallucinated summaries of content the system cannot read
5. Conflicting signals from two credible sources — system must surface both to human; never resolve algorithmically when evidence is genuinely ambiguous

**This requirements document is ready for CTO sprint planning.**
