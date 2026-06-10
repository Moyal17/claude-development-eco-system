# Example: `transcript-dialog-tabs` (TransVibe)

Reference implementation of this skill, built in `~/sourceControl/transvibe-frontend/`. Use this as a calibration point: if you follow the skill against `TranscriptDrawer.tsx`, your output should reproduce these files with only cosmetic differences.

## Scene description

- **Composition ID:** `transcript-dialog-tabs`
- **Duration:** 15s (450 frames @ 30fps)
- **Dimensions:** 1920×1080
- **Story:** cursor approaches a completed job card on the Library page → click → TranscriptDrawer springs open → camera zooms in to 1.38× → Timeline tab with 17 speaker-labeled lecture segments → cursor moves to Speakers tab → click → scene crossfades to Speakers tab (overview cards + ConversationFlow) → zoom out → TransVibe watermark fades in

## Files created

| Path | Purpose |
|---|---|
| `remotion/transcript/TranscriptDialogScene.tsx` | The scene itself — cursor, ripples, dialog spring, camera zoom, controlled tab, portal container, scoped CSS, silent-WAV helper |
| `remotion/transcript/DemoProviders.tsx` | QueryClient + conditional MemoryRouter + TooltipProvider |
| `remotion/transcript/mockTranscriptData.ts` | 17 segments of a CS 231 neural-networks lecture between Prof. Martinez and Jamie (Student); 2 speakers, ~134s, realistic confidences |
| `src/components/remotion/TranscriptDialogTabsPlayer.tsx` | `@remotion/player` wrapper forwarding `theme` via `inputProps` |
| `src/components/home/HowItWorksSection/TranscriptTabsExplanation.tsx` | Marketing section, 2-col card, `Users` icon |

## Files modified (backward-compatible only)

| Path | Change | Why |
|---|---|---|
| `src/components/transcript/TranscriptDrawer.tsx` | Added 4 optional props: `controlledActiveTab?`, `onActiveTabChange?`, `dialogContentClassName?`, `dialogPortalContainer?`, `nonModal?` | Let the scene drive the active tab, scope CSS, redirect the portal, avoid body scroll lock |
| `src/components/ui/dialog.tsx` | Extended `DialogContent` with optional `portalContainer?: HTMLElement \| null` that forwards to `<DialogPortal container={...}>` | Needed for portal redirection |
| `remotion/Root.tsx` | Added `<Composition id="transcript-dialog-tabs">` entry | Registration |
| `remotion.config.ts` | Added webpack override: alias `@ → src`, `DefinePlugin` env stub, `enableTailwind` wrap | So the Remotion bundler can build the real component's transitive deps |
| `src/components/home/HowItWorksSection/index.tsx` | Rendered `<TranscriptTabsExplanation theme={theme} />` and re-exported | Marketing placement |

## Dependencies added

```json
{ "devDependencies": { "@remotion/tailwind": "4.0.410" } }
```

(Must match `remotion` major.minor — same project had `remotion@^4.0.410`.)

## Gotchas that bit us (documented in `@references/integration-gotchas.md`)

1. `@/` imports unresolved in Remotion's webpack → alias required.
2. `import.meta.env.VITE_*` undefined at module load → DefinePlugin stub required.
3. Tailwind classes rendering as raw HTML → `@remotion/tailwind` + `import "../../src/index.css"`.
4. Radix Dialog escaping the player and covering the whole app page → portal container with `transform: translateZ(0)`.
5. shadcn's `DialogContent` hardcoded its portal → extend with `portalContainer?` prop.
6. `document.body` scroll locked while the demo played in a loop → `nonModal` prop via Radix `modal={false}`.
7. Dialog sized with `h-[99vh] w-[99vw]` overflowed the frame → scoped `<style>` with a unique class, not a global override.
8. `MemoryRouter` nested inside the app's `BrowserRouter` → `useInRouterContext()` guard.
9. `useUserFeatures` called `/auth/me` with no backend → QueryClient `retry: false` + infinite stale.
10. `AudioPlayerBar` stuck on skeleton → silent WAV data URL with duration matching the mock.

## Duration adjustments made

- First pass: 30s, 900 frames
- Second pass: 15s, 450 frames (user feedback: "make it faster")

Beat frame numbers were all halved. Camera zoom added on a second pass (user: "zoom into the dialog").

## Final visual beats (at 30fps)

| Frame | Time | Beat |
|---|---|---|
| 0 | 0.0s | Cursor begins approach from right edge |
| 24 | 0.8s | Cursor arrives at card; click ripple |
| 30 | 1.0s | Dialog spring begins |
| 60 | 2.0s | Camera zoom-in begins |
| 90 | 3.0s | Zoom at 1.38× (held) |
| 180 | 6.0s | Cursor starts moving toward Speakers tab |
| 210 | 7.0s | Cursor arrives at tab; click ripple |
| 225 | 7.5s | Controlled tab flips to "speakers" |
| 420 | 14.0s | Camera zoom-out begins |
| 435 | 14.5s | Watermark fade-in begins |
| 450 | 15.0s | End |
