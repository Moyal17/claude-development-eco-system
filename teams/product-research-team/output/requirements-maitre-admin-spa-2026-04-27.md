# Product Requirements Document: Maître.ai Admin SPA — Sprint 7
## Version: 1.0 | Authors: pm_1, pm_2 | CPO: approved | Date: 2026-04-27

> **Scope:** This document covers all frontend work for Sprint 7 (S7) of Maître.ai. It is the single source of truth for the React Admin SPA. All backend API endpoints are assumed to exist from S0–S6; this document specifies the SPA behavior, not the backend.

---

## 1. Product Vision

The Maître.ai Admin SPA is the only merchant dashboard that shows a shop owner not just what sold — but how smart their bot is, what it got wrong, and exactly what to fix next.

---

## 2. Problem Statement

A shop owner who deploys a WhatsApp AI concierge faces three unresolved problems no existing admin tool addresses: (1) they cannot see when the bot asked a customer a confusing question or made a wrong claim; (2) they have no interface to teach the bot about their products in structured form; (3) their standard commerce admin (WooCommerce) has no concept of a conversation, a validator verdict, or an allergen declaration. Existing WhatsApp admin tools (Wati, respond.io) show delivery rates but not bot intelligence. The result is a shop owner who cannot close the loop between what the bot does and what they should change.

---

## 3. Target Personas

### Persona 1: Amir — Shop Owner (primary)
- **Description**: Runs a premium butcher shop. Non-technical. Uses WooCommerce daily. Spends 15–20 min/day on admin.
- **Goals**: Capture more Thursday/Friday orders; reduce phone-line overflow; know the bot is doing its job correctly.
- **Frustrations with existing solutions**: WooCommerce has no awareness of AI conversations; Wati shows delivery rates only; no tool tells him when the bot said something wrong.
- **Success looks like**: Can train the bot, manage orders, send broadcasts, and read bot health — all without developer help. Knows within 30 seconds what needs attention today.

### Persona 2: Staff Member (secondary — limited access)
- **Description**: Counter staff or manager. Can handle escalations and order fulfillment.
- **Goals**: Resolve customer escalations quickly; capture pickup weights; not see financial data they shouldn't.
- **Frustrations**: Being given access to tools they don't need; missing clear escalation context.
- **Success looks like**: Handles all daily operational tasks from /inbox and /orders. Revenue data is masked.

---

## 4. The EXTRA Edge

**Bot Health is the only admin dashboard that tells an SMB owner what to teach their AI next.**

No commerce admin — WooCommerce, Shopify, Wati, respond.io — exposes: validator verdict distribution, LLM cost breakdown (concierge vs validator share), jailbreak attempt counts, allergen claim blocks, or hallucination flags. These metrics are the signal that tells an owner: "your bot asked customers to clarify weight 12 times this week because your ribeye schema is missing a required field — here is how to fix it."

**How it's specced (not just mentioned):**
- Bot Health tile links directly to the relevant fix: `needs_clarification` spike → "Edit Schema" button for the top offending product; allergen claim block → "View KB entry" button.
- Bot Health is the anchor of the daily dashboard check — positioned as tile 4 (after Pulse, Money, Operations), sized to demand attention.
- Validator verdict distribution chart is a primary widget, not a sub-metric.

---

## 5. Feature List — MoSCoW Prioritized

### Must Have (MVP — S7)

