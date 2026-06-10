# Integration Gotchas — Read First

Flat checklist of every problem we hit while building a faithful Remotion product demo of a real component. Each entry has: **symptom → root cause → fix**.

If the scene isn't working and the symptom matches, apply the fix. Don't re-derive.

---

## 1. Remotion bundle can't resolve `@/…` imports

**Symptom:** `Module not found: Can't resolve '@/components/ui/button'` during `npx remotion still` or `npx remotion studio`.

**Cause:** Remotion's webpack bundler does not read Vite/tsconfig path aliases.

**Fix:** Add `resolve.alias["@"] = path.resolve(process.cwd(), "src")` via `Config.overrideWebpackConfig` in `remotion.config.ts`. Use `process.cwd()`, not `__dirname` — ESM `.ts` configs don't have reliable `__dirname`.

---

## 2. `import.meta.env.VITE_*` crashes at module load

**Symptom:** `TypeError: Cannot read properties of undefined (reading 'VITE_ENVIRONMENT')` pointing at a transitive dep like `src/lib/config.ts`.

**Cause:** Remotion's webpack build doesn't know about Vite's env-var injection. Any file in the dep graph that reads `import.meta.env.VITE_*` at module load throws.

**Fix:** Add a `webpack.DefinePlugin` that stubs `import.meta.env`:

```ts
new webpack.DefinePlugin({
  "import.meta.env": JSON.stringify({
    VITE_ENVIRONMENT: "development",
    VITE_API_BASE_URL: "http://localhost:8080",
    VITE_DEBUG: "false",
    VITE_LOG_LEVEL: "info",
    // ...one key per VITE_* var the app actually reads
    NODE_ENV: "development",
    MODE: "development",
    DEV: true,
    PROD: false,
    SSR: false,
  }),
})
```

Grep the app for `import.meta.env.VITE_` to discover every key that needs a stub.

---

## 3. Tailwind classes render as plain boxes

**Symptom:** The real component's DOM is there but un-styled (grey block, no spacing, no colors). Dialog shows as a bare `div` overlay.

**Cause:** Remotion's default webpack config processes CSS but does not run Tailwind's PostCSS plugin.

**Fix:**
1. `npm install --save-dev @remotion/tailwind@<matching-version>` where version matches installed `remotion` major.minor exactly.
2. In `remotion.config.ts`: `Config.overrideWebpackConfig((c) => { const withTw = enableTailwind(c); return { ...withTw, /* rest of your overrides */ }; })`.
3. In the scene file: `import "../../src/index.css"` at the top so Tailwind's generated utilities are bundled.

---

## 4. Radix Dialog escapes the player / covers the whole app

**Symptom:** When the `@remotion/player` mounts the scene inside the app, the dialog overlays the entire page, not just the player frame.

**Cause:** Radix `<DialogContent>` renders inside `<DialogPortal>` → `document.body`. The portal escapes the player's scaled container and the dialog's `position: fixed` is relative to the viewport, not the player.

**Fix:** Give Radix a portal target that is a descendant of the scene, and put a `transform: translateZ(0)` (or any other transform / `will-change: transform` / `filter`) on that target. CSS spec: an ancestor with a transform becomes the containing block for `position: fixed` descendants.

```tsx
const portalRef = useRef<HTMLDivElement | null>(null);
const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);
useEffect(() => setPortalEl(portalRef.current), []);

// ...
<div ref={portalRef} style={{ position: "absolute", inset: 0, transform: "translateZ(0)", pointerEvents: "none" }} />
<TranscriptDrawer dialogPortalContainer={portalEl} /* ... */ />
```

This requires the shadcn `DialogContent` to forward a `container` prop — see Gotcha 5.

---

## 5. shadcn `DialogContent` doesn't forward a `container`

**Symptom:** You have a portal target div but the dialog still goes to `document.body`.

**Cause:** Stock `DialogContent` renders `<DialogPortal>` with no `container` prop — it hard-codes the destination.

**Fix:** Extend the shadcn wrapper at `src/components/ui/dialog.tsx` with an optional `portalContainer`:

```tsx
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    portalContainer?: HTMLElement | null;
  }
>(({ className, children, portalContainer, ...props }, ref) => (
  <DialogPortal container={portalContainer ?? undefined}>
    {/* unchanged */}
  </DialogPortal>
));
```

Then thread the prop through your target component (e.g. `TranscriptDrawer`) to `DialogContent`.

---

## 6. Page scroll is locked while the demo is on screen

**Symptom:** After the demo's dialog opens, the host page can't scroll. Body is stuck.

**Cause:** Radix `<Dialog modal={true}>` (the default) sets `overflow: hidden` on `document.body` and traps focus. Because the demo dialog is always open (autoplay loop), the lock never releases.

