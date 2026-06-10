# Requirements — Intent Clarification Engine

**Owners:** PM 1 (Requirements Architect) + PM 2 (Differentiation & Experience), Elite Product Research Team
**Date:** 2026-05-17
**Status:** Draft for CTO sprint planning
**Inputs:** `research-researcher1-intent-clarification-engine-2026-05-17.md`, `research-researcher2-intent-clarification-engine-2026-05-17.md`, `docs/conversation-phases.md`, `docs/intent-catalog.md`, `docs/intent-gaps.md`, current `phases.ts` / `types.ts`.

---

## 1. Product Vision

Every customer utterance is interpreted as a probe of an *active ordering goal*, never as an isolated classification problem — so the bot can never forget what it just asked, and a four-character reply like "5 ס\"מ" lands on the slot the bot was waiting for.

---

## 2. Problem Statement

Maître's conversation engine currently treats each turn as a fresh classification: the LLM concierge may ask a slot-shaped question ("how thick?") without binding any state, the next turn re-enters the classifier with no goal to anchor it, and short or ambiguous replies (a number, a unit, a "yes") are mis-routed to wrong handlers or rebound to a clean greeting. The canonical production failure — "אני רוצה אנטריקוט → 5 ס\"מ → yes → Hi, how can I help?" — is structural, not a tuning bug, and the same pattern is the #1 documented failure across Rasa, Botpress, Microsoft Bot Framework, and Tock. The fix is a thin goal-aware belief-state layer plus a tool-call contract on the concierge LLM; this requirements document specs that layer.

---

## 3. Target Personas

### Persona A — End customer (Israeli butcher-shop buyer, WhatsApp-first)

- Hebrew-first, mixed-script tolerant (Hebrew product noun + English unit is common).
- Texts in fragments: "5 ס\"מ", "כן", "קילו", "תודה" — rarely complete sentences once mid-order.
- Mobile keyboard fatigue → expects the bot to remember context across very short replies.
- Drops off within 2 frustrated turns if the bot loops or restarts.
- Three behavioral tiers: beginner (one-slot-per-turn), intermediate ("ribeye 5 cm 1 kg"), power user ("my usual + 1 kg").

### Persona B — Engineering team (single-engineer build crew)

- One backend engineer plus part-time review from the CTO/architect; no dedicated ML engineer.
- TypeScript-strict ESM monolith, MongoDB + DDB + Redis, Claude Haiku classifier + Claude Sonnet concierge.
- Build constraint: every change must be additive — no rewrite of `state-machine.ts`, no replacement of `intent-classifier.ts`. The four bypass states + the LLM router stay.
- Operational constraint: every requirement must be observable in CloudWatch (intent + state + phase already logged via `phaseForState`); new fields must extend that pivot, not break it.

### Persona C — Tenant operator (butcher-shop owner, post-MVP context only)

Mentioned only as a stakeholder of the eval set — they will be the ones to triage transcripts that fall through. Not a direct user of the engine.

---

## 4. The EXTRA Edge — Goal-Anchored Clarification (Specced)

**Statement.** Goal-Anchored Clarification is a thin belief-state layer above the existing intent classifier and state machine that maintains, across turns, *what goal the user is pursuing* and *what question the bot last asked*, and routes every inbound message through that lens before anything else.

**Why this is the edge.** Every reference framework (Rasa, Botpress, MS BF, Tock) assumes each turn carries a self-contained intent. They classify, then route. The Goal-Anchored model inverts that: it anchors first, classifies second. The concrete consequence is that the production bug becomes *structurally impossible* — the product never gets re-classified mid-form, the LLM cannot ask a question without binding state, and short replies never reach the classifier when an open question is live.

**Why competitors will not copy quickly.** Rasa is intent-routing-first, Botpress is flow-graph-first, MS BF is waterfall-first, Tock is story-DSL-first. None of them carries a `goal` as a first-class durable object across turns; adding one would break every existing customer's stories. Maître is small enough, vertical enough (one tenant = one bounded catalog), and LLM-native enough that the belief-state object fits as an additive overlay.

**Concrete object that ships.** A `ConversationBelief` record per conversation, persisted in DDB next to the existing conversation state, with:

```ts
type ConversationBelief = {
  conversationId: string;
  tenantId: string;                 // tenant slug, per multi-tenancy rule
  activeGoal: {
    kind: "order" | "support" | "info";
    productId?: string;             // null until product picked
    formId?: string;                // e.g., "entrecote.cart_fields"
    openedAt: ISODateString;
  } | null;
  openQuestion: {
    slot: string;                   // "thickness" | "weight" | "delivery_slot" | ...
    expectedShape: "numeric_unit" | "yes_no" | "product_noun" | "free_text" | "enum";
    askedAt: ISODateString;
    ttlSeconds: number;             // default 600 (10 min)
  } | null;
  offTopicCounter: number;
};
```

`activeForm` is intentionally NOT a separate object — the existing `PendingCartSession` in `ConversationContext` already carries that information. `ConversationBelief.activeGoal.formId` references the same session.

**Anchoring rules (4, all MVP).**

1. **Open-question-first** — if `openQuestion != null` and inbound is ≤ 3 tokens OR matches `expectedShape`, run the deterministic slot extractor and skip the LLM classifier entirely.
2. **Goal persistence** — `activeGoal.productId` only changes through an explicit `swap_product` or `add_product` tool call. The classifier cannot mutate the active product on its own.
3. **Concierge tool-call contract** — the concierge LLM is forbidden from emitting a bot turn that ends in `?` without simultaneously emitting an `open_form(formId, slot, expectedShape, ttlSeconds)` tool call. Enforced by a post-processing validator on the LLM output: any non-compliant turn is regenerated once, then falls back to a deterministic re-prompt of the prior slot.
4. **TTL decay** — `openQuestion` expires after `ttlSeconds`. After expiry, an isolated "yes" / "כן" is treated as out-of-context and routed to scoped clarification, not bound to the stale question.