| # | Feature | Research Source | Persona(s) | Notes |
|---|---------|----------------|-----------|-------|
| F1 | SPA bootstrap: React 18 + Vite + TS + Tailwind + Radix + TanStack Query + i18next | Tech spec §8.1 | All | RTL-safe from day 1 |
| F2 | /login — Email + password auth with JWT cookie | Tech spec §9.2 | All | Role-aware routing post-login |
| F3 | Global navigation sidebar with notification badges | R1 insight #2 | All | Escalation count, overdue orders badge |
| F4 | /dashboard — Pulse tile | Sprint plan S7 | Amir | Active convos, orders today vs yesterday, channel status, open alerts, revenue today bignum |
| F5 | /dashboard — Money tile | Sprint plan S7 | Amir (owner only) | Revenue by period, AOV, failed charges, refund rate, reconciliation status + payment kill switch indicator |
| F6 | /dashboard — Operations tile | Sprint plan S7 | Amir + Staff | Live order queue preview (top 5 overdue), prep-time stats, capacity %, manual-intervention queue count |
| F7 | /dashboard — Bot Health tile | Sprint plan S7 | Amir | Conversion rate, drop-off, messages-to-checkout, validator verdicts, LLM cost, hallucination flags, jailbreak count — with direct action links |
| F8 | /inbox — Escalation queue with full chat history | Sprint plan S7 + PRD M17 | Amir + Staff | Service window indicator per conversation |
| F9 | /inbox — Direct reply to customer (respects 24h service window) | R2 edge case EI1 | Amir + Staff | Block free-form reply if window closed; offer template selection instead |
| F10 | /inbox — Claim/lock model (prevent double reply) | R2 edge case EI2 | Staff | "Staff X is handling this" indicator |
| F11 | /inbox — Mark escalation resolved | PRD US-I01 | Amir + Staff | With optional resolution note |
| F12 | /kb — KB entry list with search and filter by type | Sprint plan S7 + R1 workflow | Amir | Filter: cut / topic / occasion / allergen |
| F13 | /kb — Create and edit KB entry (title HE/EN, body markdown, cooking method, pairings, serving size, substitutes) | Sprint plan S7 + PRD M4 | Amir | Injection-flag on save |
| F14 | /kb — Allergen field editor per entry (gluten_free, kosher, halal, dairy_free, vegan, nut_free) | Allergen guard implementation | Amir | "Not confirmed" language (not "null"); review cadence reminder |
| F15 | /kb — KB entry preview ("what will the bot say when asked about X") | R1 workflow diagram + R1 insight #8 | Amir | Test-query field for realistic question input |
| F16 | /kb — CSV bulk upload with diff preview and error report | Sprint plan S3 + R2 edge case EK3 | Amir | Error CSV download |
| F17 | /kb — Injection-flagged entry review workflow | Sprint plan S5 KB pre-strip | Amir | Flagged entries not live until reviewed |
| F18 | /orders — Live order queue sortable by deadline, state, and customer | Sprint plan S7 Operations tile | Amir + Staff | Overdue highlighted in red |
| F19 | /orders — Order detail: line items, customer, payment status, conversation link | R2 power-owner need | Amir + Staff | "View conversation" button |
| F20 | /orders — Single-item pickup capture (actual weight entry + J4 Tranzilla) | Sprint plan S7 + PRD M12 | Amir + Staff | Accepts comma as decimal separator; confirm dialog with parsed weight |
| F21 | /orders — Batch weight entry for multi-item variable orders | R2 edge case EO5 | Amir + Staff | All variable items in one form |
| F22 | /orders — Mark order paid-offline | Sprint plan decisions #4 | Amir (owner only) | Counts as conversion in analytics |
| F23 | /broadcasts — Broadcast history list with status (draft/sending/paused/complete) | Sprint plan S7 | Amir | Cancel and pause in-progress |
| F24 | /broadcasts — New broadcast: template picker (5 seeded templates) | Sprint plan S7 | Amir | Show template Meta approval status before allowing selection |
| F25 | /broadcasts — Audience picker: opted-in / by channel (WA/Telegram/both) | Sprint plan S7 | Amir | Opted-out customers never selectable |
| F26 | /broadcasts — Stock guard configuration (SKU + pause threshold) | Sprint plan S7 + R2 EB3 | Amir | Auto-pause with owner notification |
| F27 | /broadcasts — Preview with recipient count before send | R2 edge case EB1 | Amir | Block send if 0 recipients |
| F28 | /broadcasts — Variable character limit validation | R2 edge case EB5 | Amir | Client-side, before send |
| F29 | /broadcasts — Send now or schedule | Sprint plan S7 | Amir | Scheduled broadcasts visible in list |
| F30 | /broadcasts — Live send status monitor (sent/delivered/failed) | Sprint plan S7 | Amir | Per-channel breakdown |
| F31 | /schemas — Schema list per product and per category | Sprint plan S7 | Amir | Schema coverage badge on catalog |
| F32 | /schemas — Field editor: add/edit/remove fields (name, type, requirement) | Sprint plan S7 | Amir | Types: enum, decimal, boolean, free_text |
| F33 | /schemas — Conditional rule builder: one condition per field (field + op + value) | PM cross-consult resolution + R2 power-owner | Amir | Cycle detection on save |
| F34 | /schemas — Price-affecting flag per field | Sprint plan S4 order schemas | Amir | |
| F35 | /schemas — Category-level template (all products in category inherit) with product-level override | Sprint plan S7 | Amir | Library mode |
| F36 | /schemas — Live preview: "this is what the bot will ask for this product" | Sprint plan S7 + R1 insight #8 | Amir | Required fields highlighted separately from optional |
| F37 | /schemas — Schema versioning display (current version, in-flight cart count on old version) | Sprint plan S4 + R2 ES1 | Amir | Info banner when in-flight carts exist |
| F38 | /calendar — Operating hours grid (day × open/close times) | Sprint plan S7 + PRD M15 | Amir | Per-day toggle |
| F39 | /calendar — Shabbat cutoff time configuration | Sprint plan S7 + PRD M15 | Amir | |
| F40 | /calendar — Israeli holiday calendar toggle | Sprint plan S7 + PRD M15 | Amir | Enable/disable holidays from `@hebcal/core` |
| F41 | /calendar — Channel toggles (WA enabled/disabled, Telegram enabled/disabled) | Sprint plan S7 | Amir | Shows connection health per channel |
| F42 | /settings — Staff user management (invite, role assign, deactivate) | Tech spec §9.2 | Amir (owner only) | Roles: owner, staff |
| F43 | /settings — Kill switch (disable payment link generation) with owner-only guard + "type CONFIRM" dialog | Sprint plan S8 + R2 ESW2 | Amir (owner only) | Logs to payment_events ledger |
| F44 | Full Hebrew + English i18n on every page, RTL layout for Hebrew | Sprint plan S7 + PRD M18 | All | RTL verified on all interactive components |
| F45 | Role-based access: staff cannot see revenue, cannot access /settings, cannot access kill switch | PRD AC-15 + R2 ESW2 | All | JWT role claim enforced client-side + server-side |
| F46 | Mobile-first responsive layout (tablet 2-column, mobile single-column) | Sprint plan S7 | Amir | Lighthouse perf ≥ 85 |

### Should Have (Post-MVP v1.1)

| # | Feature | Research Source | Persona(s) | Notes |
|---|---------|----------------|-----------|-------|
| S1 | /broadcasts — Re-engagement audience segment (last order > N days) | R2 power-owner needs | Amir | Deferred from MVP per PM cross-consult |
| S2 | /schemas — Compound conditional rules (AND/OR) | PM cross-consult | Amir | Single condition sufficient for MVP |
| S3 | Bot Health — Per-conversation drill-down on jailbreak events | R2 open question #1 | Amir | Aggregate + inbox filter link sufficient for MVP |
| S4 | /kb — "Last allergen review" push notification (email/WA to owner) | R2 open question #4 | Amir | In-UI reminder sufficient for MVP |
| S5 | /catalog — Surplus threshold configuration per product | Tech spec §7.4 | Amir | Needed for v1.1 surplus-scan Lambda |
| S6 | /orders — Conversation-to-order funnel drill-down (which conversations converted) | R2 power-owner needs | Amir | |

### Could Have (Future Consideration)

