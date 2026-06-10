# Mock Data Template

The mock data layer is how you keep the real component visually faithful without booting real services. Rules:

1. **Shape matches the component's `data` prop exactly.** Import the real type and satisfy it.
2. **Content is plausible and domain-specific.** No Lorem Ipsum. No "John Doe". Use names, dates, and numbers that look like real production data for the product's domain.
3. **Never trigger network fetches.** Leave URL fields `undefined` unless you're supplying a data URL (e.g. the silent WAV). Empty strings often trigger fetches — use `undefined`.
4. **Keep the scene's data stable.** Values computed from `Date.now()` should be memoized or frozen in the mock so the scene is deterministic per frame.

## Template

```ts
// remotion/<feature>/mock<Feature>Data.ts
import type { <DataType> } from "../../src/<path to types>";

// If the data type has enriched fields the real app decorates at runtime,
// create a local helper type that extends the base:
type <EnrichedItem> = <BaseItem> & { <extraField>: string };

const item = (/* ordered args */): <EnrichedItem> => ({ /* ... */ });

const items: <EnrichedItem>[] = [
  // 10–25 realistic entries covering the beats the scene shows.
  // Each entry should look production-plausible for the domain:
  //
  //   Transcript/lecture:
  //     - timestamps (start/end in seconds), speaker labels, on-topic sentences
  //     - realistic confidence (0.9–0.97 for clean speech)
  //
  //   Dashboard metrics:
  //     - numbers in a realistic range for the product
  //     - timestamps relative to "now" (2h ago, Yesterday, etc.)
  //
  //   Chat thread:
  //     - two+ sender names, varied message lengths, one "typing" bubble optional
];

export const mock<Feature>Data: <DataType> = {
  // Every required field filled with a plausible value:
  _id: "demo-<feature>-01",
  status: "COMPLETED",
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  // URL fields: undefined (not "" — empty string often triggers a fetch)
  artifacts: {
    textFileUrl: undefined,
    vttFileUrl: "data:text/vtt;charset=utf-8,WEBVTT", // truthy sentinel if code gates on presence
    audioFileUrl: undefined, // the scene may overlay a synthetic silent WAV
  },
  segments: items as unknown as <DataType>["segments"],
  // ...fill the rest
};
```

## Copy guidance by domain

| Domain | What "real" looks like |
|---|---|
| Lecture transcript | Subject-specific terms ("back-propagation", "forward pass"), student follow-ups that reference the professor's last point, timestamps that accumulate |
| Team meeting | Action items with owners and dates, round-robin speakers, "I'll pick this up by Thursday" style commitments |
| Podcast interview | Host + guest names, interjections ("Yeah exactly", "So walk me through…"), verbal timestamps ("earlier you mentioned…") |
| Analytics dashboard | Round-ish but not round numbers (18.3%, $4,217), pairs of week-over-week deltas, recognizable metric names (MAU, churn, LTV, CVR) |
| E-commerce order | Plausible SKUs, mixed quantities, realistic shipping labels, tax + subtotal totals that add up |
| Chat thread | 2+ senders, varied message lengths, one short-reply cluster, one "typing" indicator optional |

## Realistic timestamps

Always use `Date.now() - <offsetMs>` for relative times. Hard-coding absolute ISO strings makes the demo look stale the next time someone renders it.

```ts
createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3h ago
updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
```

## Validating the mock

After writing the mock, render a still at a frame where the component is visible. Check:

1. No loading skeletons rendered in place of data sections.
2. No "No data" / empty-state components rendered.
3. All text is legible at 1920×1080 @ 0.5 scale (i.e. would be legible on a phone).
4. Timestamps look fresh (e.g. "2h ago", "Today", "Yesterday"), not "3 weeks ago".
