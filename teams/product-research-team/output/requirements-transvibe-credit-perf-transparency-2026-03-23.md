# Product Requirements Document: TransVibe Credit & Performance Transparency
## Version: 1.0 | Authors: pm_1, pm_2 | CPO: Approval Pending | Date: 2026-03-23

---

## 1. Product Vision

Give every TransVibe user a per-job audit trail — how long their transcription took in milliseconds and exactly how their credits were estimated versus actually charged — so that billing is never a black box.

---

## 2. Problem Statement

TransVibe already computes both values internally: `metering.processingTimeSec` (in seconds, nested) and the credit lock's `amount` (estimate) vs `actualAmount` (final charge). Neither is surfaced to users in a readable, top-level form. Users who receive a charge different from the pre-job estimate have no way to understand why, generating support tickets and eroding trust. Operators auditing billing anomalies must manually correlate `CreditLock` records (30-day TTL) with `CreditTransaction` records — a race condition against lock expiry.

---

## 3. Target Personas

### Persona 1: End User (Consumer / Business)
- **Description**: Uploads audio/video files, uses credits from a purchased plan
- **Goals**: Know exactly how long a job took; understand why their credit charge may differ from the estimate
- **Frustrations with existing solutions**: "I was shown an estimate, then charged something different with no explanation." All transcription SaaS (Otter.ai, Rev.ai, AWS direct) provides no per-job estimate-vs-actual comparison.
- **Success looks like**: Opens a completed transcript detail page, sees "Estimated: 8 credits / Charged: 7 credits / 1 credit returned" and "Processing time: 4,210 ms" — no support ticket needed.

### Persona 2: Platform Operator / Admin
- **Description**: Monitors credit accuracy, handles refund requests, optimizes estimation algorithm
- **Goals**: Query which jobs had the largest divergence between estimated and actual; audit completed jobs missing a usage transaction
- **Frustrations with existing solutions**: CreditLock records expire after 30 days; post-30-day support requests cannot be reconciled because the estimate is gone.
- **Success looks like**: Queries `GET /credits/transactions?type=usage&jobId=X` and sees both `estimatedAmount` and actual `amount` on the record without time pressure.

---

## 4. The EXTRA Edge

**TransVibe Credit Transparency** — the first transcription platform with a per-job credit audit trail.

Every other transcription SaaS either uses post-pay (no estimate to compare) or shows a pre-job estimate that is silently forgotten after the charge. TransVibe's pre-lock architecture makes this natural: `lock.amount` (the estimate) and `actualAmount` (the charge) already coexist inside `finalizeCredits()`. The only work is persisting them to durable, user-facing fields before the `CreditLock` document expires.

**What this owns in the market:** "Stripe-level billing transparency for transcription." Users see: estimated credits, actual credits, difference, and a description. Operators get a permanent audit record. No competitor currently offers this.

**Why competitors can't easily copy:** Post-pay platforms (Otter.ai) have no estimate to compare. Pre-lock platforms (none currently) would need to implement the entire lock architecture first. TransVibe's lock system is already production-ready — this feature costs two schema fields and two service writes.

---

## 5. Feature List — MoSCoW Prioritized

### Must Have (MVP)