| # | Feature | Research Source | Persona(s) | Notes |
|---|---------|----------------|-----------|-------|
| C1 | TOTP MFA for owner login | Tech spec §9.2 | Amir | argon2 + JWT is sufficient for MVP |
| C2 | /kb — AI-assisted KB entry drafting (owner provides product name → Sonnet drafts) | Power-owner | Amir | Requires additional API endpoint |
| C3 | /schemas — Drag-and-drop field reordering | R1 open question #2 | Amir | |
| C4 | /analytics — Custom date range picker | Analytics feature spec | Amir | 5 preset windows sufficient for MVP |

### Won't Have (Explicitly Out of Scope for S7)

| # | Feature | Reason |
|---|---------|--------|
| W1 | S9 analytics tiles: Customers / Catalog / Risk / Growth | Deferred to S9 — requires ≥30 real orders |
| W2 | Customer-facing WhatsApp UI (this is the admin SPA only) | Customer channel = WhatsApp, not web |
| W3 | Multi-tenant superadmin view | Platform-admin feature, not shop-owner |
| W4 | Email digests / scheduled reports | Post-MVP |
| W5 | In-app onboarding wizard for Woo/Tranzilla/Meta credential setup | S7 scope is /settings CRUD; guided wizard is v1.1 |

---

## 6. MVP Definition

The MVP Admin SPA is a production-grade React application deployed to S3/CloudFront that gives a shop owner a complete operational cockpit in one browser session: check the dashboard for today's activity, resolve escalations from the inbox, capture pickup weights on pending orders, compose and send a broadcast with a stock guard, author KB entries with allergen declarations, configure product order schemas with a live bot preview, manage operating hours and Shabbat cutoffs, and read the bot's health metrics with direct action links to fix what the bot got wrong.

**MVP Success Metrics (measured at end of S7):**
- Shop owner completes their first KB entry, first broadcast, and first order capture without developer assistance.
- All pages render correctly in Hebrew RTL.
- Lighthouse performance score ≥ 85 on /dashboard.
- Role-based access: staff cannot reach revenue data or settings.
- p95 dashboard load ≤ 2 seconds on a standard 4G connection.

---

## 7. User Stories with Acceptance Criteria

### Epic 1 — Authentication & Navigation

#### US-1.01: Login
**As** any admin user,
**I want to** log in with email and password,
**so that** I access my shop's cockpit securely.

**Acceptance Criteria:**
- Given I navigate to `/login`, when I enter correct credentials, then I am redirected to `/dashboard` with my name displayed in the top bar within 2 seconds.
- Given I enter incorrect credentials, when I submit, then an inline error "Incorrect email or password" is shown — no field-level indication of which was wrong.
- Given my JWT expires mid-session, when I make an API call, then the app silently refreshes the token using the refresh cookie — I am not logged out.
- Given I am `staff` role, when I navigate to `/settings`, then I am redirected to `/dashboard` with a "Access denied" toast.
- Given I am on any page in Hebrew, when the login page renders, then all labels, error messages, and placeholder text are in Hebrew, layout is RTL.

#### US-1.02: Global Navigation
**As** any admin user,
**I want to** navigate to any section quickly,
**so that** I don't lose context between tasks.

**Acceptance Criteria:**
- Given I am logged in, when I look at the sidebar, then I see: Dashboard, Inbox (with unresolved escalation count badge), Orders (with overdue count badge), KB, Broadcasts, Schemas, Catalog, Calendar, Settings.
- Given I am `staff` role, when the sidebar renders, then Settings is not visible.
- Given the escalation badge count is 0, then the badge is hidden (not showing "0").
- Given I switch locale to Hebrew, when the sidebar renders, then all labels are in Hebrew and the layout is right-to-left (icons on the right, text on the left).

---

### Epic 2 — Dashboard

#### US-2.01: Pulse Tile
**As** the shop owner,
**I want to** see today's activity at a glance,
**so that** I know what needs immediate attention.

**Acceptance Criteria:**
- Given I open `/dashboard`, when the page loads, then the Pulse tile shows: count of active conversations in the last 60 minutes with a spark-line, orders today vs yesterday (number + arrow), WhatsApp channel status (green/yellow/red), Telegram channel status, count of open escalations, and today's revenue with a projection.
- Given WhatsApp is disconnected, then the WhatsApp status shows red with "Disconnected — check settings" link to `/settings`.
- Given there are 0 open escalations, then the escalation counter shows "0 open" with a green indicator (not hidden).
- Given I switch to Hebrew locale, then all labels, numbers (currency formatted as ₪ with IL comma separators), and status text render in Hebrew RTL.
- Given the page auto-refreshes, when new data arrives, then values update without a full page reload (TanStack Query refetchInterval = 60 seconds).

#### US-2.02: Money Tile (owner only)
**As** the shop owner,
**I want to** see today's financial health,
**so that** I can spot problems before they escalate.

**Acceptance Criteria:**
- Given I am `owner` role, when I view the Money tile, then I see: revenue today, AOV, failed charge rate, refund rate, reconciliation status, and payment kill switch status badge.
- Given I am `staff` role, when the Money tile renders, then all financial values are replaced with "—" and a "Revenue visible to owner only" label.
- Given reconciliation status is "mismatch", then the tile shows a red "Reconciliation mismatch" badge with a "Contact support" action link.
- Given payment kill switch is active, then the tile shows a prominent amber "Payments disabled" badge.
- Given I am owner and I click the "Payments disabled" badge, then I am taken to `/settings#emergency-controls`.

#### US-2.03: Operations Tile
**As** the shop owner or staff,
**I want to** see the live order queue status,
**so that** I know which orders need action today.

