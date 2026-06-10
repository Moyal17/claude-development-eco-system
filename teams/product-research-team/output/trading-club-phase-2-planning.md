# Phase 2 — Trading Club Implementation Plan

> **Note:** First implementation step is to copy this plan to `docs/phase_2_planning.md` for codebase tracking.

## Context

All Phase 1 epics (E-01–E-16) are complete. The platform has a working API, 4 worker apps, PostgreSQL/Prisma data layer, BullMQ queue infrastructure, and LLM integration. Phase 2 adds a React frontend, manual outcome tracking, self-improving intelligence (source credibility, regime classification, shadow evaluation), and model calibration reporting. This plan covers E-17 through E-22.

**User decisions locked in:**
- Paper trading (simulated P&L). Architecture must support future broker API with no structural rework.
- Asset management via UI "Add Asset" search — not API-only.
- Outcome marking is manual: user picks direction (BUY/SELL/HOLD), magnitude threshold, and reasoning.
- Free macro data only (VIX, Fear & Greed, macro calendar). On-chain data deferred.
- Calibration transparency: Model Health section in weekly digest only — no separate push notification.
- Notifications: configurable in settings (email default, + WhatsApp/Telegram/in-app). Full delivery stack is a stub in Phase 2.

---

## Implementation Order

```
Parallel batch 1 (no dependencies):
  E-18  Outcome Tracking         ← foundation for E-19 + E-22
  E-20  Market Regime Classifier ← independent

Parallel batch 2 (after E-18):
  E-19  Source Credibility       ← needs E-18 outcome data
  E-21  Shadow Evaluation        ← independent
  E-22  Calibration Dashboard    ← needs E-18 + Digest model

After batch 2:
  E-17  React Frontend           ← consumes all API endpoints from above
```

---

## E-18: Outcome Tracking

**Why:** Foundation for the self-improving system. Every other intelligence epic depends on outcome signals.

### Prisma changes — `packages/db/prisma/schema.prisma`
Add `OutcomeDirection` Prisma enum:
```prisma
enum OutcomeDirection { BUY SELL HOLD }
```
Extend `RecommendationOutcome` model:
- Add: `direction OutcomeDirection`, `magnitudeThreshold Float`, `reasoning String @default("")`, `correct Boolean @default(false)`
- Add: `recommendation StrategyRecommendation @relation(fields: [recommendationId], references: [id])`
- Add back-relation `outcomes RecommendationOutcome[]` to `StrategyRecommendation`

**Migration:** `packages/db/prisma/migrations/<ts>_e18_outcome_tracking/migration.sql`
- Add columns + Prisma enum + FK constraint
- Pre-migration: `DELETE FROM recommendation_outcomes WHERE recommendation_id NOT IN (SELECT id FROM strategy_recommendations)` (orphan cleanup before FK add)

### Files to create
- `packages/db/src/repositories/outcome.repo.ts` — `create()`, `findByRecommendationId()`, `findByAssetId()`
- `apps/api/src/routes/outcomes.ts` — `POST /api/v1/recommendations/:id/outcome`, `GET /api/v1/recommendations/:id/outcome`
- `apps/api/src/__tests__/routes/outcomes.test.ts` — `vi.hoisted()` pattern, 5+ tests

### Files to modify
- `packages/db/src/index.ts` — export `OutcomeRepo`
- `packages/shared/src/enums/index.ts` — add `OutcomeDirection` TS enum (mirrors Prisma enum)
- `apps/api/src/app.ts` — register `outcomesRouter` at `/api/v1/recommendations`

### Data flow
`POST /recommendations/:id/outcome` → Zod validate → `OutcomeRepo.create()` → enqueue `research.source-credibility` job (E-19) with `{ recommendationId, outcomeId }`

### Edge cases
- Recommendation not found → 404
- Multiple outcomes per recommendation allowed (time-series)
- `correct` is user-supplied — system never auto-computes it

---

## E-19: Dynamic Source Credibility

**Why:** After outcomes are marked, adjust source weights to reflect track record.