| # | Feature | Research Source | Persona(s) | Notes |
|---|---------|----------------|-----------|-------|
| M-1 | `processingTimeMs` field on `ITranscript` (top-level, nullable integer ms) | R1: metering.processingTimeSec is reliable but nested and in seconds | End User, Operator | Computed at upsert: prefer `completedAt - startedAt` ms; fall back to `processingTimeSec * 1000`; null if neither available |
| M-2 | `processingTimeMs` in GET /transcripts list summary response | R1: TranscriptSummary has no processing time field | End User | Add to TranscriptSummary type and select projection |
| M-3 | `processingTimeMs` in GET /transcripts/:id detail response | R1: detail endpoint has metering nested but no top-level field | End User | Already in full document; top-level field makes it accessible without nesting |
| M-4 | `estimatedAmount` field on `ICreditTransaction` (usage type, nullable integer) | R1: CreditTransaction.usage has no estimatedAmount; R2: both values coexist in finalizeCredits() | Operator | Written in `finalizeCredits()` alongside the existing `amount` write |
| M-5 | `cost.estimatedCredits` field on `ITranscript` (nullable integer) | R1: cost object has creditsUsed but no estimatedCredits; R2: CreditLock has 30-day TTL — must promote before expiry | End User, Operator | Written by `finalizeCreditsForTranscript()` after successful finalization |
| M-6 | `cost.estimatedCredits` in GET /transcripts/:id detail response | R1: API response gap; R2: EXTRA Edge requires user-visible field | End User | Included in existing cost object returned |
| M-7 | Null-safe handling: `processingTimeMs: null` and `estimatedCredits: null` for documents without the data | R2: PT-1, PT-5, CD-5 edge cases | End User, Operator | Never return `undefined`; always return null when data unavailable |

### Should Have (Post-MVP v1)

| # | Feature | Research Source | Persona(s) | Notes |
|---|---------|----------------|-----------|-------|
| S-1 | `estimatedCredits` in GET /transcripts list summary | R1: list API gap | End User | Low priority — list is space-constrained; detail page is natural home for billing data |
| S-2 | `estimatedAmount` included in credits transaction API response for end users (currently admin-only?) | R1: API response analysis | End User | Requires confirming if `/credits/transactions` is user-accessible |
| S-3 | Alert / monitoring: COMPLETED transcripts with no usage CreditTransaction > 30 min | R2: CAT-1 critical edge case | Operator | CloudWatch or log-based alert; not a user-facing feature |

### Could Have (Future Consideration)

| # | Feature | Research Source | Persona(s) | Notes |
|---|---------|----------------|-----------|-------|
| C-1 | `GET /credits/transactions/:jobId/breakdown` — per-job full audit trail (lock → usage → unlock) | R2: "Stripe invoice line items" analogy | Operator, Power User | Requires joining CreditTransaction records by jobId |
| C-2 | Human-readable `billingNote` explaining why estimate and actual differ | R2: CAT-3 (admin misreads data) | End User | e.g., "Estimated from file metadata; actual from confirmed audio duration (MediaConvert)" |
| C-3 | CSV export with `estimatedCredits` and `processingTimeMs` columns | R2: power user needs | Power User, Operator | Builds on existing export endpoint |
| C-4 | Backfill `processingTimeMs` for historical transcripts (derive from metering where available) | R2: PT-5 | Operator | Migration script; not required for new documents |

### Won't Have (Explicitly Out of Scope)

| # | Feature | Reason |
|---|---------|--------|
| W-1 | Changes to the credit calculation algorithm | Brief constraint: "no changes to credit calculation algorithm" |
| W-2 | Real-time estimate update during processing | Requires polling architecture; out of scope |
| W-3 | Frontend UI changes | Backend-only scope for this requirements document |
| W-4 | New external dependencies | Brief constraint |
| W-5 | Per-provider pricing breakdown in the response | Future complexity; not requested |

---

## 6. MVP Definition

The MVP consists of two schema additions and three service-layer writes with no algorithm changes and no new dependencies:

1. Add `processingTimeMs: number | null` to `ITranscript` (top-level), computed from `metering` at `upsertTranscript` time, stored persistently.
2. Add `cost.estimatedCredits: number | null` to `ITranscript`, written by `finalizeCreditsForTranscript` after successful finalization.
3. Add `estimatedAmount: number | null` to `ICreditTransaction`, written in `finalizeCredits()` from `lock.amount`.
4. Expose all new fields in existing API endpoints (no new routes needed).