**Acceptance Criteria:**
- Given orders exist, when I view the Operations tile, then I see: top 5 orders sorted by deadline (nearest first), prep-time average vs target (with overdue highlighted red), delivery/pickup split, and manual-intervention queue count.
- Given an order is overdue (deadline passed, not captured), then its row is highlighted red.
- Given I click any order row, then I navigate to that order's detail in `/orders`.
- Given the manual-intervention queue count is > 0, then a "Needs attention" badge is shown with a count, and clicking navigates to `/orders?filter=manual`.

#### US-2.04: Bot Health Tile
**As** the shop owner,
**I want to** see how the bot performed this week,
**so that** I know what to fix to improve conversion.

**Acceptance Criteria:**
- Given the Bot Health tile loads, then it shows: conversation → order conversion rate (this week vs last week), average messages to checkout, validator verdict distribution (pie chart: ok / needs_clarification / warning), LLM cost this week (concierge ₪ + validator ₪ separately), hallucination flag count, jailbreak/refusal attempt count.
- Given validator `needs_clarification` rate is > 10%, then the metric is highlighted amber and an "Edit Schema" action button appears, linking to `/schemas?filter=high-clarification`.
- Given hallucination flag count is > 0, then a "View flagged KB entries" link appears, filtering `/kb` to flagged entries.
- Given jailbreak count > 0, then a "View in Inbox" link appears, filtering `/inbox` to flagged conversations.
- Given this is a new tenant with fewer than 10 conversations, then the tile shows "Collecting data — Bot Health available after 10 conversations" instead of empty charts.
- Given I am `staff` role, then the Bot Health tile is visible (no financial data in this tile).

---

### Epic 3 — Inbox

#### US-3.01: View Escalation Queue
**As** any admin user,
**I want to** see all open escalations with customer context,
**so that** I can respond to customers quickly.

**Acceptance Criteria:**
- Given I open `/inbox`, then I see open escalations sorted by created-at (oldest first), each showing: customer name, channel (WhatsApp/Telegram icon), created-at timestamp, reason (first message of escalation), service window status (OPEN/CLOSED with time remaining or elapsed).
- Given service window is closed for a conversation, then the row shows a "Window closed" badge in amber.
- Given I click an escalation, then I see the full conversation history (all messages, inbound and outbound, with timestamps and direction) in a chat bubble UI.
- Given conversation history is unavailable (system error), then the detail shows "Conversation history unavailable — customer phone: [phone]" with a "Call / WhatsApp manually" link.

#### US-3.02: Reply to Escalation
**As** any admin user,
**I want to** reply directly to a customer from the inbox,
**so that** I resolve escalations without switching to WhatsApp.

**Acceptance Criteria:**
- Given service window is OPEN, when I type a reply and click Send, then the message is delivered as a free-form WhatsApp message and appears in the conversation thread within 3 seconds.
- Given service window is CLOSED, when I try to type in the reply box, then the reply box is disabled and a banner reads "The 24-hour service window has closed. You can only send pre-approved templates." with a "Choose template" button.
- Given I click "Choose template", then I see a picker of available templates and can send one.
- Given two staff members have the same ticket open, when one starts typing, then the other sees "[Name] is typing..." and the reply box is locked for 60 seconds.
- Given the lock expires without a message sent, then the reply box becomes available again.

#### US-3.03: Resolve Escalation
**As** any admin user,
**I want to** mark an escalation as resolved,
**so that** the queue reflects accurate state.

**Acceptance Criteria:**
- Given I click "Resolve", then a dialog asks for an optional resolution note (max 200 chars).
- Given I confirm, then the escalation moves to "Resolved" status and disappears from the open queue.
- Given I need to find a resolved escalation, then a "Show resolved" filter reveals them.
- Given an escalation is resolved, when the customer sends a new message, then a new escalation ticket is created — the resolved one is not re-opened.

---

### Epic 4 — Knowledge Base

#### US-4.01: Browse and Search KB
**As** the shop owner,
**I want to** see and search all KB entries,
**so that** I can find and edit what the bot knows.

**Acceptance Criteria:**
- Given I open `/kb`, then I see a list of all entries with: title (HE + EN), type badge (cut/topic/occasion), SKU (if linked), last-updated date, allergen coverage indicator (which allergen fields are confirmed vs not-confirmed), and a "Pending review" badge if flagged.
- Given I type in the search field, then the list filters to entries whose title or body contains the search term — in real time (debounced 300ms).
- Given I filter by type "cut", then only cut entries are shown.
- Given no KB entries exist, then the empty state shows "Your knowledge base is empty — add your first entry or upload a CSV" with action buttons.

#### US-4.02: Create and Edit KB Entry
**As** the shop owner,
**I want to** author KB entries for my products and topics,
**so that** the bot can answer customer questions accurately.

**Acceptance Criteria:**
- Given I click "New entry", then I see a form with: title HE (required), title EN (required), type picker, SKU field (optional, validated against `products_mirror`), body (markdown editor with preview pane), cooking method, pairings (comma-separated), serving size per person (number), substitutes (SKU picker).
- Given I type body text containing "ignore previous instructions", "system:", "you are now", or similar patterns, when I click Save, then a warning appears: "This entry has been flagged for review. It won't be live until you review and confirm it." The entry is saved with `status = pending_review`.
- Given the entry is saved without flags, then it goes live immediately and the bot can retrieve it.
- Given I save an entry, when I click "Preview", then I see a chat-bubble simulation: the entry is the KB context and I can type a realistic customer question to see the bot's response.
- Given the preview query does not surface this entry (retrieval miss), then a "This entry was not retrieved for that query — consider adding these keywords" suggestion appears.

#### US-4.03: Allergen Fields
**As** the shop owner,
**I want to** declare what my products are and aren't,
**so that** the bot only confirms allergen claims I've explicitly approved.