### Queue additions
- Constant: `RESEARCH_SOURCE_CREDIBILITY = 'research.source-credibility'` in `packages/shared/src/constants/index.ts`
- Schema: `SourceCredibilityJobSchema = z.object({ recommendationId: uuid, outcomeId: uuid })` in `packages/queue/src/schemas.ts`
- Queue + DLQ + registry entry in `packages/queue/src/queues.ts`

### Files to create
- `apps/worker-research/src/workers/source-credibility.worker.ts`
  - Load outcome → get `correct` bool
  - Load claims for asset → trace `ClaimEvidence → NewsItem → sourceId`
  - Deduplicate source IDs
  - For each source: load/create `SourceProfile`, increment `totalSignals`, conditionally increment `correctSignals`, recompute `reliabilityScore = correctSignals / totalSignals`
  - Check `FF_SOURCE_RECALCULATION` flag before processing
- `apps/worker-research/src/__tests__/source-credibility.worker.test.ts` — 4 tests

### Files to modify
- `apps/worker-research/src/main.ts` — register `SourceCredibilityWorker`
- `packages/db/src/repositories/source.repo.ts` — add `upsertProfile()`, `findProfileBySourceId()`
- `apps/api/src/routes/sources.ts` — implement 501 stub for `GET /sources/:id/profile`

---

## E-20: Market Regime Classifier

**Why:** Contextualizes recommendations with macro market state (BULL/BEAR/SIDEWAYS/HIGH_VOLATILITY/RISK_OFF).

### External APIs (all free, no keys)
- VIX: `https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d`
- Fear & Greed: `https://api.alternative.me/fng/`
- Macro calendar: `https://nfs.faireconomy.media/ff_calendar_thisweek.json` (ForexFactory public feed)

### Classification rules
| Condition | Regime |
|-----------|--------|
| VIX > 30 | HIGH_VOLATILITY (overrides) |
| VIX > 20 AND F&G < 30 | BEAR + RISK_OFF |
| VIX < 15 AND F&G > 60 | BULL |
| F&G 30–60 | SIDEWAYS |
| Default | SIDEWAYS |

### Queue additions
- Constant: `RESEARCH_REGIME_CLASSIFICATION = 'research.regime-classification'`
- Schema: `RegimeClassificationJobSchema = z.object({ traderId: nonEmptyString, triggeredBy: z.enum(['cron', 'manual']) })`
- Queue + DLQ + registry entry

### New Prisma enum + config
- Add `MarketRegime` enum to `packages/shared/src/enums/index.ts`
- Add `REGIME_CLASSIFICATION_CRON: z.string().default('0 6 * * *')` to `packages/shared/src/config.ts`
- Add `VIX_FALLBACK_VALUE: z.number().default(20)` as fallback when Yahoo Finance is down

### Files to create
- `apps/worker-research/src/workers/regime-classification.worker.ts`
- `packages/db/src/repositories/regime.repo.ts` — `createSnapshot()`, `findLatest()`, `findRecent()`
- `apps/api/src/routes/regime.ts` — `GET /api/v1/regime/current`
- `apps/api/src/__tests__/routes/regime.test.ts`
- `apps/worker-research/src/__tests__/regime-classification.worker.test.ts`

### Files to modify
- `apps/worker-research/src/main.ts` — register worker + BullMQ daily repeat job
- `packages/db/src/index.ts` — export `RegimeRepo`
- `apps/api/src/app.ts` — register `regimeRouter`
- Cron registration: daily `{ repeat: { cron: config.REGIME_CLASSIFICATION_CRON } }` in worker-research main

### Edge cases
- Yahoo Finance down → use `VIX_FALLBACK_VALUE`, log warning, continue
- Macro calendar 404 → log warning, classify using VIX + F&G only
- Multiple runs same day → each creates new snapshot row (time-series, no upsert)

---

## E-21: Shadow Evaluation Engine

**Why:** Tests alternative LLM strategies in parallel with live pipeline without affecting recommendations.

### Queue additions
- Constant: `ORCHESTRATOR_SHADOW_EVALUATION = 'orchestrator.shadow-evaluation'`
- Schema: `ShadowEvaluationJobSchema = z.object({ traderId: nonEmptyString, modelVersion: nonEmptyString, notes: z.string().optional() })`
- Queue + DLQ + registry entry (add DLQ per architect warning — no alerting on it, but keeps infrastructure consistent)

