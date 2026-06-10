---
slug: add-idempotency-to-webhook-handler
stage: approved
status: approved
created: 2026-05-08
last-updated: 2026-05-08
owner: example-user
---

# Plan — add-idempotency-to-webhook-handler

## Brief

- **Goal:** Make the `/api/webhooks/process` handler idempotent so the upstream provider's redeliveries don't double-process payments.
- **Why now:** Two duplicate-charge incidents in the last sprint, both traced to provider redeliveries within the same minute. Finance has asked for this before month-end close.
- **Constraints:** Must not change the public webhook contract. Must work in the existing Lambda runtime (no new infra). Latency budget: <50ms added p99.
- **Non-goals:** Replaying *failed* deliveries successfully (separate concern). Changing provider-side dedup. Backfilling historical duplicates.
- **Success signal:** When the same `X-Webhook-Id` arrives twice, exactly one row is written to `Payment` and the second response is a 200 with `replayed: true`. Verified by integration test and by a scripted replay against staging.
- **Stakeholders:** @finance-eng (review), @platform-oncall (deploy).
- **Open questions:** None after intake.

## Domain Map

### Entry points
- `src/api/webhooks/process.ts:14` — Express handler `POST /api/webhooks/process`
- `serverless.yml:84` — Lambda function `webhook-processor`, mapped to the route above

### Affected components
| Path | Role | Why it matters |
|------|------|----------------|
| `src/api/webhooks/process.ts` | The handler | This is where the idempotency check goes |
| `src/util/idempotency.ts` | Existing idempotency helper | Reuse candidate — see below |
| `src/models/IdempotencyRecord.ts` | Mongoose model with TTL index | Already supports the use case; no schema change needed |
| `src/api/webhooks/process.test.ts` | Existing handler tests | Will be extended with replay scenarios |

### Existing utilities to reuse
- `src/util/idempotency.ts:18` — `withIdempotencyKey(key, ttlSec, fn)`. Atomic `findOneAndUpdate` with `$setOnInsert`. Returns `{ replayed: boolean, result: T }`. Used today by the payments service; well-tested.
- `src/util/hash.ts:7` — `stableHash(parts: string[])` — produces a stable SHA-256 of a tuple. Used to combine `(provider, webhookId)` into a single key.

### Patterns the team follows here
- **Error handling:** `src/api/webhooks/process.ts:42` — handler throws typed errors with `.status`; the global error handler at `src/middleware/error.ts:12` formats responses.
- **Logging:** structured logs via `logger.info({ event, ... })` from `src/lib/logger.ts`. Webhook events log `event: "webhook.processed"` with `provider` and `webhookId`.
- **Tests:** vitest, integration tests use `mongodb-memory-server` (see `test/setup.ts`). Existing handler tests cover happy-path and auth; no replay tests yet.

### Data flow (current state)
```
[provider] → [webhook route]
   → [auth middleware: src/middleware/webhookAuth.ts:20]
   → [process.ts handler]
   → [Payment.create / User.update]
   → [200 response]
```
No dedup anywhere in the path. A redelivery within the TTL of the original re-runs the entire handler.

### Risk surface
| Risk | Where | Blast radius | Notes |
|------|-------|--------------|-------|
| Race between two simultaneous deliveries | `process.ts:14` | Two `Payment` rows for one logical event | The existing `withIdempotencyKey` is atomic — using it correctly closes this |
| `X-Webhook-Id` missing from legacy webhooks | `process.ts:18` | Falls through with no dedup | Audit: only the staging-test webhook lacks this header; production providers all send it |
| TTL too short causes legitimate replays to dedupe | `IdempotencyRecord.ts:11` | Missed legitimate processing | Provider redelivers within 1h max per their docs; 7d TTL is well above that |

### What surprised me
- The `withIdempotencyKey` helper already exists and is used by the payments service. The team had this pattern internalized before; the webhook handler just predates it. Lower-novelty plan than the brief implied.
- `IdempotencyRecord` already has the right TTL index and shape — no migration needed. The schema was designed for exactly this kind of expansion.
- The webhook auth middleware verifies the provider signature *after* this handler routes — moving the idempotency check before the handler body but after auth is correct.

### Out-of-scope-but-touched
- `src/util/hash.ts` — read but not modified
- `src/middleware/webhookAuth.ts` — read for ordering; not modified
- The legacy staging-test webhook path — not in production; flagged but not addressed

### Open questions for /plan
- None. All scope is resolved.

## Plan

### Summary
Wrap the body of `src/api/webhooks/process.ts` with the existing `withIdempotencyKey` helper, keyed on `stableHash([provider, webhookId])` from the request headers, with a 7-day TTL. Returns `{ replayed: true }` on hit; full processing on miss. Two new integration tests verify the success signal.

### Approach
The Domain Map showed `withIdempotencyKey` already exists and is the right shape. We use it directly — no new helper.

Alternatives considered:
- **New per-webhook dedup table:** Rejected. Duplicates `IdempotencyRecord`'s schema and TTL behavior for no functional gain.
- **In-memory LRU dedup:** Rejected. Lambda is stateless across invocations; would not deduplicate across cold starts or across concurrent invocations.
- **Provider-side dedup config:** Out of scope per the brief; also requires provider-side change we don't control.