**Acceptance Criteria:**
- Given I open a KB entry or product in /catalog, when I view the allergen section, then I see 6 fields: Gluten-free, Kosher, Halal, Dairy-free, Vegan, Nut-free — each with three states: "Confirmed ✓" (true), "Not applicable ✗" (false), "Not confirmed (bot will say: contact us)" (null).
- Given a field is in the "Not confirmed" state, then it is visually distinct (grey, not a checkbox or red X) and the label reads "Not confirmed" not "null" or "unset".
- Given I save a field as "Confirmed", then the `allergens[key]` is set to `true` in `products_mirror`.
- Given allergen data for a product has not been reviewed in more than 60 days, then the product shows a soft "Review allergen data" indicator (amber dot, not alarming) in the /catalog list.
- Given I bulk-edit allergen fields for 5+ products, then a confirmation: "You are updating allergen declarations for N products — this affects what the bot tells customers" appears before save.

#### US-4.04: CSV Bulk Upload
**As** the shop owner,
**I want to** upload a CSV of KB entries,
**so that** I can seed the knowledge base for all my products quickly.

**Acceptance Criteria:**
- Given I click "Upload CSV", then a file picker opens accepting `.csv` files only.
- Given the CSV is valid, when uploaded, then a diff preview shows: N new entries, M entries to update, 0 entries to delete, with a scrollable preview of changes.
- Given the CSV contains rows with errors (missing required fields, invalid SKU), then after upload I see a row-by-row error report with: row number, SKU, field name, error reason. A "Download error CSV" button is provided.
- Given I confirm the import, then entries are upserted. Entries with injection-flag content are saved as `pending_review`.
- Given I cancel the import, then no changes are made.

---

### Epic 5 — Orders

#### US-5.01: Order Queue
**As** any admin user,
**I want to** see all pending orders sorted by urgency,
**so that** I know what to prepare today.

**Acceptance Criteria:**
- Given I open `/orders`, then I see a queue of orders with: order number, customer name, scheduled pickup time, total (owner sees amount; staff sees "—"), payment status badge, and an "Overdue" red highlight if pickup time has passed without capture.
- Given I filter by "Pending capture", then only orders awaiting weight entry and J4 capture are shown.
- Given I click an order, then I see order detail: line items, customer info, payment method and status, estimated vs pre-auth amount, a "View conversation" button linking to the conversation in /inbox.
- Given I click "View conversation", then /inbox opens filtered to the customer conversation that contains this order's items.

#### US-5.02: Pickup Weight Capture
**As** any admin user,
**I want to** enter actual pickup weights and finalize payment,
**so that** the customer is charged the correct amount.

**Acceptance Criteria:**
- Given an order has weight-variable items, when I click "Capture pickup", then I see a form listing all variable items with their estimated weight and an input for actual weight.
- Given a single-item order, then the form shows one weight input. Given a multi-item order (3 variable items), then the form shows all 3 inputs on one screen (batch form — not one at a time).
- Given I enter a weight using a comma as decimal separator (e.g. "1,5"), then it is parsed as 1.5 — no error is shown.
- Given I click "Confirm capture", then a summary dialog shows: each item with estimated vs actual weight, total charged amount, and "Confirm" or "Cancel".
- Given actual weight × price ≤ 115% of pre-auth, when I confirm, then Tranzilla J4 capture is triggered; on success, order status updates to "Complete" in real time.
- Given actual weight × price exceeds 115% pre-auth, when I confirm, then the system captures 115%, shows "Balance due: ₪X" and generates a balance payment link that is automatically sent to the customer.
- Given the J4 capture API call fails, then I see "Capture failed — retry" prominently; the order is NOT marked complete; I can retry.

#### US-5.03: Mark Paid Offline
**As** the shop owner,
**I want to** mark phone or in-person orders as paid,
**so that** they count toward my conversion metrics.

**Acceptance Criteria:**
- Given I click "Mark paid offline" on an order, then a confirmation dialog appears: "This order will be counted as a completed sale in your analytics. Confirm?"
- Given I confirm, then `order.paymentMethod = offline`, `order.state = paid`, and the conversion is recorded.
- Given I am `staff` role, when I view order actions, then "Mark paid offline" is not shown (owner-only action).

---

### Epic 6 — Broadcasts

#### US-6.01: Compose and Send Broadcast
**As** the shop owner,
**I want to** send a promo to opted-in customers,
**so that** I drive orders from my existing customer base.

**Acceptance Criteria:**
- Given I click "New broadcast", then I pick from 5 seeded templates: promo, surplus-nudge, thursday-nudge, order-status, re-engagement.
- Given a template has Meta approval status "Pending" or "Rejected", then it is shown in the list but is non-selectable with a status badge and a "Check Meta approval status" tooltip.
- Given I select a template, then I see its variable fields. Each field shows its character limit and a live character counter. If a variable exceeds Meta's limit, the field highlights red and Send is blocked.
- Given I configure audience as "All opted-in", then the recipient count is shown before I can proceed.
- Given recipient count is 0, then a "No opted-in recipients" warning appears and the Send button is disabled.
- Given I configure a stock guard SKU and threshold (e.g. lamb shoulder, pause if < 2kg), then the broadcast pauses automatically if stock drops below threshold during sending and I receive a dashboard notification.
- Given I click "Send now" and confirm, then the broadcast enters "Sending" state; the list page shows live progress (sent/delivered/failed counts, refreshed every 10 seconds).
- Given I need to stop a running broadcast, then "Pause" and "Cancel" buttons are available on the broadcast detail.

---

### Epic 7 — Schema Editor

#### US-7.01: View and Edit Product Schema
**As** the shop owner,
**I want to** configure what the bot asks customers when they order each product,
**so that** the bot gathers the right information for each cut.

**Acceptance Criteria:**
- Given I open `/schemas`, then I see a list of all products and categories with: product name, schema type (preset/custom/inherited), current version number, and number of in-flight carts on this version.
- Given a product has no schema assigned, then it is shown with a "No schema — using default" badge and an "Add schema" action.
- Given I click a product to edit, then I see the field editor listing current fields with: name, type badge (enum/decimal/boolean/free_text), requirement badge (required/optional/conditionally_required), and price-affecting indicator.