### Config additions
- `SHADOW_MODEL_VERSION: z.string().default('shadow-v1')`
- `SHADOW_EVAL_CRON: z.string().default('0 5 * * 0')` (Sundays 05:00 UTC)
- `SHADOW_EVAL_MAX_ASSETS: z.coerce.number().default(50)`

### Worker logic (`apps/worker-orchestrator/src/workers/shadow-evaluation.worker.ts`)
1. Check `FF_SHADOW_EVALUATION` — if false, skip
2. Load all active assets (up to `SHADOW_EVAL_MAX_ASSETS`)
3. Per asset: load dossier + active claims → build shadow strategy prompt (same `buildStrategyPrompt` with alternative temperature/preamble constant) → LLM call → parse result
4. Create `ShadowEvaluationRun` (one per job)
5. Per asset: create `ShadowRecommendation` linked to run
6. Compare shadow `type` vs live recommendation `type` — if different, create `DisagreementRecord`

### Files to create
- `apps/worker-orchestrator/src/workers/shadow-evaluation.worker.ts`
- `packages/db/src/repositories/shadow.repo.ts` — `createRun()`, `createRecommendation()`, `findRecentRuns()`, `findRecommendationsByRunId()`, `createDisagreement()`, `countDisagreementsForRun()`
- `apps/api/src/routes/shadow.ts` — `GET /shadow/runs`, `GET /shadow/runs/:id`, `POST /shadow/runs/trigger`
- `apps/api/src/__tests__/routes/shadow.test.ts`
- `apps/worker-orchestrator/src/__tests__/shadow-evaluation.worker.test.ts`

### Files to modify
- `apps/worker-orchestrator/src/main.ts` — register `ShadowEvaluationWorker` + weekly BullMQ repeat job
- `packages/db/src/index.ts` — export `ShadowRepo`
- `apps/api/src/app.ts` — register `shadowRouter` at `/api/v1/shadow`

---

## E-22: Calibration Dashboard (Model Health in Digest)

**Why:** Closes the learning loop — makes model accuracy visible in the weekly digest.

### New Prisma model — `Digest`
```prisma
model Digest {
  id         String   @id @default(uuid())
  traderId   String   @default("primary_trader")
  digestDate String   // YYYY-MM-DD
  content    String
  metadata   Json
  createdAt  DateTime @default(now())

  @@unique([traderId, digestDate])
  @@map("digests")
}
```
**Migration:** `packages/db/prisma/migrations/<ts>_e22_digest_table/migration.sql`

### Files to create
- `packages/db/src/repositories/digest.repo.ts` — `upsert()`, `findByDate()`, `findRecent()`

### Files to modify
- `packages/db/src/repositories/outcome.repo.ts` — add `getAccuracyByTier(since, until)`, `getAccuracyByHorizon(since, until)`, `getOverallAccuracy(since, until)`
- `packages/llm/src/prompts/digest.ts` — add `modelHealthSection` param to `buildDigestPrompt`; append "Model Health" section to template
- `apps/worker-strategy/src/workers/build-digest.worker.ts`:
  - At start: check `DigestRepo.findByDate(today)` — if exists, skip LLM call (idempotent)
  - Query outcomes for prior 7 days and 7–14 day window (trend comparison)
  - Pass `modelHealthData` to `buildDigestPrompt`
  - After LLM call: persist to `Digest` table via `DigestRepo.upsert()`
- `apps/api/src/routes/digest.ts` — implement 501 stubs: `GET /api/v1/digest` (array), `GET /api/v1/digest/:date`
- `packages/db/src/index.ts` — export `DigestRepo`

---

## E-17: React Frontend (`apps/web`)

**Why:** Makes the intelligence system observable and actionable via a web UI.

### Key architectural constraint
`apps/web` uses Vite (ESM). It must **never** import `@trading-club/*` packages — CJS/ESM boundary. All data via HTTP only.

### `apps/web/tsconfig.json` (NOT extending `tsconfig.base.json`)
Must use `"module": "ESNext"`, `"moduleResolution": "bundler"` — isolated from monorepo CJS config.