**MVP Success Metrics:**
- `GET /transcripts/:id` response includes `processingTimeMs` (integer ms or null) for all transcripts completed after the feature ships
- `GET /transcripts/:id` response includes `cost.estimatedCredits` (integer or null) for all transcripts where credit finalization succeeded
- `GET /credits/transactions` includes `estimatedAmount` on all `usage`-type transactions created after the feature ships
- Zero regressions on existing transcript creation, credit lock, and credit finalization tests
- `processingTimeMs: null` returned (not omitted, not error) for old documents and edge cases where timing is unavailable

---

## 7. User Stories with Acceptance Criteria

### Epic: Processing Time Transparency

#### US-001: User sees processing time on transcript detail
**As an** end user,
**I want to** see how long my transcription job took in milliseconds on the transcript detail page,
**so that** I can understand job performance and compare across jobs.

**Acceptance Criteria:**
- Given a completed transcript where `metering.startedAt` and `metering.completedAt` are both set, when I call `GET /transcripts/:id`, then the response includes `processingTimeMs` as an integer equal to `metering.completedAt - metering.startedAt`
- Given a completed transcript where only `metering.processingTimeSec` is set (no ms timestamps), when I call `GET /transcripts/:id`, then `processingTimeMs` equals `metering.processingTimeSec * 1000`
- Given a completed transcript where no metering data is available (old document or Lambda failure), when I call `GET /transcripts/:id`, then `processingTimeMs` is `null` (not omitted, not `undefined`, not `0`)
- Given a FAILED transcript, when I call `GET /transcripts/:id`, then `processingTimeMs` is `null`

#### US-002: User sees processing time in transcript list
**As an** end user,
**I want to** see processing time in my transcript list,
**so that** I can quickly identify which jobs were fast or slow without opening each one.

**Acceptance Criteria:**
- Given a paginated call to `GET /transcripts`, when the response is returned, then each item in the `transcripts` array includes a `processingTimeMs` field (integer or null)
- Given a transcript with `processingTimeMs: null` in the database, when it appears in the list, then `processingTimeMs: null` is returned (not omitted)
- Given a transcript with `processingTimeMs: 4210`, when it appears in the list, then `processingTimeMs: 4210` is returned

#### US-003: processingTimeMs is computed and stored at upsert time
**As a** developer,
**I want** `processingTimeMs` to be persisted on the transcript document (not computed at read time),
**so that** the value is stable and the same regardless of how the document is accessed.

**Acceptance Criteria:**
- Given `upsertTranscript` is called with `data.metering.completedAt = 1711188000000` and `data.metering.startedAt = 1711187996000`, when the transcript is saved, then `transcript.processingTimeMs === 4000`
- Given `upsertTranscript` is called with `data.metering` having no `startedAt` but `processingTimeSec = 4`, when saved, then `transcript.processingTimeMs === 4000`
- Given `upsertTranscript` is called with no metering data, when saved, then `transcript.processingTimeMs === null`
- Given an existing transcript is re-upserted (idempotent update), when new metering data is provided, then `processingTimeMs` is overwritten with the new value

---

### Epic: Credit Transparency

#### US-004: User sees estimated vs actual credits on transcript
**As an** end user,
**I want to** see both the estimated credits locked at upload and the actual credits charged on my transcript,
**so that** I understand why the final charge may differ from the pre-job estimate.

**Acceptance Criteria:**
- Given a completed transcript where credit finalization succeeded, when I call `GET /transcripts/:id`, then `cost.estimatedCredits` is an integer equal to `CreditLock.amount` at the time of finalization
- Given a completed transcript where credit finalization succeeded, when I call `GET /transcripts/:id`, then `cost.creditsUsed` equals the actual credits deducted (unchanged from current behavior)
- Given a completed transcript where no lockId was resolved (CD-5: all 4 tiers failed), when I call `GET /transcripts/:id`, then `cost.estimatedCredits` is `null` (not 0, not omitted)
- Given `cost.estimatedCredits = 8` and `cost.creditsUsed = 7`, the values coexist correctly with no constraint violation