#### US-7.02: Add and Configure a Field
**As** the shop owner,
**I want to** add ordering fields to a product schema,
**so that** the bot asks the right questions for that product.

**Acceptance Criteria:**
- Given I click "Add field", then a form appears with: field name (text), type picker (enum / decimal / boolean / free_text), requirement picker (required / optional / conditionally_required).
- Given I pick "enum", then I can add allowed values via a tag input.
- Given I pick "decimal", then I can set min, max, and step.
- Given I pick "conditionally_required", then a condition builder appears: "Required when [field picker] [operator: =, ≠, >, <, ≥, ≤] [value input]".
- Given I define a condition that creates a circular dependency (field A required if field B is > X, field B required if field A is set), when I save, then an error "Circular dependency detected between field A and field B" prevents save.
- Given I check "Price-affecting", then the live preview shows this field with a "affects price" label.

#### US-7.03: Schema Live Preview
**As** the shop owner,
**I want to** see exactly what the bot will ask a customer for this product,
**so that** I can verify the schema makes sense before going live.

**Acceptance Criteria:**
- Given I open the schema preview for a product, then I see a chat bubble simulation starting with "I'd like to add [product name] to my order" and the bot asking each required field in sequence as a natural question.
- Given a field is optional, then the preview shows it as a follow-up question with a "skip" option visible.
- Given a field has a condition (e.g. vacuum_pack required if weight_kg > 2), then the preview lets me enter a weight and shows/hides the vacuum_pack question dynamically.
- Given I save a schema change, then a new version is created. If any carts are on the old version, a banner reads: "N cart(s) in progress will complete using the previous schema version. New carts will use version X."

#### US-7.04: Category Template
**As** the shop owner,
**I want to** define a schema once for a product category,
**so that** all products in that category automatically ask the right questions.

**Acceptance Criteria:**
- Given I select a category in the schema list, then I can edit a category-level template applied to all products in that category.
- Given I add a field at the category level, then all products in the category inherit that field unless they have a product-level override.
- Given a product has a product-level override, then the product schema list shows "Custom (overrides category)" badge.
- Given I edit a category template, then I see a warning: "This will affect N products. Products with custom overrides are not affected."

---

### Epic 8 — Calendar

#### US-8.01: Configure Operating Hours and Shabbat Cutoff
**As** the shop owner,
**I want to** set the shop's operating hours and Shabbat cutoff,
**so that** the bot correctly manages customer expectations and order timing.

**Acceptance Criteria:**
- Given I open `/calendar`, then I see a weekly grid with each day showing open/close times and an on/off toggle.
- Given I toggle a day off, then that day shows "Closed" and orders cannot be scheduled for that day.
- Given I set the Shabbat cutoff time (e.g. Friday 14:00), then the bot declines orders for same-day Friday pickup after 14:00 and offers Sunday.
- Given I enable the Israeli holiday calendar, then all major Jewish holidays (Rosh Hashanah, Yom Kippur, Sukkot, Pesach, Shavuot, etc.) are respected using `@hebcal/core` data.
- Given I view the calendar in Hebrew, then all day names, month names, and holiday names are in Hebrew.

#### US-8.02: Channel Toggles
**As** the shop owner,
**I want to** enable or disable WhatsApp and Telegram independently,
**so that** I can control which channels are active without touching the backend.

**Acceptance Criteria:**
- Given WhatsApp is enabled, then the toggle is green and the connection health indicator shows last-verified timestamp.
- Given I toggle WhatsApp off, then a confirmation dialog: "Disabling WhatsApp will stop all incoming and outgoing messages on that channel. Confirm?" After confirm, new inbound messages on that channel are dropped (queued is not supported in MVP).
- Given Telegram is enabled independently, then toggling WA off does not affect Telegram.

---

### Epic 9 — Settings

#### US-9.01: Staff User Management
**As** the shop owner,
**I want to** manage who has access to the dashboard,
**so that** staff can handle operational tasks without seeing sensitive data.

**Acceptance Criteria:**
- Given I open `/settings`, then I see a Users section listing all active users with: name, email, role, and last-login date.
- Given I click "Invite user", then I enter their email and pick a role (owner/staff); they receive an invitation email.
- Given I click "Deactivate" on a user, then their JWT is invalidated on next use and they are redirected to /login.
- Given I am `staff` role, then /settings is not accessible (redirected to /dashboard with error toast).

#### US-9.02: Kill Switch (Emergency Payment Disable)
**As** the shop owner,
**I want to** disable payment link generation in an emergency,
**so that** I can protect customers if I suspect a payment system issue.

**Acceptance Criteria:**
- Given I open `/settings`, then I see an "Emergency Controls" section with a "Disable payment links" button and current status ("Payments: Active" in green or "Payments: Disabled" in red).
- Given I am `staff` role, then the Emergency Controls section is not rendered.
- Given I click "Disable payment links", then a modal requires me to type "CONFIRM" before the action proceeds.
- Given I confirm, then payment link generation is disabled; all new `request_payment_link` tool calls return "Payments temporarily unavailable — please contact us"; existing in-flight payments complete normally.
- Given payments are disabled, then the Money tile on /dashboard shows a prominent "Payments disabled" amber badge with a "Re-enable" link back to /settings.
- Given I click "Re-enable", then the same "type CONFIRM" dialog appears; on confirm, payments are re-enabled within 30 seconds.

---

## 8. Edge Case Requirements