### Tech stack
React 18 + Vite 5 · TypeScript · React Router v6 · TanStack Query v5 · Tailwind CSS v3 · shadcn/ui (Radix) · TradingView Lightweight Charts v4

### Vite dev proxy
```ts
server: { proxy: { '/api': 'http://localhost:3000' } }
```
No CORS issues in dev. `VITE_AUTH_TOKEN` in `.env` injected into all requests via `api/client.ts`.

### New API backend routes needed (before frontend is useful)

| Endpoint | File | Notes |
|----------|------|-------|
| `GET /api/v1/assets?q=<term>` | `routes/assets.ts` | Add `q` filter |
| `GET /api/v1/assets/:id/news` | `routes/assets.ts` | Top 5 news items |
| `GET /api/v1/assets/:id/candles` | `routes/candles.ts` | Serve `candlesChartData/<class>/<symbol>.json` |
| `POST /api/v1/portfolio/:id/allocations` | `routes/portfolio.ts` | Set asset allocation % |
| `DELETE /api/v1/portfolio/:id/allocations/:assetId` | `routes/portfolio.ts` | Remove allocation |

Security note: candles route must sanitize `Asset.symbol` via `path.resolve` + base-dir check to prevent path traversal (symbol already validated as `[A-Z0-9]` by creation schema — double-check at read time).

### Component tree summary

```
AppShell (Sidebar + TopBar)
├── PortfolioPage (/)
│   ├── PortfolioSummaryCard
│   ├── AssetAllocationTable      (with recommendation badge, conviction %)
│   └── AddAssetModal             (search → POST /assets → POST /portfolio/:id/allocations)
├── AssetDetailPage (/assets/:id)
│   ├── StrategyCard
│   ├── CandleChart               (TradingView Lightweight Charts)
│   ├── TopNewsPanel              (top 5 news)
│   ├── TraceableConviction       (expandable claims with citations)
│   ├── RevisionHistory           (timeline + MarkOutcomeModal)
│   └── DossierPanel
├── AlertQueuePage (/alerts)
│   ├── AlertCard (approve/dismiss + reason)
│   └── ConvictionPanel (slide-out)
├── DigestPage (/digest)
│   └── react-markdown rendered content + previous digests list
└── SettingsPage (/settings)
    ├── NotificationPreferences   (email/WhatsApp/Telegram/in-app toggles — delivery stubs)
    ├── SourceManagement
    └── WatchlistManagement
```

### Full directory structure
All under `apps/web/src/`:
- `api/` — `client.ts`, `assets.ts`, `recommendations.ts`, `alerts.ts`, `portfolio.ts`, `digest.ts`, `sources.ts`, `outcomes.ts`, `regime.ts`
- `components/layout/` — `AppShell.tsx`, `Sidebar.tsx`, `TopBar.tsx`
- `components/charts/` — `CandleChart.tsx`
- `components/portfolio/` — `PortfolioSummaryCard.tsx`, `AssetAllocationTable.tsx`, `AddAssetModal.tsx`
- `components/asset/` — `StrategyCard.tsx`, `TopNewsPanel.tsx`, `TraceableConviction.tsx`, `RevisionHistory.tsx`, `DossierPanel.tsx`, `MarkOutcomeModal.tsx`
- `components/alerts/` — `AlertCard.tsx`, `ConvictionPanel.tsx`
- `components/settings/` — `NotificationPreferences.tsx`, `SourceManagement.tsx`, `WatchlistManagement.tsx`
- `pages/` — `PortfolioPage.tsx`, `AssetDetailPage.tsx`, `AlertQueuePage.tsx`, `DigestPage.tsx`, `SettingsPage.tsx`
- `hooks/` — `usePortfolio.ts`, `useAsset.ts`, `useAlerts.ts`, `useDigest.ts`, `useSources.ts`
- `types/api.ts`

---

## Prisma Migrations Summary

| Migration | Purpose |
|-----------|---------|
| `<ts>_e18_outcome_tracking` | Add `OutcomeDirection` enum, outcome columns + FK to `RecommendationOutcome` |
| `<ts>_e22_digest_table` | Add `Digest` model |

No new migrations for E-19, E-20, E-21 — models (`SourceProfile`, `RegimeSnapshot`, `ShadowRecommendation`, `ShadowEvaluationRun`, `DisagreementRecord`) already exist in schema.