#### US-005: estimatedCredits is written after successful finalization only
**As a** developer,
**I want** `cost.estimatedCredits` to only be written when credit finalization actually succeeds,
**so that** a null value reliably means "finalization failed or lockId was unavailable" — never "zero credits estimated."

**Acceptance Criteria:**
- Given `finalizeCreditsForTranscript` is called and `retryFinalizeCredits` returns `success: true`, when the function completes, then a `Transcript.updateOne` call sets `cost.estimatedCredits = lock.amount` on the transcript document
- Given `finalizeCreditsForTranscript` is called and `retryFinalizeCredits` returns `success: false` after all retries, when the function completes, then `cost.estimatedCredits` is NOT written (remains null or unchanged)
- Given `finalizeCreditsForTranscript` is called with `transcript.lockId = undefined`, when the function returns early, then `cost.estimatedCredits` is NOT written
- Given `lock.amount = 0` (pathological case), then `cost.estimatedCredits` is written as `0` (zero is a valid lock amount — only null is the "not available" sentinel)

#### US-006: Operator sees estimated and actual credits on credit transaction
**As a** platform operator,
**I want** credit usage transactions to include the estimated amount alongside the actual amount,
**so that** I can audit billing accuracy and resolve user disputes without accessing CreditLock records.

**Acceptance Criteria:**
- Given `finalizeCredits(lockId, actualAmount)` is called and succeeds, when the `usage` CreditTransaction is created, then it includes `estimatedAmount: lock.amount` (the original locked amount)
- Given the `usage` CreditTransaction is queried, when `estimatedAmount` is present, then it is a non-negative integer
- Given `lock.amount = 10` and `actualAmount = 8`, when the transaction is created, then `amount = -8` and `estimatedAmount = 10`
- Given an `unlock` CreditTransaction is created for excess credits (difference > 0), it does NOT need an `estimatedAmount` field — this is only required on `usage` transactions

#### US-007: unlock CreditTransaction is created when actual < estimated
**As a** platform operator (existing behavior, unchanged),
**I want** excess locked credits to be released as an `unlock` transaction when actual < estimated,
**so that** the credit balance ledger is complete.

**Acceptance Criteria (unchanged from current behavior, regression test only):**
- Given `lock.amount = 10` and `actualAmount = 7`, when `finalizeCredits` completes, then a `usage` transaction for `-7` AND an `unlock` transaction for `+3` are both created
- Given `lock.amount = 5` and `actualAmount = 5`, when `finalizeCredits` completes, then only a `usage` transaction for `-5` is created (no unlock)

---

## 8. Edge Case Requirements

| # | Edge Case | Severity | Requirement | Acceptance Criteria |
|---|-----------|----------|-------------|---------------------|
| EC-1 | `engineStartedAt` missing — no metering timestamps | Medium | `processingTimeMs` must be `null`, not `0` | `upsertTranscript` with metering.startedAt=undefined → processingTimeMs=null in DB |
| EC-2 | Sub-second job — `processingTimeSec` rounds to 0 | Low | Use `completedAt - startedAt` (ms) when both available; only fall back to `sec * 1000` | With startedAt=T, completedAt=T+500, processingTimeMs=500 (not 0) |
| EC-3 | Old transcript document (no metering field) | Medium | `processingTimeMs: null` returned; never throw error | GET /transcripts/:id on old doc → processingTimeMs: null in response |
| EC-4 | All lockId resolution tiers fail | High | `cost.estimatedCredits: null`; transcript creation NOT blocked | upsertTranscript with no lockId → transcript saved, cost.estimatedCredits=null |
| EC-5 | Finalization fails after max retries | Medium | `cost.estimatedCredits` NOT written; field remains null | finalizeCreditsForTranscript with LOCK_NOT_FOUND → no estimatedCredits update |
| EC-6 | Duplicate finalization event (idempotency) | Medium | Second `finalizeCredits` call returns `LOCK_NOT_FOUND`; no second usage transaction | Covered by existing lock status check; no additional requirement |
| EC-7 | `estimatedCredits` must never be written as `0` when lock lookup fails | High | Only write `0` if `lock.amount` is actually `0`; write `null` if lock not found | Mock CreditLock returning null → cost.estimatedCredits remains null, not 0 |