| # | Edge Case | Severity | Requirement | Acceptance Criteria |
|---|-----------|----------|-------------|---------------------|
| EC1 | KB entry saved with injection-like text | High | Save with `pending_review` status; not live until owner reviews | Entry shows "Pending review" badge; bot cannot retrieve it until owner confirms |
| EC2 | CSV upload with 200 rows, 15 fail validation | Medium | Show full error report per row; allow import of valid rows | Error report downloadable as CSV; invalid rows skipped; valid rows imported |
| EC3 | Order capture: actual weight entered with comma decimal ("1,5") | High | Parse comma as decimal separator | "1,5" parses to 1.5; no error thrown; confirm dialog shows parsed value |
| EC4 | Order capture: J4 Tranzilla call fails after weight submitted | Critical | Never mark order complete; show retry; do not persist weight until payment confirmed | Order remains in "Pending capture" state; retry button visible |
| EC5 | Inbox reply attempted outside 24h service window | High | Block free-form; offer template selection | Reply box disabled with "Window closed" banner; template picker shown |
| EC6 | Two staff members reply to same escalation | High | Optimistic lock; "X is typing" indicator | Reply box locked for 60s when another user is typing; auto-releases on inactivity |
| EC7 | Broadcast sent to 0 opted-in recipients | Medium | Block send; show warning | Send button disabled when recipient count = 0; "0 recipients" shown prominently |
| EC8 | Broadcast template not approved by Meta | Critical | Block send; show status | Non-approved templates non-selectable with status badge |
| EC9 | Schema change with in-flight carts on old version | High | Show in-flight cart count; allow save with info banner | "N carts on previous version" banner shown; save allowed; old carts complete on old schema |
| EC10 | Schema conditional rule creates circular dependency | High | Validate on save; reject with specific error | Error message names the two conflicting fields |
| EC11 | Kill switch activated during in-flight payment | Critical | Disable new payment links only; do not interrupt existing payments | In-flight payments complete; payment events ledger records kill-switch timestamp |
| EC12 | Staff user accidentally accesses kill switch | Critical | Owner-role guard + "type CONFIRM" dialog | Staff cannot see Emergency Controls section; owner must type "CONFIRM" |
| EC13 | Actual capture weight exceeds 115% pre-auth | High | Capture 115%, generate and send balance link | Balance link auto-sent to customer; order shows "Balance pending" status |
| EC14 | New tenant: Bot Health tile has < 10 conversations | Medium | Graceful empty state instead of zero-charts | "Collecting data — available after 10 conversations" message |

---

## 9. Differentiation Requirements

| # | Differentiator | Requirement | How It Beats Competitors |
|---|---------------|-------------|--------------------------|
| D1 | Bot Health tile — validator verdicts | Validator verdict pie chart with `needs_clarification` action trigger → `/schemas` | No admin shows this; owners of competing bots are blind to bot-IQ gaps |
| D2 | Bot Health tile — LLM cost breakdown | Separate concierge ₪ and validator ₪ cost display, weekly trend | SMB owners can see their AI spending at SKU-level attribution |
| D3 | Bot Health tile → Schema Editor link | "Edit Schema" button on `needs_clarification` spike, pre-filtered to high-clarification products | Closes the loop: bot failure → owner fix, in one click |
| D4 | Bot Health tile → KB link | "View flagged KB entries" on hallucination flag count | Closes the loop: wrong claim → KB fix |
| D5 | Allergen field editor with "Not confirmed" language | Explicit three-state allergen field per product; "Not confirmed" renders as grey (not as failure) | No commerce admin exposes allergen declarations at product level as a bot-output control |
| D6 | Schema editor live preview | Real bot question simulation per product schema, with condition testing | Owner sees exactly what their bot will ask — before going live |
| D7 | Inbox service window indicator | Per-conversation "Window OPEN/CLOSED — X hours remaining" badge | Prevents silent message failures that no other WhatsApp admin surfaces |
| D8 | Broadcast stock guard | Auto-pause when guard SKU drops below threshold; auto-notification | No BSP admin exposes stock-aware broadcast gating |

---

## 10. Non-Functional Requirements

### Performance
- `/dashboard` p95 load ≤ 2 seconds on 4G (Lighthouse performance ≥ 85).
- `/orders` list render ≤ 1 second for up to 100 orders.
- TanStack Query refetch intervals: dashboard tiles = 60s, inbox = 30s, order queue = 60s.
- Client-side broadcast variable validation: < 100ms response to keypress.

### Accessibility
- WCAG 2.1 AA compliance for all interactive elements.
- All icon-only buttons have `aria-label`.
- Color is never the sole indicator of status (badges have text labels too).
- Hebrew RTL tested: all Radix UI components verified for RTL layout.
- Interactive list button labels ≤ 20 characters in Hebrew (validated by lint check on i18n strings).

### Security & Privacy
- JWT token in httpOnly cookie; never in localStorage.
- Revenue data masked for `staff` role: zero client-side rendering of revenue fields for staff.
- Kill switch action requires `role = owner` JWT claim enforced server-side.
- All API calls include `Authorization: Bearer <token>`; tenant isolation enforced by server.
- No PII (customer phone, full name) displayed in broadcast recipient lists — only counts.

### Reliability & Error Handling
- Every API call wrapped in TanStack Query with error state rendered to the user (no silent failures).
- Optimistic updates with rollback on API failure for status changes.
- Offline state: banner "You appear to be offline — data may be stale" when network unavailable.
- Form autosave: KB entry and schema field editors autosave draft every 30 seconds.

### Internationalisation (Hebrew + English)
- All strings in `src/i18n/he.json` and `src/i18n/en.json` — no hardcoded strings anywhere.
- Locale toggle persistent in localStorage.
- All charts, tables, and date pickers tested in Hebrew.
- Currency formatted as ₪ X,XXX for ILS in Hebrew locale; $X,XXX for USD.
- RTL layout: icons flip, sidebar right-to-left, text alignment right for Hebrew.

---

## 11. Post-MVP Roadmap