### Files to modify
| Path | Change | Why |
|------|--------|-----|
| `src/api/webhooks/process.ts` | Wrap handler body in `withIdempotencyKey`; key from `(provider, X-Webhook-Id)`; return `{ replayed: true }` on hit | Brief: no double-processing |
| `src/api/webhooks/process.test.ts` | Add two integration tests: same-id replay → one DB write, two responses; different-id calls → two writes | Verifies success signal |
| `src/api/webhooks/process.ts` | Add structured warn log when `X-Webhook-Id` is missing | Per "Patterns the team follows here" |

### Files to create
None.

### Data flow (proposed)
```
[provider] → [webhook route]
   → [auth middleware]
   → **[idempotencyKey check (NEW)]**
       hit  → return { replayed: true } 200
       miss → [process.ts handler body]
              → [Payment.create / User.update]
              → [200 response]
```

### Edge cases
1. **Two redeliveries arrive within milliseconds.** Both race the idempotency check. `withIdempotencyKey` uses atomic `findOneAndUpdate` with `$setOnInsert` — exactly one wins, the other gets `replayed: true`.
2. **`X-Webhook-Id` is missing.** Fall through to the handler body with a structured warn log (`event: "webhook.missing-idempotency-key"`). Brief allows this; only legacy staging traffic lacks the header.
3. **Idempotency record exists but the original processing failed.** Currently we'd dedupe a failed delivery. Out of scope this round (brief: "no double-processing," not "ensure successful processing"). Documented in the test as `NOT tested`.
4. **TTL expires between original and redelivery.** Provider docs guarantee redelivery within 1h; 7d TTL is well above. If a provider violates this, behavior is "process again, generate duplicate Payment." Acceptable per finance.

### Test strategy
- **Unit:** none — the helper itself is already unit-tested at `src/util/idempotency.test.ts`.
- **Integration:**
  - `webhook same-id called twice → exactly one Payment row, second response has replayed: true` (covers success signal directly)
  - `webhook different-id called twice → two Payment rows`
  - `webhook with missing X-Webhook-Id → processes normally, emits warn log`
- **Manual:** scripted replay against staging using the provider's redelivery tool. Confirm staging metrics show one Payment per logical event.
- **NOT tested:** Failed-delivery replay (out of scope per brief). TTL expiry (timing-dependent; covered by helper's existing tests).

### Rollback plan
Feature flag: `WEBHOOK_IDEMPOTENCY_ENABLED` (boolean, default true after deploy). If issues surface, set to false in Parameter Store; handler returns to pre-change behavior on next Lambda cold start (≤ 5 min). `IdempotencyRecord` rows expire on their own via TTL — no cleanup needed.

### Risks & mitigations
| Risk | Likelihood | Blast radius | Mitigation |
|------|-----------|--------------|------------|
| Hash collision across providers | Very low (SHA-256) | One missed legitimate webhook per collision | Hash includes provider name; collision space is 2^256 |
| Feature flag fails open if Parameter Store is unreachable | Low | Replays double-process during the outage | Acceptable: pre-change behavior; matches today's risk |
| Increased load on `IdempotencyRecord` collection | Low | Marginal Mongo query rate | Existing TTL index handles cleanup; capacity has headroom |

### Out of scope (carried over from brief)
- Replaying *failed* deliveries successfully (separate concern)
- Changing provider-side dedup
- Backfilling historical duplicates

### Open questions for the architect
- None.

## Architect Review

**Verdict:** APPROVED
**Cycle:** 1 of 3

### Concerns
| Severity | Section | Concern | Required action |
|----------|---------|---------|-----------------|
| WARNING | Test strategy | "Manual replay against staging" lacks a checklist of specific scenarios | Add a 3-bullet manual checklist before merge |

### Positive patterns
- Clear reuse of `withIdempotencyKey` — the Domain Map flagged it and the plan honored it
- Alternatives considered with concrete reasons for rejection
- Rollback plan is real (feature flag + TTL); not just "revert the commit"
- Edge case 3 explicitly defers failed-replay as out of scope rather than silently handling it

### Notes for the implementor
- The structured warn log on missing header should match the team's existing event-name convention. Check `src/lib/logger.ts` for prior `webhook.*` events.
- When wiring the feature flag, follow the pattern in `src/lib/featureFlag.ts:8` (Parameter Store + 60s in-memory cache).

## Approval

- **Architect:** APPROVED (cycle 1)
- **User:** example-user on 2026-05-08T14:32:00Z
- **Plan freeze:** files listed above are the contract; deviation requires re-planning.

## Tasks

- [ ] T1. Add `withIdempotencyKey` wrapper around handler body in `src/api/webhooks/process.ts`
- [ ] T2. Add structured warn log for missing `X-Webhook-Id`
- [ ] T3. Wire `WEBHOOK_IDEMPOTENCY_ENABLED` feature flag per `src/lib/featureFlag.ts:8` pattern
- [ ] T4. Integration test: same-id replay → one Payment, second response `replayed: true`
- [ ] T5. Integration test: different-id calls → two Payments
- [ ] T6. Integration test: missing header → processes normally + warn log emitted
- [ ] T7. Verify the manual replay checklist before merge (per architect WARNING)
- [ ] T8. Run full test suite locally; confirm no regressions
- [ ] T9. Deploy to staging; run scripted replay; confirm metrics