---

## 9. Differentiation Requirements

| # | Differentiator | Requirement | How It Beats Competitors |
|---|---------------|-------------|--------------------------|
| DR-1 | Per-job estimate vs actual credit comparison | `cost.estimatedCredits` and `cost.creditsUsed` both present on transcript, both returned in API response | Otter.ai, Rev.ai, AWS Transcribe: no per-job estimate-vs-actual shown |
| DR-2 | Permanent audit record of credit estimate | `estimatedAmount` on `ICreditTransaction` survives past CreditLock 30-day TTL | CreditLock expires; this does not — operators can audit indefinitely |
| DR-3 | Machine-readable billing fields for API integrators | `estimatedCredits` in transcript JSON response enables third-party apps to build pre-confirm UX | No transcription API currently exposes pre-job estimates in the completion response |

---

## 10. Non-Functional Requirements

### Performance
- `processingTimeMs` computation at `upsertTranscript` time adds zero additional DB reads (computed from already-in-memory `data.metering`)
- `cost.estimatedCredits` write adds one `Transcript.updateOne` call inside `finalizeCreditsForTranscript` — already in the critical path; acceptable latency addition < 5ms
- `estimatedAmount` field on `CreditTransaction` adds no additional computation — `lock.amount` is already in scope at the write site

### Reliability & Error Handling
- All three new fields are nullable — their absence (null) must never cause a 500 error in any API endpoint
- `processingTimeMs: null` is a valid, expected response for old documents and failure cases
- `cost.estimatedCredits: null` is a valid, expected response when lock resolution failed
- The `finalizeCreditsForTranscript` update to write `estimatedCredits` must be wrapped in try/catch and must not block the overall finalization success — same error isolation pattern as the existing Redis cleanup in that function

### Backward Compatibility
- All new fields are additions only — no existing fields renamed, removed, or changed in type
- Old transcript documents without `processingTimeMs` return `processingTimeMs: null` (not an error)
- Old CreditTransaction records without `estimatedAmount` return `estimatedAmount: undefined` or the field is omitted (not `null` to distinguish from "was available, was zero")

### Security & Privacy
- No new trust boundaries introduced — fields are internal billing data already accessible to authenticated users
- `estimatedAmount` on CreditTransaction is only accessible to the transaction owner (same auth gate as current transactions endpoint)

---

## 11. Post-MVP Roadmap

| Phase | Feature(s) | Value Delivered | Dependency |
|-------|-----------|-----------------|------------|
| v1.1 | `estimatedCredits` in list summary; S-3 monitoring alert for silent non-finalization | Complete billing transparency in list view; production safety | M-5 (estimatedCredits on transcript) |
| v1.2 | `GET /credits/transactions/:jobId/breakdown` — per-job full audit trail | Stripe-level billing transparency; reduces support tickets | M-4 (estimatedAmount on transaction) |
| v1.3 | `billingNote` plain-language explanation on transcript (why estimate ≠ actual) | Trust-building copy; reduces "why was I charged X?" tickets | Research into divergence reasons per provider |
| v2.0 | CSV export with processingTimeMs + estimatedCredits columns; per-provider processing SLA dashboard | Power-user and operator analytics | v1.2 data completeness |

---

## 12. Explicit Out-of-Scope

- Credit calculation algorithm changes
- Frontend / UI implementation
- New API endpoints (all features use existing endpoints with added fields)
- Real-time estimate updates during processing
- New external service dependencies
- Backfill of `processingTimeMs` for historical documents (post-MVP migration script)
- Per-provider cost breakdown in the API response
- Webhooks for billing events