**The litmus test.** The production bug ("אני רוצה אנטריקוט → 5 ס\"מ → yes → Hi") routes correctly: turn 1 opens `entrecote.cart_fields` via the `add_to_cart` handler (which now also writes `activeGoal.productId = entrecote` and `openQuestion = { slot: thickness, shape: numeric_unit }`); turn 2 ("5 ס\"מ") matches the shape and fills the slot deterministically without touching the classifier; turn 3 ("yes") either matches a live yes/no openQuestion at the confirmation step or, if no such question is live, is anchored to scoped clarification — it never resolves to `greet`.

---

## 5. Feature List — MoSCoW Prioritized

| ID | Feature | Priority | Source |
|---|---|---|---|
| F1 | `ConversationBelief` record (activeGoal + openQuestion + offTopicCounter) persisted per conversation in DDB, written and read on every inbound turn | **Must** | r1 §8, r2 §9.1 |
| F2 | Open-question-first router: before the LLM classifier, if `openQuestion != null` AND (inbound ≤ 3 tokens OR matches `expectedShape`), route to a deterministic slot extractor | **Must** | r1 §8 (insight 4), r2 §10 (insight 8) |
| F3 | New fourth bypass state `awaiting_product_details` activated the moment `add_to_cart` resolves a product, BEFORE field collection, to bind subsequent turns to the active goal | **Must** | r1 §8 (insight 1), r1 §10 (Q1) |
| F4 | Concierge LLM tool-call contract: every concierge turn ending in `?` must emit `open_form(formId, slot, expectedShape, ttlSeconds)`. Enforced via output validator + one regenerate retry, then deterministic fallback | **Must** | r2 §5 (rule 3), r2 §9.3 |
| F5 | Deterministic slot extractors for `numeric_unit`, `yes_no`, `enum` (Hebrew + English vocabularies hard-coded; quote-normalisation pre-pass for `5 ס\"מ`) | **Must** | r1 §9 (#1, #5, #9), r2 §2.5 (#13) |
| F6 | Goal-persistence guard: `activeGoal.productId` mutation rejected unless dispatching handler is `add_to_cart`, `swap_product`, `add_product`, or explicit cancel/cart-reset | **Must** | r2 §2.2 (#6), r2 §9.3 (rule 2) |
| F7 | `openQuestion.ttlSeconds` decay; expired questions are cleared on inbound and short replies route to scoped clarification instead of being bound | **Must** | r2 §2.1 (#4), r2 §9.3 (rule 4) |
| F8 | Scoped clarification template: when slot extraction fails inside an active form, re-ask the open slot with example values; do NOT restart the goal | **Must** | r1 §9 (#1, #10), r2 §7.1 |
| F9 | Off-topic counter inside `awaiting_product_details` / `awaiting_cart_fields`; 3 consecutive unparseable inbounds → recovery clarification ("we were ordering ribeye — keep going or set aside?") | **Must** | r1 §9 (#10), r2 §7.4 |
| F10 | Production-bug regression test fixture: the exact transcript "אני רוצה אנטריקוט → 5 ס\"מ → כן" frozen as an integration test that asserts state, belief, and outbound copy | **Must** | r1 §5, r2 §10 (insight 12) |
| F11 | CloudWatch metric `belief_anchor_hit` (incremented when F2 short-circuits the classifier) and `concierge_tool_call_violation` (incremented when F4 regenerates) | **Must** | r1 §8 (insight 10), r2 §10 (insight 11) |
| F12 | Hebrew yes/no/affirmation vocabulary baked into the `yes_no` slot extractor (`כן`, `לא`, `אוקיי`, `סבבה`, `בטח`, `אין מצב`, plus emoji `👍`, `👎`) | **Must** | r1 §9 (#5), r2 §2.5 |
| F13 | Disambiguation clarification: when product matcher returns ≥2 candidates with similar scores, surface a numbered list and ask the customer to pick | Should | r2 §7.2 |
| F14 | Correction-vs-addition detector: deictic "actually" / "במקום" / "instead" → swap product keeping compatible slots; bare new product noun → ask "replace or add?" | Should | r1 §9 (#3), r2 §2.6 (#15) |
| F15 | Compound-slot extraction: when an inbound contains BOTH product + thickness + weight ("ribeye 5cm 1kg"), fill all extractable slots and only ask for what's missing — Botpress "Already Extracted" pattern | Should | r1 §7 (Intermediate), r2 §2.4 (#11) |
| F16 | Confirmation-clarification template: pre-payment recap as a single yes/no anchored by `openQuestion = { slot: "confirm_order", shape: "yes_no" }` (formalises today's `awaiting_confirmation` under the belief layer) | Should | r2 §7.3 |
| F17 | Eval-set CI harness: 20 frozen transcripts (the production bug + 19 derived edge cases) run on every PR, output a state-and-belief diff | Should | r2 §10 (insight 11) |
| F18 | Calibrated abstention: classifier emits `no_confident_intent` instead of always picking a winner; routes to scoped or disambiguating clarification rather than best-guess handler | Could | r2 §2.3 (#8) |
| F19 | Multi-intent split-and-queue: "I want sirloin and when are you open?" answered as info-then-resume-order | Could | r1 §9 (#4), r2 §2.4 (#10) |
| F20 | "Same as last time" historical recall as an anchored shortcut intent | Could | r1 §4.2, r2 §2.7 (#17) |
| F21 | Late yes/no binding (3+ turns late) via decayed-confidence binding instead of TTL hard-cutoff | Could | r2 §2.1 (#4) |
| F22 | `product_lookup` intent (gap #1, #4 in `intent-gaps.md`) | **Won't (this sprint)** | `docs/intent-catalog.md`, see §12 |
| F23 | `business_information` intent (gap #2, #6 in `intent-gaps.md`) | **Won't (this sprint)** | `docs/intent-catalog.md`, see §12 |
| F24 | Visual flow editor / DSL for tenant operators to author goals | Won't | out of scope, contradicts MVP posture |

---

## 6. MVP Definition with Success Metrics

### 6.1 What ships in MVP

The minimum that structurally prevents the production bug and earns the EXTRA edge:

- **F1** `ConversationBelief` object + DDB persistence
- **F2** Open-question-first router (the anchoring rule)
- **F3** `awaiting_product_details` fourth bypass state
- **F4** Concierge tool-call contract (`open_form` required for any `?`)
- **F5** Deterministic slot extractors for `numeric_unit`, `yes_no`, `enum`, with quote normalisation
- **F6** Goal-persistence guard
- **F7** `openQuestion` TTL decay
- **F8** Scoped clarification template
- **F9** Off-topic counter + recovery clarification
- **F10** Production-bug regression test
- **F11** CloudWatch metrics for anchor hits and tool-call violations
- **F12** Hebrew yes/no/affirmation vocabulary

Everything else is post-MVP.

### 6.2 MVP success metrics (must all be green at sprint close)

| Metric | Target | How measured |
|---|---|---|
| **M1 — Production bug routes correctly** | 100% pass on the canonical transcript test (F10) | Integration test: turn 2 fills `thickness=5cm` deterministically; turn 3 anchored to live or expired `openQuestion`, never resolves to `greet`. CloudWatch `belief_anchor_hit ≥ 1` per replay. |
| M2 — `belief_anchor_hit` rate on real traffic | ≥ 25% of inbound turns where `openQuestion != null` AND inbound length ≤ 3 tokens are anchored without classifier call | CloudWatch metric divided by inbound count over a 24h window |
| M3 — Concierge tool-call compliance | ≥ 95% of concierge turns ending in `?` carry an `open_form` tool call on first generation; 100% after the single regenerate retry | CloudWatch `concierge_tool_call_violation` rate per concierge turn |
| M4 — Goal-mutation safety | Zero `activeGoal.productId` mutations from non-whitelisted handlers in a 7-day soak | CloudWatch metric `belief_goal_mutation_rejected` should fire only from disallowed handlers; alert if a non-whitelisted handler ever passes |
| M5 — Cart-completion rate of started sessions | ≥ +10 pp vs the pre-belief-layer baseline on the 20 frozen transcripts | Eval-set replay diff (F17 — Should-have; if F17 slips, manual measurement on 5 transcripts) |
| M6 — p95 inbound-to-outbound latency | No regression > 200 ms vs current p95 | X-Ray segment on belief read/write + extractor; new code must not add a 2nd LLM call to MVP (concierge tool-call enforcement reuses the existing concierge call) |

### 6.3 What MVP explicitly does NOT do

- Does not introduce `product_lookup` or `business_information` intents (deferred to a separate sprint — they are orthogonal to the bug).
- Does not add a 2nd LLM call per turn. The classifier is reused; the concierge call is reused; the tool-call contract is added to its existing prompt and validated post-hoc.
- Does not rewrite the state machine. The 8 existing `ConversationStateKind` values stay; one new value `awaiting_product_details` is added.

---

## 7. User Stories with Acceptance Criteria

### Story U1 — Short numeric+unit reply lands on the slot

**As** a customer mid-order, **I want** my "5 ס\"מ" reply **to** fill the thickness the bot just asked for, **so that** I do not have to repeat myself or restart.

**Acceptance criteria:**
- AC1.1 Given `openQuestion = { slot: "thickness", expectedShape: "numeric_unit", ttlSeconds: 600 }` and inbound `"5 ס\"מ"`, then `belief_anchor_hit = 1`, `classifier_invocations_for_turn = 0`, and `pendingCartSession.collectedFields.thickness_cm = 5`.
- AC1.2 Given inbound `"5"` (no unit) under the same state, then slot extraction returns "unit missing" and the bot replies with the scoped clarification template including unit hint; `openQuestion` is preserved (not cleared).
- AC1.3 Given inbound `5 cm` (English unit), the extractor normalises to `thickness_cm = 5` and AC1.1 holds.

### Story U2 — Bare "yes" / "כן" binds to the live yes/no question

**As** a customer at the confirmation step, **I want** "כן" **to** confirm the recap, **so that** the bot does not greet me fresh.

**Acceptance criteria:**
- AC2.1 Given `openQuestion = { slot: "confirm_order", expectedShape: "yes_no", ttlSeconds: 600 }`, inbound `"כן"` produces `confirmation_yes` event and state transitions to `cart_open` for the immediate `pay` dispatch.
- AC2.2 Given the same inbound after `openQuestion` has expired (TTL elapsed), the engine emits scoped clarification ("רוצה לאשר את ההזמנה?") and does NOT resolve to `greet`.
- AC2.3 Inbound `"👍"`, `"אוקיי"`, `"סבבה"`, `"yes"`, `"ok"` all map to the same `yes_no = true` extraction.

### Story U3 — Concierge cannot ask a slot question without binding state

**As** the engine, **I want** the concierge LLM to never ask a slot-shaped `?` without emitting `open_form`, **so that** no subsequent short reply can fall through.

**Acceptance criteria:**
- AC3.1 Given a concierge LLM response with `text` ending in `?` and no `open_form` tool call, the validator rejects the output, regenerates once with a stronger prompt, and increments `concierge_tool_call_violation`.
- AC3.2 If the regenerate also fails the contract, the engine drops the concierge text and emits a deterministic re-prompt of the prior `openQuestion` (or, if none, a generic "what would you like to order?" `awaiting_clarification` re-entry).
- AC3.3 KB Q&A turns that legitimately end in `?` (e.g. "Want me to also check whether the kebab is gluten-free?") are exempt from the contract IF they emit `open_form` with `expectedShape: "yes_no"` and `slot: "kb_followup_<n>"` — i.e. they must bind state too. There is no exemption; every `?` binds.

### Story U4 — Wrong product never carries forward

**As** a customer who just said "אנטריקוט", **I want** the bot to keep that product locked, **so that** turn 4 does not silently switch to "sirloin".

**Acceptance criteria:**
- AC4.1 After `add_to_cart` resolves `productId = entrecote`, any inbound for the next N turns inside `awaiting_product_details` / `awaiting_cart_fields` MUST NOT mutate `activeGoal.productId` unless dispatching handler is in the whitelist `{ add_to_cart, swap_product, add_product, cancel, cart_reset }`.
- AC4.2 If the concierge LLM emits an `add_product` tool call from `awaiting_cart_fields` without a deictic correction marker, the engine rejects the mutation, increments `belief_goal_mutation_rejected`, and re-asks the current slot.
- AC4.3 The production-bug transcript replay assertion includes `activeGoal.productId === "entrecote"` at every turn.

### Story U5 — Customer can escape with a single explicit cancel

**As** a customer who changed their mind, **I want** `"בטל"` / `"cancel"` **to** exit the active form immediately, **so that** I am not trapped.

**Acceptance criteria:**
- AC5.1 Inbound matching the `cancel` vocabulary (`"בטל"`, `"בטלי"`, `"cancel"`, `"abort"`, `"לבטל"`) inside any active form clears `activeGoal`, `openQuestion`, and `pendingCartSession`; state returns to `cart_open` (if cart non-empty) or `browsing` (if empty).
- AC5.2 The `cancel` handler is on the goal-mutation whitelist; its mutation does NOT increment `belief_goal_mutation_rejected`.
- AC5.3 The customer sees a single acknowledgement message; the bot does not immediately re-prompt the cancelled slot.

### Story U6 — Off-topic mid-form recovers gracefully

**As** a customer who drifted, **I want** the bot **to** acknowledge the drift after 3 off-topic turns and offer a clear choice, **so that** I do not feel stuck.

**Acceptance criteria:**
- AC6.1 Each unparseable inbound inside `awaiting_product_details` or `awaiting_cart_fields` increments `ConversationBelief.offTopicCounter` (note: this replaces the per-session `redirectCount` for product-detail collection; cart-session-internal counter continues to apply to its own scope).
- AC6.2 On the 3rd consecutive off-topic inbound, the bot emits the recovery template: `"היינו באמצע הזמנה של {productName} — להמשיך או להשאיר לפעם הבאה?"`.
- AC6.3 On reply `"להמשיך"` / `"continue"`, the bot re-asks the open slot; on `"להשאיר"` / `"abandon"`, the bot clears the goal and transitions to `cart_open` / `browsing`.

### Story U7 — Restarting the goal is impossible without explicit user action

**As** the engine, **I want** to never transition from `awaiting_product_details` back to `idle` / `browsing` except via the cancel path, **so that** the user's goal cannot evaporate silently.

**Acceptance criteria:**
- AC7.1 The state machine rejects any transition from `awaiting_product_details` to `idle` or `browsing` unless the triggering event is in `{ confirmation_cancel, abandoned_cart_session, escalated }`.
- AC7.2 Attempts to transition out of `awaiting_product_details` via `greeted` or `unknown_received` are dropped; the engine instead increments `offTopicCounter` and routes to scoped clarification.

---

## 8. Edge Case Requirements (MVP-blocking 7 from researcher_2's 18)

| # | Edge case | Severity | Trigger | Required behavior | Implemented by |
|---|---|---|---|---|---|
| EC1 | Bare unit reply ("5 ס\"מ", "1 kg", "two") | severe | User answers a slot prompt with just the value | Open-question-first router fills the slot deterministically; no classifier call | F2, F5 |
| EC2 | Bare confirmation ("כן", "yes", "👍") with no live yes/no | moderate | User replies "yes" after `openQuestion` expired or never existed | Scoped clarification anchored to last `openQuestion`'s slot OR — if none — `awaiting_clarification` re-entry; NEVER `greet` | F2, F7, F8, F12 |
| EC3 | LLM "roleplays" a slot question without binding state | catastrophic | Concierge emits `?` turn without `open_form` tool call | Output validator rejects, regenerates once, then falls back to deterministic re-prompt | F4 |
| EC4 | Wrong product carried forward after a side mention | catastrophic | Concierge or classifier substitutes a different product mid-form | Goal-persistence guard rejects mutation by non-whitelisted handler | F6 |
| EC5 | State advances on classifier output but classifier was wrong | severe | Classifier emits `add_to_cart` for a question | Two-channel binding: classifier proposes but state advances only on slot-fill or explicit confirm via tool call | F1, F3, F4 |
| EC6 | Cancel mid-form | simple | User wants out | First-class cancel vocabulary always wins over slot-fill, clears belief | F5, U5 |
| EC7 | Hebrew quote-character entity ("5 ס\"מ") | simple | Escaped `"` confuses regex | Pre-normalisation pass on inbound: collapse `ס\"מ` → `ס"מ`, then unit regex | F5 |

**Deferred to post-MVP** (researcher_2 §11): late yes/no (#4), calibrated abstention (#8, #9), multi-intent (#10, #11), "same as last time" (#17), mid-slot product addition (#16), deeper bilingual coverage (#12, #14), correction-vs-addition (#15 — moved to Should F14).

---

## 9. Differentiation Requirements

| Differentiator (vs Rasa / Botpress / MS BF / Tock) | Why competitors don't ship it | Maître requirement | MVP? |
|---|---|---|---|
| **Goal as a first-class durable object** | Their abstractions (dialog stack, flow graph, waterfall, story DSL) tie goal to whichever node/step is active; no goal object survives transitions | F1 `ConversationBelief.activeGoal` persisted across turns, mutable only via whitelisted handlers | **Yes** |
| **Open-question-first routing** | They classify-then-route; short replies have no signal so the classifier guesses | F2 open-question router runs BEFORE classifier when `openQuestion` is live | **Yes** |
| **Concierge tool-call contract** | None has a free-text LLM concierge that needs binding to a state machine | F4 — every `?` from the concierge LLM must emit `open_form` | **Yes** |
| **Named clarification taxonomy (not a single fallback)** | All four ship a single "I didn't understand" string; named types are hand-rolled per project | F8 (scoped), F9 (recovery), F16 (confirmation) in MVP; F13 (disambiguation), F18 (calibrated abstention) post-MVP | Partial (3/6 in MVP) |
| **Hebrew-first short-reply anchoring** | NLU pipelines are weak on 1–3 token Hebrew inputs; entity-only inputs have zero intent signal | F5 + F12 + quote normalisation pre-pass | **Yes** |
| **Vertical-bounded product-context guard** | Generic frameworks have no concept of a tenant-bounded catalog as ground truth | F6 — `activeGoal.productId` validated against `productmirrors` lookup; concierge cannot invent a SKU | **Yes** |
| **Reproducible eval set with the canonical bug** | DoorDash and Rasa CALM are heading here; OSS doesn't ship it | F10 + F17 (F17 Should-have, F10 Must-have) | Partial (F10 in MVP) |

---

## 10. Non-Functional Requirements

### 10.1 Latency

- **N1.** Belief read + write per inbound: p95 ≤ 30 ms (DDB single-item GetItem / UpdateItem on the existing conversation-state table).
- **N2.** Deterministic slot extractor: p95 ≤ 5 ms (regex + vocabulary lookup, no IO).
- **N3.** Concierge tool-call validator: zero new LLM calls in the happy path. On contract violation, one regenerate retry is permitted; p95 added latency on violation path ≤ 1.2 s. Violation rate target ≤ 5%, so contribution to overall p95 is bounded.
- **N4.** Overall p95 inbound-to-outbound: no regression > 200 ms vs current baseline.

### 10.2 Storage and persistence

- **N5.** `ConversationBelief` lives in the existing `maitre-conversation-state` DDB table, NOT in Redis. Rationale resolved in Appendix A topic 4: state must survive a deploy and a Redis flush; goal loss across deploys is the exact failure mode we are fixing.
- **N6.** Belief record is keyed by the same PK as conversation state; written transactionally with state on every turn.
- **N7.** Belief TTL on DDB: 30 days (same as conversation log retention).

### 10.3 Observability

- **N8.** CloudWatch metrics (per tenant): `belief_anchor_hit`, `belief_anchor_miss`, `concierge_tool_call_violation`, `concierge_tool_call_regenerate_success`, `belief_goal_mutation_rejected`, `belief_offtopic_recovery_triggered`, `belief_short_reply_unanchored` (sentinel: should be near-zero in MVP).
- **N9.** Every belief mutation appended to the existing conversation log with `event: "belief_mutation"` and a typed before/after diff. CloudWatch Insights pivot uses the existing `phase` enrichment from `phaseForState`.
- **N10.** X-Ray subsegments on belief read, slot extractor, and tool-call validator.

### 10.4 Hebrew handling

- **N11.** Quote normalisation pre-pass on every inbound: `ס\"מ` → `ס"מ`, `כ\"ג` → `כ"ג`, smart-quotes → straight quotes. Idempotent.
- **N12.** Yes/no vocabulary maintained in `backend/src/integrations/llm/yes-no-vocabulary.ts` (new file) with Hebrew + English + emoji; explicit test fixtures per language.
- **N13.** Numeric+unit extractor accepts Hebrew units (`ס"מ`, `ק"ג`, `גרם`, `קילו`), English units (`cm`, `kg`, `g`, `gram`), and mixed-script (`5 cm`, `5ס"מ`, `קילו וחצי` → 1.5 kg).
- **N14.** All scoped/recovery clarification copy lives in `backend/src/i18n/copy.ts` keyed by `belief.scoped.*` and `belief.recovery.*` with Hebrew + English variants; existing copy review pipeline applies.

### 10.5 Accessibility / channel constraints

- **N15.** No new channel primitives required. Scoped clarification is plain text; recovery clarification is plain text with example values inline (no interactive list — keeps WhatsApp + Telegram parity).
- **N16.** RTL rendering follows existing `outbound-list` and template conventions; numeric examples wrapped in LTR isolates if rendered inline.
- **N17.** Belief layer is channel-agnostic — works identically on WhatsApp and Telegram. No assumption of interactive-list support.

### 10.6 Safety and tenancy

- **N18.** Belief is tenant-scoped via the existing slug-as-`tenantId` convention. The DDB PK encodes `TENANT#<slug>`. Mongo Mongoose plugin not applicable (DDB), but every belief read/write asserts tenant slug match.
- **N19.** Concierge tool-call contract validator never executes user-supplied tool calls — it only validates that the LLM output declared one. Tool-call execution remains in the existing `tool-catalog.ts` allowlist.

---

## 11. Post-MVP Roadmap

**Phase 2 — "Stretch the edge" (next sprint after MVP ships clean):**
- F13 Disambiguation clarification (numbered product list)
- F14 Correction-vs-addition detector
- F15 Compound-slot extraction (Botpress "Already Extracted")
- F17 Eval-set CI harness (20 transcripts on PR)

**Phase 3 — "Coverage gaps" (parallel sprint, separate scope):**
- F22 `product_lookup` intent + handler
- F23 `business_information` intent + handler
- (These two are tracked in `docs/intent-gaps.md` and are independent of the belief layer; doing them after MVP avoids confounding their classification gains with the anchoring gains.)

**Phase 4 — "Quality flywheel":**
- F18 Calibrated abstention (`no_confident_intent`)
- F19 Multi-intent split-and-queue
- F20 "Same as last time" power-user shortcut
- F21 Late yes/no via decayed-confidence binding
- F16 formal Confirmation-clarification template (already partially in MVP via `awaiting_confirmation`; this phase makes it homogeneous with the rest of the taxonomy)
- Cross-sell on cart completion (intent-gaps Gap 8) — explicitly tracked separately

**Phase 5 — "Tenant scale":**
- Mid-slot product addition (researcher_2 #16) with sub-form mechanics
- Order-status intent (intent-gaps Gap 10)
- Deeper bilingual: full Arabic parity (currently a tracked debt item)

---

## 12. Explicit Out-of-Scope

- **F22 — `product_lookup` intent.** Documented in `docs/intent-gaps.md` as Gap 1 + Gap 4. Critical product work, but orthogonal to the structural fix. Bundling it with the belief layer would confound metrics: an improvement in `cart_completion_rate` could be from anchoring OR from better product Q&A. Ship belief first, measure clean, then ship `product_lookup` against a stable baseline. (Resolution in Appendix A topic 2.)
- **F23 — `business_information` intent.** Same reasoning. `docs/intent-gaps.md` Gap 2 + Gap 6.
- **Multi-intent message handling** (researcher_2 #10, #11). Rare in real traffic; deferred to Phase 4.
- **"Same as last time"** (researcher_2 #17). Delight feature, not survival feature.
- **Sub-form for mid-slot product addition** (researcher_2 #16). Non-trivial; depends on disambiguation + correction-vs-addition shipping first.
- **Visual / DSL authoring tools for goals** (F24). Contradicts the additive-overlay posture.
- **2nd LLM call per turn dedicated to clarification.** The brief permits it "IF it materially improves disambiguation"; MVP achieves the bug fix without one. If post-MVP metrics show disambiguation is the remaining bottleneck, a Haiku-class 2nd call may be added in Phase 2 or later.
- **Replacement of the existing state machine.** Additive only.
- **Arabic-language parity for new copy.** Tracked as existing debt in monorepo `CLAUDE.md`. New `belief.*` copy keys will be added in `he` + `en` only; Arabic falls back to English via i18next, consistent with current debt posture.

---

## 13. Appendix A — PM Cross-Consultation Log

This log is the integrity proof for this requirements doc. Each topic captures the genuine tension, both PMs' positions, and the resolution we both signed off on.

### A.1 MVP scope: belief layer minimal vs concierge tool-call included

- **PM 1 (Requirements Architect):** Ship the minimum that makes the production bug structurally impossible. Belief layer + 4th bypass state + short-reply anchoring is enough — the bug arises when turn 2's "5 ס\"מ" reaches the classifier; if F2 (open-question-first) short-circuits it, the bug is gone. The concierge tool-call contract is a *generalisation* of the fix; we can ship it in Phase 2 once the belief layer is stable in production. Lower MVP risk.
- **PM 2 (Differentiation & Experience):** That's a misread of the bug. Turn 2 *only has* an `openQuestion` to anchor to because turn 1's concierge bound one. In the production transcript, the concierge *did not* bind state — the LLM asked "?" without ever opening a form. If we ship F2 without F4, the engine still has no `openQuestion` for "5 ס\"מ" to anchor to on turn 2 of the actual bug, and the bug reproduces. The tool-call contract is *the* structural fix; the belief layer is the data structure that makes it possible.
- **Resolution (both PMs):** PM 2 is right on the bug-mechanics reading. The MVP MUST include F4 (concierge tool-call contract) because without it, F2's `openQuestion` is sometimes null when it should be live, and the bug reproduces. F4 stays in MVP. PM 1's risk concern is addressed by N3's bounded-violation-rate target and the one-regenerate-retry pattern: violations are observable and bounded, not silent failures.

### A.2 `product_lookup` + `business_information` intents in MVP

- **PM 1:** Include both. They are already documented as proposed intents in `intent-catalog.md`, `intent-gaps.md` calls them the highest-leverage classifier fixes, and they are needed for the bot to feel competent. Bundle them.
- **PM 2:** Hard no for MVP. They are *orthogonal* to the bug. Bundling them muddies the metrics: when `cart_completion_rate` moves, we will not know whether the belief layer helped or the new intents helped. The eco-system rule is one structural change per ship-cycle; this is the structural change. Ship the intents in a separate sprint against a stabilised baseline.
- **Resolution (both PMs):** PM 2's measurement argument wins. Two separate sprints, two clean attribution windows. Both intents are explicitly listed in §12 (Out-of-Scope) with a roadmap pointer to Phase 3. PM 1 accepts the deferral on the condition that the eval-set fixture (F17) includes 3–5 transcripts whose ideal answer requires `product_lookup`, so we have a calibrated "this is what we leave on the table by deferring" data point.

### A.3 Concierge forcing function and the KB Q&A `?` exception

- **PM 2:** F4 must be absolute — every concierge `?` emits `open_form`. No exemptions. The moment we exempt "KB questions that legitimately end in `?`", we re-create the bug under a different name.
- **PM 1:** That breaks legitimate KB UX. Example: customer asks "is the kebab gluten-free?", bot answers from KB, and ends with "want me to also check the burger?" That trailing question is genuinely useful and is NOT a slot-fill. Forcing it to emit `open_form` is overkill.
- **PM 2 (revised):** Then the rule is even more important, not less: that trailing question IS a `yes_no` slot. The bot is asking the customer to commit to a follow-up KB lookup. Bind it as `openQuestion = { slot: "kb_followup_<n>", expectedShape: "yes_no" }`. Now the customer's "כן" reply is a deterministic slot-fill that triggers the follow-up KB call. The bug-class is closed for KB too.
- **Resolution (both PMs):** No exemptions. Every concierge `?` emits `open_form`. The `slot` namespace is extended to include `kb_followup_*` shapes. Story U3 AC3.3 reflects this. This makes the rule simpler to enforce *and* improves KB-followup UX as a side effect.

### A.4 Belief-state storage: Redis vs DDB

- **PM 1:** Redis. Sub-50 ms reads, cheap, the WhatsApp p95 latency budget is tight (≈ 2 s end-to-end), and we already use Redis for conversation-state caching.
- **PM 2:** DDB. State must survive (a) a deploy, (b) a Redis cluster flush, (c) a Redis cache eviction under memory pressure. The exact failure mode we are fixing is "the goal evaporated" — putting the goal in a volatile store re-creates the failure mode at a different layer. Also: the existing `maitre-conversation-state` DDB table already holds `ConversationContext`; co-locating `ConversationBelief` is the obvious shape and makes transactional writes trivial.
- **Resolution (both PMs):** DDB, co-located with conversation state in `maitre-conversation-state`. Redis remains the cache layer for the existing state read path; the belief object can ride on the same cached record. PM 1's latency concern is addressed by N1's 30 ms p95 budget — DDB single-item GetItem is comfortably inside it. Codified in N5 / N6.

### A.5 Hebrew anchoring: classifier few-shots vs belief-state rule

- **PM 1:** Hebrew short-reply patterns ("כן", "5 ס\"מ", "קילו") are addressed by adding more Hebrew few-shot examples to the existing classifier prompt. We already have a Hebrew few-shot section in `prompts.ts`; this is incremental.
- **PM 2:** Few-shots are insufficient. They improve average classifier confidence on Hebrew short replies, but the failure mode is "classifier picks the *wrong* intent with high confidence", not "classifier abstains". More few-shots can make a wrong answer more confident. The fix has to live in the belief-state anchoring rule (F2): when `openQuestion` is live and inbound is ≤ 3 tokens, the classifier is *bypassed entirely*. That is a structural protection, not a tuning one.
- **Resolution (both PMs):** PM 2 wins on the structural argument. Hebrew anchoring lives in F2 (open-question-first), F5 (deterministic Hebrew slot extractors), F12 (Hebrew yes/no vocabulary), and N11–N13 (Hebrew normalisation rules). The classifier prompt may STILL be updated with Hebrew few-shots over time, but it is not how we close the bug. PM 1 accepts and adds that the eval-set fixture (F17 / F10) must include the bug transcript plus 5 additional Hebrew short-reply cases as MVP regressions, to keep the structural fix honest.

### A.6 Additional minor disagreements (resolved without tension)

- **`activeForm` as separate object vs reuse `PendingCartSession`:** PM 2 originally specced `activeForm` as part of `ConversationBelief`. PM 1 noted `PendingCartSession` already carries that data on `ConversationContext`. Resolved: `ConversationBelief.activeGoal.formId` is a pointer; the session itself stays where it is. Avoids data duplication and migration risk. Reflected in §4 spec.
- **`offTopicCounter` location:** PM 1 noted the existing `redirectCount` on `PendingCartSession` and `offTopicCount` on `ConversationContext`. PM 2 wanted a new counter on `ConversationBelief`. Resolved: belief-level counter applies in `awaiting_product_details` (where there is no `PendingCartSession` yet) and any future goal-bearing state without a session; existing per-session counter continues to apply inside `awaiting_cart_fields`. Two counters, scoped clearly. AC6.1 reflects this.

---

## 14. Appendix B — Research Traceability Matrix

Every Must-Have feature traces to a specific section in researcher_1 (r1) or researcher_2 (r2). Should/Could features included for completeness.

| Feature | Source | Section |
|---|---|---|
| F1 ConversationBelief | r2 | §9.1 (belief-state object spec), §5 (EXTRA edge), §10 insights 3 |
| F2 Open-question-first router | r1 §8 insight 4, r1 §9 #1; r2 §9.3 rule 1, §10 insight 8 |
| F3 `awaiting_product_details` bypass state | r1 §8 insight 2, §10 Q1; r2 §10 insight 3 |
| F4 Concierge tool-call contract | r2 §5 ("How Maître can own it" — rule 3), §9.3 rule 3, §10 insight 4 |
| F5 Deterministic slot extractors | r1 §8 insight 4, §9 #1, #5, #9; r2 §2.5 #13, §10 insight 5 |
| F6 Goal-persistence guard | r2 §2.2 #6, §9.3 rule 2 |
| F7 `openQuestion` TTL decay | r2 §2.1 #4, §9.3 rule 4, §10 insight 7 |
| F8 Scoped clarification | r1 §9 #1, #10; r2 §7.1, §10 insight 2 |
| F9 Off-topic recovery clarification | r1 §9 #10; r2 §7.4, §10 insight 2 |
| F10 Production-bug regression test | r1 §5 (bug-transcript test); r2 §5.1 litmus test, §10 insight 12 |
| F11 CloudWatch metrics | r1 §8 insight 10; r2 §10 insight 11 |
| F12 Hebrew yes/no vocabulary | r1 §9 #5; r2 §2.5 |
| F13 Disambiguation clarification | r2 §7.2 |
| F14 Correction-vs-addition detector | r1 §9 #3; r2 §2.6 #15, §10 insight 9 |
| F15 Compound-slot extraction | r1 §7 (Intermediate tier), §9 #2; r2 §2.4 #11 |
| F16 Confirmation-clarification template | r1 §3 (phase 6), §8 insight 8; r2 §7.3 |
| F17 Eval-set CI harness | r2 §10 insight 11 |
| F18 Calibrated abstention | r2 §2.3 #8, #9, §10 insight 6 |
| F19 Multi-intent split-and-queue | r1 §9 #4; r2 §2.4 #10 |
| F20 "Same as last time" shortcut | r1 §4.2, §7; r2 §2.7 #17 |
| F21 Late yes/no decayed binding | r2 §2.1 #4 |
| EC1–EC7 | r2 §2 (catalog) + §11 (MVP-priority subset) |
| Differentiator: goal as durable object | r2 §4, §5, §6 |
| Differentiator: open-question-first | r1 §8 (all insights); r2 §10 insight 8 |
| Differentiator: concierge tool-call | r2 §5, §9.3 rule 3 |
| Differentiator: clarification taxonomy | r2 §7 |
| Differentiator: Hebrew anchoring | r2 §2.5, §10 insight 5 |
| Differentiator: vertical-bounded product guard | r1 §8 insight 3; r2 §2.2 #6 |
| Differentiator: eval set | r2 §10 insight 11 |
| N5–N7 DDB persistence | r2 §10 open question 3, resolved in Appendix A.4 |
| N8–N10 observability | r1 §8 insight 10; r2 §10 insight 11 |
| N11–N14 Hebrew handling | r2 §2.5 |

---

```json
{
  "doc_type": "requirements",
  "product": "intent-clarification-engine",
  "date": "2026-05-17",
  "authors": ["pm_1_requirements_architect", "pm_2_differentiation_experience"],
  "vision": "Every customer utterance is interpreted as a probe of an active ordering goal, never as an isolated classification problem — so the bot can never forget what it just asked, and a four-character reply like '5 ס\"מ' lands on the slot the bot was waiting for.",
  "problem": "Maître's engine treats each turn as a fresh classification; the LLM concierge asks slot-shaped questions without binding state; short or ambiguous replies are mis-routed or restart the session. The production transcript 'אני רוצה אנטריקוט → 5 ס\"מ → yes → Hi, how can I help?' is the canonical instance.",
  "personas": ["end_customer_hebrew_first_whatsapp", "engineering_team_single_engineer", "tenant_operator_eval_only"],
  "extra_edge": {
    "name": "Goal-Anchored Clarification",
    "core_object": "ConversationBelief { activeGoal, openQuestion, offTopicCounter }",
    "anchoring_rules": [
      "open_question_first_routing",
      "goal_persistence_via_whitelisted_handlers",
      "concierge_tool_call_contract_open_form_required_on_question",
      "open_question_ttl_decay"
    ]
  },
  "mvp_features": ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"],
  "should_have_features": ["F13", "F14", "F15", "F16", "F17"],
  "could_have_features": ["F18", "F19", "F20", "F21"],
  "wont_have_features": ["F22_product_lookup_intent", "F23_business_information_intent", "F24_visual_authoring"],
  "mvp_success_metrics": [
    {"id": "M1", "metric": "production_bug_routes_correctly", "target": "100% pass on canonical transcript integration test"},
    {"id": "M2", "metric": "belief_anchor_hit_rate", "target": ">=25% on short-reply turns with live openQuestion"},
    {"id": "M3", "metric": "concierge_tool_call_compliance", "target": ">=95% first-gen, 100% after one regenerate"},
    {"id": "M4", "metric": "goal_mutation_safety", "target": "zero non-whitelisted productId mutations in 7-day soak"},
    {"id": "M5", "metric": "cart_completion_uplift", "target": "+10pp on 20-transcript eval set"},
    {"id": "M6", "metric": "p95_latency_regression", "target": "<=200ms"}
  ],
  "edge_cases_mvp": ["EC1_bare_unit_reply", "EC2_bare_confirmation_no_live_question", "EC3_llm_asks_without_binding", "EC4_wrong_product_carried_forward", "EC5_state_advances_on_wrong_classifier", "EC6_cancel_mid_form", "EC7_hebrew_quote_normalisation"],
  "edge_cases_deferred": ["late_yes_no", "calibrated_abstention", "multi_intent", "same_as_last_time", "mid_slot_product_addition", "deep_bilingual", "correction_vs_addition"],
  "out_of_scope": ["product_lookup_intent_this_sprint", "business_information_intent_this_sprint", "multi_intent_handling", "visual_authoring", "second_llm_call_per_turn", "state_machine_rewrite", "arabic_copy_parity"],
  "non_functional": {
    "latency_p95_belief_rw_ms": 30,
    "latency_p95_extractor_ms": 5,
    "latency_overall_regression_ms_max": 200,
    "storage": "DynamoDB co-located with maitre-conversation-state",
    "ttl_days": 30,
    "metrics": ["belief_anchor_hit", "belief_anchor_miss", "concierge_tool_call_violation", "concierge_tool_call_regenerate_success", "belief_goal_mutation_rejected", "belief_offtopic_recovery_triggered", "belief_short_reply_unanchored"],
    "open_question_ttl_seconds_default": 600
  },
  "cross_consultation_resolutions": [
    {"topic": "mvp_scope_concierge_tool_call_inclusion", "winner": "PM2", "decision": "F4 included in MVP — without it F2 has no openQuestion to anchor to on the actual bug"},
    {"topic": "product_lookup_business_information_in_mvp", "winner": "PM2", "decision": "deferred to separate sprint for clean metric attribution"},
    {"topic": "concierge_kb_question_exemption", "winner": "PM2", "decision": "no exemption — KB follow-up questions emit kb_followup_* yes_no openQuestion"},
    {"topic": "belief_state_storage_redis_vs_ddb", "winner": "PM2", "decision": "DDB — state must survive deploys and Redis flushes"},
    {"topic": "hebrew_anchoring_classifier_vs_structural", "winner": "PM2", "decision": "structural anchoring in belief layer, not classifier few-shots"}
  ],
  "stage": "requirements_complete_ready_for_cpo_signoff",
  "next_stage": "cto_sprint_planning"
}
```