**Fix:** Accept an optional `nonModal?: boolean` prop on your target component that passes `modal={!nonModal}` to the Radix `<Dialog>` root. Pass `nonModal` from the scene.

```tsx
<Dialog open={open} onOpenChange={onOpenChange} modal={!nonModal}>
```

Trade-off: non-modal dialogs don't have focus trap or click-outside-to-close. Fine for a scripted demo.

---

## 7. Dialog sized for the viewport overflows 1920×1080

**Symptom:** The dialog fills the entire composition frame — the library page behind it isn't visible.

**Cause:** The real dialog uses classes like `h-[99vh] w-[99vw]` tuned to real viewports.

**Fix:** Do **not** edit the real component's classes. Instead:

1. Add a `dialogContentClassName?: string` prop on the target component that merges into the `DialogContent` className via `cn()`.
2. From the scene, pass a unique class like `transcript-demo-dialog`.
3. Inject a `<style>` block in the scene that scopes the size override:

```tsx
<style>{`
  [data-${name}-demo-portal] .transcript-demo-dialog[role="dialog"] {
    height: auto !important;
    max-height: 780px !important;
    width: 960px !important;
    max-width: 960px !important;
  }
`}</style>
```

Scope with the portal container's data-attribute so the rule doesn't affect real Dialogs elsewhere in the host app.

---

## 8. Radix default overlay is too dark against a busy background

**Symptom:** The library page / dashboard behind the dialog is invisible through the Radix overlay.

**Cause:** shadcn's default `DialogOverlay` uses `bg-black/80`.

**Fix:** Scope an override inside the scene's `<style>`:

```css
[data-<name>-demo-portal] .fixed.inset-0.bg-black\/80 {
  background-color: rgba(0, 0, 0, 0.25) !important;
}
```

---

## 9. Nested routers crash

**Symptom:** `@remotion/player` displays ⚠ instead of the scene. Console shows `You cannot render a <Router> inside another <Router>`.

**Cause:** Your `DemoProviders` wraps children in `<MemoryRouter>`, but the host app already has a `<BrowserRouter>` — React Router 6 refuses to nest.

**Fix:** Provide `MemoryRouter` **conditionally**, only when there isn't already one in scope:

```tsx
import { MemoryRouter, useInRouterContext } from "react-router-dom";

const MaybeRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const inRouter = useInRouterContext();
  return inRouter ? <>{children}</> : <MemoryRouter>{children}</MemoryRouter>;
};
```

This works in Remotion Studio (no outer router → MemoryRouter added) and inside the host app (outer router → passthrough).

---

## 10. API-calling hooks try to fetch in Studio

**Symptom:** Console logs `Browser failed to load http://localhost:8080/auth/me (XHR): net::ERR_CONNECTION_REFUSED`. The component still renders fine.

**Cause:** The real component uses hooks like `useUserFeatures` that hit an API. In Studio there's no backend.

**Fix:** In `DemoProviders`, create a QueryClient with retries disabled and infinite stale time. Let the `isLoading` state fall through — most feature-gated UI treats "loading" as "feature off", which is exactly what we want for a demo. No module mocking needed.

```ts
const demoQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false, refetchOnMount: false },
    mutations: { retry: false },
  },
});
```

---

## 11. AudioPlayerBar / video player shows loading skeleton forever

**Symptom:** Component's audio/video control bar is stuck on a skeleton. Controls never render.

**Cause:** The bar waits for the `loadedmetadata` event. With no `src` or an unreachable URL, the event never fires.

**Fix:** Pass a synthetic silent WAV data URL that matches the mock's declared duration. Construct it in-browser — see `@silent-wav-helper.md`.

```ts
const audioSrc = useMemo(() => createSilentWavDataUrl(mockData.duration ?? 120), []);
const mockDataWithAudio = useMemo(() => ({
  ...mockData,
  artifacts: { ...mockData.artifacts, audioFileUrl: audioSrc },
}), [audioSrc]);
```

---

## 12. Composition duration mismatch between Root and Player

**Symptom:** Player plays for a different length than Studio, or last frame shows a black/blank tail.

**Cause:** `durationInFrames` in `remotion/Root.tsx` doesn't match `durationInFrames` on the `@remotion/player` `<Player>`.

**Fix:** Use a single exported constant (e.g. `TRANSCRIPT_DEMO_DURATION = 450`) and import it in both places.

---

## 13. `useCurrentFrame` / `useVideoConfig` throws outside composition context

**Symptom:** `Error: useCurrentFrame must be called inside a composition`.

**Cause:** A child component calls these hooks but is rendered outside `<Player>` / `<Composition>` — usually by accidentally importing the scene component into plain app code.