| Phase | Feature(s) | Value Delivered | Dependency |
|-------|-----------|-----------------|------------|
| S7 → v1.1 (post-launch) | Re-engagement broadcast segment (last order > N days) | Recapture dormant customers | Customer last-order-date query |
| v1.1 | Schema compound conditional rules (AND/OR) | Power-owner schema control | S7 single-condition rule builder |
| v1.1 | Bot Health per-conversation drill-down on jailbreak events | Investigation capability | S7 aggregate counts + inbox filter |
| v1.1 | Surplus threshold configuration per product in /catalog | Enables surplus-scan Lambda | v1.1 surplus-scan Lambda |
| v1.1 | Allergen review push notifications (email or WA to owner) | Proactive compliance reminders | Email or WA notification service |
| S9 | Analytics dashboard: Customers / Catalog / Risk / Growth tiles | Full business intelligence | ≥30 real orders flowing |
| v1.2 | AI-assisted KB entry drafting | Faster bot training | Anthropic API call from admin SPA |
| v1.2 | Onboarding wizard for Woo/Tranzilla/Meta credential setup | Faster tenant onboarding | Guided multi-step form |

---

## 12. Explicit Out-of-Scope

- S9 analytics tiles (Customers / Catalog / Risk / Growth) — requires ≥30 real orders.
- Customer-facing WhatsApp UI — channel is WhatsApp, not web browser.
- Multi-tenant superadmin panel — platform-admin feature.
- Email digest reports — post-MVP.
- TOTP MFA for login — argon2 + JWT refresh is sufficient for MVP.
- Guided onboarding wizard for credentials — /settings CRUD is sufficient for MVP.
- In-app chat with Meta support — out of scope entirely.
- Mobile native app (iOS/Android) — responsive web only.
- Custom date range picker on analytics — 5 preset windows in S9.

---

## Appendix A: PM Cross-Consultation Log

| Topic | PM 1 Position | PM 2 Challenge | Resolution |
|-------|--------------|---------------|------------|
| Schema editor conditional rules | Defer full condition builder to v1.1 — preset covers Day 1 owners | Full condition UI is Must Have — validator loop requires owner to fix conditions, not just fields | Full condition UI Must Have. Scope: one condition per field. Compound (AND/OR) → v1.1. |
| Broadcast audience segmentation | Opted-in + channel filter only; re-engagement deferred | Agree to defer re-engagement. But recipient count preview + opted-out-never-selectable is Must Have | Re-engagement segment → v1.1. Recipient count + opted-in-only base → Must Have. |
| Bot Health jailbreak drill-down | Aggregate counts only. Individual conversation drill-down is v1.1 | Agreed. Add "View in Inbox" filter link to reuse existing infrastructure | Aggregate + inbox filter link → Must Have. Per-conversation Bot Health drill-down → v1.1. |
| Kill switch location | Dashboard button (as described in sprint plan) | Settings page — staff must not reach it. Dashboard button = accidental activation risk | Settings page (owner-only) + payment status indicator on Money tile Dashboard. No dashboard button. |
| Bot Health tile for staff | Staff should see Bot Health (no financial data) | Agreed — Bot Health is operational, not financial | Bot Health visible to staff. Money tile masked for staff. |
| Empty states | Mentioned as important but not specced | Must have explicit empty state per page with a first-action CTA | Added to acceptance criteria for every list page |

---

## Appendix B: Research Traceability Matrix

| Requirement | Source | Researcher | Finding Summary |
|-------------|--------|-----------|----------------|
| F7 Bot Health tile | Sprint plan S7 + R2 §2 | r2 | Bot Health is a new category — no competitor shows validator verdicts or LLM cost to SMBs |
| F7 Bot Health → Schema link | R2 insight #7 + power-owner needs | r2 | Power-owner tuning flywheel: Bot Health signal → Schema fix |
| F8/F9 Service window indicator in inbox | R2 edge case EI1 | r2 | Silent message failure when owner replies outside window = trust-destroying |
| F10 Claim/lock model | R2 edge case EI2 | r2 | Double-reply scenario destroys customer trust |
| F14 Allergen fields "Not confirmed" language | Allergen guard implementation + R2 §7 | r2 | Allergen fields are legal exposure; null must not look like "not set" |
| F15 KB preview with test query | R2 edge case EK5 | r2 | Owner needs to verify retrieval, not just content |
| F17 Injection-flag review workflow | Sprint plan S5 KB pre-strip | r1/r2 | KB content injection is a Critical threat (C-07) |
| F21 Batch weight entry | R2 edge case EO5 | r2 | Multi-item weight capture one-at-a-time = daily friction |
| F26 Broadcast stock guard | Sprint plan S7 + R2 EB3 | r2 | Sending promo for OOS item = trust destruction + wasted sends |
| F28 Broadcast variable char limit | R2 edge case EB5 | r2 | Meta rejects over-limit variables at send time — must validate client-side |
| F33 Schema conditional rule builder | R2 power-owner needs + PM cross-consult | r2 | Validator needs_clarification = schema condition gap; owner must be able to fix |
| F36 Schema live preview | Sprint plan S7 + R1 insight #8 | r1 | Preview is the "aha moment" for schema editor adoption |
| F37 Schema version + in-flight cart count | Sprint plan S4 + R2 ES1 | r1/r2 | In-flight carts on old schema must complete without disruption |
| F43 Kill switch "type CONFIRM" dialog | R2 edge case ESW2 | r2 | Staff accidental activation risk is catastrophic |
| F45 Role-based access (revenue masking) | PRD AC-15 | r1 | Revenue visible to owner only — confirmed across all sources |
| D5 Allergen "Not confirmed" three-state | Allergen guard implementation | r2 | Three states (true/false/null) have distinct UX meaning; null ≠ false visually |
| D7 Inbox service window indicator | R2 edge case EI1 | r2 | No WhatsApp admin surfaces the 24h window status — market gap |
| D8 Broadcast stock guard auto-pause | R2 edge case EB3 | r2 | No BSP admin has stock-aware broadcast gating |