---

## New Queue Names Summary

| Constant | Queue | Worker App | DLQ |
|----------|-------|-----------|-----|
| `RESEARCH_SOURCE_CREDIBILITY` | `research.source-credibility` | worker-research | Yes |
| `RESEARCH_REGIME_CLASSIFICATION` | `research.regime-classification` | worker-research | Yes |
| `ORCHESTRATOR_SHADOW_EVALUATION` | `orchestrator.shadow-evaluation` | worker-orchestrator | Yes |

---

## New Config Variables

Add to `packages/shared/src/config.ts` + `config/.env.example`:
```
SHADOW_MODEL_VERSION=shadow-v1
SHADOW_EVAL_CRON=0 5 * * 0
SHADOW_EVAL_MAX_ASSETS=50
REGIME_CLASSIFICATION_CRON=0 6 * * *
VIX_FALLBACK_VALUE=20
```

Feature flags to flip to `true` in `.env` for testing:
- `FF_REGIME_SNAPSHOTS`
- `FF_SHADOW_EVALUATION`
- `FF_SOURCE_RECALCULATION`

---

## Critical Files / Patterns to Follow

| File | Why critical |
|------|-------------|
| `packages/db/prisma/schema.prisma` | Two migrations touch it; must stay consistent |
| `packages/shared/src/constants/index.ts` | All 3 new queue names; must be added before workers/queues compile |
| `packages/queue/src/queues.ts` | Follow exact `makeQueue` + `makeDlqQueue` + `QUEUE_REGISTRY` pattern |
| `apps/worker-research/src/workers/update-dossier.worker.ts` | `BaseWorker` subclass pattern for new research workers |
| `apps/api/src/__tests__/routes/recommendations.test.ts` | `vi.hoisted()` pattern for all new route tests |

---

## Key Risk Flags

1. **E-18 FK migration** — orphaned `recommendation_outcomes` rows will break the FK add. Migration must include `DELETE` cleanup first.
2. **E-17 CJS/ESM boundary** — `apps/web` must never import `@trading-club/*` packages. Document in `apps/web/README.md`.
3. **E-17 tsconfig isolation** — `apps/web/tsconfig.json` must NOT extend `tsconfig.base.json` (which targets CJS).
4. **E-22 Digest idempotency** — `BuildDigestWorker` must check `DigestRepo.findByDate(today)` before calling LLM to avoid duplicate cost on retry.
5. **E-20 VIX API** — Yahoo Finance free endpoint is unofficial. Use `VIX_FALLBACK_VALUE` when it fails; macro calendar 404 is non-blocking.

---

## Verification

### After E-18
```bash
cd apps/api && npx vitest run src/__tests__/routes/outcomes.test.ts
```
Manually: `POST /api/v1/recommendations/<id>/outcome` with bearer token → expect 201 + DB row.

### After E-19
```bash
cd apps/worker-research && npx vitest run src/__tests__/source-credibility.worker.test.ts
```
Verify `SourceProfile.reliabilityScore` updates in DB after outcome marked.

### After E-20
```bash
cd apps/worker-research && npx vitest run src/__tests__/regime-classification.worker.test.ts
```
Manually trigger: `POST /api/v1/regime/current` → `GET /api/v1/regime/current` → expect regime snapshot.

### After E-21
```bash
cd apps/worker-orchestrator && npx vitest run src/__tests__/shadow-evaluation.worker.test.ts
```
`POST /api/v1/shadow/runs/trigger` → `GET /api/v1/shadow/runs` → verify run + disagreement records.

### After E-22
Run `BuildDigestWorker` manually → `GET /api/v1/digest` → verify "Model Health" section in returned content.

### After E-17 (full integration)
1. `turbo dev` — starts API (port 3000) + web (port 5173)
2. Open `http://localhost:5173`
3. Portfolio Overview loads with asset allocation table
4. Asset Detail shows candle chart (after `fetch-candles` script run) + strategy card + news
5. Alert Queue: approve/dismiss flow works end-to-end
6. Digest page renders latest weekly digest markdown
7. Settings: source list loads; add/remove source updates the API