**Fix:** These hooks are safe inside anything rendered by `<Player>` or `<Composition>`. Never import the scene file directly from a page; always go through `@remotion/player`.

---

## 14. Remotion still render gets ⚠ while Studio works

**Symptom:** `npx remotion still` produces a blank PNG with a warning triangle, but `npx remotion studio` renders the scene fine.

**Cause:** Usually a version mismatch warning (e.g. `zod`) or an `npx remotion ensure-browser` step that hasn't run.

**Fix:** Read the full stderr — the top of the log has the actual cause. Common fixes: `npx remotion add zod`, `npm install @remotion/tailwind@<matching>`.

---

## 15. Mocks go stale when the real component evolves

**Symptom:** The demo scene renders a page/dialog that no longer matches the current app (obsolete header, missing toolbar, different card layout). Existing `Mock<Feature>Page` / `Mock<Feature>Card` files look right structurally but diverge from `src/…` as shipped today.

**Cause:** Mocks are snapshots in time. The source component kept evolving; the mock didn't.

**Fix:** Before reusing an existing mock, diff it against the real component (read the current source file and compare structure/classes/copy). If it's drifted:

1. Ask the user: "The mock diverged from the current `<X>` component — want an updated mock?"
2. If yes, create a **new file** — e.g. `MockLibraryPageV2.tsx` — next to the old one. Do NOT modify the existing mock unless the user explicitly asks to replace it. Other scenes may still depend on the old mock being stable.
3. Point the current scene's imports at the new V2 file.

Rule of thumb: mocks are additive. Scenes opt in by importing the version they want.

---

## 16. Cursor coordinates drift after every layout change

**Symptom:** Cursor circles don't land on the UI element they're supposed to click. Off by 40–100 px at one or more beats.

**Cause:** Every CSS tweak to the demo scope — changing dialog height, forcing ScrollArea height, tweaking font — shifts button positions in unzoomed 1920×1080 space. The hand-measured `LECTURE_CARD`, `SUMMARY_TAB`, `LIST_SUBTAB`, etc. stop matching reality.

**Fix:** Re-center all cursor targets every **~3 revisions** (or any time scoped CSS changes). Don't trust values that worked last iteration.

Verification loop:

```bash
# Render a still at each click frame (use your scene's actual click frames).
for f in 45 125 185 245 305 395; do
  npx remotion still <composition-id> --frame=$f --scale=0.5 out/v-$f.png
done
```

Open each PNG and confirm the cursor circle visibly overlaps the intended target element. For any miss, reverse-project screen coordinates back through the camera zoom:

```
target_y = (H/2) + (screen_y − H/2) / cameraZoom   // H = 1080
target_x = (W/2) + (screen_x − W/2) / cameraZoom   // W = 1920
screen_{x,y} = 2 × pixel_in_scaled_still          // stills are scale 0.5
```

One-pass after any structural CSS change. Don't wait for the user to catch it.

---

## 17. Dialog content leaves a white gap above the fold

**Symptom:** The dialog renders, but the tab body (transcript list / summary body) ends well before the dialog's bottom rounded edge — there's a visible ~100–150 px blank strip.

**Causes (in order of likelihood):**

1. **Inner ScrollArea stuck at its default `sm:h-[480px]`** — TranscriptDrawer-style components hardcode a fixed height tuned for real viewports. Stretch it to fill the taller demo dialog (e.g. 760 px via runtime JS in `useEffect` because class-based `!important` overrides sometimes lose to more-specific Tailwind rules).
2. **Audio bar / footer bar slot rendering with no content** — a `flex-shrink-0 max-h-32` placeholder reserves ~128 px even when empty. Hide the slot for demos that don't use it.
3. **Fixed dialog height masking a flex mismatch** — if `sm:h-auto sm:max-h-[90dvh]` beats your `!important` override, the dialog may auto-size to its content, producing a gap when content is short. Prefer to drive *content* size and let the dialog auto-fit, rather than pinning the dialog.

Verification: render a still at a frame where the dialog is fully settled (past the spring entrance AND past camera-zoom-in). Measure from the last visible line of real content to the dialog's rounded bottom edge. Anything > ~20 px of non-padding gap is a bug.

Don't ship a scene with visible internal whitespace in a container that has overflowable content behind it — the viewer reads that as "the app is broken."

---

## 18. Out-of-scope (for this skill)

- **Next.js App Router** — this skill assumes Vite + React Router. Next.js needs different aliasing and server/client boundaries.
- **Non-shadcn design systems** (MUI, Chakra, Mantine) — the portal-container pattern is general, but the specific escape-hatch prop names differ per library.
- **Real audio / voiceover** — this skill synthesizes silent WAVs only. For real narration, see the `remotion` skill's `rules/voiceover.md`.