---

## Appendix A: PM Cross-Consultation Log

| # | Topic | PM 1 Position | PM 2 Position | Resolution |
|---|-------|--------------|--------------|------------|
| CC-1 | `processingTimeMs` field placement (top-level vs metering sub-field) | Top-level on transcript for clean frontend contract | Agreed — top-level is better API contract than exposing metering internals | PM 2 agreed with PM 1. Top-level field chosen. |
| CC-2 | `estimatedCredits` write timing: upsert vs finalization | PM 1 draft: write at upsert (CreditLock lookup during upsert) | PM 2: write at finalization (avoids redundant DB read; only writes on confirmed success) | PM 1 accepted PM 2. Written in `finalizeCreditsForTranscript` only. |
| CC-3 | Null vs omitted for unavailable fields | PM 1: field always present, value null when unavailable | PM 2: agreed — null is better than omit; lets clients distinguish "not available" from "not yet loaded" | Both agreed. All fields always present in response; null when data unavailable. |
| CC-4 | `estimatedCredits: 0` when lock not found (CAT-2 risk) | PM 1: write null if not found | PM 2 raised: lock.amount=0 is a valid case — rule is "null only when lock not found, not when amount=0" | Joint resolution: only write null when lock is not found; write 0 only if lock.amount is actually 0. |
| CC-5 | MVP scope: S-3 monitoring alert | PM 1: should be MVP | PM 2: should be Should Have — it's operational, not user-facing; doesn't block transparency value prop | PM 2 prevailed. S-3 moved to Should Have. |

---

## Appendix B: Research Traceability Matrix

| Requirement ID | Source | Researcher | Finding Summary |
|----------------|--------|-----------|----------------|
| M-1 | R1 §4.1, §5.1 | researcher_1 | `metering.processingTimeSec` is reliable but nested/seconds; no top-level ms field exists |
| M-2 | R1 §4.3, §5.5 | researcher_1 | `TranscriptSummary` does not include any processing time field |
| M-3 | R1 §4.3 | researcher_1 | Detail endpoint returns full document but metering is nested; top-level field improves API contract |
| M-4 | R1 §2.2, §4.2 | researcher_1 | `CreditTransaction` (usage) stores only `actualAmount`; `lock.amount` is logged but not persisted |
| M-5 | R1 §2.2, §4.1; R2 §2.2 CD-5 | researcher_1 + researcher_2 | `cost.estimatedCredits` missing; CreditLock has 30-day TTL — must promote before expiry |
| M-6 | R2 §5 (EXTRA Edge) | researcher_2 | Per-job estimate vs actual is the primary user-visible transparency differentiator |
| M-7 | R2 §2.1 PT-1, PT-5; §2.2 CD-5 | researcher_2 | Multiple legitimate null cases; null-safe API contract required |
| EC-1 | R2 §2.1 PT-1 | researcher_2 | `engineStartedAt` can be missing — processingTimeMs must be nullable |
| EC-2 | R2 §2.1 PT-4 | researcher_2 | Sub-second rounding to 0 — prefer `completedAt - startedAt` ms precision |
| EC-4 | R2 §2.2 CD-5 | researcher_2 | 4-tier lockId resolution can fail completely — transcript creation must not be blocked |
| EC-7 | R2 §2.3 CAT-2 | researcher_2 | Writing estimatedCredits=0 when lock not found would look like overcharge to users |
| DR-1 | R2 §3.1 | researcher_2 | No competitor provides per-job estimate vs actual; TransVibe can own this |
| DR-2 | R2 §5 | researcher_2 | CreditLock TTL makes estimatedAmount on transaction the only permanent record |
| DR-3 | R2 §5 | researcher_2 | Machine-readable fields in API enable third-party developer use cases |
